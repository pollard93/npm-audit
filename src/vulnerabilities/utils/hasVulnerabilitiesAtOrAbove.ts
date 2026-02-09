import { AuditResult, SeverityLevel, SEVERITY_ORDER } from '../../shared/types';

/**
 * Check if the audit result has any vulnerabilities at or above the specified severity
 */
export function hasVulnerabilitiesAtOrAbove(
  auditResult: AuditResult,
  minSeverity: SeverityLevel = 'high'
): boolean {
  const metadata = auditResult.metadata.vulnerabilities;
  const minLevel = SEVERITY_ORDER[minSeverity];

  for (const [severity, count] of Object.entries(metadata)) {
    if (severity === 'total') continue;

    const level = SEVERITY_ORDER[severity as SeverityLevel];
    if (level >= minLevel && count > 0) {
      return true;
    }
  }

  return false;
}
