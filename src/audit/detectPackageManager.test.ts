import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { detectPackageManager } from './detectPackageManager';

describe('detectPackageManager', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-audit-detect-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should detect pnpm from pnpm-lock.yaml', () => {
    fs.writeFileSync(path.join(tmpDir, 'pnpm-lock.yaml'), '');
    expect(detectPackageManager(tmpDir)).toBe('pnpm');
  });

  it('should detect npm from package-lock.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), '{}');
    expect(detectPackageManager(tmpDir)).toBe('npm');
  });

  it('should throw when both lockfiles are present', () => {
    fs.writeFileSync(path.join(tmpDir, 'pnpm-lock.yaml'), '');
    fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), '{}');
    expect(() => detectPackageManager(tmpDir)).toThrow('Multiple lockfiles found');
  });

  it('should throw when no lockfile is present', () => {
    expect(() => detectPackageManager(tmpDir)).toThrow('No supported lockfile found');
  });
});
