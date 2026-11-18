/**
 * Regression tests for the renderer review findings:
 * escaping, grid attributes and row heights, Horizontal widths, number rounding,
 * ARIA groups, text vs placeholder, input labels and conditionals.
 */

import { describe, it, expect } from 'vitest';
import { SVGRenderer } from './svg-renderer';
import { LayoutEngine, LayoutInfo } from './layout';
import { getTheme, cleanTheme, Theme } from './theme';
import {
  DocumentNode,
  ElementNode,
  ControlNode,
  ControlType,
  LayoutNode,
  LayoutType,
  ComponentNode,
  ConditionalNode,
  AttributeMap,
} from '../parser/ast';

const loc = { line: 1, column: 1, offset: 0 };

function doc(children: ElementNode[], attributes: Record<string, string> = {}): DocumentNode {
  return { type: 'Document', style: 'clean', attributes, children, dataSections: [], start: loc, end: loc };
}

function control(controlType: ControlType, extra: Partial<ControlNode> = {}): ControlNode {
  return { type: 'Control', controlType, attributes: {}, modifiers: {}, start: loc, end: loc, ...extra };
}

function layout(layoutType: LayoutType, children: ElementNode[], attributes: AttributeMap = {}): LayoutNode {
  return { type: 'Layout', layoutType, children, attributes, modifiers: {}, start: loc, end: loc };
}

function card(children: ElementNode[] = []): ComponentNode {
  return { type: 'Component', componentType: 'Card', children, attributes: {}, modifiers: {}, start: loc, end: loc };
}

function conditional(
  thenChildren: ElementNode[],
  elseChildren?: ElementNode[],
  attributes: AttributeMap = {}
): ConditionalNode {
  return {
    type: 'Conditional',
    condition: 'loggedIn',
    thenChildren,
    elseChildren,
    attributes,
    modifiers: {},
    start: loc,
    end: loc,
  };
}

function renderDoc(document: DocumentNode): string {
  return new SVGRenderer(getTheme('clean')).render(document);
}

function layoutDoc(document: DocumentNode, width = 800): LayoutInfo {
  return new LayoutEngine(getTheme('clean')).calculateLayout(document, width, 600);
}

/**
 * A small well-formedness check: tags balance, text holds no raw '<' or stray '&',
 * and every attribute is name="value" with no quote inside the value.
 */
