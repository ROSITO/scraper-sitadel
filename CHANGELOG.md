# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-09-24

### Added
- Initial release of Sitadel Building Permits Actor
- Support for 4 datasets: logements, locaux, amenager, demolir
- RGPD-compliant filtering (onlyPersonnesMorales with SIREN validation)
- Geographic filters (département, commune INSEE codes)
- Project filters (TYPE_DAU, dates, surfaces, dwelling count)
- Incremental extraction with KVS watermark (onlyNewSinceLastRun)
- Pay-per-event pricing with 'permit' event
- Preview/count mode (free) vs extract mode (paid)
- Comprehensive input schema with UI-friendly field types
- Minimal vs full field output modes
- CSV streaming for memory-efficient processing
- Store-oriented README for Apify marketplace
- Test fixture with 20 sample permits
- Smoke tests validating CSV parsing and filtering
- Example input files for common use cases
- French documentation with English summary
- Apache 2.0 license

### Technical
- Node.js 20+ with TypeScript
- Apify SDK 3.7.2
- csv-parse for streaming CSV parsing
- Complete actor configuration (.actor/actor.json)
- Docker image based on apify/actor-node:20
- Automatic build pipeline with npm scripts

### Data Sources
- SDES (Service des données et études statistiques)
- DiDo API endpoints for monthly-updated permit data
- Licence Ouverte 2.0 (Open License)
- Data since 2013, updated monthly
