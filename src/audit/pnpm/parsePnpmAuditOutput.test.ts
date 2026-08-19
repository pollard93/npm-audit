import { parsePnpmAuditOutput } from './parsePnpmAuditOutput';
import { PnpmAdvisory, PnpmAuditRaw } from './types';

describe('parsePnpmAuditOutput', () => {
  const createMockAdvisory = (overrides: Partial<PnpmAdvisory> = {}): PnpmAdvisory => ({
    id: 1234,
    title: 'Test vulnerability',
    severity: 'high',
    url: 'https://github.com/advisories/GHSA-xxxx-xxxx-xxxx',
    module_name: 'test-package',
    ...overrides,
  });

  const createMockRaw = (advisories: Record<string, PnpmAdvisory> = {}): PnpmAuditRaw => ({
    advisories,
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: Object.values(advisories).filter((a) => a.severity === 'high').length,
        critical: Object.values(advisories).filter((a) => a.severity === 'critical').length,
      },
    },
  });

  it('should parse valid pnpm audit JSON output into the normalized shape', () => {
    const output = JSON.stringify(
      createMockRaw({ '1234': createMockAdvisory({ module_name: 'vulnerable-pkg' }) })
    );
    const result = parsePnpmAuditOutput(output);

    expect(result.packageManager).toBe('pnpm');
    expect(result.advisories).toEqual([
      {
        packageName: 'vulnerable-pkg',
        severity: 'high',
        title: 'Test vulnerability',
        url: 'https://github.com/advisories/GHSA-xxxx-xxxx-xxxx',
      },
    ]);
    expect(result.severityCounts.high).toBe(1);
    expect(result.severityCounts.total).toBe(1);
  });

  it('should return an empty advisories list for a clean audit', () => {
    const output = JSON.stringify(createMockRaw());
    const result = parsePnpmAuditOutput(output);

    expect(result.advisories).toEqual([]);
    expect(result.severityCounts.total).toBe(0);
  });

  it('should map multiple advisories from different packages', () => {
    const output = JSON.stringify(
      createMockRaw({
        '111': createMockAdvisory({ id: 111, module_name: 'pkg-a', severity: 'critical' }),
        '222': createMockAdvisory({ id: 222, module_name: 'pkg-b', severity: 'moderate' }),
      })
    );
    const result = parsePnpmAuditOutput(output);

    expect(result.advisories).toHaveLength(2);
    expect(result.advisories.map((a) => a.packageName)).toEqual(['pkg-a', 'pkg-b']);
  });

  it('should use metadata.total when provided instead of recomputing it', () => {
    const raw = createMockRaw({ '1234': createMockAdvisory() });
    raw.metadata.vulnerabilities.total = 99;
    const result = parsePnpmAuditOutput(JSON.stringify(raw));

    expect(result.severityCounts.total).toBe(99);
  });

  it('should throw for invalid JSON', () => {
    expect(() => parsePnpmAuditOutput('not valid json')).toThrow(
      'Failed to parse pnpm audit output'
    );
  });

  it('should throw for missing advisories', () => {
    const output = JSON.stringify({ metadata: { vulnerabilities: {} } });
    expect(() => parsePnpmAuditOutput(output)).toThrow('Invalid audit output structure');
  });

  it('should throw for missing metadata', () => {
    const output = JSON.stringify({ advisories: {} });
    expect(() => parsePnpmAuditOutput(output)).toThrow('Invalid audit output structure');
  });
});
