import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock the runAudit module
jest.mock('../audit/runAudit');

import { runAudit } from '../audit/runAudit';
import { AuditResult, Vulnerability } from '../shared/types';

const mockedRunAudit = runAudit as jest.MockedFunction<typeof runAudit>;

// We need to test the main function directly since we're mocking runAudit
// Import the functions we need to test the logic
import { filterVulnerabilities } from '../vulnerabilities/utils/filterVulnerabilities';
import { hasVulnerabilitiesAtOrAbove } from '../vulnerabilities/utils/hasVulnerabilitiesAtOrAbove';
import { loadConfig } from '../config/loadConfig';
import { parseArgs } from './utils/parseArgs';

describe('CLI End-to-End with Mocked Audit', () => {
  let tempDir: string;

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

  const createMockAuditResult = (
    vulnerabilities: Record<string, Partial<Vulnerability>> = {}
  ): AuditResult => ({
    auditReportVersion: 2,
    vulnerabilities: vulnerabilities as Record<string, Vulnerability>,
    metadata: {
      vulnerabilities: {
        info: Object.values(vulnerabilities).filter((v) => v.severity === 'info').length,
        low: Object.values(vulnerabilities).filter((v) => v.severity === 'low').length,
        moderate: Object.values(vulnerabilities).filter((v) => v.severity === 'moderate').length,
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

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-audit-e2e-'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('vulnerability detection', () => {
    it('should detect high severity vulnerabilities', async () => {
      const auditResult = createMockAuditResult({
        'vulnerable-package': createMockVulnerability({
          name: 'vulnerable-package',
          severity: 'high',
          via: [
            {
              source: 111111,
              name: 'vulnerable-package',
              dependency: 'vulnerable-package',
              title: 'Prototype Pollution',
              url: 'https://npmjs.com/advisories/111111',
              severity: 'high',
              range: '<2.0.0',
            },
          ],
        }),
      });

      mockedRunAudit.mockResolvedValue(auditResult);

      const hasVulns = hasVulnerabilitiesAtOrAbove(auditResult, 'high');
      expect(hasVulns).toBe(true);

      const config = { acceptedVulnerabilities: [] };
      const unaccepted = filterVulnerabilities(auditResult, config, 'high');

      expect(unaccepted).toHaveLength(1);
      expect(unaccepted[0].name).toBe('vulnerable-package');
      expect(unaccepted[0].id).toBe(111111);
      expect(unaccepted[0].severity).toBe('high');
      expect(unaccepted[0].title).toBe('Prototype Pollution');
    });

    it('should detect critical severity vulnerabilities', async () => {
      const auditResult = createMockAuditResult({
        'critical-package': createMockVulnerability({
          name: 'critical-package',
          severity: 'critical',
          via: [
            {
              source: 222222,
              name: 'critical-package',
              dependency: 'critical-package',
              title: 'Remote Code Execution',
              url: 'https://npmjs.com/advisories/222222',
              severity: 'critical',
              range: '*',
            },
          ],
        }),
      });

      mockedRunAudit.mockResolvedValue(auditResult);

      const hasVulns = hasVulnerabilitiesAtOrAbove(auditResult, 'high');
      expect(hasVulns).toBe(true);

      const config = { acceptedVulnerabilities: [] };
      const unaccepted = filterVulnerabilities(auditResult, config, 'high');

      expect(unaccepted).toHaveLength(1);
      expect(unaccepted[0].severity).toBe('critical');
    });

    it('should ignore moderate vulnerabilities when level is high', async () => {
      const auditResult = createMockAuditResult({
        'moderate-package': createMockVulnerability({
          name: 'moderate-package',
          severity: 'moderate',
        }),
      });

      // Override metadata to have correct counts
      auditResult.metadata.vulnerabilities = {
        info: 0,
        low: 0,
        moderate: 1,
        high: 0,
        critical: 0,
        total: 1,
      };

      mockedRunAudit.mockResolvedValue(auditResult);

      const hasVulns = hasVulnerabilitiesAtOrAbove(auditResult, 'high');
      expect(hasVulns).toBe(false);
    });

    it('should detect multiple vulnerabilities across packages', async () => {
      const auditResult = createMockAuditResult({
        'package-a': createMockVulnerability({
          name: 'package-a',
          severity: 'high',
          via: [
            {
              source: 333333,
              name: 'package-a',
              dependency: 'package-a',
              title: 'SQL Injection',
              url: 'https://npmjs.com/advisories/333333',
              severity: 'high',
              range: '*',
            },
          ],
        }),
        'package-b': createMockVulnerability({
          name: 'package-b',
          severity: 'critical',
          via: [
            {
              source: 444444,
              name: 'package-b',
              dependency: 'package-b',
              title: 'Command Injection',
              url: 'https://npmjs.com/advisories/444444',
              severity: 'critical',
              range: '*',
            },
          ],
        }),
      });

      mockedRunAudit.mockResolvedValue(auditResult);

      const config = { acceptedVulnerabilities: [] };
      const unaccepted = filterVulnerabilities(auditResult, config, 'high');

      expect(unaccepted).toHaveLength(2);
      expect(unaccepted.map((v) => v.name).sort()).toEqual(['package-a', 'package-b']);
    });
  });

  describe('accepted vulnerabilities', () => {
    it('should filter out accepted vulnerabilities', async () => {
      const auditResult = createMockAuditResult({
        'accepted-package': createMockVulnerability({
          name: 'accepted-package',
          severity: 'high',
          via: [
            {
              source: 555555,
              name: 'accepted-package',
              dependency: 'accepted-package',
              title: 'Known Issue',
              url: 'https://npmjs.com/advisories/555555',
              severity: 'high',
              range: '*',
            },
          ],
        }),
      });

      mockedRunAudit.mockResolvedValue(auditResult);

      const config = {
        acceptedVulnerabilities: [
          {
            id: 555555,
            reason: 'Mitigated by input validation',
            acceptedBy: 'security@example.com',
            acceptedAt: '2026-02-09T00:00:00.000Z',
          },
        ],
      };

      const unaccepted = filterVulnerabilities(auditResult, config, 'high');
      expect(unaccepted).toHaveLength(0);
    });

    it('should not filter expired accepted vulnerabilities', async () => {
      const auditResult = createMockAuditResult({
        'expired-accept': createMockVulnerability({
          name: 'expired-accept',
          severity: 'high',
          via: [
            {
              source: 666666,
              name: 'expired-accept',
              dependency: 'expired-accept',
              title: 'Expired Acceptance',
              url: 'https://npmjs.com/advisories/666666',
              severity: 'high',
              range: '*',
            },
          ],
        }),
      });

      mockedRunAudit.mockResolvedValue(auditResult);

      const config = {
        acceptedVulnerabilities: [
          {
            id: 666666,
            reason: 'Was accepted but expired',
            acceptedBy: 'security@example.com',
            acceptedAt: '2025-01-01T00:00:00.000Z',
            expiresAt: '2025-12-31T00:00:00.000Z', // Expired
          },
        ],
      };

      const now = new Date('2026-02-09T00:00:00.000Z');
      const unaccepted = filterVulnerabilities(auditResult, config, 'high', now);

      expect(unaccepted).toHaveLength(1);
      expect(unaccepted[0].id).toBe(666666);
    });

    it('should load config from file and filter vulnerabilities', async () => {
      const auditResult = createMockAuditResult({
        'config-test-pkg': createMockVulnerability({
          name: 'config-test-pkg',
          severity: 'high',
          via: [
            {
              source: 777777,
              name: 'config-test-pkg',
              dependency: 'config-test-pkg',
              title: 'Config Test',
              url: 'https://npmjs.com/advisories/777777',
              severity: 'high',
              range: '*',
            },
          ],
        }),
      });

      mockedRunAudit.mockResolvedValue(auditResult);

      // Create config file
      const configPath = path.join(tempDir, '.npm-audit-accept.json');
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          acceptedVulnerabilities: [
            {
              id: 777777,
              reason: 'Accepted via config file',
              acceptedBy: 'test@example.com',
              acceptedAt: '2026-02-09T00:00:00.000Z',
            },
          ],
        })
      );

      const config = await loadConfig(undefined, tempDir);
      const unaccepted = filterVulnerabilities(auditResult, config, 'high');

      expect(unaccepted).toHaveLength(0);
    });

    it('should require all vulnerabilities in a package to be accepted', async () => {
      const auditResult = createMockAuditResult({
        'multi-vuln-pkg': createMockVulnerability({
          name: 'multi-vuln-pkg',
          severity: 'high',
          via: [
            {
              source: 888888,
              name: 'multi-vuln-pkg',
              dependency: 'multi-vuln-pkg',
              title: 'First Issue',
              url: 'https://npmjs.com/advisories/888888',
              severity: 'high',
              range: '*',
            },
            {
              source: 999999,
              name: 'multi-vuln-pkg',
              dependency: 'multi-vuln-pkg',
              title: 'Second Issue',
              url: 'https://npmjs.com/advisories/999999',
              severity: 'high',
              range: '*',
            },
          ],
        }),
      });

      mockedRunAudit.mockResolvedValue(auditResult);

      // Only accept one of the two vulnerabilities
      const config = {
        acceptedVulnerabilities: [
          {
            id: 888888,
            reason: 'Only accepting first',
            acceptedBy: 'test@example.com',
            acceptedAt: '2026-02-09T00:00:00.000Z',
          },
        ],
      };

      const unaccepted = filterVulnerabilities(auditResult, config, 'high');

      expect(unaccepted).toHaveLength(1);
      expect(unaccepted[0].id).toBe(999999); // The unaccepted one
    });
  });

  describe('severity levels', () => {
    it('should respect --level moderate option', () => {
      const args = parseArgs(['--level', 'moderate']);
      expect(args.level).toBe('moderate');
    });

    it('should respect --level critical option', () => {
      const args = parseArgs(['--level', 'critical']);
      expect(args.level).toBe('critical');
    });

    it('should detect moderate vulnerabilities when level is moderate', async () => {
      const auditResult = createMockAuditResult({
        'mod-pkg': createMockVulnerability({
          name: 'mod-pkg',
          severity: 'moderate',
          via: [
            {
              source: 101010,
              name: 'mod-pkg',
              dependency: 'mod-pkg',
              title: 'Moderate Issue',
              url: 'https://npmjs.com/advisories/101010',
              severity: 'moderate',
              range: '*',
            },
          ],
        }),
      });

      auditResult.metadata.vulnerabilities = {
        info: 0,
        low: 0,
        moderate: 1,
        high: 0,
        critical: 0,
        total: 1,
      };

      mockedRunAudit.mockResolvedValue(auditResult);

      const hasVulns = hasVulnerabilitiesAtOrAbove(auditResult, 'moderate');
      expect(hasVulns).toBe(true);

      const config = { acceptedVulnerabilities: [] };
      const unaccepted = filterVulnerabilities(auditResult, config, 'moderate');

      expect(unaccepted).toHaveLength(1);
      expect(unaccepted[0].severity).toBe('moderate');
    });
  });

  describe('config file handling', () => {
    it('should return empty config when file does not exist', async () => {
      const config = await loadConfig(undefined, tempDir);
      expect(config.acceptedVulnerabilities).toEqual([]);
    });

    it('should load custom config path', async () => {
      const customPath = path.join(tempDir, 'custom-audit.json');
      fs.writeFileSync(
        customPath,
        JSON.stringify({
          acceptedVulnerabilities: [
            {
              id: 123,
              reason: 'Custom config',
              acceptedBy: 'test@example.com',
              acceptedAt: '2026-02-09T00:00:00.000Z',
            },
          ],
        })
      );

      const config = await loadConfig('custom-audit.json', tempDir);
      expect(config.acceptedVulnerabilities).toHaveLength(1);
      expect(config.acceptedVulnerabilities[0].id).toBe(123);
    });
  });
});
