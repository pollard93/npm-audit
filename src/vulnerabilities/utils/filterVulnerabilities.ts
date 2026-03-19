import {
  AuditResult,
  AuditConfig,
  FilteredVulnerability,
  SeverityLevel,
  SEVERITY_ORDER,
} from '../../shared/types';
import { isExpired } from '../../config/utils/isExpired';
import { resolveVulnerabilityDetails } from './extractVulnerabilityInfo';

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
  const unaccepted: FilteredVulnerability[] = [];
  const minSeverityLevel = SEVERITY_ORDER[minSeverity];

  // Get set of non-expired accepted vulnerability URLs
  const acceptedUrls = new Set(
    config.acceptedVulnerabilities.filter((v) => !isExpired(v, now)).map((v) => v.url)
  );

  for (const [name, vulnerability] of Object.entries(auditResult.vulnerabilities)) {
    // Check if severity meets threshold
    const severityLevel = SEVERITY_ORDER[vulnerability.severity];
    if (severityLevel < minSeverityLevel) {
      continue;
    }

    // Get all advisory details for this package, resolving transitive references
    const details = resolveVulnerabilityDetails(vulnerability, auditResult.vulnerabilities);

    // Report each unaccepted advisory
    for (const detail of details) {
      if (!acceptedUrls.has(detail.url)) {
        unaccepted.push({
          url: detail.url,
          name,
          severity: vulnerability.severity,
          title: detail.title,
        });
      }
    }
  }

  return unaccepted;
}
