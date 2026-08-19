import { hasVulnerabilitiesAtOrAbove } from './hasVulnerabilitiesAtOrAbove';
import { AuditResult } from '../../shared/types';

describe('hasVulnerabilitiesAtOrAbove', () => {
  const createMockAuditResult = (
    counts: Partial<AuditResult['severityCounts']> = {}
  ): AuditResult => ({
    packageManager: 'npm',
    advisories: [],
    severityCounts: {
      info: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
      total: 0,
      ...counts,
    },
  });

  it('should return true when high vulnerabilities exist', () => {
    const result = createMockAuditResult({ high: 1, total: 1 });
    expect(hasVulnerabilitiesAtOrAbove(result, 'high')).toBe(true);
  });

  it('should return true when critical vulnerabilities exist', () => {
    const result = createMockAuditResult({ critical: 1, total: 1 });
    expect(hasVulnerabilitiesAtOrAbove(result, 'high')).toBe(true);
  });

  it('should return false when only moderate vulnerabilities exist', () => {
    const result = createMockAuditResult({ moderate: 1, total: 1 });
    expect(hasVulnerabilitiesAtOrAbove(result, 'high')).toBe(false);
  });

  it('should return false when no vulnerabilities exist', () => {
    const result = createMockAuditResult();
    expect(hasVulnerabilitiesAtOrAbove(result, 'high')).toBe(false);
  });

  it('should respect minimum severity level', () => {
    const result = createMockAuditResult({ moderate: 1, total: 1 });

    expect(hasVulnerabilitiesAtOrAbove(result, 'moderate')).toBe(true);
    expect(hasVulnerabilitiesAtOrAbove(result, 'low')).toBe(true);
  });

  it('should use default minimum severity of high', () => {
    const result = createMockAuditResult({ high: 1, total: 1 });
    expect(hasVulnerabilitiesAtOrAbove(result)).toBe(true);
  });

  it('should check critical level correctly', () => {
    const result = createMockAuditResult({ critical: 2, total: 2 });

    expect(hasVulnerabilitiesAtOrAbove(result, 'critical')).toBe(true);
    expect(hasVulnerabilitiesAtOrAbove(result, 'high')).toBe(true);
  });

  it('should return false when vulnerabilities are below threshold', () => {
    const result = createMockAuditResult({ low: 5, info: 3, total: 8 });

    expect(hasVulnerabilitiesAtOrAbove(result, 'moderate')).toBe(false);
    expect(hasVulnerabilitiesAtOrAbove(result, 'low')).toBe(true);
  });
});