function expectWellFormed(svg: string): void {
  const stack: string[] = [];
  const tokens = svg.split(/(<[^>]*>)/);
  for (const token of tokens) {
    if (token.startsWith('<')) {
      const m = /^<(\/?)([\w:-]+)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>$/.exec(token);
      expect(m, `malformed tag: ${token}`).not.toBeNull();
      const [, closing, name, , selfClosing] = m!;
      if (closing) {
        expect(stack.pop(), `unbalanced </${name}>`).toBe(name);
      } else if (!selfClosing) {
        stack.push(name);
      }
    } else {
      expect(token.includes('<'), `raw < in text: ${token}`).toBe(false);
      expect(/&(?!(amp|lt|gt|quot|apos|#\d+);)/.test(token), `stray & in text: ${token}`).toBe(false);
    }
  }
  expect(stack).toEqual([]);
}

describe('Renderer review fixes', () => {
  describe('escaping', () => {
    it('escapes Avatar initials', () => {
      const svg = renderDoc(doc([control('Avatar', { text: '<script &x' })]));
      expect(svg).not.toContain('<S');
      expect(svg).toContain('&lt;&amp;');
      expectWellFormed(svg);
    });

    it('keeps the SVG well formed with hostile text everywhere', () => {
      const evil = '"><x a=\'1\' & </g>';
      const kinds: ControlType[] = [
        'Button', 'IconButton', 'TextInput', 'TextArea', 'Label', 'Heading', 'Link', 'Checkbox', 'Radio',
        'Dropdown', 'Avatar', 'Badge', 'Chip', 'Switch', 'Tab', 'MenuItem', 'Breadcrumb', 'Cell', 'TreeItem',
        'AccordionSection', 'Column', 'Toast',
      ];
      const children = kinds.map((k) =>
        control(k, { text: evil, placeholder: evil, label: evil, icon: evil, tooltip: evil })
      );
      const svg = new SVGRenderer(getTheme('clean')).render(doc(children), { lang: 'en"><x', title: evil });
      expectWellFormed(svg);
    });

    it('escapes theme colours put into attributes', () => {
      const theme: Theme = { ...cleanTheme, colors: { ...cleanTheme.colors, primary: 'red" onload="x' } };
      const svg = new SVGRenderer(theme).render(doc([control('Button', { text: 'Go', modifiers: { primary: true } })]));
      expect(svg).not.toContain('onload="x"');
      expectWellFormed(svg);
    });

    it('renders italic labels with a real font-style attribute', () => {
      const svg = renderDoc(doc([control('Label', { text: '*soft*' })]));
      expect(svg).toMatch(/class="wire-text" font-style="italic">soft</);
    });
  });

  describe('grid', () => {
    it('does not throw on a numeric grid attribute', () => {
      const grid = layout('Grid', [control('Button', { text: 'A', attributes: { grid: 1 } })], { cols: 2 });
      expect(() => renderDoc(doc([grid]))).not.toThrow();
      const result = layoutDoc(doc([grid]));
      const button = result.children[0].children[0];
      // grid=1 is row 1, col 0
      expect(button.bounds.x).toBe(0);
      expect(button.bounds.y).toBeGreaterThan(0);
    });

    it('auto-places children with unreadable grid values', () => {
      const grid = layout('Grid', [
        control('Button', { text: 'A', attributes: { grid: 'x,y' } }),
        control('Button', { text: 'B', attributes: { grid: true } }),
        control('Button', { text: 'C', attributes: { grid: '0,9' } }),
      ], { cols: 2 });
      const result = layoutDoc(doc([grid]));
      const [a, b, c] = result.children[0].children;
      expect(a.bounds.x).toBe(0);
      expect(b.bounds.x).toBeGreaterThan(0);
      expect(c.bounds.y).toBeGreaterThan(a.bounds.y);
    });

    it('makes each row as tall as its tallest child', () => {
      const grid = layout('Grid', [
        control('TextArea'),
        control('Button', { text: 'B' }),
        control('Button', { text: 'C' }),
      ], { cols: 2 });
      const result = layoutDoc(doc([grid]));
      const [area, , below] = result.children[0].children;
      expect(below.bounds.y).toBeGreaterThanOrEqual(area.bounds.y + area.bounds.height);
    });
  });

  describe('horizontal', () => {
    it('shares the width between two Cards', () => {
      const row = layout('Horizontal', [card(), card()]);
      const result = layoutDoc(doc([row]), 800);
      const [first, second] = result.children[0].children;
      expect(second.bounds.x).toBeGreaterThan(first.bounds.x);
      expect(second.bounds.x + second.bounds.width).toBeLessThanOrEqual(800);
      expect(first.bounds.width).toBe(second.bounds.width);
    });

    it('gives controls their own width and the rest to the flexible children', () => {
      const row = layout('Horizontal', [control('Button', { text: 'Go' }), card()], { gap: 8 });
      const result = layoutDoc(doc([row]), 800);
      const [button, rest] = result.children[0].children;
      expect(button.bounds.width).toBe(100);
      expect(rest.bounds.x).toBe(108);
      expect(rest.bounds.x + rest.bounds.width).toBe(800);
    });
  });

  describe('rounding', () => {
    it('writes no number with more than 2 decimals in attributes', () => {
      // 3 columns over 768px with a gap give thirds
      const grid = layout('Grid', [control('Button'), control('Button'), control('Button'), control('Slider')], { cols: 3 });
      const svg = renderDoc(doc([grid, control('Avatar', { text: 'Ann Lee', attributes: { size: 'xs' } })]));
      expect(svg).not.toMatch(/\d\.\d{3,}/);
    });

    it('leaves numbers in text content alone', () => {
      const svg = renderDoc(doc([control('Label', { text: 'pi is 3.14159' })]));
      expect(svg).toContain('pi is 3.14159');
    });
  });

  describe('aria', () => {
    it('wraps each control in a group with its role and an escaped label', () => {
      const svg = renderDoc(doc([control('Button', { text: 'Save "now"' })]));
      expect(svg).toContain('<g role="button" aria-label="Save &quot;now&quot;">');
    });

    it('uses the field label and state attributes', () => {
      const svg = renderDoc(doc([
        control('TextInput', { label: 'Email', modifiers: { required: true } }),
        control('Checkbox', { text: 'Agree', modifiers: { checked: true } }),
      ]));
      expect(svg).toContain('role="textbox" aria-label="Email" aria-required="true"');
      expect(svg).toContain('role="checkbox" aria-label="Agree" aria-checked="true"');
    });

    it('adds no groups when accessible is false', () => {
      const svg = new SVGRenderer(getTheme('clean')).render(doc([control('Button', { text: 'Go' })]), { accessible: false });
      expect(svg).not.toContain('role="button"');
    });
  });

  describe('text vs placeholder', () => {
    it('renders the text of a Heading and a Link', () => {
      const svg = renderDoc(doc([control('Heading', { text: 'Title' }), control('Link', { text: 'More' })]));
      expect(svg).toContain('>Title</text>');
      expect(svg).toContain('>More</text>');
      expect(svg).not.toContain('>Heading</text>');
    });

    it('falls back to the placeholder for older trees', () => {
      const svg = renderDoc(doc([control('Heading', { placeholder: 'Old title' })]));
      expect(svg).toContain('>Old title</text>');
    });
  });

  describe('input labels', () => {
    it('draws the label above the box and reserves its height', () => {
      const document = doc([control('TextInput', { label: 'Name', placeholder: 'Your name' })]);
      const plain = layoutDoc(doc([control('TextInput', { placeholder: 'Your name' })])).children[0];
      const labelled = layoutDoc(document).children[0];
      expect(labelled.bounds.height).toBe(plain.bounds.height + 20);

      const svg = renderDoc(document);
      const labelAt = svg.indexOf('>Name</text>');
      const boxAt = svg.indexOf('<rect', labelAt);
      expect(labelAt).toBeGreaterThan(-1);
      expect(boxAt).toBeGreaterThan(labelAt);
      // The box starts below the label line (16 padding + 20 label)
      expect(svg.slice(boxAt)).toMatch(/^<rect x="16" y="36"/);
    });

    it('labels TextArea and Dropdown but not Button', () => {
      const svg = renderDoc(doc([
        control('TextArea', { label: 'Notes' }),
        control('Dropdown', { label: 'Country' }),
        control('Button', { text: 'Go', label: 'ignored' }),
      ]));
      expect(svg).toContain('>Notes</text>');
      expect(svg).toContain('>Country</text>');
      expect(svg).not.toContain('>ignored</text>');
    });
  });

  describe('conditionals', () => {
    const branches = (attrs: AttributeMap = {}): ConditionalNode =>
      conditional([control('Label', { text: 'Welcome back' })], [control('Button', { text: 'Sign in' })], attrs);

    it('renders the then-branch by default', () => {
      const svg = renderDoc(doc([branches(), control('Label', { text: 'After' })]));
      expect(svg).toContain('>Welcome back</text>');
      expect(svg).not.toContain('>Sign in</text>');
      const result = layoutDoc(doc([branches(), control('Label', { text: 'After' })]));
      expect(result.children[1].bounds.y).toBeGreaterThanOrEqual(result.children[0].bounds.height);
      expect(result.children[0].bounds.height).toBeGreaterThan(0);
    });

    it('renders the else-branch when the node says show="else"', () => {
      const svg = renderDoc(doc([branches({ show: 'else' })]));
      expect(svg).toContain('>Sign in</text>');
      expect(svg).not.toContain('>Welcome back</text>');
    });

    it('renders the else-branch when the document says show="else"', () => {
      const svg = renderDoc(doc([branches()], { show: 'else' }));
      expect(svg).toContain('>Sign in</text>');
    });

    it('renders nothing for show="else" without an else-branch', () => {
      const svg = renderDoc(doc([conditional([control('Label', { text: 'Only then' })], undefined, { show: 'else' })]));
      expect(svg).not.toContain('Only then');
    });
  });
});
