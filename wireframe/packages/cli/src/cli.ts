#!/usr/bin/env node

/**
 * Wireframe CLI
 * 
 * Command-line interface for compiling Wireframe diagrams
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { compile, parse } from '@aspect-ui/wireframe-core';

interface CLIOptions {
  input?: string;
  inputs?: string[];
  output?: string;
  width?: number;
  height?: number;
  theme?: string;
  validate?: boolean;
  watch?: boolean;
  config?: string;
  help?: boolean;
  version?: boolean;
  quiet?: boolean;
}

interface ConfigFile {
  width?: number;
  height?: number;
  theme?: string;
  output?: string;
}

const VERSION = '0.0.1';

const HELP = `
Wireframe CLI - UI Mockup Compiler

Usage:
  wire [options] <input-file> [input-file2 ...]
  wire --help
  wire --version

Options:
  -o, --output <file>   Output file path (default: stdout, or <input>.svg for multiple files)
  -w, --width <n>       SVG width in pixels (default: 800)
  -h, --height <n>      SVG height in pixels (default: 600)
  -t, --theme <name>    Theme: clean, sketch, blueprint, realistic (default: clean)
  -v, --validate        Validate only, don't render
  --watch               Watch for file changes and recompile
  -c, --config <file>   Load configuration from JSON file
  -q, --quiet           Suppress non-error output
  --help                Show this help message
  --version             Show version number

Examples:
  wire login.wire -o login.svg
  wire form.wire --theme sketch --width 1024
  wire --validate *.wire
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

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    inputs: [],
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
      case '-w':
      case '--width':
        options.width = parseInt(args[++i], 10);
        break;
      case '-h':
      case '--height':
        options.height = parseInt(args[++i], 10);
        break;
      case '-t':
      case '--theme':
        options.theme = args[++i];
        break;
      case '-v':
      case '--validate':
        options.validate = true;
        break;
      case '--watch':
        options.watch = true;
        break;
      case '-c':
      case '--config':
        options.config = args[++i];
        break;
      case '-q':
      case '--quiet':
        options.quiet = true;
        break;
      case '--help':
        options.help = true;
        break;
      case '--version':
        options.version = true;
        break;
      default:
        if (!arg.startsWith('-')) {
          options.inputs!.push(arg);
          if (!options.input) {
            options.input = arg;
          }
        }
    }
  }
  
  return options;
}

function loadConfig(configPath: string): ConfigFile {
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error: Could not load config file "${configPath}"`);
    process.exit(1);
  }
}

function log(message: string, quiet?: boolean): void {
  if (!quiet) {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}

function compileFile(
  inputPath: string,
  options: {
    output?: string;
    width: number;
    height: number;
    theme: string;
    validate?: boolean;
    quiet?: boolean;
  }
): boolean {
  // Read input file
  let source: string;
  try {
    source = fs.readFileSync(inputPath, 'utf-8');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error: Could not read file "${inputPath}"`);
    return false;
  }
  
  // Validate only mode
  if (options.validate) {
    const { errors } = parse(source);
    
    if (errors.length === 0) {
      log(`✓ ${inputPath} is valid`, options.quiet);
      return true;
    } else {
      // eslint-disable-next-line no-console
      console.error(`✗ ${inputPath} has ${errors.length} error(s):`);
      for (const error of errors) {
        // eslint-disable-next-line no-console
        console.error(`  Line ${error.location.line}: ${error.message}`);
      }
      return false;
    }
  }
  
  // Compile to SVG
  const { svg, errors } = compile(source, {
    width: options.width,
    height: options.height,
    theme: options.theme,
  });
  
  // Report errors
  if (errors.length > 0 && !options.quiet) {
    // eslint-disable-next-line no-console
    console.error(`Warnings in ${inputPath}:`);
    for (const error of errors) {
      // eslint-disable-next-line no-console
      console.error(`  Line ${error.line}: ${error.message}`);
    }
  }
  
  // Determine output path
  let outputPath = options.output;
  if (!outputPath) {
    // Default: replace .wire with .svg
    outputPath = inputPath.replace(/\.wire$/, '.svg');
  } else if (fs.existsSync(outputPath) && fs.statSync(outputPath).isDirectory()) {
    // Output is a directory
    const basename = path.basename(inputPath, '.wire') + '.svg';
    outputPath = path.join(outputPath, basename);
  }
  
  // Write output
  try {
    fs.writeFileSync(outputPath, svg);
    log(`✓ ${inputPath} → ${outputPath}`, options.quiet);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error: Could not write to "${outputPath}"`);
    return false;
  }
}

function watchFile(
  inputPath: string,
  options: {
    output?: string;
    width: number;
    height: number;
    theme: string;
    quiet?: boolean;
  }
): void {
  log(`Watching ${inputPath} for changes...`, options.quiet);
  
  // Initial compile
  compileFile(inputPath, options);
  
  // Watch for changes
  fs.watch(inputPath, (eventType) => {
    if (eventType === 'change') {
      const timestamp = new Date().toLocaleTimeString();
      log(`[${timestamp}] File changed, recompiling...`, options.quiet);
      compileFile(inputPath, options);
    }
  });
}

function main(): void {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  
  if (options.help) {
    // eslint-disable-next-line no-console
    console.log(HELP);
    process.exit(0);
  }
  
  if (options.version) {
    // eslint-disable-next-line no-console
    console.log(`wire v${VERSION}`);
    process.exit(0);
  }
  
  // Load config file if specified
  let config: ConfigFile = {};
  if (options.config) {
    config = loadConfig(options.config);
  }
  
  // Merge options with config (CLI takes precedence)
  const width = options.width || config.width || 800;
  const height = options.height || config.height || 600;
  const theme = options.theme || config.theme || 'clean';
  const output = options.output || config.output;
  
  // Check for input files
  if (!options.inputs || options.inputs.length === 0) {
    // eslint-disable-next-line no-console
    console.error('Error: No input file(s) specified');
    // eslint-disable-next-line no-console
    console.error('Run "wire --help" for usage information');
    process.exit(1);
  }
  
  // Watch mode - only supports single file
  if (options.watch) {
    if (options.inputs.length > 1) {
      // eslint-disable-next-line no-console
      console.error('Error: Watch mode only supports a single input file');
      process.exit(1);
    }
    
    watchFile(options.inputs[0], {
      output,
      width,
      height,
      theme,
      quiet: options.quiet,
    });
    
    // Keep process running
    process.stdin.resume();
    return;
  }
  
  // Process all input files
  let hasErrors = false;
  
  for (const inputPath of options.inputs) {
    const success = compileFile(inputPath, {
      output: options.inputs.length === 1 ? output : undefined, // Only use explicit output for single file
      width,
      height,
      theme,
      validate: options.validate,
      quiet: options.quiet,
    });
    
    if (!success) {
      hasErrors = true;
    }
  }
  
  // Summary for multiple files
  if (options.inputs.length > 1 && !options.quiet) {
    const successCount = options.inputs.length - (hasErrors ? 1 : 0);
    log(`\nProcessed ${options.inputs.length} file(s): ${successCount} succeeded`, options.quiet);
  }
  
  process.exit(hasErrors ? 1 : 0);
}

main();
