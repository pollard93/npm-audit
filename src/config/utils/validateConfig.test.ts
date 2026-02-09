import { validateConfig } from './validateConfig';

describe('validateConfig', () => {
  it('should validate a valid config', () => {
    const config = {
      acceptedVulnerabilities: [
        {
          id: 123456,
          reason: 'Test reason',
          acceptedBy: 'test@example.com',
          acceptedAt: '2026-02-09T00:00:00.000Z',
        },
      ],
    };

    const result = validateConfig(config);
    expect(result.acceptedVulnerabilities).toHaveLength(1);
  });

  it('should return empty array for missing acceptedVulnerabilities', () => {
    const config = {};
    const result = validateConfig(config);
    expect(result.acceptedVulnerabilities).toEqual([]);
  });

  it('should throw for null config', () => {
    expect(() => validateConfig(null)).toThrow('Config must be an object');
  });

  it('should throw for non-object config', () => {
    expect(() => validateConfig('string')).toThrow('Config must be an object');
  });

  it('should throw for invalid vulnerability entry', () => {
    const config = {
      acceptedVulnerabilities: [{ id: 'not-a-number' }],
    };

    expect(() => validateConfig(config)).toThrow('Invalid accepted vulnerability');
  });

  it('should validate config with expiresAt', () => {
    const config = {
      acceptedVulnerabilities: [
        {
          id: 123456,
          reason: 'Test reason',
          acceptedBy: 'test@example.com',
          acceptedAt: '2026-02-09T00:00:00.000Z',
          expiresAt: '2026-08-09T00:00:00.000Z',
        },
      ],
    };

    const result = validateConfig(config);
    expect(result.acceptedVulnerabilities[0].expiresAt).toBe('2026-08-09T00:00:00.000Z');
  });
});
