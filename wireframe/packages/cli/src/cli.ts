#!/usr/bin/env node

/**
 * Wireframe CLI
 * 
 * Command-line interface for compiling Wireframe diagrams
 */

import * as fs from 'node:fs';
import { compile, parse } from '@aspect-ui/wireframe-core';

interface CLIOptions {
  input?: string;
  output?: string;
  width?: number;
  height?: number;
  theme?: string;
  validate?: boolean;
  help?: boolean;
  version?: boolean;
}

const VERSION = '0.0.1';

const HELP = `
Wireframe CLI - UI Mockup Compiler

Usage:
  wire [options] <input-file>
  wire --help
  wire --version

Options:
  -o, --output <file>   Output file path (default: stdout)
  -w, --width <n>       SVG width in pixels (default: 800)
  -h, --height <n>      SVG height in pixels (default: 600)
  -t, --theme <name>    Theme: clean, sketch, blueprint, realistic (default: clean)
  -v, --validate        Validate only, don't render
  --help                Show this help message
  --version             Show version number

Examples:
  wire login.wire -o login.svg
  wire form.wire --theme sketch --width 1024
  wire --validate *.wire
`;

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {};
  
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
      case '--help':
        options.help = true;
        break;
      case '--version':
        options.version = true;
        break;
      default:
        if (!arg.startsWith('-')) {
          options.input = arg;
        }
    }
  }
  
  return options;
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
  
  if (!options.input) {
    // eslint-disable-next-line no-console
    console.error('Error: No input file specified');
    // eslint-disable-next-line no-console
    console.error('Run "wire --help" for usage information');
    process.exit(1);
  }
  
  // Read input file
  let source: string;
  try {
    source = fs.readFileSync(options.input, 'utf-8');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error: Could not read file "${options.input}"`);
    process.exit(1);
  }
  
  // Validate only mode
  if (options.validate) {
    const { errors } = parse(source);
    
    if (errors.length === 0) {
      // eslint-disable-next-line no-console
      console.log(`✓ ${options.input} is valid`);
      process.exit(0);
    } else {
      // eslint-disable-next-line no-console
      console.error(`✗ ${options.input} has ${errors.length} error(s):`);
      for (const error of errors) {
        // eslint-disable-next-line no-console
        console.error(`  Line ${error.location.line}: ${error.message}`);
      }
      process.exit(1);
    }
  }
  
  // Compile to SVG
  const { svg, errors } = compile(source, {
    width: options.width || 800,
    height: options.height || 600,
    theme: options.theme || 'clean',
  });
  
  // Report errors
  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`Warnings in ${options.input}:`);
    for (const error of errors) {
      // eslint-disable-next-line no-console
      console.error(`  Line ${error.line}: ${error.message}`);
    }
  }
  
  // Output SVG
  if (options.output) {
    try {
      fs.writeFileSync(options.output, svg);
      // eslint-disable-next-line no-console
      console.log(`✓ Written to ${options.output}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error: Could not write to "${options.output}"`);
      process.exit(1);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(svg);
  }
}

main();
