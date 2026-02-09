import { isExpired } from './isExpired';
import { AcceptedVulnerability } from '../../shared/types';

describe('isExpired', () => {
  const createVulnerability = (expiresAt?: string): AcceptedVulnerability => ({
    id: 123456,
    reason: 'Test reason',
    acceptedBy: 'test@example.com',
    acceptedAt: '2026-01-01T00:00:00.000Z',
    expiresAt,
  });

  it('should return false when no expiresAt is set', () => {
    const vuln = createVulnerability();
    expect(isExpired(vuln)).toBe(false);
  });

  it('should return false when expiresAt is in the future', () => {
    const vuln = createVulnerability('2030-01-01T00:00:00.000Z');
    const now = new Date('2026-02-09T00:00:00.000Z');
    expect(isExpired(vuln, now)).toBe(false);
  });

  it('should return true when expiresAt is in the past', () => {
    const vuln = createVulnerability('2025-01-01T00:00:00.000Z');
    const now = new Date('2026-02-09T00:00:00.000Z');
    expect(isExpired(vuln, now)).toBe(true);
  });

  it('should return true when expiresAt equals now', () => {
    const vuln = createVulnerability('2026-02-09T00:00:00.000Z');
    const now = new Date('2026-02-09T00:00:00.001Z');
    expect(isExpired(vuln, now)).toBe(true);
  });

  it('should use current date when now is not provided', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 10);
    const vuln = createVulnerability(futureDate.toISOString());
    expect(isExpired(vuln)).toBe(false);
  });
});
