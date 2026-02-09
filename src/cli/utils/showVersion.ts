import * as fs from 'fs';
import * as path from 'path';

/**
 * Get the package version from package.json
 */
export function getPackageVersion(): string {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf-8')
  ) as { version: string };
  return pkg.version;
}

/**
 * Print the package version to console
 */
export function showVersion(): void {
  console.log(getPackageVersion());
}
