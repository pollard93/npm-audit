/**
 * Check if a string is a valid ISO 8601 date
 */
export function isValidISODate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes('T');
}
