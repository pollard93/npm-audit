import { parseArgs } from './parseArgs';

describe('parseArgs', () => {
  it('should return default options for empty args', () => {
    const options = parseArgs([]);

    expect(options.level).toBe('high');
    expect(options.help).toBe(false);
    expect(options.version).toBe(false);
    expect(options.configPath).toBeUndefined();
  });

  it('should parse --config option', () => {
    const options = parseArgs(['--config', 'custom-config.json']);
    expect(options.configPath).toBe('custom-config.json');
  });

  it('should parse -c short option', () => {
    const options = parseArgs(['-c', 'custom-config.json']);
    expect(options.configPath).toBe('custom-config.json');
  });

  it('should parse --level option', () => {
    const options = parseArgs(['--level', 'moderate']);
    expect(options.level).toBe('moderate');
  });

  it('should parse -l short option', () => {
    const options = parseArgs(['-l', 'critical']);
    expect(options.level).toBe('critical');
  });

  it('should parse --help option', () => {
    const options = parseArgs(['--help']);
    expect(options.help).toBe(true);
  });

  it('should parse -h short option', () => {
    const options = parseArgs(['-h']);
    expect(options.help).toBe(true);
  });

  it('should parse --version option', () => {
    const options = parseArgs(['--version']);
    expect(options.version).toBe(true);
  });

  it('should parse -v short option', () => {
    const options = parseArgs(['-v']);
    expect(options.version).toBe(true);
  });

  it('should parse multiple options', () => {
    const options = parseArgs(['--config', 'config.json', '--level', 'low']);
    expect(options.configPath).toBe('config.json');
    expect(options.level).toBe('low');
  });

  it('should exit on invalid severity level', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

    expect(() => parseArgs(['--level', 'invalid'])).toThrow('process.exit called');

    expect(mockConsoleError).toHaveBeenCalledWith('Invalid severity level: invalid');

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });
});
