import { Actor, log } from 'apify';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

interface Input {
    datasets?: string[];
    departementCodes?: string[];
    communeInseeCodes?: string[];
    typeDau?: string;
    dateAutorisationFrom?: string;
    dateAutorisationTo?: string;
    minSurfaceHab?: number;
    minLogements?: number;
    onlyPersonnesMorales?: boolean;
    onlyNewSinceLastRun?: boolean;
    maxItems?: number;
    includeFields?: 'minimal' | 'full';
    mode?: 'extract' | 'preview';
}

interface PermitRow {
    REG_CODE?: string;
    DEP_CODE?: string;
    COMM?: string;
    TYPE_DAU?: string;
    NUM_DAU?: string;
    ETAT_DAU?: string;
    DATE_REELLE_AUTORISATION?: string;
    DENOM_DEM?: string;
    SIREN_DEM?: string;
    SIRET_DEM?: string;
    CJ_DEM?: string;
    APE_DEM?: string;
    CODPOST_DEM?: string;
    LOCALITE_DEM?: string;
    SURF_HAB_CREEE?: string;
    NB_LGT_TOT_CREES?: string;
    I_PISCINE?: string;
    NATURE_PROJET_DECLAREE?: string;
    NATURE_PROJET_COMPLETEE?: string;
    [key: string]: string | undefined;
}

interface PermitOutput {
    id: string;
    typeDau: string;
    numDau: string;
    etatDau?: string;
    dateAutorisation: string;
    commune?: string;
    depCode?: string;
    regCode?: string;
    denomDemandeur?: string;
    sirenDemandeur?: string;
    siretDemandeur?: string;
    cjDemandeur?: string;
    apeDemandeur?: string;
    codePostalDemandeur?: string;
    localiteDemandeur?: string;
    surfacePlancher?: number;
    nombreLogements?: number;
    piscine?: boolean;
    natureProjet?: string;
    _raw?: PermitRow;
}

const DATASET_URLS: Record<string, string> = {
    logements: 'https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1/datafiles/8b35affb-55fc-4c1f-915b-7750f974446a/csv',
    locaux: 'https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1/datafiles/f8f0700f-806c-40a7-83b1-f21cf507e7c4/csv',
    amenager: 'https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1/datafiles/96883f50-538b-41f9-a059-c6eb97e6a23a/csv',
    demolir: 'https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1/datafiles/1a9a2f0c-56fe-4e69-84a7-fbbda2121f02/csv',
};

const KVS_KEY_WATERMARK = 'last-run-watermark';

Actor.main(async () => {
    const input = await Actor.getInput<Input>() ?? {};
    
    const {
        datasets = ['logements'],
        departementCodes = [],
        communeInseeCodes = [],
        typeDau = '',
        dateAutorisationFrom,
        dateAutorisationTo,
        minSurfaceHab,
        minLogements,
        onlyPersonnesMorales = true,
        onlyNewSinceLastRun = false,
        maxItems,
        includeFields = 'minimal',
        mode = 'extract',
    } = input;

    log.info('Starting Sitadel Building Permits Actor', { input });

    let watermark: string | null = null;
    if (onlyNewSinceLastRun) {
        watermark = await Actor.getValue(KVS_KEY_WATERMARK) as string | null;
        log.info(`Watermark from last run: ${watermark ?? 'none'}`);
    }

    let totalProcessed = 0;
    let totalPushed = 0;
    let latestDate: string | null = watermark;
    let anyStoppedEarly = false;

    for (const datasetName of datasets) {
        if (maxItems && totalPushed >= maxItems) {
            log.info(`Already reached maxItems (${maxItems}), skipping remaining datasets`);
            break;
        }

        const url = DATASET_URLS[datasetName];
        if (!url) {
            log.warning(`Unknown dataset: ${datasetName}`);
            continue;
        }

        log.info(`Processing dataset: ${datasetName} from ${url}`);

        try {
            const stats = await processDataset(
                url,
                {
                    departementCodes,
                    communeInseeCodes,
                    typeDau,
                    dateAutorisationFrom,
                    dateAutorisationTo,
                    minSurfaceHab,
                    minLogements,
                    onlyPersonnesMorales,
                    watermark,
                    maxItems: maxItems ? maxItems - totalPushed : undefined,
                    includeFields,
                    mode,
                }
            );

            totalProcessed += stats.processed;
            totalPushed += stats.pushed;
            anyStoppedEarly = anyStoppedEarly || stats.stoppedEarly;

            if (stats.latestDate && (!latestDate || stats.latestDate > latestDate)) {
                latestDate = stats.latestDate;
            }

            if (maxItems && totalPushed >= maxItems) {
                log.info(`Reached maxItems limit: ${maxItems}`);
                break;
            }
        } catch (error) {
            log.error(`Failed to process dataset ${datasetName}`, { error });
        }
    }

    if (mode === 'preview') {
        log.info(`Preview mode: Found ${totalPushed} matching permits (no data extracted)`);
    } else {
        log.info(`Extracted ${totalPushed} permits out of ${totalProcessed} processed`);

        // Only update watermark if we completed a full run without artificial early stop
        if (onlyNewSinceLastRun && latestDate && !anyStoppedEarly) {
            await Actor.setValue(KVS_KEY_WATERMARK, latestDate);
            log.info(`Updated watermark to: ${latestDate}`);
        } else if (onlyNewSinceLastRun && anyStoppedEarly) {
            log.info(`Watermark NOT updated (stopped early due to maxItems)`);
        }
    }
});

