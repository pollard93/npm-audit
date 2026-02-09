import { SeverityLevel, SEVERITY_ORDER } from '../../shared/types';

export interface CliOptions {
  configPath?: string;
  level: SeverityLevel;
  help: boolean;
  version: boolean;
}

/**
 * Parse command line arguments into CliOptions
 */
export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    level: 'high',
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--config':
      case '-c':
        options.configPath = args[++i];
        break;
      case '--level':
      case '-l': {
        const level = args[++i] as SeverityLevel;
        if (!SEVERITY_ORDER[level]) {
          console.error(`Invalid severity level: ${level}`);
          console.error('Valid options: info, low, moderate, high, critical');
          process.exit(1);
        }
        options.level = level;
        break;
      }
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--version':
      case '-v':
        options.version = true;
        break;
    }
  }

  return options;
}
