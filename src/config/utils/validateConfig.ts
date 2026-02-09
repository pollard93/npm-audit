import { AuditConfig, AcceptedVulnerability } from '../../shared/types';
import { isValidAcceptedVulnerability } from './isValidAcceptedVulnerability';

/**
 * Validate the configuration structure
 */
export function validateConfig(config: unknown): AuditConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('Config must be an object');
  }

  const typedConfig = config as Record<string, unknown>;

  if (!Array.isArray(typedConfig.acceptedVulnerabilities)) {
    return { acceptedVulnerabilities: [] };
  }

  const validatedVulnerabilities: AcceptedVulnerability[] = [];

  for (const vuln of typedConfig.acceptedVulnerabilities) {
    if (!isValidAcceptedVulnerability(vuln)) {
      throw new Error(`Invalid accepted vulnerability: ${JSON.stringify(vuln)}`);
    }
    validatedVulnerabilities.push(vuln);
  }

  return { acceptedVulnerabilities: validatedVulnerabilities };
}
