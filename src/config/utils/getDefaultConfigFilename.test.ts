import { getDefaultConfigFilename } from './getDefaultConfigFilename';

describe('getDefaultConfigFilename', () => {
  it('should return the default config filename', () => {
    expect(getDefaultConfigFilename()).toBe('.npm-audit-accept.json');
  });
});