async function processDataset(
    url: string,
    filters: {
        departementCodes: string[];
        communeInseeCodes: string[];
        typeDau: string;
        dateAutorisationFrom?: string;
        dateAutorisationTo?: string;
        minSurfaceHab?: number;
        minLogements?: number;
        onlyPersonnesMorales: boolean;
        watermark: string | null;
        maxItems?: number;
        includeFields: 'minimal' | 'full';
        mode: 'extract' | 'preview';
    }
): Promise<{ processed: number; pushed: number; latestDate: string | null; stoppedEarly: boolean }> {
    const abortController = new AbortController();
    
    // Safety limit: when maxItems is set, stop scanning after this many rows
    // to avoid downloading huge files when matches are scarce
    const maxRowsToScan = filters.maxItems ? Math.max(filters.maxItems * 10000, 50000) : undefined;
    
    const response = await fetch(url, { signal: abortController.signal });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const stream = Readable.fromWeb(response.body as any);
    
    const parser = parse({
        columns: true,
        delimiter: ';',
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        encoding: 'utf-8',
    });

    stream.pipe(parser);

    let processed = 0;
    let pushed = 0;
    let latestDate: string | null = null;
    let stoppedEarly = false;

    try {
        for await (const row of parser as AsyncIterable<PermitRow>) {
            processed++;

            // Safety check: stop if we've scanned too many rows (prevents full download with scarce matches)
            if (maxRowsToScan && processed > maxRowsToScan) {
                log.warning(`Scanned ${processed} rows but only found ${pushed} matches (wanted ${filters.maxItems}). Stopping to prevent timeout. Try broader filters.`);
                stoppedEarly = true;
                parser.destroy();
                stream.destroy();
                abortController.abort();
                break;
            }

            if (filters.maxItems && pushed >= filters.maxItems) {
                log.info(`Reached maxItems limit (${filters.maxItems}), stopping stream early`);
                stoppedEarly = true;
                parser.destroy();
                stream.destroy();
                abortController.abort();
                break;
            }

            if (!matchesFilters(row, filters)) {
                continue;
            }

            const dateAutorisation = row.DATE_REELLE_AUTORISATION;
            if (dateAutorisation && (!latestDate || dateAutorisation > latestDate)) {
                latestDate = dateAutorisation;
            }

            pushed++;

            if (filters.mode === 'extract') {
                const output = transformRow(row, filters.includeFields);
                await Actor.pushData(output, 'permit');
            }

            if (processed % 1000 === 0) {
                log.info(`Processed ${processed} rows, pushed ${pushed}`);
            }
        }

        if (!stoppedEarly) {
            log.info(`Dataset processing completed: ${processed} rows, ${pushed} matched`);
        } else {
            log.info(`Dataset processing stopped early at ${processed} rows, ${pushed} matched`);
        }
        return { processed, pushed, latestDate, stoppedEarly };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            log.info(`Stream aborted successfully after ${pushed} matches`);
            return { processed, pushed, latestDate, stoppedEarly };
        }
        log.error('Stream error', { error });
        throw error;
    }
}

