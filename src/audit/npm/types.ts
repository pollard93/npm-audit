import { SeverityLevel } from '../../shared/types';

export interface NpmVulnerability {
  id: number;
  name: string;
  severity: SeverityLevel;
  title: string;
  url: string;
  range: string;
  via: (string | NpmVulnerabilityVia)[];
  effects: string[];
  fixAvailable: boolean | NpmFixInfo;
}

export interface NpmVulnerabilityVia {
  source: number;
  name: string;
  dependency: string;
  title: string;
  url: string;
  severity: SeverityLevel;
  range: string;
}

export interface NpmFixInfo {
  name: string;
  version: string;
  isSemVerMajor: boolean;
}

export interface NpmAuditRaw {
  auditReportVersion: number;
  vulnerabilities: Record<string, NpmVulnerability>;
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
