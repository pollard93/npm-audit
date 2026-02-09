import { AuditResult } from '../../shared/types';

/**
 * Parse the JSON output from npm audit
 */
export function parseAuditOutput(output: string): AuditResult {
  try {
    const result = JSON.parse(output) as AuditResult;

    if (!result.vulnerabilities || !result.metadata) {
      throw new Error('Invalid audit output structure');
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to parse npm audit output: ${(error as Error).message}`);
  }
}
