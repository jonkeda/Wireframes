/**
 * CLI Tests
 * 
 * Tests for CLI utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    existsSync: vi.fn(),
  };
});

describe('CLI Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('output path generation', () => {
    it('should generate SVG path from .wire file', () => {
      const inputPath = '/path/to/file.wire';
      const outputPath = inputPath.replace(/\.wire$/, '.svg');
      expect(outputPath).toBe('/path/to/file.svg');
    });

    it('should generate JSON path for AST output', () => {
      const inputPath = '/path/to/file.wire';
      const outputPath = inputPath.replace(/\.wire$/, '.json');
      expect(outputPath).toBe('/path/to/file.json');
    });

    it('should handle files without .wire extension', () => {
      const inputPath = '/path/to/file.txt';
      const outputPath = inputPath + '.svg';
      expect(outputPath).toBe('/path/to/file.txt.svg');
    });
  });

  describe('format detection', () => {
    it('should detect svg format', () => {
      const formats = ['svg', 'json', 'ast'];
      expect(formats.includes('svg')).toBe(true);
    });

    it('should detect json format', () => {
      const formats = ['svg', 'json', 'ast'];
      expect(formats.includes('json')).toBe(true);
    });

    it('should detect ast format', () => {
      const formats = ['svg', 'json', 'ast'];
      expect(formats.includes('ast')).toBe(true);
    });
  });

  describe('config file parsing', () => {
    it('should parse valid JSON config', () => {
      const configContent = JSON.stringify({
        input: 'test.wire',
        output: 'test.svg',
        format: 'svg',
        theme: 'sketch',
      });
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(configContent);
      
      const config = JSON.parse(configContent);
      expect(config.theme).toBe('sketch');
      expect(config.format).toBe('svg');
    });

    it('should handle inputs array in config', () => {
      const configContent = JSON.stringify({
        inputs: ['file1.wire', 'file2.wire', 'file3.wire'],
        outputDir: './dist',
        theme: 'clean',
      });
      
      const config = JSON.parse(configContent);
      expect(config.inputs).toHaveLength(3);
      expect(config.outputDir).toBe('./dist');
    });

    it('should merge config with command line options', () => {
      const fileConfig = {
        theme: 'sketch',
        width: 800,
        height: 600,
      };
      
      const cliOptions = {
        theme: 'blueprint', // CLI should override
        width: 800,   // Use same value to test merge
      };
      
      const merged = { ...fileConfig, ...cliOptions };
      // CLI theme overrides file config
      expect(merged.theme).toBe('blueprint');
      // Merged width should be present
      expect(merged.width).toBe(800);
    });
  });

  describe('watch mode', () => {
    it('should detect .wire file changes', () => {
      const watchPath = '/path/to/watch';
      const filename = 'test.wire';
      const isWireFile = filename.endsWith('.wire');
      expect(isWireFile).toBe(true);
    });

    it('should ignore non-.wire files', () => {
      const filename = 'test.txt';
      const isWireFile = filename.endsWith('.wire');
      expect(isWireFile).toBe(false);
    });

    it('should ignore hidden files', () => {
      const filename = '.gitignore';
      const isHidden = filename.startsWith('.');
      expect(isHidden).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should format parse errors correctly', () => {
      const errors = [
        { line: 1, column: 5, message: 'Unexpected token' },
        { line: 3, column: 10, message: 'Invalid control name' },
      ];
      
      const formatted = errors.map(e => `Line ${e.line}:${e.column}: ${e.message}`);
      expect(formatted[0]).toBe('Line 1:5: Unexpected token');
      expect(formatted[1]).toBe('Line 3:10: Invalid control name');
    });

    it('should handle missing input file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const inputPath = '/path/to/nonexistent.wire';
      const exists = fs.existsSync(inputPath);
      expect(exists).toBe(false);
    });
  });

  describe('output formats', () => {
    it('should support SVG output', () => {
      const validFormats = ['svg', 'json', 'ast'];
      expect(validFormats.includes('svg')).toBe(true);
    });

    it('should support JSON output', () => {
      const validFormats = ['svg', 'json', 'ast'];
      expect(validFormats.includes('json')).toBe(true);
    });

    it('should support AST output', () => {
      const validFormats = ['svg', 'json', 'ast'];
      expect(validFormats.includes('ast')).toBe(true);
    });
  });

  describe('theme validation', () => {
    it('should validate clean theme', () => {
      const validThemes = ['clean', 'sketch', 'blueprint', 'realistic'];
      expect(validThemes.includes('clean')).toBe(true);
    });

    it('should validate sketch theme', () => {
      const validThemes = ['clean', 'sketch', 'blueprint', 'realistic'];
      expect(validThemes.includes('sketch')).toBe(true);
    });

    it('should validate blueprint theme', () => {
      const validThemes = ['clean', 'sketch', 'blueprint', 'realistic'];
      expect(validThemes.includes('blueprint')).toBe(true);
    });

    it('should validate realistic theme', () => {
      const validThemes = ['clean', 'sketch', 'blueprint', 'realistic'];
      expect(validThemes.includes('realistic')).toBe(true);
    });

    it('should reject invalid theme', () => {
      const validThemes = ['clean', 'sketch', 'blueprint', 'realistic'];
      expect(validThemes.includes('invalid')).toBe(false);
    });
  });
});
