import { SeverityLevel } from '../../shared/types';

export interface PnpmAdvisory {
  id: number;
  title: string;
  severity: SeverityLevel;
  url: string;
  module_name: string;
}

export interface PnpmAuditRaw {
  advisories: Record<string, PnpmAdvisory>;
  metadata: {
    vulnerabilities: Record<SeverityLevel, number> & { total?: number };
  };
}
