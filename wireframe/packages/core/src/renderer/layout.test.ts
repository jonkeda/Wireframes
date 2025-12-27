/**
 * Layout Engine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LayoutEngine } from './layout';
import { getTheme } from './theme';
import { DocumentNode, LayoutNode, ControlNode } from '../parser/ast';

describe('LayoutEngine', () => {
  let engine: LayoutEngine;

  beforeEach(() => {
    engine = new LayoutEngine(getTheme('clean'));
  });

  describe('Document Layout', () => {
    it('should layout an empty document', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const result = engine.calculateLayout(doc, 800, 600);

      expect(result.bounds.x).toBe(0);
      expect(result.bounds.y).toBe(0);
      expect(result.bounds.width).toBe(800);
      expect(result.bounds.height).toBeGreaterThanOrEqual(600);
      expect(result.children).toHaveLength(0);
    });

    it('should layout a document with a single control', () => {
      const button: ControlNode = {
        type: 'Control',
        controlType: 'Button',
        text: 'Click Me',
        modifiers: {},
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const doc: DocumentNode = {
        type: 'Document',
        children: [button],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const result = engine.calculateLayout(doc, 800, 600);

      expect(result.children).toHaveLength(1);
      expect(result.children[0].bounds.x).toBeDefined();
      expect(result.children[0].bounds.y).toBeDefined();
      expect(result.children[0].bounds.width).toBeGreaterThan(0);
      expect(result.children[0].bounds.height).toBeGreaterThan(0);
    });
  });

  describe('Vertical Layout', () => {
    it('should stack children vertically', () => {
      const vertical: LayoutNode = {
        type: 'Layout',
        layoutType: 'Vertical',
        children: [
          {
            type: 'Control',
            controlType: 'Button',
            text: 'Button 1',
            modifiers: {},
            attributes: {},
            location: { line: 2, column: 3, offset: 10 },
          } as ControlNode,
          {
            type: 'Control',
            controlType: 'Button',
            text: 'Button 2',
            modifiers: {},
            attributes: {},
            location: { line: 3, column: 3, offset: 30 },
          } as ControlNode,
        ],
        modifiers: {},
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const doc: DocumentNode = {
        type: 'Document',
        children: [vertical],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const result = engine.calculateLayout(doc, 800, 600);

      expect(result.children).toHaveLength(1);
      const layoutResult = result.children[0];
      expect(layoutResult.children).toHaveLength(2);

      // Second child should be below first
      const child1 = layoutResult.children[0];
      const child2 = layoutResult.children[1];
      expect(child2.bounds.y).toBeGreaterThan(child1.bounds.y);
    });
  });

  describe('Horizontal Layout', () => {
    it('should place children side by side', () => {
      const horizontal: LayoutNode = {
        type: 'Layout',
        layoutType: 'Horizontal',
        children: [
          {
            type: 'Control',
            controlType: 'Button',
            text: 'Left',
            modifiers: {},
            attributes: {},
            location: { line: 2, column: 3, offset: 10 },
          } as ControlNode,
          {
            type: 'Control',
            controlType: 'Button',
            text: 'Right',
            modifiers: {},
            attributes: {},
            location: { line: 3, column: 3, offset: 30 },
          } as ControlNode,
        ],
        modifiers: {},
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const doc: DocumentNode = {
        type: 'Document',
        children: [horizontal],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const result = engine.calculateLayout(doc, 800, 600);

      expect(result.children).toHaveLength(1);
      const layoutResult = result.children[0];
      expect(layoutResult.children).toHaveLength(2);

      // Second child should be to the right of first
      const child1 = layoutResult.children[0];
      const child2 = layoutResult.children[1];
      expect(child2.bounds.x).toBeGreaterThan(child1.bounds.x);
    });
  });

  describe('Control Sizes', () => {
    it('should give buttons default size', () => {
      const button: ControlNode = {
        type: 'Control',
        controlType: 'Button',
        text: 'Test',
        modifiers: {},
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const doc: DocumentNode = {
        type: 'Document',
        children: [button],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const result = engine.calculateLayout(doc, 800, 600);
      const buttonLayout = result.children[0];

      expect(buttonLayout.bounds.width).toBeGreaterThan(0);
      expect(buttonLayout.bounds.height).toBeGreaterThan(0);
    });

    it('should respect explicit width attribute', () => {
      const button: ControlNode = {
        type: 'Control',
        controlType: 'Button',
        text: 'Wide Button',
        modifiers: {},
        attributes: { w: 300 },
        location: { line: 1, column: 1, offset: 0 },
      };

      const doc: DocumentNode = {
        type: 'Document',
        children: [button],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const result = engine.calculateLayout(doc, 800, 600);
      const buttonLayout = result.children[0];

      expect(buttonLayout.bounds.width).toBe(300);
    });

    it('should give inputs default size', () => {
      const input: ControlNode = {
        type: 'Control',
        controlType: 'TextInput',
        placeholder: 'Enter text',
        modifiers: {},
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const doc: DocumentNode = {
        type: 'Document',
        children: [input],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const result = engine.calculateLayout(doc, 800, 600);
      const inputLayout = result.children[0];

      expect(inputLayout.bounds.width).toBeGreaterThan(0);
      expect(inputLayout.bounds.height).toBeGreaterThan(0);
    });
  });

  describe('Nested Layouts', () => {
    it('should handle nested containers', () => {
      const nested: LayoutNode = {
        type: 'Layout',
        layoutType: 'Vertical',
        children: [
          {
            type: 'Layout',
            layoutType: 'Horizontal',
            children: [
              {
                type: 'Control',
                controlType: 'Button',
                text: 'A',
                modifiers: {},
                attributes: {},
                location: { line: 3, column: 5, offset: 30 },
              } as ControlNode,
              {
                type: 'Control',
                controlType: 'Button',
                text: 'B',
                modifiers: {},
                attributes: {},
                location: { line: 4, column: 5, offset: 50 },
              } as ControlNode,
            ],
            modifiers: {},
            attributes: {},
            location: { line: 2, column: 3, offset: 15 },
          } as LayoutNode,
          {
            type: 'Control',
            controlType: 'Label',
            text: 'Footer',
            modifiers: {},
            attributes: {},
            location: { line: 5, column: 3, offset: 70 },
          } as ControlNode,
        ],
        modifiers: {},
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const doc: DocumentNode = {
        type: 'Document',
        children: [nested],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const result = engine.calculateLayout(doc, 800, 600);

      expect(result.children).toHaveLength(1);
      const outerLayout = result.children[0];
      expect(outerLayout.children).toHaveLength(2);

      // Inner horizontal layout
      const innerLayout = outerLayout.children[0];
      expect(innerLayout.children).toHaveLength(2);
    });
  });

  describe('Gap and Padding', () => {
    it('should apply gap between children', () => {
      const vertical: LayoutNode = {
        type: 'Layout',
        layoutType: 'Vertical',
        children: [
          {
            type: 'Control',
            controlType: 'Button',
            text: 'Button 1',
            modifiers: {},
            attributes: { h: 30 },
            location: { line: 2, column: 3, offset: 10 },
          } as ControlNode,
          {
            type: 'Control',
            controlType: 'Button',
            text: 'Button 2',
            modifiers: {},
            attributes: { h: 30 },
            location: { line: 3, column: 3, offset: 30 },
          } as ControlNode,
        ],
        modifiers: {},
        attributes: { gap: 20 },
        location: { line: 1, column: 1, offset: 0 },
      };

      const doc: DocumentNode = {
        type: 'Document',
        children: [vertical],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const result = engine.calculateLayout(doc, 800, 600);
      const layoutResult = result.children[0];
      const child1 = layoutResult.children[0];
      const child2 = layoutResult.children[1];

      // Gap between buttons should be at least 20
      const actualGap = child2.bounds.y - (child1.bounds.y + child1.bounds.height);
      expect(actualGap).toBeGreaterThanOrEqual(20);
    });
  });
});
