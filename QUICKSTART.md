# Quick Start Guide

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Run Tests

```bash
npm test
```

This runs smoke tests with a local 20-row fixture CSV. All tests should pass.

## Local Development

### Option 1: With Apify CLI (if installed)

```bash
apify run
```

This will prompt for input or use `apify_storage/key_value_stores/default/INPUT.json` if it exists.

### Option 2: Direct Node.js

```bash
npm start
```

This runs the actor with input from `apify_storage/key_value_stores/default/INPUT.json`.

### Option 3: Watch Mode (Development)

```bash
npm run dev
```

Watches for file changes and rebuilds automatically.

## Create Input File

Create `apify_storage/key_value_stores/default/INPUT.json`:

```bash
mkdir -p apify_storage/key_value_stores/default
cat > apify_storage/key_value_stores/default/INPUT.json << 'EOF'
{
  "datasets": ["logements"],
  "departementCodes": ["75"],
  "onlyPersonnesMorales": true,
  "maxItems": 10,
  "mode": "preview"
}
EOF
```

## Example Use Cases

### 1. Preview Mode (Free - Count Only)

```json
{
  "datasets": ["logements"],
  "departementCodes": ["75", "13"],
  "onlyPersonnesMorales": true,
  "mode": "preview"
}
```

This counts matching permits without extracting data (free).

### 2. Extract Building Permits in Paris

```json
{
  "datasets": ["logements"],
  "departementCodes": ["75"],
  "typeDau": "PC",
  "dateAutorisationFrom": "2023-01-01",
  "onlyPersonnesMorales": true,
  "maxItems": 100,
  "mode": "extract"
}
```

### 3. Pool Installers in South of France

```json
{
  "datasets": ["logements"],
  "departementCodes": ["13", "83", "84", "06"],
  "dateAutorisationFrom": "2024-01-01",
  "onlyPersonnesMorales": true,
  "mode": "extract"
}
```

Filter results for `piscine: true` in your application.

### 4. Incremental Extraction

```json
{
  "datasets": ["logements"],
  "onlyPersonnesMorales": true,
  "onlyNewSinceLastRun": true,
  "mode": "extract"
}
```

Only extracts permits newer than the last run (uses KVS watermark).

## Output

Results are saved to:
- Default dataset: `apify_storage/datasets/default/`
- Key-value store: `apify_storage/key_value_stores/default/`

Each item has structure:

```json
{
  "id": "PC-075-056-23-00001-75056",
  "typeDau": "PC",
  "numDau": "075-056-23-00001",
  "dateAutorisation": "2023-01-15",
  "commune": "75056",
  "depCode": "75",
  "denomDemandeur": "SOCIETE IMMOBILIERE PARIS",
  "sirenDemandeur": "123456789",
  "surfacePlancher": 2500.0,
  "nombreLogements": 12
}
```

## Troubleshooting

### Tests Fail

Ensure fixture exists:
```bash
ls -la test/fixtures/logements-sample.csv
```

### Build Errors

Clean and rebuild:
```bash
rm -rf dist node_modules
npm install
npm run build
```

### CSV Download Fails

Check network connectivity and DiDo API status.
Use preview mode to test without downloading large files.

## Next Steps

1. Test with local fixture: `npm test`
2. Try preview mode with real data
3. Extract a small sample: set `maxItems: 10`
4. Deploy to Apify platform
5. Configure scheduling for automatic updates

## Deployment

See [Apify Documentation](https://docs.apify.com/actors/development/deployment) for deployment instructions.

This actor is ready to deploy to Apify platform with:
- Configured input schema
- Pay-per-event pricing
- Store description
- Docker build