function matchesFilters(row: PermitRow, filters: {
    departementCodes: string[];
    communeInseeCodes: string[];
    typeDau: string;
    dateAutorisationFrom?: string;
    dateAutorisationTo?: string;
    minSurfaceHab?: number;
    minLogements?: number;
    onlyPersonnesMorales: boolean;
    watermark: string | null;
}): boolean {
    if (filters.onlyPersonnesMorales) {
        const siren = row.SIREN_DEM?.trim();
        if (!siren || siren.length !== 9 || !/^\d{9}$/.test(siren)) {
            return false;
        }
    }

    if (filters.departementCodes.length > 0) {
        const depCode = row.DEP_CODE?.trim();
        if (!depCode || !filters.departementCodes.includes(depCode)) {
            return false;
        }
    }

    if (filters.communeInseeCodes.length > 0) {
        const commune = row.COMM?.trim();
        if (!commune || !filters.communeInseeCodes.includes(commune)) {
            return false;
        }
    }

    if (filters.typeDau) {
        const typeDau = row.TYPE_DAU?.trim();
        if (typeDau !== filters.typeDau) {
            return false;
        }
    }

    const dateAutorisation = row.DATE_REELLE_AUTORISATION?.trim();
    if (dateAutorisation) {
        if (filters.watermark && dateAutorisation <= filters.watermark) {
            return false;
        }
        if (filters.dateAutorisationFrom && dateAutorisation < filters.dateAutorisationFrom) {
            return false;
        }
        if (filters.dateAutorisationTo && dateAutorisation > filters.dateAutorisationTo) {
            return false;
        }
    }

    if (filters.minSurfaceHab !== undefined) {
        const surface = parseFloat(row.SURF_HAB_CREEE ?? '0');
        if (isNaN(surface) || surface < filters.minSurfaceHab) {
            return false;
        }
    }

    if (filters.minLogements !== undefined) {
        const logements = parseInt(row.NB_LGT_TOT_CREES ?? '0', 10);
        if (isNaN(logements) || logements < filters.minLogements) {
            return false;
        }
    }

    return true;
}

function transformRow(row: PermitRow, includeFields: 'minimal' | 'full'): PermitOutput {
    const typeDau = row.TYPE_DAU?.trim() ?? '';
    const numDau = row.NUM_DAU?.trim() ?? '';
    const commune = row.COMM?.trim() ?? '';
    
    const id = `${typeDau}-${numDau}-${commune}`.replace(/\s+/g, '-');

    const output: PermitOutput = {
        id,
        typeDau,
        numDau,
        etatDau: row.ETAT_DAU?.trim(),
        dateAutorisation: row.DATE_REELLE_AUTORISATION?.trim() ?? '',
        commune,
        depCode: row.DEP_CODE?.trim(),
        regCode: row.REG_CODE?.trim(),
        denomDemandeur: row.DENOM_DEM?.trim(),
        sirenDemandeur: row.SIREN_DEM?.trim(),
        siretDemandeur: row.SIRET_DEM?.trim(),
        cjDemandeur: row.CJ_DEM?.trim(),
        apeDemandeur: row.APE_DEM?.trim(),
        codePostalDemandeur: row.CODPOST_DEM?.trim(),
        localiteDemandeur: row.LOCALITE_DEM?.trim(),
    };

    const surface = parseFloat(row.SURF_HAB_CREEE ?? '');
    if (!isNaN(surface)) {
        output.surfacePlancher = surface;
    }

    const logements = parseInt(row.NB_LGT_TOT_CREES ?? '', 10);
    if (!isNaN(logements)) {
        output.nombreLogements = logements;
    }

    if (row.I_PISCINE === '1' || row.I_PISCINE?.toLowerCase() === 'true') {
        output.piscine = true;
    }

    const natureProjet = row.NATURE_PROJET_COMPLETEE?.trim() || row.NATURE_PROJET_DECLAREE?.trim();
    if (natureProjet) {
        output.natureProjet = natureProjet;
    }

    if (includeFields === 'full') {
        output._raw = row;
    }

    return output;
}
