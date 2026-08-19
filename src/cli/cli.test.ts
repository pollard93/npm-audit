import { checkAuditResult, deduplicateVulnerabilities } from './cli';
import {
  AuditResult,
  AuditConfig,
  NormalizedAdvisory,
  FilteredVulnerability,
} from '../shared/types';

describe('checkAuditResult', () => {
  const createMockAdvisory = (overrides: Partial<NormalizedAdvisory> = {}): NormalizedAdvisory => ({
    packageName: 'test-package',
    severity: 'high',
    title: 'Test vulnerability',
    url: 'https://npmjs.com/advisories/123456',
    ...overrides,
  });

  const createMockAuditResult = (advisories: NormalizedAdvisory[] = []): AuditResult => ({
    packageManager: 'npm',
    advisories,
    severityCounts: {
      info: 0,
      low: advisories.filter((a) => a.severity === 'low').length,
      moderate: advisories.filter((a) => a.severity === 'moderate').length,
      high: advisories.filter((a) => a.severity === 'high').length,
      critical: advisories.filter((a) => a.severity === 'critical').length,
      total: advisories.length,
    },
  });

  const emptyConfig: AuditConfig = { acceptedVulnerabilities: [] };

  it('should return exitCode 0 when no vulnerabilities are found', () => {
    const auditResult = createMockAuditResult([]);

    const result = checkAuditResult(auditResult, emptyConfig, 'high');

    expect(result.exitCode).toBe(0);
    expect(result.message).toContain('No high or above');
  });

  it('should detect high severity vulnerabilities by default', () => {
    const auditResult = createMockAuditResult([
      createMockAdvisory({ packageName: 'vulnerable-pkg', severity: 'high' }),
    ]);

    const result = checkAuditResult(auditResult, emptyConfig, 'high');

    expect(result.exitCode).toBe(1);
    expect(result.message).toContain('unaccepted vulnerabilities');
    expect(result.unacceptedVulnerabilities).toHaveLength(1);
  });

  it('should detect critical severity vulnerabilities', () => {
    const auditResult = createMockAuditResult([
      createMockAdvisory({
        packageName: 'critical-pkg',
        severity: 'critical',
        title: 'Critical issue',
        url: 'https://npmjs.com/advisories/999999',
      }),
    ]);

    const result = checkAuditResult(auditResult, emptyConfig, 'high');

    expect(result.exitCode).toBe(1);
    expect(result.unacceptedVulnerabilities).toHaveLength(1);
  });

  it('should detect low severity vulnerabilities when level is low', () => {
    const auditResult = createMockAuditResult([
      createMockAdvisory({
        packageName: 'low-pkg',
        severity: 'low',
        title: 'Low severity issue',
        url: 'https://npmjs.com/advisories/111111',
      }),
    ]);

    const result = checkAuditResult(auditResult, emptyConfig, 'low');

    expect(result.exitCode).toBe(1);
    expect(result.unacceptedVulnerabilities).toHaveLength(1);
  });

  it('should allow vulnerability when accepted in config', () => {
    const auditResult = createMockAuditResult([
      createMockAdvisory({
        packageName: 'accepted-pkg',
        title: 'Accepted issue',
        url: 'https://npmjs.com/advisories/123456',
      }),
    ]);

    const config: AuditConfig = {
      acceptedVulnerabilities: [
        {
          url: 'https://npmjs.com/advisories/123456',
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
    const auditResult = createMockAuditResult([
      createMockAdvisory({
        packageName: 'expired-pkg',
        title: 'Expired acceptance',
        url: 'https://npmjs.com/advisories/789012',
      }),
    ]);

    const config: AuditConfig = {
      acceptedVulnerabilities: [
        {
          url: 'https://npmjs.com/advisories/789012',
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

describe('deduplicateVulnerabilities', () => {
  const makeVuln = (url: string, name = `pkg-${url}`): FilteredVulnerability => ({
    url,
    name,
    severity: 'high',
    title: `Vulnerability ${url}`,
  });

  it('should return the same list when there are no duplicates', () => {
    const vulns = [
      makeVuln('https://example.com/a'),
      makeVuln('https://example.com/b'),
      makeVuln('https://example.com/c'),
    ];
    const result = deduplicateVulnerabilities(vulns);
    expect(result).toHaveLength(3);
    expect(result.map((v) => v.url)).toEqual([
      'https://example.com/a',
      'https://example.com/b',
      'https://example.com/c',
    ]);
  });

  it('should remove duplicate URLs keeping only the first occurrence', () => {
    const vulns = [
      makeVuln('https://example.com/a', 'pkg-a'),
      makeVuln('https://example.com/a', 'pkg-b'),
      makeVuln('https://example.com/a', 'pkg-c'),
      makeVuln('https://example.com/b', 'pkg-d'),
    ];
    const result = deduplicateVulnerabilities(vulns);
    expect(result).toHaveLength(2);
    expect(result[0].url).toBe('https://example.com/a');
    expect(result[0].name).toBe('pkg-a');
    expect(result[1].url).toBe('https://example.com/b');
  });

  it('should filter out entries with empty url', () => {
    const vulns = [
      makeVuln('', 'unresolvable-pkg'),
      makeVuln('https://example.com/a'),
      makeVuln('https://example.com/b'),
    ];
    const result = deduplicateVulnerabilities(vulns);
    expect(result).toHaveLength(2);
    expect(result.map((v) => v.url)).toEqual(['https://example.com/a', 'https://example.com/b']);
  });

  it('should filter out multiple entries with empty url', () => {
    const vulns = [makeVuln('', 'pkg-a'), makeVuln('', 'pkg-b'), makeVuln('https://example.com/a')];
    const result = deduplicateVulnerabilities(vulns);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://example.com/a');
  });

  it('should return empty array when all entries have empty url', () => {
    const vulns = [makeVuln('', 'pkg-a'), makeVuln('', 'pkg-b')];
    const result = deduplicateVulnerabilities(vulns);
    expect(result).toHaveLength(0);
  });

  it('should return empty array for empty input', () => {
    expect(deduplicateVulnerabilities([])).toHaveLength(0);
  });
});
