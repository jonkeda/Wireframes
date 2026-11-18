/**
 * Wireframe CLI
 *
 * Command-line interface for compiling Wireframe diagrams.
 * The logic lives here (exported for tests); bin.ts is the executable.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { compile, parse } from '@jonkeda/wireframe-core';

export interface CLIOptions {
  command: 'compile' | 'parse';
  inputs: string[];
  output?: string;
  width?: number;
  height?: number;
  theme?: string;
  validate?: boolean;
  watch?: boolean;
  force?: boolean;
  config?: string;
  help?: boolean;
  version?: boolean;
  quiet?: boolean;
}

export interface ConfigFile {
  width?: number;
  height?: number;
  theme?: string;
  output?: string;
}

/** Where the CLI writes its messages */
export interface CLIIO {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

/** A usage error: reported to stderr, exit code 2 */
export class UsageError extends Error {}

export const VERSION = '0.0.9';

/** Output value meaning "write to stdout" */
export const STDOUT = '-';

export const HELP = `
Wireframe CLI - UI Mockup Compiler

Usage:
  wire [options] <input-file> [input-file2 ...]
  wire parse <input-file> [input-file2 ...]
  wire --help
  wire --version

Commands:
  (default)             Compile each input to SVG
  parse                 Print the parse tree (AST) and errors as JSON to stdout

Options:
  -o, --output <path>   Output file, or "-" for stdout. With several inputs: a
                        directory (created if missing). Default: next to each
                        input, with a .wire extension replaced by .svg
                        (any other name gets .svg appended: spec.txt -> spec.txt.svg)
  -w, --width <n>       SVG width in pixels (default: fits the content, 800 at most)
  -h, --height <n>      Minimum SVG height in pixels (default: fits the content)
  -t, --theme <name>    Theme: clean, sketch, blueprint, realistic
                        (default: the document's own "wireframe <style>" header, else clean)
  -v, --validate        Validate only, don't render
  -f, --force           Write the SVG even when the source has (recoverable) errors;
                        the errors are still reported and the exit code is still 1
  --watch               Watch for file changes and recompile
  -c, --config <file>   Load configuration from JSON file
  -q, --quiet           Suppress non-error output
  --help                Show this help message
  --version             Show version number

  Options taking a value also accept --name=value (e.g. --theme=sketch).
  Unknown options are an error.

Errors are printed as <file>:<line>:<column>: error: <message>.
Exit code: 0 on success, 1 when any file has errors or cannot be read/written,
2 on a usage error.

Examples:
  wire login.wire -o login.svg
  wire login.wire -o - > login.svg
  wire form.wire --theme sketch --width 1024
  wire --validate *.wire
  wire parse login.wire > login.ast.json
  wire --watch dashboard.wire -o dashboard.svg
  wire -c wireframe.config.json *.wire

Config file format (wireframe.config.json):
  {
    "width": 1024,
    "height": 768,
    "theme": "clean",
    "output": "./dist"
  }
`;

const VALUE_FLAGS: Record<string, 'output' | 'width' | 'height' | 'theme' | 'config'> = {
  '-o': 'output',
  '--output': 'output',
  '-w': 'width',
  '--width': 'width',
  '-h': 'height',
  '--height': 'height',
  '-t': 'theme',
  '--theme': 'theme',
  '-c': 'config',
  '--config': 'config',
};

const BOOLEAN_FLAGS: Record<string, 'validate' | 'watch' | 'force' | 'quiet' | 'help' | 'version'> = {
  '-v': 'validate',
  '--validate': 'validate',
  '--watch': 'watch',
  '-f': 'force',
  '--force': 'force',
  '-q': 'quiet',
  '--quiet': 'quiet',
  '--help': 'help',
  '--version': 'version',
};

function parsePositiveInt(flag: string, value: string): number {
  const n = Number(value);
  if (!/^\d+$/.test(value) || !Number.isInteger(n) || n <= 0) {
    throw new UsageError(`${flag} expects a positive whole number, got "${value}"`);
  }
  return n;
}

/**
 * Parse command-line arguments. Throws UsageError for unknown flags or
 * missing/invalid values.
 */
export function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = { command: 'compile', inputs: [] };
  let i = 0;

  if (args[0] === 'parse') {
    options.command = 'parse';
    i = 1;
  }

