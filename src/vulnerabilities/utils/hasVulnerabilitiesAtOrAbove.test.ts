import { hasVulnerabilitiesAtOrAbove } from './hasVulnerabilitiesAtOrAbove';
import { AuditResult, Vulnerability } from '../../shared/types';

describe('hasVulnerabilitiesAtOrAbove', () => {
  const createMockAuditResult = (
    vulnerabilities: Record<string, Partial<Vulnerability>> = {},
    metadataOverrides: Partial<AuditResult['metadata']['vulnerabilities']> = {}
  ): AuditResult => ({
    auditReportVersion: 2,
    vulnerabilities: vulnerabilities as Record<string, Vulnerability>,
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: Object.values(vulnerabilities).filter((v) => v.severity === 'high').length,
        critical: Object.values(vulnerabilities).filter((v) => v.severity === 'critical').length,
        total: Object.keys(vulnerabilities).length,
        ...metadataOverrides,
      },
      dependencies: {
        prod: 10,
        dev: 5,
        optional: 0,
        peer: 0,
        peerOptional: 0,
        total: 15,
      },
    },
  });

  const createMockVulnerability = (overrides: Partial<Vulnerability> = {}): Vulnerability => ({
    id: 1,
    name: 'test-package',
    severity: 'high',
    title: 'Test vulnerability',
    url: 'https://npmjs.com/advisories/123',
    range: '*',
    via: [],
    effects: [],
    fixAvailable: false,
    ...overrides,
  });

  it('should return true when high vulnerabilities exist', () => {
    const result = createMockAuditResult({
      'test-pkg': createMockVulnerability({ severity: 'high' }),
    });

    expect(hasVulnerabilitiesAtOrAbove(result, 'high')).toBe(true);
  });

  it('should return true when critical vulnerabilities exist', () => {
    const result = createMockAuditResult({
      'test-pkg': createMockVulnerability({ severity: 'critical' }),
    });

    expect(hasVulnerabilitiesAtOrAbove(result, 'high')).toBe(true);
  });

  it('should return false when only moderate vulnerabilities exist', () => {
    const result: AuditResult = {
      auditReportVersion: 2,
      vulnerabilities: {
        'test-pkg': createMockVulnerability({ severity: 'moderate' }),
      },
      metadata: {
        vulnerabilities: {
          info: 0,
          low: 0,
          moderate: 1,
          high: 0,
          critical: 0,
          total: 1,
        },
        dependencies: { prod: 10, dev: 5, optional: 0, peer: 0, peerOptional: 0, total: 15 },
      },
    };

    expect(hasVulnerabilitiesAtOrAbove(result, 'high')).toBe(false);
  });

  it('should return false when no vulnerabilities exist', () => {
    const result = createMockAuditResult();
    expect(hasVulnerabilitiesAtOrAbove(result, 'high')).toBe(false);
  });

  it('should respect minimum severity level', () => {
    const result: AuditResult = {
      auditReportVersion: 2,
      vulnerabilities: {
        'test-pkg': createMockVulnerability({ severity: 'moderate' }),
      },
      metadata: {
        vulnerabilities: {
          info: 0,
          low: 0,
          moderate: 1,
          high: 0,
          critical: 0,
          total: 1,
        },
        dependencies: { prod: 10, dev: 5, optional: 0, peer: 0, peerOptional: 0, total: 15 },
      },
    };

    expect(hasVulnerabilitiesAtOrAbove(result, 'moderate')).toBe(true);
    expect(hasVulnerabilitiesAtOrAbove(result, 'low')).toBe(true);
  });

  it('should use default minimum severity of high', () => {
    const result = createMockAuditResult({
      'test-pkg': createMockVulnerability({ severity: 'high' }),
    });

    expect(hasVulnerabilitiesAtOrAbove(result)).toBe(true);
  });

  it('should check critical level correctly', () => {
    const result = createMockAuditResult(
      {},
      { critical: 2, high: 0, moderate: 0, low: 0, info: 0, total: 2 }
    );

    expect(hasVulnerabilitiesAtOrAbove(result, 'critical')).toBe(true);
    expect(hasVulnerabilitiesAtOrAbove(result, 'high')).toBe(true);
  });

  it('should return false when vulnerabilities are below threshold', () => {
    const result = createMockAuditResult(
      {},
      { critical: 0, high: 0, moderate: 0, low: 5, info: 3, total: 8 }
    );

    expect(hasVulnerabilitiesAtOrAbove(result, 'moderate')).toBe(false);
    expect(hasVulnerabilitiesAtOrAbove(result, 'low')).toBe(true);
  });
});
