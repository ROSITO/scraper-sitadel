import { Actor } from 'apify';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

async function runSmokeTest() {
    console.log('🧪 Running smoke test with fixture data...\n');

    const fixturePath = join(process.cwd(), 'test', 'fixtures', 'logements-sample.csv');
    console.log(`📁 Loading fixture: ${fixturePath}`);

    const stream = createReadStream(fixturePath);
    const parser = parse({
        columns: true,
        delimiter: ';',
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        encoding: 'utf-8',
    });

    let totalRows = 0;
    let personnesMorales = 0;
    let particuliers = 0;
    let withPiscine = 0;
    const depCounts: Record<string, number> = {};

    return new Promise<void>((resolve, reject) => {
        stream.pipe(parser)
            .on('data', (row: PermitRow) => {
                totalRows++;

                const siren = row.SIREN_DEM?.trim();
                if (siren && siren.length === 9 && /^\d{9}$/.test(siren)) {
                    personnesMorales++;
                } else {
                    particuliers++;
                }

                if (row.I_PISCINE === '1' || row.I_PISCINE?.toLowerCase() === 'true') {
                    withPiscine++;
                }

                const dep = row.DEP_CODE?.trim();
                if (dep) {
                    depCounts[dep] = (depCounts[dep] || 0) + 1;
                }
            })
            .on('end', () => {
                console.log('\n✅ Test results:');
                console.log(`   Total rows: ${totalRows}`);
                console.log(`   Personnes morales (with SIREN): ${personnesMorales}`);
                console.log(`   Particuliers (no SIREN): ${particuliers}`);
                console.log(`   With swimming pool: ${withPiscine}`);
                console.log(`   Départements:`);
                Object.entries(depCounts).sort().forEach(([dep, count]) => {
                    console.log(`      ${dep}: ${count} permits`);
                });

                console.log('\n🎯 Validation:');
                const checks = [
                    { name: 'Total rows > 0', pass: totalRows > 0 },
                    { name: 'Has personnes morales', pass: personnesMorales > 0 },
                    { name: 'Has particuliers', pass: particuliers > 0 },
                    { name: 'Has piscine permits', pass: withPiscine > 0 },
                    { name: 'Multiple départements', pass: Object.keys(depCounts).length > 1 },
                ];

                const allPassed = checks.every(c => c.pass);
                checks.forEach(check => {
                    const icon = check.pass ? '✓' : '✗';
                    console.log(`   ${icon} ${check.name}`);
                });

                if (allPassed) {
                    console.log('\n🎉 All smoke tests passed!');
                    resolve();
                } else {
                    console.log('\n❌ Some tests failed!');
                    reject(new Error('Smoke tests failed'));
                }
            })
            .on('error', (error) => {
                console.error('❌ Stream error:', error);
                reject(error);
            });
    });
}

async function testMaxItems() {
    console.log('\n\n🧪 Running maxItems test with fixture data...\n');

    const fixturePath = join(process.cwd(), 'test', 'fixtures', 'logements-sample.csv');
    const stream = createReadStream(fixturePath);
    const parser = parse({
        columns: true,
        delimiter: ';',
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        encoding: 'utf-8',
    });

    const maxItems = 3;
    const results: any[] = [];
    let processed = 0;

    try {
        stream.pipe(parser);
        
        for await (const row of parser as AsyncIterable<PermitRow>) {
            processed++;

            if (results.length >= maxItems) {
                parser.destroy();
                stream.destroy();
                break;
            }

            const siren = row.SIREN_DEM?.trim();
            if (siren && siren.length === 9 && /^\d{9}$/.test(siren)) {
                results.push({
                    denom: row.DENOM_DEM,
                    siren: row.SIREN_DEM,
                    dep: row.DEP_CODE,
                });
            }
        }

        console.log(`✅ maxItems test results:`);
        console.log(`   Processed rows: ${processed}`);
        console.log(`   Matched permits: ${results.length}`);
        console.log(`   Expected: exactly ${maxItems} matches\n`);

        const checks = [
            { name: 'Matched exactly maxItems', pass: results.length === maxItems },
            { name: 'Stopped early (processed < 20)', pass: processed < 20 },
        ];

        const allPassed = checks.every(c => c.pass);
        checks.forEach(check => {
            const icon = check.pass ? '✓' : '✗';
            console.log(`   ${icon} ${check.name}`);
        });

        if (!allPassed) {
            throw new Error('maxItems test failed');
        }

        console.log('\n🎉 maxItems test passed!');
    } catch (error: any) {
        if (error.message === 'maxItems test failed') {
            throw error;
        }
        console.error('❌ maxItems test error:', error);
        throw error;
    }
}

Promise.resolve()
    .then(() => runSmokeTest())
    .then(() => testMaxItems())
    .then(() => {
        console.log('\n✨ All tests completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Test suite failed:', error);
        process.exit(1);
    });
