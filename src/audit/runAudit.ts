import { execSync } from 'child_process';
import { AuditResult } from '../shared/types';
import { parseAuditOutput } from './utils/parseAuditOutput';

/**
 * Run npm audit and return the parsed result
 */
export async function runAudit(cwd: string = process.cwd()): Promise<AuditResult> {
  try {
    // npm audit returns non-zero exit code when vulnerabilities are found,
    // so we need to capture the output regardless of exit code
    const output = execSync('npm audit --json', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return parseAuditOutput(output);
  } catch (error) {
    // npm audit returns non-zero when vulnerabilities exist
    const execError = error as { stdout?: string; stderr?: string; message?: string };

    if (execError.stdout) {
      return parseAuditOutput(execError.stdout);
    }

    throw new Error(`Failed to run npm audit: ${execError.message || 'Unknown error'}`);
  }
}
