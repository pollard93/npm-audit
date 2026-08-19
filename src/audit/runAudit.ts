import { AuditResult, PackageManager } from '../shared/types';
import { detectPackageManager } from './detectPackageManager';
import { runNpmAudit } from './npm/runNpmAudit';
import { parseNpmAuditOutput } from './npm/parseNpmAuditOutput';
import { runPnpmAudit } from './pnpm/runPnpmAudit';
import { parsePnpmAuditOutput } from './pnpm/parsePnpmAuditOutput';

/**
 * Run the audit for the given (or detected) package manager and return the normalized result
 */
export async function runAudit(
  cwd: string = process.cwd(),
  packageManager?: PackageManager
): Promise<AuditResult> {
  const resolvedPackageManager = packageManager ?? detectPackageManager(cwd);

  switch (resolvedPackageManager) {
    case 'npm':
      return parseNpmAuditOutput(await runNpmAudit(cwd));
    case 'pnpm':
      return parsePnpmAuditOutput(await runPnpmAudit(cwd));
  }
}
