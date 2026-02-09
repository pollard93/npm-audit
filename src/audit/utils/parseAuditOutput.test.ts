import { parseAuditOutput } from './parseAuditOutput';
import { AuditResult, Vulnerability } from '../../shared/types';

describe('parseAuditOutput', () => {
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

  it('should parse valid audit JSON output', () => {
    const output = JSON.stringify(createMockAuditResult());
    const result = parseAuditOutput(output);

    expect(result.auditReportVersion).toBe(2);
    expect(result.vulnerabilities).toBeDefined();
    expect(result.metadata).toBeDefined();
  });

  it('should throw for invalid JSON', () => {
    expect(() => parseAuditOutput('not valid json')).toThrow('Failed to parse npm audit output');
  });

  it('should throw for missing vulnerabilities', () => {
    const output = JSON.stringify({ metadata: {} });
    expect(() => parseAuditOutput(output)).toThrow('Invalid audit output structure');
  });

  it('should throw for missing metadata', () => {
    const output = JSON.stringify({ vulnerabilities: {} });
    expect(() => parseAuditOutput(output)).toThrow('Invalid audit output structure');
  });
});
