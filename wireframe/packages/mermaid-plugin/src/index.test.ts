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
  wireDetector,
  wireframeDiagramDefinition,
  errorSvg,
  drawSvgInto,
  registerWireframe,
} from './index';

describe('Mermaid Plugin', () => {
  beforeEach(() => {
    resetConfig();
  });

  describe('detector', () => {
    it('should detect wireframe prefix', () => {
      expect(detector('wireframe\nButton "Test"')).toBe(true);
      expect(detector('wireframe')).toBe(true);
      expect(detector('  wireframe\n/Header')).toBe(true);
    });

    it('should detect the wire alias with wireDetector only', () => {
      expect(wireDetector('wire\nButton "Test"')).toBe(true);
      expect(wireDetector('wire')).toBe(true);
      expect(wireDetector('  wire\n/Header')).toBe(true);
      expect(detector('wire\nButton "Test"')).toBe(false);
      expect(wireDetector('wireframe')).toBe(false);
    });

    it('should match wireframe only as a whole word', () => {
      expect(detector('wiremock\nstubs')).toBe(false);
      expect(detector('wireframes\n')).toBe(false);
      expect(detector('wireframe-x')).toBe(false);
      expect(wireDetector('wiremock')).toBe(false);
      expect(detector('wireframe sketch\n  Button "Go"\n/wireframe')).toBe(true);
      expect(detector('wireframe: Button "Go"')).toBe(true);
      expect(detector('WIREFRAME\n')).toBe(true);
    });

    it('should allow front matter and %% lines before the keyword', () => {
      expect(detector('---\ntitle: Login\n---\nwireframe\n  Button "Go"')).toBe(true);
      expect(detector('%%{init: {"theme": "dark"}}%%\nwireframe\n')).toBe(true);
      expect(detector('%% a comment\n  wireframe\n')).toBe(true);
      expect(detector('---\ntitle: x\n---\nwiremock')).toBe(false);
    });

    it('should not detect other prefixes', () => {
      expect(detector('flowchart LR')).toBe(false);
      expect(detector('sequenceDiagram')).toBe(false);
      expect(detector('Button "Test"')).toBe(false);
    });
  });

  describe('parser', () => {
    it('should parse valid wireframe content', () => {
      const result = parser('wireframe\nButton "Test"');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should parse wire prefix content', () => {
      const result = parser('wire\nButton "Test"');
      expect(result.valid).toBe(true);
    });

    it('should parse content with multiple lines', () => {
      const result = parser('wireframe\nButton "Title"\nButton "Click"');
      expect(result.valid).toBe(true);
    });

    it('should parse empty wireframe', () => {
      const result = parser('wireframe\n');
      expect(result.valid).toBe(true);
    });
  });

  describe('renderer', () => {
    it('should render valid wireframe to SVG', () => {
      const svg = renderer('wireframe\nButton "Test Header"');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      // SVG contains text content
      expect(svg.length).toBeGreaterThan(100);
    });

    it('should render with wire prefix', () => {
      const svg = renderer('wire\nButton "Click Me"');
      expect(svg).toContain('<svg');
      expect(svg).toContain('800'); // default width
    });

    it('should render error SVG for invalid content', () => {
      const svg = renderer('wireframe\n@@@ invalid');
      expect(svg).toContain('<svg');
      expect(svg).toContain('Parse Error');
    });

    it('should respect options', () => {
      const svg = renderer('wireframe\nButton "Test"', { width: 1000, height: 800 });
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
      const svg = renderer('wireframe\nButton "Test"');
      expect(svg).toContain('width="500"');
      expect(svg).toContain('height="400"');
    });
  });

  describe('renderWireframe', () => {
    it('should render standalone without prefix', () => {
      const result = renderWireframe('Button "Test"');
      expect(result.svg).toContain('<svg');
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid content', () => {
      const result = renderWireframe('@@@invalid');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should respect options', () => {
      const result = renderWireframe('Button "Test"', { width: 1000, theme: 'blueprint' });
      expect(result.svg).toContain('width="1000"');
    });

    it('should produce valid SVG structure', () => {
      const result = renderWireframe('Button "Test"\nButton "Click"');
      expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(result.svg).toContain('viewBox');
    });
  });

  describe('error SVG', () => {
    const xss = '<img src=x onerror=alert(1)>';

    it('escapes parse error messages (no live elements)', () => {
      const svg = renderer(`wireframe "${xss}"\n/wireframe`);
      expect(svg).toContain('Parse Error');
      expect(svg).not.toContain('<img');
      expect(svg).toContain('&lt;img src=x onerror=alert(1)&gt;');
    });

    it('escapes every message and puts each on its own line', () => {
      const svg = errorSvg(['first & <b>', 'second', 'multi\nline']);
      expect(svg).not.toContain('<b>');
      expect(svg).toContain('first &amp; &lt;b&gt;');
      expect(svg).not.toContain('\\n');
      // title + 4 message lines
      expect(svg.match(/<text /g)).toHaveLength(5);
      expect(svg).toMatch(/>second<\/text>/);
      expect(svg).toMatch(/>multi<\/text>/);
      expect(svg).toMatch(/>line<\/text>/);
    });

    it('renders one line per error from the renderer', () => {
      const svg = renderer('wireframe\n  @@@ invalid');
      expect(svg.match(/<text /g)!.length).toBeGreaterThan(2);
      expect(svg).not.toContain('\\n');
    });
  });

  describe('diagram definitions (Mermaid external diagram API)', () => {
    it('should have wireframeDiagram with id, detector and loader', async () => {
      expect(wireframeDiagram.id).toBe('wireframe');
      expect(wireframeDiagram.detector).toBe(detector);
      const loaded = await wireframeDiagram.loader();
      expect(loaded.id).toBe('wireframe');
      expect(loaded.diagram).toBe(wireframeDiagramDefinition);
      expect(typeof loaded.diagram.db).toBe('object');
      expect(typeof loaded.diagram.parser.parse).toBe('function');
      expect(typeof loaded.diagram.renderer.draw).toBe('function');
    });

    it('should have wireDiagram with id, wire detector and loader', async () => {
      expect(wireDiagram.id).toBe('wire');
      expect(wireDiagram.detector).toBe(wireDetector);
      expect((await wireDiagram.loader()).id).toBe('wire');
    });

    it('parser.parse accepts valid text and throws on errors', () => {
      expect(() => wireframeDiagramDefinition.parser.parse('wireframe\n  Button "Go"\n')).not.toThrow();
      expect(() => wireframeDiagramDefinition.parser.parse('wireframe\n  @@@ invalid\n')).toThrow(/Unexpected/);
    });

    it('draw renders into the <svg id> Mermaid created', () => {
      const attrs: Record<string, string> = {};
      const target = {
        innerHTML: '<g></g>',
        setAttribute: (n: string, v: string): void => {
          attrs[n] = v;
        },
      };
      const g = globalThis as { document?: unknown };
      const saved = g.document;
      g.document = { getElementById: (id: string): unknown => (id === 'mermaid-1' ? target : null) };
      try {
        wireframeDiagramDefinition.renderer.draw('wireframe\n  Button "Go"\n', 'mermaid-1', '11.0.0');
      } finally {
        g.document = saved;
      }
      expect(attrs.width).toBe('800');
      expect(attrs.viewBox).toBeDefined();
      expect(target.innerHTML.startsWith('<g></g>')).toBe(true);
      expect(target.innerHTML).toContain('Go');
      expect(target.innerHTML).not.toContain('<svg');
    });

    it('draw uses the sandbox iframe document when present', () => {
      const html: string[] = [];
      const target = {
        innerHTML: '',
        setAttribute: (): void => {},
        insertAdjacentHTML: (_p: string, h: string): void => {
          html.push(h);
        },
      };
      const frameDoc = { getElementById: (id: string): unknown => (id === 'd' ? target : null) };
      const g = globalThis as { document?: unknown };
      const saved = g.document;
      g.document = { getElementById: (id: string): unknown => (id === 'id' ? { contentDocument: frameDoc } : null) };
      try {
        wireframeDiagramDefinition.renderer.draw('wireframe\n  Button "Go"\n', 'd', '11');
      } finally {
        g.document = saved;
      }
      expect(html.join('')).toContain('Go');
    });

    it('draw throws when there is no target element', () => {
      expect(() => wireframeDiagramDefinition.renderer.draw('wireframe\n  Button "Go"\n', 'none', '1')).toThrow(
        /no <svg id="none">/
      );
    });

    it('drawSvgInto copies root attributes except id and xmlns', () => {
      const attrs: Record<string, string> = {};
      const target = { innerHTML: '', setAttribute: (n: string, v: string): void => void (attrs[n] = v) };
      drawSvgInto(target, '<svg xmlns="http://www.w3.org/2000/svg" id="x" width="10" viewBox="0 0 10 10"><rect/></svg>');
      expect(attrs).toEqual({ width: '10', viewBox: '0 0 10 10' });
      expect(target.innerHTML).toBe('<rect/>');
    });

    it('registerWireframe passes both definitions to registerExternalDiagrams', async () => {
      let received: unknown[] = [];
      await registerWireframe({
        registerExternalDiagrams: async (d: unknown[]): Promise<void> => {
          received = d;
        },
      });
      expect(received).toEqual([wireframeDiagram, wireDiagram]);
    });
  });
});
