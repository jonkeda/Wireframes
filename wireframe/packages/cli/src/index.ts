/**
 * @jonkeda/wireframe-cli - Command-line interface for Wireframe
 */

export {
  run,
  parseArgs,
  defaultOutputName,
  resolveOutputPath,
  formatError,
  compileFile,
  UsageError,
  HELP,
  VERSION,
  STDOUT,
} from './cli.js';
export type { CLIOptions, CLIIO, ConfigFile, CompileFileOptions } from './cli.js';
