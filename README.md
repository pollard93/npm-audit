# @ppoll/npm-audit

A CLI tool that runs `npm audit` before installing dependencies and fails if there are any high or critical vulnerabilities, unless they are explicitly accepted in a configuration file.

## Installation

```bash
npm install -g @ppoll/npm-audit
```

Or as a dev dependency:

```bash
npm install --save-dev @ppoll/npm-audit
```

## Usage

### CLI

Instead of running `npm install`, run:

```bash
npm-audit-install
```

This will:
1. Run `npm audit` to check for vulnerabilities
2. If high or critical vulnerabilities are found, check against your accepted vulnerabilities config
3. Fail if there are unaccepted high/critical vulnerabilities
4. Run `npm install` if all checks pass

### Options

```bash
npm-audit-install [options]

Options:
  --config, -c    Path to config file (default: .npm-audit-accept.json)
  --level, -l     Minimum severity level to fail on (default: high)
                  Options: low, moderate, high, critical
  --help, -h      Show help
  --version, -v   Show version
```

### Configuration

Create a `.npm-audit-accept.json` file in your project root to accept known vulnerabilities:

```json
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
```

#### Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | The vulnerability ID from npm audit |
| `reason` | Yes | Why this vulnerability is being accepted |
| `acceptedBy` | Yes | Who accepted this vulnerability |
| `acceptedAt` | Yes | When this vulnerability was accepted (ISO 8601) |
| `expiresAt` | No | When this acceptance expires (ISO 8601). If expired, the vulnerability will cause a failure again. |

### CI/CD Integration

Add to your pipeline:

```yaml
# GitHub Actions example
- name: Install dependencies with audit
  run: npx @ppoll/npm-audit
```

```yaml
# Azure Pipelines example
- script: npx @ppoll/npm-audit
  displayName: 'Install dependencies with audit'
```

## Programmatic Usage

```typescript
import { runAudit, loadConfig, filterVulnerabilities } from '@ppoll/npm-audit';

const auditResult = await runAudit();
const config = await loadConfig('.npm-audit-accept.json');
const unacceptedVulnerabilities = filterVulnerabilities(auditResult, config);

if (unacceptedVulnerabilities.length > 0) {
  console.error('Unaccepted vulnerabilities found!');
  process.exit(1);
}
```

## License

MIT
