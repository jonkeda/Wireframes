#!/usr/bin/env node

/**
 * Wireframe CLI executable
 */

import { run } from './cli.js';

const code = run(process.argv.slice(2), {
  // eslint-disable-next-line no-console
  stdout: (text) => console.log(text),
  // eslint-disable-next-line no-console
  stderr: (text) => console.error(text),
});

if (code === undefined) {
  // Watch mode: keep the process running
  process.stdin.resume();
} else {
  process.exitCode = code;
}
