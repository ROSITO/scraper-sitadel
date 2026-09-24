// Quick extract test with hardcoded input
import { Actor, log } from 'apify';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

const LOGEMENTS_URL = 'https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1/datafiles/8b35affb-55fc-4c1f-915b-7750f974446a/csv';

interface PermitRow {
    [key: string]: string | undefined;
    SIREN_DEM?: string;
    DEP_CODE?: string;
}

async function quickTest() {
    console.log('=== Quick Extract Test: 5 permits from Paris (75) ===\n');
    
    const response = await fetch(LOGEMENTS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const stream = Readable.fromWeb(response.body as any);
    const parser = parse({
        columns: true,
        delimiter: ';',
        skip_empty_lines: true,
        trim: true,
    });

    stream.pipe(parser);

    const results: any[] = [];
    let processed = 0;
    let matched = 0;

    try {
        for await (const row of parser as AsyncIterable<PermitRow>) {
            processed++;

            if (matched >= 5) break;

            const siren = row.SIREN_DEM?.trim();
            const dep = row.DEP_CODE?.trim();

            if (dep === '75' && siren && siren.length === 9 && /^\d{9}$/.test(siren)) {
                matched++;
                results.push({
                    id: `${row.TYPE_DAU}-${row.NUM_DAU}-${row.COMM}`,
                    typeDau: row.TYPE_DAU,
                    numDau: row.NUM_DAU,
                    dateAutorisation: row.DATE_REELLE_AUTORISATION,
                    commune: row.COMM,
                    depCode: row.DEP_CODE,
                    denomDemandeur: row.DENOM_DEM,
                    sirenDemandeur: row.SIREN_DEM,
                    surfacePlancher: parseFloat(row.SURF_HAB_CREEE || '0') || undefined,
                    nombreLogements: parseInt(row.NB_LGT_TOT_CREES || '0') || undefined,
                    piscine: row.I_PISCINE === '1' || row.I_PISCINE?.toLowerCase() === 'true' || undefined,
                    natureProjet: row.NATURE_PROJET_COMPLETEE || row.NATURE_PROJET_DECLAREE,
                });
                console.log(`✓ Matched ${matched}/5: ${row.DENOM_DEM} (${row.TYPE_DAU})`);
            }

            if (processed % 10000 === 0) {
                console.log(`  ... scanned ${processed} rows, found ${matched} matches`);
            }
        }

        console.log(`\n✅ Processed ${processed} rows, extracted ${matched} permits\n`);
        console.log('=== Sample Output (First 2 permits) ===\n');
        results.slice(0, 2).forEach((item, i) => {
            console.log(`Permit ${i + 1}:`);
            console.log(JSON.stringify(item, null, 2));
            console.log();
        });

        return results;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

quickTest()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
