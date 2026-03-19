# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-03-19

### Breaking Changes

- **Changed matching strategy from vulnerability IDs to advisory URLs**
  - `AcceptedVulnerability` now uses `url` (GitHub advisory URL, e.g., `GHSA-*`) as the primary matching key instead of `id`
  - `id` field is now optional and kept for reference only
  - This is necessary because npm audit's vulnerability IDs change between runs while advisory URLs remain stable
  - **Migration required**: See README.md "Migrating from v1 to v2" section

### Changed

- Config format: `acceptedVulnerabilities[].id` → `acceptedVulnerabilities[].url`
- Output format: Removed `ID:` line from vulnerability display, kept only `URL:`
- CLI suggestion format: Suggestion now uses `url` as the required field
- Multiple advisories per package are now reported separately (was: only first unaccepted advisory reported)

### Added

- New `resolveVulnerabilityDetails()` function to extract all advisory URLs from a vulnerability
- Better handling of transitive dependencies with multiple distinct advisories

### Fixed

- **Identity crisis issue**: Accepted vulnerabilities no longer fail on subsequent audits due to ID changes
- User experience: All unaccepted advisories now reported in a single run instead of requiring multiple runs

## [1.1.1] - 2024-01-15

### Added

- Support for multiple vulnerabilities acceptance

### Fixed

- Improved error messages for invalid configurations

## [1.1.0] - 2024-01-10

### Added

- Configurable severity levels (low, moderate, high, critical)
- Expiration date support for accepted vulnerabilities

## [1.0.0] - 2024-01-01

### Added

- Initial release
- Basic vulnerability audit and acceptance functionality
- CI/CD integration examples
- Configuration file support
