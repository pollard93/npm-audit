import * as fs from 'fs';
import * as path from 'path';
import { PackageManager } from '../shared/types';

/**
 * Detect which package manager a project uses by sniffing its lockfile
 */
export function detectPackageManager(cwd: string = process.cwd()): PackageManager {
  const hasPnpmLock = fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'));
  const hasNpmLock = fs.existsSync(path.join(cwd, 'package-lock.json'));

  if (hasPnpmLock && hasNpmLock) {
    throw new Error(
      'Multiple lockfiles found (pnpm-lock.yaml and package-lock.json) - use --package-manager to disambiguate.'
    );
  }

  if (hasPnpmLock) {
    return 'pnpm';
  }

  if (hasNpmLock) {
    return 'npm';
  }

  throw new Error(
    'No supported lockfile found (package-lock.json or pnpm-lock.yaml) - use --package-manager to force a choice.'
  );
}
