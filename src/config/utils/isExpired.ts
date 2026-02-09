import { AcceptedVulnerability } from '../../shared/types';

/**
 * Check if an accepted vulnerability has expired
 */
export function isExpired(acceptedVuln: AcceptedVulnerability, now: Date = new Date()): boolean {
  if (!acceptedVuln.expiresAt) {
    return false;
  }

  const expiryDate = new Date(acceptedVuln.expiresAt);
  return now > expiryDate;
}