  let onlyInputs = false;
  for (; i < args.length; i++) {
    const arg = args[i];

    if (onlyInputs || !arg.startsWith('-')) {
      options.inputs.push(arg);
      continue;
    }
    if (arg === '--') {
      onlyInputs = true;
      continue;
    }

    const eq = arg.startsWith('--') ? arg.indexOf('=') : -1;
    const flag = eq >= 0 ? arg.slice(0, eq) : arg;

    const valueKey = VALUE_FLAGS[flag];
    if (valueKey) {
      let value: string | undefined;
      if (eq >= 0) {
        value = arg.slice(eq + 1);
      } else {
        value = args[++i];
        if (value === undefined) {
          throw new UsageError(`${flag} expects a value`);
        }
      }
      if (valueKey === 'width' || valueKey === 'height') {
        options[valueKey] = parsePositiveInt(flag, value);
      } else {
        if (value === '') {
          throw new UsageError(`${flag} expects a value`);
        }
        options[valueKey] = value;
      }
      continue;
    }

    const boolKey = BOOLEAN_FLAGS[flag];
    if (boolKey && eq < 0) {
      options[boolKey] = true;
      continue;
    }

    throw new UsageError(
      boolKey ? `${flag} does not take a value` : `Unknown option "${flag}"`
    );
  }

  return options;
}

/**
 * Default output file name for an input: a trailing .wire is replaced by
 * .svg, anything else gets .svg appended - so it never equals the input.
 */
export function defaultOutputName(inputPath: string): string {
  return inputPath.replace(/\.wire$/i, '') + '.svg';
}

/**
 * Where to write the SVG for an input.
 *
 * @param output      the -o / config value (undefined: next to the input)
 * @param outputIsDir whether `output` is (to be treated as) a directory
 * @returns a file path, or STDOUT
 */
export function resolveOutputPath(inputPath: string, output: string | undefined, outputIsDir: boolean): string {
  if (!output) {
    return defaultOutputName(inputPath);
  }
  if (output === STDOUT) {
    return STDOUT;
  }
  if (outputIsDir) {
    return path.join(output, path.basename(defaultOutputName(inputPath)));
  }
  return output;
}

/**
 * Format one error the way compilers do: file:line:column: error: message
 */
export function formatError(file: string, error: { line: number; column: number; message: string }): string {
  return `${file}:${error.line}:${error.column}: error: ${error.message}`;
}

function isDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function loadConfig(configPath: string): ConfigFile {
  let content: string;
  try {
    content = fs.readFileSync(configPath, 'utf-8');
  } catch {
    throw new UsageError(`Could not load config file "${configPath}"`);
  }
  try {
    return JSON.parse(content) as ConfigFile;
  } catch (e) {
    throw new UsageError(`Config file "${configPath}" is not valid JSON: ${(e as Error).message}`);
  }
}

function readSource(inputPath: string, io: CLIIO): string | undefined {
  try {
    return fs.readFileSync(inputPath, 'utf-8');
  } catch {
    io.stderr(`${inputPath}: error: could not read file`);
    return undefined;
  }
}

function mapErrors(errors: Array<{ message: string; location: { line: number; column: number } }>): Array<{ message: string; line: number; column: number }> {
  return errors.map((e) => ({ message: e.message, line: e.location.line, column: e.location.column }));
}

export interface CompileFileOptions {
  /** File path, or STDOUT */
  outputPath: string;
  /** Not set: the picture fits its content, up to 800 */
  width?: number;
  /** Not set: the picture fits its content */
  height?: number;
  /** Only set when the user chose a theme; otherwise the document's style is used */
  theme?: string;
  validate?: boolean;
  force?: boolean;
  quiet?: boolean;
}

/**
 * Compile (or validate) one file. Returns whether it succeeded without errors.
 */
export function compileFile(inputPath: string, options: CompileFileOptions, io: CLIIO): boolean {
  const source = readSource(inputPath, io);
  if (source === undefined) {
    return false;
  }

  // Validate only mode
  if (options.validate) {
    const errors = mapErrors(parse(source).errors);
    for (const error of errors) {
      io.stderr(formatError(inputPath, error));
    }
    if (errors.length === 0 && !options.quiet) {
      io.stdout(`✓ ${inputPath} is valid`);
    }
    return errors.length === 0;
  }

  // Compile to SVG
  const { svg, errors } = compile(source, {
    ...(options.width ? { width: options.width } : {}),
    ...(options.height ? { height: options.height } : {}),
    ...(options.theme ? { theme: options.theme } : {}),
  });

  for (const error of errors) {
    io.stderr(formatError(inputPath, error));
  }

  if (!svg) {
    io.stderr(`${inputPath}: error: could not be parsed; no output written`);
    return false;
  }
  if (errors.length > 0 && !options.force) {
    io.stderr(`${inputPath}: ${errors.length} error(s); no output written (use --force to write it anyway)`);
    return false;
  }

  // Write output
  if (options.outputPath === STDOUT) {
    io.stdout(svg);
    return errors.length === 0;
  }
  if (path.resolve(options.outputPath) === path.resolve(inputPath)) {
    io.stderr(`${inputPath}: error: output path is the input file; not overwriting it`);
    return false;
  }
  try {
    fs.writeFileSync(options.outputPath, svg);
  } catch {
    io.stderr(`${inputPath}: error: could not write to "${options.outputPath}"`);
    return false;
  }
  if (!options.quiet) {
    io.stdout(`✓ ${inputPath} → ${options.outputPath}`);
  }
  return errors.length === 0;
}

