import {
  AuditResult,
  AuditConfig,
  FilteredVulnerability,
  SeverityLevel,
  SEVERITY_ORDER,
} from '../../shared/types';
import { isExpired } from '../../config/utils/isExpired';

/**
 * Filter vulnerabilities based on severity level and accepted vulnerabilities.
 * Returns one entry per unaccepted advisory URL.
 */
export function filterVulnerabilities(
  auditResult: AuditResult,
  config: AuditConfig,
  minSeverity: SeverityLevel = 'high',
  now: Date = new Date()
): FilteredVulnerability[] {
  const minSeverityLevel = SEVERITY_ORDER[minSeverity];

  // Get set of non-expired accepted vulnerability URLs
  const acceptedUrls = new Set(
    config.acceptedVulnerabilities.filter((v) => !isExpired(v, now)).map((v) => v.url)
  );

  return auditResult.advisories
    .filter(
      (advisory) =>
        SEVERITY_ORDER[advisory.severity] >= minSeverityLevel && !acceptedUrls.has(advisory.url)
    )
    .map((advisory) => ({
      url: advisory.url,
      name: advisory.packageName,
      severity: advisory.severity,
      title: advisory.title,
    }));
}
