#!/usr/bin/env node

import { runAudit } from '../audit/runAudit';
import { filterVulnerabilities } from '../vulnerabilities/utils/filterVulnerabilities';
import { hasVulnerabilitiesAtOrAbove } from '../vulnerabilities/utils/hasVulnerabilitiesAtOrAbove';
import { loadConfig } from '../config/loadConfig';
import { getDefaultConfigFilename } from '../config/utils/getDefaultConfigFilename';
import { formatVulnerability } from '../vulnerabilities/utils/formatVulnerability';
import { showVersion } from './utils/showVersion';
import { showHelp } from './utils/showHelp';
import { parseArgs } from './utils/parseArgs';
import { AuditResult, AuditConfig, FilteredVulnerability, SeverityLevel } from '../shared/types';

export interface AuditCheckResult {
  exitCode: number;
  message: string;
  unacceptedVulnerabilities?: FilteredVulnerability[];
}

/**
 * Core audit check logic - extracted for testability
 */
export function checkAuditResult(
  auditResult: AuditResult,
  config: AuditConfig,
  level: SeverityLevel
): AuditCheckResult {
  // Quick check if there are any vulnerabilities at the specified level
  if (!hasVulnerabilitiesAtOrAbove(auditResult, level)) {
    return {
      exitCode: 0,
      message: `No ${level} or above vulnerabilities found.`,
    };
  }

  const unaccepted = filterVulnerabilities(auditResult, config, level);

  if (unaccepted.length === 0) {
    return {
      exitCode: 0,
      message: 'All vulnerabilities are accepted in configuration.',
    };
  }

  return {
    exitCode: 1,
    message: `Found ${unaccepted.length} unaccepted vulnerabilities.`,
    unacceptedVulnerabilities: unaccepted,
  };
}

/**
 * Deduplicate vulnerabilities by source ID for the suggested accept config.
 * Filters out entries with id 0 (unresolvable) and keeps only the first
 * occurrence of each unique ID.
 */
export function deduplicateVulnerabilities(
  vulnerabilities: FilteredVulnerability[]
): FilteredVulnerability[] {
  const seenUrls = new Set<string>();
  return vulnerabilities.filter((v) => {
    if (!v.url || seenUrls.has(v.url)) return false;
    seenUrls.add(v.url);
    return true;
  });
}

export async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.version) {
    showVersion();
    process.exit(0);
  }

  console.log('🔍 Running npm audit...\n');

  try {
    const auditResult = await runAudit();

    // Quick check if there are any vulnerabilities at the specified level
    if (!hasVulnerabilitiesAtOrAbove(auditResult, options.level)) {
      console.log(`✅ No ${options.level} or above vulnerabilities found.`);
      process.exit(0);
    }

    // Load config to check for accepted vulnerabilities
    console.log(`⚠️  Found vulnerabilities at ${options.level} level or above.\n`);
    console.log(
      `📋 Loading accepted vulnerabilities from ${options.configPath || getDefaultConfigFilename()}...\n`
    );

    const config = await loadConfig(options.configPath);
    const result = checkAuditResult(auditResult, config, options.level);

    if (result.exitCode === 0) {
      console.log(`✅ ${result.message}`);
      process.exit(0);
    }

    // Report unaccepted vulnerabilities
    console.log(`❌ ${result.message}\n`);

    for (const vuln of result.unacceptedVulnerabilities!) {
      console.log(formatVulnerability(vuln));
      console.log();
    }

    console.log(
      `To accept these vulnerabilities, add them to ${options.configPath || getDefaultConfigFilename()}:`
    );
    const uniqueVulns = deduplicateVulnerabilities(result.unacceptedVulnerabilities!);

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    console.log(`
{
  "acceptedVulnerabilities": [
${uniqueVulns
  .map(
    (v) => `    {
      "url": ${JSON.stringify(v.url)},
      "description": ${JSON.stringify(v.title)},
      "reason": "TODO: Add reason for accepting",
      "acceptedBy": "your-email@example.com",
      "acceptedAt": "${now.toISOString()}",
      "expiresAt": "${oneWeekFromNow.toISOString()}"
    }`
  )
  .join(',\n')}
  ]
}
`);

    process.exit(1);
  } catch (error) {
    console.error(`\n❌ Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Only run main() if this file is executed directly, not when imported
if (require.main === module) {
  main();
}
