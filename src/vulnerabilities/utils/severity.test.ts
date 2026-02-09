import { meetsMinimumSeverity, getSeverityColor, RESET_COLOR } from './severity';

describe('severity', () => {
  describe('meetsMinimumSeverity', () => {
    it('should return true when severity equals minimum', () => {
      expect(meetsMinimumSeverity('high', 'high')).toBe(true);
    });

    it('should return true when severity is above minimum', () => {
      expect(meetsMinimumSeverity('critical', 'high')).toBe(true);
      expect(meetsMinimumSeverity('high', 'moderate')).toBe(true);
    });

    it('should return false when severity is below minimum', () => {
      expect(meetsMinimumSeverity('moderate', 'high')).toBe(false);
      expect(meetsMinimumSeverity('low', 'moderate')).toBe(false);
    });

    it('should handle info level', () => {
      expect(meetsMinimumSeverity('info', 'info')).toBe(true);
      expect(meetsMinimumSeverity('info', 'low')).toBe(false);
    });
  });

  describe('getSeverityColor', () => {
    it('should return cyan for info', () => {
      expect(getSeverityColor('info')).toBe('\x1b[36m');
    });

    it('should return green for low', () => {
      expect(getSeverityColor('low')).toBe('\x1b[32m');
    });

    it('should return yellow for moderate', () => {
      expect(getSeverityColor('moderate')).toBe('\x1b[33m');
    });

    it('should return bright red for high', () => {
      expect(getSeverityColor('high')).toBe('\x1b[91m');
    });

    it('should return red for critical', () => {
      expect(getSeverityColor('critical')).toBe('\x1b[31m');
    });
  });

  describe('RESET_COLOR', () => {
    it('should be the reset ANSI code', () => {
      expect(RESET_COLOR).toBe('\x1b[0m');
    });
  });
});
