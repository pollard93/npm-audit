import { isValidISODate } from './isValidISODate';

describe('isValidISODate', () => {
  it('should return true for valid ISO dates', () => {
    expect(isValidISODate('2026-02-09T00:00:00.000Z')).toBe(true);
    expect(isValidISODate('2025-12-31T23:59:59.999Z')).toBe(true);
    expect(isValidISODate('2024-01-01T12:30:00Z')).toBe(true);
  });

  it('should return false for non-ISO date formats', () => {
    expect(isValidISODate('2026-02-09')).toBe(false);
    expect(isValidISODate('02/09/2026')).toBe(false);
    expect(isValidISODate('February 9, 2026')).toBe(false);
  });

  it('should return false for invalid dates', () => {
    expect(isValidISODate('not a date')).toBe(false);
    expect(isValidISODate('')).toBe(false);
    expect(isValidISODate('2026-13-45T00:00:00.000Z')).toBe(false);
  });

  it('should return false for non-string inputs', () => {
    expect(isValidISODate(null as unknown as string)).toBe(false);
    expect(isValidISODate(undefined as unknown as string)).toBe(false);
    expect(isValidISODate(123 as unknown as string)).toBe(false);
  });
});
