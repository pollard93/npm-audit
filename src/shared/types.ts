export type SeverityLevel = 'info' | 'low' | 'moderate' | 'high' | 'critical';

export interface Vulnerability {
  id: number;
  name: string;
  severity: SeverityLevel;
  title: string;
  url: string;
  range: string;
  via: (string | VulnerabilityVia)[];
  effects: string[];
  fixAvailable: boolean | FixInfo;
}

export interface VulnerabilityVia {
  source: number;
  name: string;
  dependency: string;
  title: string;
  url: string;
  severity: SeverityLevel;
  range: string;
}

export interface FixInfo {
  name: string;
  version: string;
  isSemVerMajor: boolean;
}

export interface AuditResult {
  auditReportVersion: number;
  vulnerabilities: Record<string, Vulnerability>;
  metadata: {
    vulnerabilities: Record<SeverityLevel, number> & { total: number };
    dependencies: {
      prod: number;
      dev: number;
      optional: number;
      peer: number;
      peerOptional: number;
      total: number;
    };
  };
}

export interface AcceptedVulnerability {
  id: number;
  reason: string;
  acceptedBy: string;
  acceptedAt: string;
  expiresAt?: string;
}

export interface AuditConfig {
  acceptedVulnerabilities: AcceptedVulnerability[];
}

export interface FilteredVulnerability {
  id: number;
  name: string;
  severity: SeverityLevel;
  title: string;
  url: string;
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
