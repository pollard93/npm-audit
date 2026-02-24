import { filterVulnerabilities } from './filterVulnerabilities';
import { AuditResult, AuditConfig, Vulnerability } from '../../shared/types';

describe('filterVulnerabilities', () => {
  const createMockAuditResult = (
    vulnerabilities: Record<string, Partial<Vulnerability>> = {}
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
    via: [
      {
        source: 123456,
        name: 'test-package',
        dependency: 'test-package',
        title: 'Test vulnerability title',
        url: 'https://npmjs.com/advisories/123456',
        severity: 'high',
        range: '*',
      },
    ],
    effects: [],
    fixAvailable: false,
    ...overrides,
  });

  it('should return unaccepted vulnerabilities', () => {
    const auditResult = createMockAuditResult({
      'vulnerable-pkg': createMockVulnerability({
        name: 'vulnerable-pkg',
        severity: 'high',
        via: [
          {
            source: 123456,
            name: 'vulnerable-pkg',
            dependency: 'vulnerable-pkg',
            title: 'High severity issue',
            url: 'https://npmjs.com/advisories/123456',
            severity: 'high',
            range: '*',
          },
        ],
      }),
    });

    const config: AuditConfig = { acceptedVulnerabilities: [] };
    const result = filterVulnerabilities(auditResult, config);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('vulnerable-pkg');
    expect(result[0].id).toBe(123456);
  });

  it('should filter out accepted vulnerabilities', () => {
    const auditResult = createMockAuditResult({
      'vulnerable-pkg': createMockVulnerability({
        name: 'vulnerable-pkg',
        severity: 'high',
        via: [
          {
            source: 123456,
            name: 'vulnerable-pkg',
            dependency: 'vulnerable-pkg',
            title: 'High severity issue',
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
          reason: 'Accepted for testing',
          acceptedBy: 'test@example.com',
          acceptedAt: '2026-02-09T00:00:00.000Z',
        },
      ],
    };

    const result = filterVulnerabilities(auditResult, config);
    expect(result).toHaveLength(0);
  });

  it('should not filter expired accepted vulnerabilities', () => {
    const auditResult = createMockAuditResult({
      'vulnerable-pkg': createMockVulnerability({
        name: 'vulnerable-pkg',
        severity: 'high',
        via: [
          {
            source: 123456,
            name: 'vulnerable-pkg',
            dependency: 'vulnerable-pkg',
            title: 'High severity issue',
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
          reason: 'Accepted for testing',
          acceptedBy: 'test@example.com',
          acceptedAt: '2025-01-01T00:00:00.000Z',
          expiresAt: '2025-12-31T00:00:00.000Z',
        },
      ],
    };

    const now = new Date('2026-02-09T00:00:00.000Z');
    const result = filterVulnerabilities(auditResult, config, 'high', now);
    expect(result).toHaveLength(1);
  });

  it('should filter vulnerabilities below minimum severity', () => {
    const auditResult: AuditResult = {
      auditReportVersion: 2,
      vulnerabilities: {
        'moderate-pkg': createMockVulnerability({
          name: 'moderate-pkg',
          severity: 'moderate',
        }),
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

    const config: AuditConfig = { acceptedVulnerabilities: [] };
    const result = filterVulnerabilities(auditResult, config, 'high');

    expect(result).toHaveLength(0);
  });

  it('should handle multiple vulnerabilities in same package', () => {
    const auditResult = createMockAuditResult({
      'vulnerable-pkg': createMockVulnerability({
        name: 'vulnerable-pkg',
        severity: 'high',
        via: [
          {
            source: 111,
            name: 'vulnerable-pkg',
            dependency: 'vulnerable-pkg',
            title: 'Issue 1',
            url: 'https://npmjs.com/advisories/111',
            severity: 'high',
            range: '*',
          },
          {
            source: 222,
            name: 'vulnerable-pkg',
            dependency: 'vulnerable-pkg',
            title: 'Issue 2',
            url: 'https://npmjs.com/advisories/222',
            severity: 'high',
            range: '*',
          },
        ],
      }),
    });

    const config: AuditConfig = {
      acceptedVulnerabilities: [
        {
          id: 111,
          reason: 'Accepted for testing',
          acceptedBy: 'test@example.com',
          acceptedAt: '2026-02-09T00:00:00.000Z',
        },
      ],
    };

    const result = filterVulnerabilities(auditResult, config);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(222);
  });

  it('should filter package when all vulnerabilities are accepted', () => {
    const auditResult = createMockAuditResult({
      'vulnerable-pkg': createMockVulnerability({
        name: 'vulnerable-pkg',
        severity: 'high',
        via: [
          {
            source: 111,
            name: 'vulnerable-pkg',
            dependency: 'vulnerable-pkg',
            title: 'Issue 1',
            url: 'https://npmjs.com/advisories/111',
            severity: 'high',
            range: '*',
          },
          {
            source: 222,
            name: 'vulnerable-pkg',
            dependency: 'vulnerable-pkg',
            title: 'Issue 2',
            url: 'https://npmjs.com/advisories/222',
            severity: 'high',
            range: '*',
          },
        ],
      }),
    });

    const config: AuditConfig = {
      acceptedVulnerabilities: [
        {
          id: 111,
          reason: 'Accepted for testing',
          acceptedBy: 'test@example.com',
          acceptedAt: '2026-02-09T00:00:00.000Z',
        },
        {
          id: 222,
          reason: 'Accepted for testing',
          acceptedBy: 'test@example.com',
          acceptedAt: '2026-02-09T00:00:00.000Z',
        },
      ],
    };

    const result = filterVulnerabilities(auditResult, config);
    expect(result).toHaveLength(0);
  });

  it('should resolve title and URL for transitive vulnerabilities', () => {
    const auditResult = createMockAuditResult({
      minimatch: createMockVulnerability({
        name: 'minimatch',
        severity: 'high',
        via: [
          {
            source: 1113371,
            name: 'minimatch',
            dependency: 'minimatch',
            title: 'ReDoS via repeated wildcards',
            url: 'https://github.com/advisories/GHSA-1234',
            severity: 'high',
            range: '*',
          },
        ],
      }),
      '@eslint/config-array': createMockVulnerability({
        name: '@eslint/config-array',
        severity: 'high',
        title: '',
        url: '',
        via: ['minimatch'],
      }),
    });

    const config: AuditConfig = { acceptedVulnerabilities: [] };
    const result = filterVulnerabilities(auditResult, config);

    const transitiveResult = result.find((v) => v.name === '@eslint/config-array');
    expect(transitiveResult).toBeDefined();
    expect(transitiveResult!.id).toBe(1113371);
    expect(transitiveResult!.title).toBe('ReDoS via repeated wildcards');
    expect(transitiveResult!.url).toBe('https://github.com/advisories/GHSA-1234');
  });
});
