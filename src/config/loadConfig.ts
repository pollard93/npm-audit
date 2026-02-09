import * as fs from 'fs';
import * as path from 'path';
import { AuditConfig } from '../shared/types';
import { validateConfig } from './utils/validateConfig';
import { getDefaultConfigFilename } from './utils/getDefaultConfigFilename';

/**
 * Load the audit configuration from a JSON file
 */
export async function loadConfig(
  configPath?: string,
  cwd: string = process.cwd()
): Promise<AuditConfig> {
  const resolvedPath = configPath
    ? path.resolve(cwd, configPath)
    : path.resolve(cwd, getDefaultConfigFilename());

  try {
    const content = await fs.promises.readFile(resolvedPath, 'utf-8');
    const config = JSON.parse(content) as AuditConfig;
    return validateConfig(config);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Config file doesn't exist, return empty config
      return { acceptedVulnerabilities: [] };
    }
    throw new Error(`Failed to load config from ${resolvedPath}: ${(error as Error).message}`);
  }
}
