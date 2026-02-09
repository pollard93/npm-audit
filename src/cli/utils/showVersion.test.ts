import { getPackageVersion, showVersion } from './showVersion';

describe('showVersion', () => {
  describe('getPackageVersion', () => {
    it('should return a valid semver version string', () => {
      const version = getPackageVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should return the package version from package.json', () => {
      const version = getPackageVersion();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });
  });

  describe('showVersion', () => {
    it('should log the version to console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      showVersion();

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/^\d+\.\d+\.\d+/));

      consoleSpy.mockRestore();
    });
  });
});
