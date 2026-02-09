import { SeverityLevel } from '../../shared/types';

// ANSI color codes
const COLORS: Record<SeverityLevel, string> = {
  info: '\x1b[36m', // Cyan
  low: '\x1b[32m', // Green
  moderate: '\x1b[33m', // Yellow
  high: '\x1b[91m', // Bright Red
  critical: '\x1b[31m', // Red
};

export const RESET_COLOR = '\x1b[0m';

/**
 * Get the ANSI color code for a severity level
 */
export function getSeverityColor(severity: SeverityLevel): string {
  return COLORS[severity] || '';
}
