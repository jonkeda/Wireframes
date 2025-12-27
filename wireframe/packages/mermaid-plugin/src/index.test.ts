/**
 * Mermaid Plugin Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  detector,
  parser,
  renderer,
  setConfig,
  getConfig,
  resetConfig,
  renderWireframe,
  wireframeDiagram,
  wireDiagram,
} from './index';

describe('Mermaid Plugin', () => {
  beforeEach(() => {
    resetConfig();
  });

  describe('detector', () => {
    it('should detect wireframe prefix', () => {
      expect(detector('wireframe\n/Header "Test"')).toBe(true);
      expect(detector('wireframe')).toBe(true);
      expect(detector('  wireframe\n/Header')).toBe(true);
    });

    it('should detect wire prefix', () => {
      expect(detector('wire\n/Header "Test"')).toBe(true);
      expect(detector('wire')).toBe(true);
      expect(detector('  wire\n/Header')).toBe(true);
    });

    it('should not detect other prefixes', () => {
      expect(detector('flowchart LR')).toBe(false);
      expect(detector('sequenceDiagram')).toBe(false);
      expect(detector('/Header "Test"')).toBe(false);
    });
  });

  describe('parser', () => {
    it('should parse valid wireframe content', () => {
      const result = parser('wireframe\n/Header "Test"');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should parse wire prefix content', () => {
      const result = parser('wire\n/Header "Test"');
      expect(result.valid).toBe(true);
    });

    it('should parse content with multiple lines', () => {
      const result = parser('wireframe\n/Header "Title"\n/Button "Click"');
      expect(result.valid).toBe(true);
    });

    it('should parse empty wireframe', () => {
      const result = parser('wireframe\n');
      expect(result.valid).toBe(true);
    });
  });

  describe('renderer', () => {
    it('should render valid wireframe to SVG', () => {
      const svg = renderer('wireframe\n/Header "Test Header"');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      // SVG contains text content
      expect(svg.length).toBeGreaterThan(100);
    });

    it('should render with wire prefix', () => {
      const svg = renderer('wire\n/Button "Click Me"');
      expect(svg).toContain('<svg');
      expect(svg).toContain('800'); // default width
    });

    it('should render error SVG for invalid content', () => {
      const svg = renderer('wireframe\n@@@ invalid');
      expect(svg).toContain('<svg');
      expect(svg).toContain('Parse Error');
    });

    it('should respect options', () => {
      const svg = renderer('wireframe\n/Header "Test"', { width: 1000, height: 800 });
      expect(svg).toContain('width="1000"');
      expect(svg).toContain('height="800"');
    });
  });

  describe('configuration', () => {
    it('should have default config', () => {
      const config = getConfig();
      expect(config.width).toBe(800);
      expect(config.height).toBe(600);
      expect(config.theme).toBe('clean');
      expect(config.showGrid).toBe(false);
    });

    it('should update config with setConfig', () => {
      setConfig({ width: 1200, theme: 'sketch' });
      const config = getConfig();
      expect(config.width).toBe(1200);
      expect(config.theme).toBe('sketch');
      expect(config.height).toBe(600); // unchanged
    });

    it('should reset config', () => {
      setConfig({ width: 1200, theme: 'sketch' });
      resetConfig();
      const config = getConfig();
      expect(config.width).toBe(800);
      expect(config.theme).toBe('clean');
    });

    it('should use config in renderer', () => {
      setConfig({ width: 500, height: 400 });
      const svg = renderer('wireframe\n/Header "Test"');
      expect(svg).toContain('width="500"');
      expect(svg).toContain('height="400"');
    });
  });

  describe('renderWireframe', () => {
    it('should render standalone without prefix', () => {
      const result = renderWireframe('/Header "Test"');
      expect(result.svg).toContain('<svg');
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid content', () => {
      const result = renderWireframe('@@@invalid');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should respect options', () => {
      const result = renderWireframe('/Header "Test"', { width: 1000, theme: 'blueprint' });
      expect(result.svg).toContain('width="1000"');
    });

    it('should produce valid SVG structure', () => {
      const result = renderWireframe('/Header "Test"\n/Button "Click"');
      expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(result.svg).toContain('viewBox');
    });
  });

  describe('diagram definitions', () => {
    it('should have wireframeDiagram with correct id', () => {
      expect(wireframeDiagram.id).toBe('wireframe');
      expect(wireframeDiagram.detector).toBe(detector);
    });

    it('should have wireDiagram with correct id', () => {
      expect(wireDiagram.id).toBe('wire');
      expect(wireDiagram.detector).toBe(detector);
    });

    it('should have parser.parse function', () => {
      const result = wireframeDiagram.parser.parse('wireframe\n/Header "Test"');
      expect(result.valid).toBe(true);
    });

    it('should have renderer.render function', () => {
      const svg = wireframeDiagram.renderer.render('wireframe\n/Header "Test"', 'id', '1');
      expect(svg).toContain('<svg');
    });
  });
});
