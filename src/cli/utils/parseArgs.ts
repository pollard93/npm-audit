import { PackageManager, SeverityLevel, SEVERITY_ORDER } from '../../shared/types';

const PACKAGE_MANAGERS: PackageManager[] = ['npm', 'pnpm'];

export interface CliOptions {
  configPath?: string;
  level: SeverityLevel;
  packageManager?: PackageManager;
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
      case '--package-manager':
      case '-p': {
        const packageManager = args[++i] as PackageManager;
        if (!PACKAGE_MANAGERS.includes(packageManager)) {
          console.error(`Invalid package manager: ${packageManager}`);
          console.error(`Valid options: ${PACKAGE_MANAGERS.join(', ')}`);
          process.exit(1);
        }
        options.packageManager = packageManager;
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
