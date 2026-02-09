import { checkAuditResult } from './cli';
import { AuditResult, AuditConfig, Vulnerability } from '../shared/types';

describe('checkAuditResult', () => {
  const createMockVulnerability = (overrides: Partial<Vulnerability> = {}): Vulnerability => ({
    id: 1,
    name: 'test-package',
    severity: 'high',
    title: 'Test vulnerability',
    url: 'https://npmjs.com/advisories/123456',
    range: '*',
    via: [
      {
        source: 123456,
        name: 'test-package',
        dependency: 'test-package',
        title: 'Test vulnerability',
        url: 'https://npmjs.com/advisories/123456',
        severity: 'high',
        range: '*',
      },
    ],
    effects: [],
    fixAvailable: false,
    ...overrides,
  });

  const createMockAuditResult = (
    vulnerabilities: Record<string, Partial<Vulnerability>> = {},
    counts?: { high?: number; critical?: number; moderate?: number; low?: number }
  ): AuditResult => ({
    auditReportVersion: 2,
    vulnerabilities: vulnerabilities as Record<string, Vulnerability>,
    metadata: {
      vulnerabilities: {
        info: 0,
        low: counts?.low ?? 0,
        moderate: counts?.moderate ?? 0,
        high:
          counts?.high ??
          Object.values(vulnerabilities).filter((v) => v.severity === 'high').length,
        critical:
          counts?.critical ??
          Object.values(vulnerabilities).filter((v) => v.severity === 'critical').length,
        total: Object.keys(vulnerabilities).length,
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

  const emptyConfig: AuditConfig = { acceptedVulnerabilities: [] };

  it('should return exitCode 0 when no vulnerabilities are found', () => {
    const auditResult = createMockAuditResult({});

    const result = checkAuditResult(auditResult, emptyConfig, 'high');

    expect(result.exitCode).toBe(0);
    expect(result.message).toContain('No high or above');
  });

  it('should detect high severity vulnerabilities by default', () => {
    const auditResult = createMockAuditResult({
      'vulnerable-pkg': createMockVulnerability({
        name: 'vulnerable-pkg',
        severity: 'high',
      }),
    });

    const result = checkAuditResult(auditResult, emptyConfig, 'high');

    expect(result.exitCode).toBe(1);
    expect(result.message).toContain('unaccepted vulnerabilities');
    expect(result.unacceptedVulnerabilities).toHaveLength(1);
  });

  it('should detect critical severity vulnerabilities', () => {
    const auditResult = createMockAuditResult({
      'critical-pkg': createMockVulnerability({
        name: 'critical-pkg',
        severity: 'critical',
        via: [
          {
            source: 999999,
            name: 'critical-pkg',
            dependency: 'critical-pkg',
            title: 'Critical issue',
            url: 'https://npmjs.com/advisories/999999',
            severity: 'critical',
            range: '*',
          },
        ],
      }),
    });

    const result = checkAuditResult(auditResult, emptyConfig, 'high');

    expect(result.exitCode).toBe(1);
    expect(result.unacceptedVulnerabilities).toHaveLength(1);
  });

  it('should detect low severity vulnerabilities when level is low', () => {
    const auditResult = createMockAuditResult(
      {
        'low-pkg': createMockVulnerability({
          name: 'low-pkg',
          severity: 'low',
          via: [
            {
              source: 111111,
              name: 'low-pkg',
              dependency: 'low-pkg',
              title: 'Low severity issue',
              url: 'https://npmjs.com/advisories/111111',
              severity: 'low',
              range: '*',
            },
          ],
        }),
      },
      { low: 1 }
    );

    const result = checkAuditResult(auditResult, emptyConfig, 'low');

    expect(result.exitCode).toBe(1);
    expect(result.unacceptedVulnerabilities).toHaveLength(1);
  });

  it('should allow vulnerability when accepted in config', () => {
    const auditResult = createMockAuditResult({
      'accepted-pkg': createMockVulnerability({
        name: 'accepted-pkg',
        severity: 'high',
        via: [
          {
            source: 123456,
            name: 'accepted-pkg',
            dependency: 'accepted-pkg',
            title: 'Accepted issue',
            url: 'https://npmjs.com/advisories/123456',
            severity: 'high',
            range: '*',
          },
        ],
      }),
    });

    const config: AuditConfig = {
      acceptedVulnerabilities: [
        {
          id: 123456,
          reason: 'Mitigated by input validation',
          acceptedBy: 'security@example.com',
          acceptedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };

    const result = checkAuditResult(auditResult, config, 'high');

    expect(result.exitCode).toBe(0);
    expect(result.message).toContain('All vulnerabilities are accepted');
  });

  it('should fail when accepted vulnerability has expired', () => {
    const auditResult = createMockAuditResult({
      'expired-pkg': createMockVulnerability({
        name: 'expired-pkg',
        severity: 'high',
        via: [
          {
            source: 789012,
            name: 'expired-pkg',
            dependency: 'expired-pkg',
            title: 'Expired acceptance',
            url: 'https://npmjs.com/advisories/789012',
            severity: 'high',
            range: '*',
          },
        ],
      }),
    });

    const config: AuditConfig = {
      acceptedVulnerabilities: [
        {
          id: 789012,
          reason: 'Was accepted but now expired',
          acceptedBy: 'security@example.com',
          acceptedAt: '2025-01-01T00:00:00.000Z',
          expiresAt: '2025-12-31T00:00:00.000Z', // Expired (before Feb 2026)
        },
      ],
    };

    const result = checkAuditResult(auditResult, config, 'high');

    expect(result.exitCode).toBe(1);
    expect(result.message).toContain('unaccepted vulnerabilities');
    expect(result.unacceptedVulnerabilities).toHaveLength(1);
  });
});
