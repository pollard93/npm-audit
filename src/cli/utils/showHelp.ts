import { getDefaultConfigFilename } from '../../config/utils/getDefaultConfigFilename';

/**
 * Display help message for the CLI
 */
export function showHelp(): void {
  console.log(`
npm-audit-check - Check npm audit for vulnerabilities and fail on unaccepted issues

Usage: npm-audit-check [options]

Options:
  --config, -c    Path to config file (default: ${getDefaultConfigFilename()})
  --level, -l     Minimum severity level to fail on (default: high)
                  Options: info, low, moderate, high, critical
  --help, -h      Show this help message
  --version, -v   Show version

Configuration:
  Create a ${getDefaultConfigFilename()} file to accept known vulnerabilities:

  {
    "acceptedVulnerabilities": [
      {
        "id": 1234567,
        "reason": "No fix available, mitigated by input validation",
        "acceptedBy": "engineer@example.com",
        "acceptedAt": "2026-02-09T00:00:00.000Z",
        "expiresAt": "2026-08-09T00:00:00.000Z"
      }
    ]
  }
`);
}
