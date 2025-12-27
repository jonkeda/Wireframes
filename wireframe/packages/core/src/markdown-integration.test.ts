/**
 * Tests for Markdown Preview Integration
 * 
 * These tests verify that wireframe code can be parsed and rendered correctly
 * for markdown preview integration.
 */

import { describe, it, expect } from 'vitest';
import { Parser, SVGRenderer, getTheme } from './index';

describe('Markdown Preview Integration', () => {
  describe('Parser for markdown code blocks', () => {
    it('should parse simple wireframe code', () => {
      const source = `wireframe clean
    Button "Hello"
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.document).not.toBeNull();
      // Document uses 'style' property, not 'theme'
      expect(result.document?.style).toBe('clean');
    });

    it('should parse wireframe without explicit theme', () => {
      const source = `wireframe
    Button "Test"
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.document).not.toBeNull();
    });

    it('should parse complex wireframe with nested elements', () => {
      const source = `wireframe clean
    Card w=300 padding=16
        Vertical gap=8
            Heading "Login" level=2
            TextInput placeholder="Email"
            PasswordInput placeholder="Password"
            Button "Sign In" primary
        /Vertical
    /Card
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.document).not.toBeNull();
      expect(result.document?.children).toHaveLength(1);
    });

    it('should report errors for invalid syntax', () => {
      const source = `wireframe clean
    InvalidControl "Test"
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty wireframe', () => {
      const source = `wireframe clean
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.document).not.toBeNull();
      expect(result.document?.children).toHaveLength(0);
    });
  });

  describe('Theme/Style detection from document', () => {
    it('should detect clean style', () => {
      const source = `wireframe clean
    Button "Test"
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);

      expect(result.document?.style).toBe('clean');
    });

    it('should detect blueprint style', () => {
      const source = `wireframe blueprint
    Button "Test"
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);

      expect(result.document?.style).toBe('blueprint');
    });

    it('should detect sketch style', () => {
      const source = `wireframe sketch
    Button "Test"
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);

      expect(result.document?.style).toBe('sketch');
    });
  });

  describe('SVG Rendering for markdown', () => {
    it('should render simple wireframe to SVG', () => {
      const source = `wireframe clean
    Button "Hello"
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);
      
      expect(result.document).not.toBeNull();
      
      const theme = getTheme('clean');
      const renderer = new SVGRenderer(theme);
      const svg = renderer.render(result.document!);

      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('Hello');
    });

    it('should render with blueprint theme', () => {
      const source = `wireframe blueprint
    Button "Test"
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);
      
      expect(result.document).not.toBeNull();
      
      const theme = getTheme('blueprint');
      const renderer = new SVGRenderer(theme);
      const svg = renderer.render(result.document!);

      expect(svg).toContain('<svg');
      // Blueprint theme has dark blue colors
      expect(svg).toContain('#');
    });

    it('should render Card with children', () => {
      const source = `wireframe clean
    Card w=300
        Vertical gap=8
            Heading "My Title" level=2
            Label "My Description"
        /Vertical
    /Card
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);
      
      expect(result.document).not.toBeNull();
      
      const theme = getTheme('clean');
      const renderer = new SVGRenderer(theme);
      const svg = renderer.render(result.document!);

      expect(svg).toContain('<svg');
      // The rendered output contains the label text
      expect(svg).toContain('My Description');
      // Verify card structure
      expect(svg).toContain('rect');
    });

    it('should handle form elements', () => {
      const source = `wireframe clean
    Vertical gap=8
        TextInput "Email" placeholder="Enter email"
        PasswordInput "Password"
        Checkbox "Remember me"
        Button "Submit" primary
    /Vertical
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);
      
      expect(result.document).not.toBeNull();
      
      const theme = getTheme('clean');
      const renderer = new SVGRenderer(theme);
      const svg = renderer.render(result.document!);

      expect(svg).toContain('<svg');
      // Check for rendered elements
      expect(svg).toContain('Remember me');
      expect(svg).toContain('Submit');
    });
  });

  describe('Error handling for markdown preview', () => {
    it('should provide meaningful error for invalid element', () => {
      const source = `wireframe clean
    NotARealElement "Test"
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);

      // Should have an error about unknown element
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle very long content gracefully', () => {
      // Create a wireframe with many elements
      let source = `wireframe clean
    Vertical gap=4`;
      
      for (let i = 0; i < 100; i++) {
        source += `\n        Button "Button ${i}"`;
      }
      source += `\n    /Vertical
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.document).not.toBeNull();
    });
  });

  describe('Integration scenarios', () => {
    it('should render dashboard layout', () => {
      const source = `wireframe clean
    Dock w=600 h=400
        Header dock=top h=60
            Label "My Dashboard"
        /Header
        Sidebar dock=left w=150
            Menu
                MenuItem "Home" icon=home
                MenuItem "Settings" icon=settings
            /Menu
        /Sidebar
        Content dock=fill
            Card
                Label "Main content"
            /Card
        /Content
    /Dock
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);
      
      expect(result.errors).toHaveLength(0);
      expect(result.document).not.toBeNull();
      
      const theme = getTheme('clean');
      const renderer = new SVGRenderer(theme);
      const svg = renderer.render(result.document!);

      expect(svg).toContain('<svg');
      expect(svg).toContain('Main content');
    });

    it('should render login form', () => {
      const source = `wireframe clean
    Card w=350 padding=24
        Vertical gap=16
            Label "Welcome to App"
            TextInput "Email" placeholder="Enter email"
            PasswordInput "Password"
            Checkbox "Remember me"
            Button "Sign In" primary
            Link "Forgot password?"
        /Vertical
    /Card
/wireframe`;

      const parser = new Parser();
      const result = parser.parse(source);
      
      expect(result.errors).toHaveLength(0);
      
      const theme = getTheme('clean');
      const renderer = new SVGRenderer(theme);
      const svg = renderer.render(result.document!);

      expect(svg).toContain('Sign In');
      expect(svg).toContain('Remember me');
    });
  });
});
