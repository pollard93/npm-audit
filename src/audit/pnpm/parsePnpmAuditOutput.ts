import { AuditResult, NormalizedAdvisory, SEVERITY_ORDER, SeverityLevel } from '../../shared/types';
import { PnpmAuditRaw } from './types';

const SEVERITY_LEVELS = Object.keys(SEVERITY_ORDER) as SeverityLevel[];

/**
 * Parse the JSON output from pnpm audit into the normalized AuditResult shape
 */
export function parsePnpmAuditOutput(output: string): AuditResult {
  let raw: PnpmAuditRaw;

  try {
    raw = JSON.parse(output) as PnpmAuditRaw;
  } catch (error) {
    throw new Error(`Failed to parse pnpm audit output: ${(error as Error).message}`);
  }

  if (!raw.advisories || !raw.metadata?.vulnerabilities) {
    throw new Error('Failed to parse pnpm audit output: Invalid audit output structure');
  }

  const advisories: NormalizedAdvisory[] = Object.values(raw.advisories).map((advisory) => ({
    packageName: advisory.module_name,
    severity: advisory.severity,
    title: advisory.title,
    url: advisory.url,
  }));

  const counts = raw.metadata.vulnerabilities;
  const total =
    counts.total ?? SEVERITY_LEVELS.reduce((sum, severity) => sum + counts[severity], 0);

  return {
    packageManager: 'pnpm',
    advisories,
    severityCounts: { ...counts, total },
  };
}
