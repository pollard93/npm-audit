export type SeverityLevel = 'info' | 'low' | 'moderate' | 'high' | 'critical';

export type PackageManager = 'npm' | 'pnpm';

export interface NormalizedAdvisory {
  packageName: string;
  severity: SeverityLevel;
  title: string;
  url: string;
}

export interface AuditResult {
  packageManager: PackageManager;
  advisories: NormalizedAdvisory[];
  severityCounts: Record<SeverityLevel, number> & { total: number };
}

export interface AcceptedVulnerability {
  url: string;
  id?: number;
  reason: string;
  acceptedBy: string;
  acceptedAt: string;
  expiresAt?: string;
}

export interface AuditConfig {
  acceptedVulnerabilities: AcceptedVulnerability[];
}

export interface FilteredVulnerability {
  url: string;
  name: string;
  severity: SeverityLevel;
  title: string;
}

export interface AuditOptions {
  configPath?: string;
  level?: SeverityLevel;
  cwd?: string;
}

export const SEVERITY_ORDER: Record<SeverityLevel, number> = {
  info: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};