/**
 * The `parse` command: print { document, errors } as JSON to stdout
 * (an array of { file, document, errors } for several inputs).
 */
function parseFiles(inputs: string[], io: CLIIO): number {
  let failed = false;
  const results: Array<{ file: string; document: unknown; errors: Array<{ message: string; line: number; column: number }> }> = [];
  for (const file of inputs) {
    const source = readSource(file, io);
    if (source === undefined) {
      failed = true;
      continue;
    }
    const { document, errors } = parse(source);
    const mapped = mapErrors(errors);
    for (const error of mapped) {
      io.stderr(formatError(file, error));
    }
    if (mapped.length > 0) failed = true;
    results.push({ file, document: document ?? null, errors: mapped });
  }
  const json = inputs.length === 1
    ? results.map(({ document, errors }) => ({ document, errors }))[0] ?? { document: null, errors: [] }
    : results;
  io.stdout(JSON.stringify(json, null, 2));
  return failed ? 1 : 0;
}

function watchFile(inputPath: string, options: CompileFileOptions, io: CLIIO): void {
  if (!options.quiet) io.stdout(`Watching ${inputPath} for changes...`);

  // Initial compile
  compileFile(inputPath, options, io);

  // Watch for changes
  fs.watch(inputPath, (eventType) => {
    if (eventType === 'change') {
      const timestamp = new Date().toLocaleTimeString();
      if (!options.quiet) io.stdout(`[${timestamp}] File changed, recompiling...`);
      compileFile(inputPath, options, io);
    }
  });
}

/**
 * Run the CLI. Returns the exit code, or undefined when watching (the
 * process must stay alive).
 */
export function run(argv: string[], io: CLIIO): number | undefined {
  let options: CLIOptions;
  let config: ConfigFile = {};
  try {
    options = parseArgs(argv);
    if (options.help) {
      io.stdout(HELP);
      return 0;
    }
    if (options.version) {
      io.stdout(`wire v${VERSION}`);
      return 0;
    }
    if (options.config) {
      config = loadConfig(options.config);
    }
    if (options.inputs.length === 0) {
      throw new UsageError('No input file(s) specified');
    }
  } catch (e) {
    if (e instanceof UsageError) {
      io.stderr(`Error: ${e.message}`);
      io.stderr('Run "wire --help" for usage information');
      return 2;
    }
    throw e;
  }

  if (options.command === 'parse') {
    return parseFiles(options.inputs, io);
  }

  // Merge options with config (CLI takes precedence)
  const width = options.width || config.width;
  const height = options.height || config.height;
  const theme = options.theme || config.theme;
  const output = options.output || config.output;
  const multiple = options.inputs.length > 1;

  if (multiple && output === STDOUT && !options.validate) {
    io.stderr('Error: -o - (stdout) takes a single input file');
    return 2;
  }

  // Is the output a directory?
  let outputIsDir = false;
  if (output && output !== STDOUT && !options.validate) {
    outputIsDir = isDirectory(output) || /[\\/]$/.test(output);
    if (multiple && !outputIsDir) {
      if (fs.existsSync(output)) {
        io.stderr(`Error: with several input files the output "${output}" must be a directory`);
        return 2;
      }
      outputIsDir = true;
    }
    if (outputIsDir && !isDirectory(output)) {
      try {
        fs.mkdirSync(output, { recursive: true });
      } catch {
        io.stderr(`Error: could not create output directory "${output}"`);
        return 1;
      }
    }
  }

  const fileOptions = (inputPath: string): CompileFileOptions => ({
    outputPath: resolveOutputPath(inputPath, output, outputIsDir),
    width,
    height,
    theme,
    validate: options.validate,
    force: options.force,
    // Never mix status lines into SVG on stdout
    quiet: options.quiet || output === STDOUT,
  });

  // Watch mode - only supports single file
  if (options.watch) {
    if (multiple) {
      io.stderr('Error: Watch mode only supports a single input file');
      return 2;
    }
    watchFile(options.inputs[0], fileOptions(options.inputs[0]), io);
    return undefined;
  }

  // Process all input files
  let successCount = 0;
  for (const inputPath of options.inputs) {
    if (compileFile(inputPath, fileOptions(inputPath), io)) {
      successCount++;
    }
  }

  // Summary for multiple files
  if (multiple && !options.quiet && output !== STDOUT) {
    io.stdout(`\nProcessed ${options.inputs.length} file(s): ${successCount} succeeded, ${options.inputs.length - successCount} failed`);
  }

  return successCount === options.inputs.length ? 0 : 1;
}
