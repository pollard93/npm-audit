import { runAudit } from './runAudit';
import { detectPackageManager } from './detectPackageManager';
import { runNpmAudit } from './npm/runNpmAudit';
import { parseNpmAuditOutput } from './npm/parseNpmAuditOutput';
import { runPnpmAudit } from './pnpm/runPnpmAudit';
import { parsePnpmAuditOutput } from './pnpm/parsePnpmAuditOutput';
import { AuditResult } from '../shared/types';

jest.mock('./detectPackageManager');
jest.mock('./npm/runNpmAudit');
jest.mock('./npm/parseNpmAuditOutput');
jest.mock('./pnpm/runPnpmAudit');
jest.mock('./pnpm/parsePnpmAuditOutput');

describe('runAudit', () => {
  const mockAuditResult: AuditResult = {
    packageManager: 'npm',
    advisories: [],
    severityCounts: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 },
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should dispatch to the npm adapter when packageManager is npm', async () => {
    (runNpmAudit as jest.Mock).mockResolvedValue('{"raw":"npm"}');
    (parseNpmAuditOutput as jest.Mock).mockReturnValue(mockAuditResult);

    const result = await runAudit('/some/dir', 'npm');

    expect(runNpmAudit).toHaveBeenCalledWith('/some/dir');
    expect(parseNpmAuditOutput).toHaveBeenCalledWith('{"raw":"npm"}');
    expect(runPnpmAudit).not.toHaveBeenCalled();
    expect(result).toBe(mockAuditResult);
  });

  it('should dispatch to the pnpm adapter when packageManager is pnpm', async () => {
    (runPnpmAudit as jest.Mock).mockResolvedValue('{"raw":"pnpm"}');
    (parsePnpmAuditOutput as jest.Mock).mockReturnValue(mockAuditResult);

    const result = await runAudit('/some/dir', 'pnpm');

    expect(runPnpmAudit).toHaveBeenCalledWith('/some/dir');
    expect(parsePnpmAuditOutput).toHaveBeenCalledWith('{"raw":"pnpm"}');
    expect(runNpmAudit).not.toHaveBeenCalled();
    expect(result).toBe(mockAuditResult);
  });

  it('should detect the package manager when none is supplied', async () => {
    (detectPackageManager as jest.Mock).mockReturnValue('pnpm');
    (runPnpmAudit as jest.Mock).mockResolvedValue('{"raw":"pnpm"}');
    (parsePnpmAuditOutput as jest.Mock).mockReturnValue(mockAuditResult);

    await runAudit('/some/dir');

    expect(detectPackageManager).toHaveBeenCalledWith('/some/dir');
    expect(runPnpmAudit).toHaveBeenCalled();
  });
});
