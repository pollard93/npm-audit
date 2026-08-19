import { filterVulnerabilities } from './filterVulnerabilities';
import { AuditConfig, AuditResult, NormalizedAdvisory } from '../../shared/types';

describe('filterVulnerabilities', () => {
  const createMockAuditResult = (advisories: NormalizedAdvisory[] = []): AuditResult => ({
    packageManager: 'npm',
    advisories,
    severityCounts: {
      info: 0,
      low: 0,
      moderate: 0,
      high: advisories.filter((a) => a.severity === 'high').length,
      critical: advisories.filter((a) => a.severity === 'critical').length,
      total: advisories.length,
    },
  });

  const createMockAdvisory = (overrides: Partial<NormalizedAdvisory> = {}): NormalizedAdvisory => ({
    packageName: 'vulnerable-pkg',
    severity: 'high',
    title: 'Test vulnerability',
    url: 'https://npmjs.com/advisories/123456',
    ...overrides,
  });

  it('should return unaccepted vulnerabilities', () => {
    const auditResult = createMockAuditResult([
      createMockAdvisory({
        packageName: 'vulnerable-pkg',
        title: 'High severity issue',
        url: 'https://npmjs.com/advisories/123456',
      }),
    ]);

    const config: AuditConfig = { acceptedVulnerabilities: [] };
    const result = filterVulnerabilities(auditResult, config);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('vulnerable-pkg');
    expect(result[0].url).toBe('https://npmjs.com/advisories/123456');
  });

  it('should filter out accepted vulnerabilities', () => {
    const auditResult = createMockAuditResult([
      createMockAdvisory({ url: 'https://npmjs.com/advisories/123456' }),
    ]);

    const config: AuditConfig = {
      acceptedVulnerabilities: [
        {
          url: 'https://npmjs.com/advisories/123456',
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
    const auditResult = createMockAuditResult([
      createMockAdvisory({ url: 'https://npmjs.com/advisories/123456' }),
    ]);

    const config: AuditConfig = {
      acceptedVulnerabilities: [
        {
          url: 'https://npmjs.com/advisories/123456',
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
    const auditResult = createMockAuditResult([
      createMockAdvisory({ packageName: 'moderate-pkg', severity: 'moderate' }),
    ]);

    const config: AuditConfig = { acceptedVulnerabilities: [] };
    const result = filterVulnerabilities(auditResult, config, 'high');

    expect(result).toHaveLength(0);
  });

  it('should handle multiple vulnerabilities in same package', () => {
    const auditResult = createMockAuditResult([
      createMockAdvisory({ title: 'Issue 1', url: 'https://npmjs.com/advisories/111' }),
      createMockAdvisory({ title: 'Issue 2', url: 'https://npmjs.com/advisories/222' }),
    ]);

    const config: AuditConfig = {
      acceptedVulnerabilities: [
        {
          url: 'https://npmjs.com/advisories/111',
          reason: 'Accepted for testing',
          acceptedBy: 'test@example.com',
          acceptedAt: '2026-02-09T00:00:00.000Z',
        },
      ],
    };

    const result = filterVulnerabilities(auditResult, config);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://npmjs.com/advisories/222');
  });

  it('should filter package when all vulnerabilities are accepted', () => {
    const auditResult = createMockAuditResult([
      createMockAdvisory({ title: 'Issue 1', url: 'https://npmjs.com/advisories/111' }),
      createMockAdvisory({ title: 'Issue 2', url: 'https://npmjs.com/advisories/222' }),
    ]);

    const config: AuditConfig = {
      acceptedVulnerabilities: [
        {
          url: 'https://npmjs.com/advisories/111',
          reason: 'Accepted for testing',
          acceptedBy: 'test@example.com',
          acceptedAt: '2026-02-09T00:00:00.000Z',
        },
        {
          url: 'https://npmjs.com/advisories/222',
          reason: 'Accepted for testing',
          acceptedBy: 'test@example.com',
          acceptedAt: '2026-02-09T00:00:00.000Z',
        },
      ],
    };

    const result = filterVulnerabilities(auditResult, config);
    expect(result).toHaveLength(0);
  });

  it('should preserve resolved title and URL for transitive vulnerabilities', () => {
    const auditResult = createMockAuditResult([
      createMockAdvisory({
        packageName: '@eslint/config-array',
        title: 'ReDoS via repeated wildcards',
        url: 'https://github.com/advisories/GHSA-1234',
      }),
    ]);

    const config: AuditConfig = { acceptedVulnerabilities: [] };
    const result = filterVulnerabilities(auditResult, config);

    const transitiveResult = result.find((v) => v.name === '@eslint/config-array');
    expect(transitiveResult).toBeDefined();
    expect(transitiveResult!.title).toBe('ReDoS via repeated wildcards');
    expect(transitiveResult!.url).toBe('https://github.com/advisories/GHSA-1234');
  });
});
