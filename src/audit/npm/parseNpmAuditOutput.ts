import { AuditResult, NormalizedAdvisory } from '../../shared/types';
import { NpmAuditRaw } from './types';
import { resolveVulnerabilityDetails } from './extractVulnerabilityInfo';

/**
 * Parse the JSON output from npm audit into the normalized AuditResult shape
 */
export function parseNpmAuditOutput(output: string): AuditResult {
  let raw: NpmAuditRaw;

  try {
    raw = JSON.parse(output) as NpmAuditRaw;
  } catch (error) {
    throw new Error(`Failed to parse npm audit output: ${(error as Error).message}`);
  }

  if (!raw.vulnerabilities || !raw.metadata) {
    throw new Error('Failed to parse npm audit output: Invalid audit output structure');
  }

  const advisories: NormalizedAdvisory[] = [];

  for (const [name, vulnerability] of Object.entries(raw.vulnerabilities)) {
    const details = resolveVulnerabilityDetails(vulnerability, raw.vulnerabilities);

    for (const detail of details) {
      advisories.push({
        packageName: name,
        severity: vulnerability.severity,
        title: detail.title,
        url: detail.url,
      });
    }
  }

  return {
    packageManager: 'npm',
    advisories,
    severityCounts: raw.metadata.vulnerabilities,
  };
}
