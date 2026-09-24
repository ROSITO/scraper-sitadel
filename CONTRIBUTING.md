# Contributing to Sitadel Building Permits Actor

Thank you for your interest in contributing to this project!

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`

## Project Structure

- `.actor/` - Apify Actor configuration and schemas
- `src/main.ts` - Main actor logic (CSV streaming, filtering, dataset pushing)
- `src/test.ts` - Smoke tests
- `test/fixtures/` - Sample CSV data for testing

## Making Changes

1. Create a new branch for your feature
2. Make your changes
3. Ensure tests pass: `npm test`
4. Build successfully: `npm run build`
5. Update documentation if needed
6. Commit with clear messages
7. Submit a pull request

## Code Style

- Use TypeScript strict mode
- Follow existing code formatting
- Add comments for complex logic
- Keep functions focused and testable

## Testing

- Add tests for new features
- Ensure existing tests pass
- Test with the fixture data in `test/fixtures/`
- For large CSV testing, use a small sample

## RGPD Compliance

Any changes to filtering or data output must maintain RGPD compliance:
- Default `onlyPersonnesMorales: true` must remain
- Never expose personal data of individuals
- Document any privacy-related changes

## Documentation

- Update README.md for user-facing changes
- Update .actor/README.md for store listing changes
- Keep examples up to date
- Maintain both French and English sections

## Questions?

Open an issue for discussion before making major changes.
