// Benchmark maxItems with real DiDo data
import { parse } from 'csv-parse';
import { Readable } from 'stream';

interface PermitRow {
    [key: string]: string | undefined;
    SIREN_DEM?: string;
    DEP_CODE?: string;
}

const LOGEMENTS_URL = 'https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1/datafiles/8b35affb-55fc-4c1f-915b-7750f974446a/csv';

async function benchmark() {
    console.log('=== Benchmarking maxItems with Real DiDo Data ===');
    console.log('Target: ALL départements, personnes morales only, maxItems: 50\n');

    const startTime = Date.now();
    const abortController = new AbortController();
    
    const response = await fetch(LOGEMENTS_URL, { signal: abortController.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const stream = Readable.fromWeb(response.body as any);
    const parser = parse({
        columns: true,
        delimiter: ';',
        skip_empty_lines: true,
        trim: true,
    });

    stream.pipe(parser);

    let processed = 0;
    let matched = 0;
    const maxItems = 50;

    try {
        for await (const row of parser as AsyncIterable<PermitRow>) {
            processed++;

            if (matched >= maxItems) {
                console.log(`\n✅ Reached maxItems (${maxItems}), aborting stream...`);
                parser.destroy();
                stream.destroy();
                abortController.abort();
                break;
            }

            const siren = row.SIREN_DEM?.trim();

            // Match ANY département with valid SIREN (personnes morales)
            if (siren && siren.length === 9 && /^\d{9}$/.test(siren)) {
                matched++;
                if (matched % 10 === 0 || matched <= 5) {
                    console.log(`✓ Match ${matched}: ${row.DENOM_DEM?.substring(0, 40)} (dep ${row.DEP_CODE}, row ${processed})`);
                }
            }

            if (processed % 5000 === 0) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log(`  ... scanned ${processed} rows, found ${matched} matches (${elapsed}s)`);
            }
        }
    } catch (error: any) {
        if (error.name === 'AbortError' || error.code === 'ERR_STREAM_PREMATURE_CLOSE') {
            console.log('Stream aborted successfully');
        } else {
            console.error('Error:', error.message);
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n📊 Results:`);
    console.log(`   Processed: ${processed} rows`);
    console.log(`   Matched: ${matched} permits`);
    console.log(`   Wall clock: ${elapsed} seconds`);
    console.log(`   Rate: ${(processed / parseFloat(elapsed)).toFixed(0)} rows/sec`);
    
    const success = matched === maxItems && processed < 100000;
    console.log(`\n${success ? '✅ SUCCESS' : '❌ FAIL'}: Early stop ${success ? 'worked' : 'failed'}!`);
    
    process.exit(success ? 0 : 1);
}

benchmark().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
