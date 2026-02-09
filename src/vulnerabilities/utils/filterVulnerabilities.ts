import {
  AuditResult,
  AuditConfig,
  FilteredVulnerability,
  SeverityLevel,
  SEVERITY_ORDER,
} from '../../shared/types';
import { isExpired } from '../../config/utils/isExpired';
import {
  extractVulnerabilityIds,
  getVulnerabilityTitle,
  getVulnerabilityUrl,
} from './extractVulnerabilityInfo';

/**
 * Filter vulnerabilities based on severity level and accepted vulnerabilities
 */
export function filterVulnerabilities(
  auditResult: AuditResult,
  config: AuditConfig,
  minSeverity: SeverityLevel = 'high',
  now: Date = new Date()
): FilteredVulnerability[] {
  const unaccepted: FilteredVulnerability[] = [];
  const minSeverityLevel = SEVERITY_ORDER[minSeverity];

  // Get set of non-expired accepted vulnerability IDs
  const acceptedIds = new Set(
    config.acceptedVulnerabilities.filter((v) => !isExpired(v, now)).map((v) => v.id)
  );

  for (const [name, vulnerability] of Object.entries(auditResult.vulnerabilities)) {
    // Check if severity meets threshold
    const severityLevel = SEVERITY_ORDER[vulnerability.severity];
    if (severityLevel < minSeverityLevel) {
      continue;
    }

    // Get all vulnerability IDs for this package
    const vulnIds = extractVulnerabilityIds(vulnerability);

    // Check if all vulnerabilities for this package are accepted
    const allAccepted = vulnIds.length > 0 && vulnIds.every((id) => acceptedIds.has(id));

    if (!allAccepted) {
      // Find the first unaccepted vulnerability ID for reporting
      const firstUnacceptedId = vulnIds.find((id) => !acceptedIds.has(id)) || vulnIds[0] || 0;

      unaccepted.push({
        id: firstUnacceptedId,
        name,
        severity: vulnerability.severity,
        title: getVulnerabilityTitle(vulnerability),
        url: getVulnerabilityUrl(vulnerability),
      });
    }
  }

  return unaccepted;
}
