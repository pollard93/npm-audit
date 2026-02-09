import { getSeverityColor, RESET_COLOR } from './severity';

describe('severity', () => {
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
