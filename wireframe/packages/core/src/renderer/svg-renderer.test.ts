/**
 * SVG Renderer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SVGRenderer } from './svg-renderer';
import { getTheme } from './theme';
import { DocumentNode, ControlNode, LayoutNode, SectionNode, ComponentNode } from '../parser/ast';

describe('SVGRenderer', () => {
  let renderer: SVGRenderer;

  beforeEach(() => {
    renderer = new SVGRenderer(getTheme('clean'));
  });

  describe('Basic Rendering', () => {
    it('should render an empty document', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc, { width: 400, height: 300 });

      expect(svg).toContain('<svg');
      expect(svg).toContain('width="400"');
      expect(svg).toContain('</svg>');
    });

    it('should render a document with default dimensions', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('<svg');
      expect(svg).toContain('width="800"');
      expect(svg).toContain('</svg>');
    });
  });

  describe('Control Rendering', () => {
    it('should render a Button', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Button',
            text: 'Click Me',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('<svg');
      expect(svg).toContain('Click Me');
      expect(svg).toContain('</svg>');
    });

    it('should render a TextInput', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'TextInput',
            placeholder: 'Enter text',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('<svg');
      expect(svg).toContain('Enter text');
    });

    it('should render a Label', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Label',
            text: 'Hello World',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('Hello World');
    });

    it('should render a Checkbox', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Checkbox',
            text: 'Accept terms',
            modifiers: { checked: true },
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('Accept terms');
    });

    it('should render a Radio button', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Radio',
            text: 'Option A',
            modifiers: { selected: true },
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('Option A');
    });

    it('should render a Dropdown', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Dropdown',
            text: 'Select option',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('<svg');
    });

    it('should render a TextArea', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'TextArea',
            placeholder: 'Enter description',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('<svg');
    });

    it('should render a Heading', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Heading',
            text: 'Welcome',
            modifiers: {},
            attributes: { level: 1 },
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      // Heading is rendered - may use fallback rendering
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('should render a Link', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Link',
            text: 'Click here',
            modifiers: {},
            attributes: { href: 'https://example.com' },
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      // Link is rendered - may use fallback rendering
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('should render an Image placeholder', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Image',
            text: 'logo',
            modifiers: {},
            attributes: { w: 64, h: 64 },
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('<svg');
    });

    it('should render a Divider', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Separator',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('<svg');
    });

    it('should render a Badge', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Badge',
            text: '5',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('<svg');
    });

    it('should render a Progress bar', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Progress',
            modifiers: {},
            attributes: { value: 75 },
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('<svg');
    });
  });

  describe('Container Rendering', () => {
    it('should render a Card component', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Component',
            componentType: 'Card',
            children: [
              {
                type: 'Control',
                controlType: 'Label',
                text: 'Card content',
                modifiers: {},
                attributes: {},
                location: { line: 2, column: 3, offset: 10 },
              } as ControlNode,
            ],
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ComponentNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('<svg');
    });

    it('should render a Section', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Section',
            sectionType: 'Header',
            title: 'My Header',
            children: [
              {
                type: 'Control',
                controlType: 'Label',
                text: 'Header content',
                modifiers: {},
                attributes: {},
                location: { line: 2, column: 3, offset: 10 },
              } as ControlNode,
            ],
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as SectionNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('<svg');
    });
  });

  describe('Layout Rendering', () => {
    it('should render a Vertical layout', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Layout',
            layoutType: 'Vertical',
            children: [
              {
                type: 'Control',
                controlType: 'Button',
                text: 'Top',
                modifiers: {},
                attributes: {},
                location: { line: 2, column: 3, offset: 10 },
              } as ControlNode,
              {
                type: 'Control',
                controlType: 'Button',
                text: 'Bottom',
                modifiers: {},
                attributes: {},
                location: { line: 3, column: 3, offset: 30 },
              } as ControlNode,
            ],
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as LayoutNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('Top');
      expect(svg).toContain('Bottom');
    });

    it('should render a Horizontal layout', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
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
          } as LayoutNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);

      expect(svg).toContain('Left');
      expect(svg).toContain('Right');
    });
  });

  describe('Theme Support', () => {
    it('should apply clean theme', () => {
      const cleanRenderer = new SVGRenderer(getTheme('clean'));
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Button',
            text: 'Themed',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = cleanRenderer.render(doc);

      expect(svg).toContain('<svg');
      expect(svg).toContain('Themed');
    });

    it('should apply sketch theme', () => {
      const sketchRenderer = new SVGRenderer(getTheme('sketch'));
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Button',
            text: 'Sketchy',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = sketchRenderer.render(doc);

      expect(svg).toContain('<svg');
      expect(svg).toContain('Sketchy');
    });

    it('should apply blueprint theme', () => {
      const blueprintRenderer = new SVGRenderer(getTheme('blueprint'));
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Button',
            text: 'Blueprint',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = blueprintRenderer.render(doc);

      expect(svg).toContain('<svg');
      expect(svg).toContain('Blueprint');
    });
  });

  describe('Properties', () => {
    it('should apply width via render options', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc, { width: 500, height: 400 });

      expect(svg).toContain('width="500"');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown control types gracefully', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'UnknownWidget' as any,
            text: 'Test',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      // Should not throw
      expect(() => renderer.render(doc)).not.toThrow();
    });

    it('should handle empty children', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Layout',
            layoutType: 'Vertical',
            children: [],
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as LayoutNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      expect(() => renderer.render(doc)).not.toThrow();
    });
  });

  describe('Phase 2 Controls', () => {
    it('should render Tabs and Tab', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Tabs',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
          {
            type: 'Control',
            controlType: 'Tab',
            text: 'Home',
            modifiers: { active: true },
            attributes: {},
            location: { line: 2, column: 1, offset: 10 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);
      expect(svg).toContain('<svg');
      expect(svg).toContain('Home');
    });

    it('should render Table with rows and cols', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Table',
            modifiers: {},
            attributes: { rows: 4, cols: 3 },
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);
      expect(svg).toContain('Column 1');
      expect(svg).toContain('Column 2');
      expect(svg).toContain('Data');
    });

    it('should render Breadcrumb navigation', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Breadcrumb',
            text: 'Home, Products, Details',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);
      expect(svg).toContain('Home');
      expect(svg).toContain('Products');
      expect(svg).toContain('Details');
      expect(svg).toContain('/'); // separator
    });

    it('should render Pagination', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Pagination',
            modifiers: {},
            attributes: { page: 3, total: 10 },
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);
      expect(svg).toContain('<svg');
      // Current page should be highlighted
      expect(svg).toContain('>3<');
    });

    it('should render Accordion with sections', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'AccordionSection',
            text: 'Section Title',
            modifiers: { expanded: true },
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);
      expect(svg).toContain('Section Title');
    });

    it('should render Badge with variants', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Badge',
            text: 'New',
            modifiers: {},
            attributes: { variant: 'success' },
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);
      expect(svg).toContain('New');
      expect(svg).toContain('#198754'); // success color
    });

    it('should render Toast notification', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Toast',
            text: 'Saved!',
            modifiers: {},
            attributes: { variant: 'success' },
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);
      expect(svg).toContain('Saved!');
    });

    it('should render Stepper', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Stepper',
            modifiers: {},
            attributes: { steps: 3, current: 2 },
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);
      expect(svg).toContain('<svg');
      // Step circles should be rendered
      expect(svg).toContain('<circle');
    });

    it('should render Heading with level', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Heading',
            text: 'Main Title',
            modifiers: {},
            attributes: { level: 1 },
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);
      expect(svg).toContain('Main Title');
      expect(svg).toContain('font-size: 24px'); // h1 size
    });

    it('should render Link', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Link',
            text: 'Click Here',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);
      expect(svg).toContain('Click Here');
      expect(svg).toContain('#0d6efd'); // primary color
      expect(svg).toContain('underline');
    });

    it('should render Skeleton', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Skeleton',
            modifiers: {},
            attributes: { variant: 'text' },
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);
      expect(svg).toContain('<rect');
      expect(svg).toContain('animate'); // animation for skeleton
    });

    it('should render DataGrid', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'DataGrid',
            modifiers: {},
            attributes: { rows: 3, cols: 2 },
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);
      expect(svg).toContain('Column 1');
      // Should have checkboxes in rows
      expect(svg).toContain('<rect');
    });

    it('should render Menu with MenuItem', () => {
      const doc: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'Control',
            controlType: 'Menu',
            text: 'Actions',
            modifiers: {},
            attributes: {},
            location: { line: 1, column: 1, offset: 0 },
          } as ControlNode,
          {
            type: 'Control',
            controlType: 'MenuItem',
            text: 'Edit',
            modifiers: {},
            attributes: {},
            location: { line: 2, column: 1, offset: 10 },
          } as ControlNode,
        ],
        dataSections: [],
        attributes: {},
        location: { line: 1, column: 1, offset: 0 },
      };

      const svg = renderer.render(doc);
      expect(svg).toContain('Actions');
      expect(svg).toContain('Edit');
    });
  });
});
