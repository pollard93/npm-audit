import { showHelp } from './showHelp';

describe('showHelp', () => {
  it('should log help text to console', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    showHelp();

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const helpText = consoleSpy.mock.calls[0][0] as string;

    expect(helpText).toContain('npm-audit-check');
    expect(helpText).toContain('--config');
    expect(helpText).toContain('--level');
    expect(helpText).toContain('--help');
    expect(helpText).toContain('--version');
    expect(helpText).toContain('.npm-audit-accept.json');
    expect(helpText).toContain('acceptedVulnerabilities');

    consoleSpy.mockRestore();
  });
});
