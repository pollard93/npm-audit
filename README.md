# @ppoll/npm-audit

[![npm version](https://img.shields.io/npm/v/@ppoll/npm-audit.svg)](https://www.npmjs.com/package/@ppoll/npm-audit)
[![npm downloads](https://img.shields.io/npm/dm/@ppoll/npm-audit.svg)](https://www.npmjs.com/package/@ppoll/npm-audit)

A zero-dependency CLI tool that runs `npm audit` and fails if there are any high or critical vulnerabilities, unless they are explicitly accepted in a configuration file. Designed for CI/CD pipelines to enforce security policies while allowing teams to acknowledge and track accepted risks.

## Features

- **Zero dependencies** - Only uses Node.js built-in modules
- **Supply chain protection** - Run before `npm install` to audit your lock file before any potentially compromised packages are installed
- **Configurable severity levels** - Fail on high/critical (default) or adjust to your needs
- **Accept known vulnerabilities** - Document accepted risks with reasons, ownership, and expiration dates
- **CI/CD ready** - Works with GitHub Actions, Azure DevOps, and any CI system

## Usage

The recommended way to use this tool is with `npx`, which downloads and runs it directly without installing:

```bash
npx @ppoll/npm-audit
```

This will:

1. Run `npm audit` to check for vulnerabilities
2. If high or critical vulnerabilities are found, check against your accepted vulnerabilities config
3. Exit with code 0 if no issues or all issues are accepted
4. Exit with code 1 if there are unaccepted high/critical vulnerabilities

### Options

```bash
npx @ppoll/npm-audit [options]

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

| Field        | Required | Description                                                                                         |
| ------------ | -------- | --------------------------------------------------------------------------------------------------- |
| `id`         | Yes      | The vulnerability ID from npm audit                                                                 |
| `reason`     | Yes      | Why this vulnerability is being accepted                                                            |
| `acceptedBy` | Yes      | Who accepted this vulnerability                                                                     |
| `acceptedAt` | Yes      | When this vulnerability was accepted (ISO 8601)                                                     |
| `expiresAt`  | No       | When this acceptance expires (ISO 8601). If expired, the vulnerability will cause a failure again. |

## CI/CD Integration

The key benefit of this tool is that `npx` can download and run it directly from npm **before** installing your project dependencies. This protects against supply chain attacks by auditing the lock file before any potentially compromised packages are installed.

### GitHub Actions

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Security audit (before install)
        run: npx @ppoll/npm-audit

      - name: Install dependencies
        run: npm ci
```

### Azure DevOps Pipelines

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
    displayName: 'Install Node.js'

  - script: npx @ppoll/npm-audit
    displayName: 'Security audit (before install)'

  - script: npm ci
    displayName: 'Install dependencies'
```

#### With Custom Configuration

```yaml
steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
    displayName: 'Install Node.js'

  - script: npx @ppoll/npm-audit --config security/audit-exceptions.json --level critical
    displayName: 'Security audit (critical only)'

  - script: npm ci
    displayName: 'Install dependencies'
```

#### As a Separate Stage

```yaml
stages:
  - stage: Security
    displayName: 'Security Checks'
    jobs:
      - job: Audit
        displayName: 'NPM Audit'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'

          - script: npx @ppoll/npm-audit
            displayName: 'Run security audit'
            continueOnError: false

          - script: npm ci
            displayName: 'Install dependencies'
```

## Example Output

When vulnerabilities are found:

```
🔍 Running npm audit...

⚠️  Found vulnerabilities at high level or above.

📋 Loading accepted vulnerabilities from .npm-audit-accept.json...

❌ Found 2 unaccepted vulnerabilities:

  HIGH: fast-xml-parser - fast-xml-parser has RangeError DoS Numeric Entities Bug
    ID: 1112708
    URL: https://github.com/advisories/GHSA-37qj-frw5-hhjh

  HIGH: next - Next.js self-hosted applications vulnerable to DoS
    ID: 1112593
    URL: https://github.com/advisories/GHSA-9g9p-9gw9-jx7f

To accept these vulnerabilities, add them to .npm-audit-accept.json:

{
  "acceptedVulnerabilities": [
    {
      "id": 1112708,
      "reason": "TODO: Add reason for accepting",
      "acceptedBy": "your-email@example.com",
      "acceptedAt": "2026-02-09T09:21:06.871Z"
    },
    ...
  ]
}
```

When all vulnerabilities are accepted:

```
🔍 Running npm audit...

⚠️  Found vulnerabilities at high level or above.

📋 Loading accepted vulnerabilities from .npm-audit-accept.json...

✅ All vulnerabilities are accepted in configuration.
```

## License

MIT
