import { execSync } from 'child_process';

/**
 * Run npm audit and return the raw JSON output
 */
export async function runNpmAudit(cwd: string = process.cwd()): Promise<string> {
  try {
    // npm audit returns non-zero exit code when vulnerabilities are found,
    // so we need to capture the output regardless of exit code
    return execSync('npm audit --json', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    // npm audit returns non-zero when vulnerabilities exist
    const execError = error as { stdout?: string; stderr?: string; message?: string };

    if (execError.stdout) {
      return execError.stdout;
    }

    throw new Error(`Failed to run npm audit: ${execError.message || 'Unknown error'}`);
  }
}
