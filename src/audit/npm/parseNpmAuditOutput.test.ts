import { parseNpmAuditOutput } from './parseNpmAuditOutput';
import { NpmAuditRaw, NpmVulnerability } from './types';

describe('parseNpmAuditOutput', () => {
  const createMockVulnerability = (
    overrides: Partial<NpmVulnerability> = {}
  ): NpmVulnerability => ({
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

  const createMockRaw = (vulnerabilities: Record<string, NpmVulnerability> = {}): NpmAuditRaw => ({
    auditReportVersion: 2,
    vulnerabilities,
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

  it('should parse valid audit JSON output into the normalized shape', () => {
    const output = JSON.stringify(
      createMockRaw({ 'vulnerable-pkg': createMockVulnerability({ name: 'vulnerable-pkg' }) })
    );
    const result = parseNpmAuditOutput(output);

    expect(result.packageManager).toBe('npm');
    expect(result.advisories).toEqual([
      {
        packageName: 'vulnerable-pkg',
        severity: 'high',
        title: 'Test vulnerability',
        url: 'https://npmjs.com/advisories/123456',
      },
    ]);
    expect(result.severityCounts.high).toBe(1);
  });

  it('should return an empty advisories list for a clean audit', () => {
    const output = JSON.stringify(createMockRaw());
    const result = parseNpmAuditOutput(output);

    expect(result.advisories).toEqual([]);
    expect(result.severityCounts.total).toBe(0);
  });

  it('should resolve transitive advisories into the flattened list', () => {
    const rootVuln = createMockVulnerability({
      name: 'minimatch',
      via: [
        {
          source: 111,
          name: 'minimatch',
          dependency: 'minimatch',
          title: 'ReDoS via repeated wildcards',
          url: 'https://github.com/advisories/GHSA-1234',
          severity: 'high',
          range: '*',
        },
      ],
    });
    const transitiveVuln = createMockVulnerability({
      name: '@eslint/config-array',
      title: '',
      url: '',
      via: ['minimatch'],
    });

    const output = JSON.stringify(
      createMockRaw({ minimatch: rootVuln, '@eslint/config-array': transitiveVuln })
    );
    const result = parseNpmAuditOutput(output);

    const transitiveAdvisory = result.advisories.find(
      (a) => a.packageName === '@eslint/config-array'
    );
    expect(transitiveAdvisory).toEqual({
      packageName: '@eslint/config-array',
      severity: 'high',
      title: 'ReDoS via repeated wildcards',
      url: 'https://github.com/advisories/GHSA-1234',
    });
  });

  it('should throw for invalid JSON', () => {
    expect(() => parseNpmAuditOutput('not valid json')).toThrow('Failed to parse npm audit output');
  });

  it('should throw for missing vulnerabilities', () => {
    const output = JSON.stringify({ metadata: {} });
    expect(() => parseNpmAuditOutput(output)).toThrow('Invalid audit output structure');
  });

  it('should throw for missing metadata', () => {
    const output = JSON.stringify({ vulnerabilities: {} });
    expect(() => parseNpmAuditOutput(output)).toThrow('Invalid audit output structure');
  });
});
