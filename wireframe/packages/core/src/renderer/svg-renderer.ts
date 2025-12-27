import {
  DocumentNode,
  ElementNode,
  ControlNode,
  SectionNode,
  LayoutNode,
  ComponentNode,
  isControlNode,
  isSectionNode,
  isLayoutNode,
  isComponentNode,
} from '../parser/ast.js';
import { Theme, getTheme } from './theme.js';
import { LayoutEngine, LayoutInfo, BoundingBox } from './layout.js';

/**
 * Render options
 */
export interface RenderOptions {
  width?: number;
  height?: number;
  theme?: string;
  padding?: number;
}

/**
 * SVG Renderer
 *
 * Renders Wireframe documents to SVG format.
 */
export class SVGRenderer {
  private theme: Theme;
  private layoutEngine: LayoutEngine;
  private defs: string[] = [];

  constructor(theme: Theme) {
    this.theme = theme;
    this.layoutEngine = new LayoutEngine(theme);
  }

  /**
   * Render a document to SVG
   */
  render(document: DocumentNode, options: RenderOptions = {}): string {
    const width = options.width || 800;
    const height = options.height || 600;
    const padding = options.padding ?? this.theme.spacing.padding;

    // Update theme if specified
    if (options.theme) {
      this.theme = getTheme(options.theme);
      this.layoutEngine = new LayoutEngine(this.theme);
    }

    // Calculate layout
    const layout = this.layoutEngine.calculateLayout(document, width - padding * 2, height - padding * 2);

    // Reset state
    this.defs = [];

    // Render SVG
    const content = this.renderLayout(layout, padding, padding);

    const defs = this.defs.length > 0 ? `<defs>${this.defs.join('\n')}</defs>` : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.max(height, layout.bounds.height + padding * 2)}" viewBox="0 0 ${width} ${Math.max(height, layout.bounds.height + padding * 2)}">
  <style>
    .wire-text { font-family: ${this.theme.typography.fontFamily}; font-size: ${this.theme.typography.fontSize}px; fill: ${this.theme.colors.text}; }
    .wire-text-secondary { fill: ${this.theme.colors.textSecondary}; }
    .wire-text-disabled { fill: ${this.theme.colors.textDisabled}; }
    .wire-text-bold { font-weight: ${this.theme.typography.fontWeightBold}; }
    .wire-text-small { font-size: ${this.theme.typography.fontSizeSmall}px; }
    .wire-text-large { font-size: ${this.theme.typography.fontSizeLarge}px; }
  </style>
  ${defs}
  <rect width="100%" height="100%" fill="${this.theme.colors.background}" />
  ${content}
</svg>`;
  }

  /**
   * Render a layout info node
   */
  private renderLayout(layout: LayoutInfo, offsetX: number = 0, offsetY: number = 0): string {
    const { bounds, children, node } = layout;
    const x = bounds.x + offsetX;
    const y = bounds.y + offsetY;

    let svg = '';

    // Render the node itself
    if (node.type === 'Document') {
      // Document is just a container
    } else if (isControlNode(node as ElementNode)) {
      svg += this.renderControl(node as ControlNode, { ...bounds, x, y });
    } else if (isSectionNode(node as ElementNode)) {
      svg += this.renderSection(node as SectionNode, { ...bounds, x, y });
    } else if (isLayoutNode(node as ElementNode)) {
      svg += this.renderLayoutNode(node as LayoutNode, { ...bounds, x, y });
    } else if (isComponentNode(node as ElementNode)) {
      svg += this.renderComponent(node as ComponentNode, { ...bounds, x, y });
    }

    // Render children
    for (const child of children) {
      svg += this.renderLayout(child, offsetX, offsetY);
    }

    return svg;
  }

  /**
   * Render a control element
   */
  private renderControl(node: ControlNode, bounds: BoundingBox): string {
    switch (node.controlType) {
      case 'Button':
        return this.renderButton(node, bounds);
      case 'IconButton':
        return this.renderIconButton(node, bounds);
      case 'TextInput':
      case 'NumberInput':
      case 'DateInput':
      case 'PasswordInput':
        return this.renderInput(node, bounds);
      case 'TextArea':
        return this.renderTextArea(node, bounds);
      case 'Label':
        return this.renderLabel(node, bounds);
      case 'Checkbox':
        return this.renderCheckbox(node, bounds);
      case 'Radio':
        return this.renderRadio(node, bounds);
      case 'Dropdown':
        return this.renderDropdown(node, bounds);
      case 'Separator':
        return this.renderSeparator(node, bounds);
      case 'Spacer':
        return ''; // Spacer is invisible
      case 'Icon':
        return this.renderIcon(node, bounds);
      case 'Image':
        return this.renderImage(node, bounds);
      case 'Avatar':
        return this.renderAvatar(node, bounds);
      case 'Progress':
        return this.renderProgress(node, bounds);
      case 'Slider':
        return this.renderSlider(node, bounds);
      case 'Switch':
        return this.renderSwitch(node, bounds);
      case 'Chip':
        return this.renderChip(node, bounds);
      default:
        return this.renderGenericControl(node, bounds);
    }
  }

  /**
   * Render a button
   */
  private renderButton(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const isPrimary = node.modifiers.primary;
    const isDisabled = node.modifiers.disabled;

    const bgColor = isPrimary ? this.theme.colors.primary : this.theme.colors.buttonBackground;
    const textColor = isPrimary ? this.theme.colors.primaryText : this.theme.colors.text;
    const opacity = isDisabled ? 0.5 : 1;

    return `<g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${this.theme.borders.radius}" fill="${bgColor}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />
      <text x="${x + width / 2}" y="${y + height / 2 + 5}" text-anchor="middle" class="wire-text" fill="${textColor}">${this.escapeXml(node.text || 'Button')}</text>
    </g>`;
  }

  /**
   * Render an icon button
   */
  private renderIconButton(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const isPrimary = node.modifiers.primary;

    const bgColor = isPrimary ? this.theme.colors.primary : this.theme.colors.buttonBackground;
    const iconColor = isPrimary ? this.theme.colors.primaryText : this.theme.colors.text;

    let svg = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${this.theme.borders.radius}" fill="${bgColor}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />`;

    // Render icon placeholder
    const iconSize = 16;
    const iconX = node.text ? x + 12 : x + (width - iconSize) / 2;
    const iconY = y + (height - iconSize) / 2;
    svg += this.renderIconPlaceholder(iconX, iconY, iconSize, iconColor, node.icon);

    // Render text if present
    if (node.text) {
      const textX = iconX + iconSize + 8;
      svg += `<text x="${textX}" y="${y + height / 2 + 5}" class="wire-text" fill="${iconColor}">${this.escapeXml(node.text)}</text>`;
    }

    return `<g>${svg}</g>`;
  }

  /**
   * Render a text input
   */
  private renderInput(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const placeholder = node.placeholder || '';

    let typeIndicator = '';
    if (node.controlType === 'PasswordInput') {
      typeIndicator = '••••';
    } else if (node.controlType === 'DateInput') {
      typeIndicator = '📅';
    } else if (node.controlType === 'NumberInput') {
      typeIndicator = '123';
    }

    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${this.theme.borders.radius}" fill="${this.theme.colors.inputBackground}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />
      <text x="${x + 12}" y="${y + height / 2 + 5}" class="wire-text wire-text-secondary">${this.escapeXml(typeIndicator || placeholder)}</text>
      ${node.modifiers.required ? `<text x="${x + width - 12}" y="${y + height / 2 + 5}" text-anchor="end" fill="${this.theme.colors.error}">*</text>` : ''}
    </g>`;
  }

  /**
   * Render a text area
   */
  private renderTextArea(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const placeholder = node.placeholder || '';

    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${this.theme.borders.radius}" fill="${this.theme.colors.inputBackground}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />
      <text x="${x + 12}" y="${y + 20}" class="wire-text wire-text-secondary">${this.escapeXml(placeholder)}</text>
      <line x1="${x + width - 20}" y1="${y + height - 8}" x2="${x + width - 8}" y2="${y + height - 8}" stroke="${this.theme.colors.border}" stroke-width="2" />
      <line x1="${x + width - 14}" y1="${y + height - 14}" x2="${x + width - 8}" y2="${y + height - 8}" stroke="${this.theme.colors.border}" stroke-width="2" />
    </g>`;
  }

  /**
   * Render a label
   */
  private renderLabel(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, height } = bounds;
    const text = node.text || '';

    // Check for markdown-style formatting
    let textClass = 'wire-text';
    let displayText = text;

    if (text.startsWith('**') && text.endsWith('**')) {
      textClass += ' wire-text-bold';
      displayText = text.slice(2, -2);
    } else if (text.startsWith('*') && text.endsWith('*')) {
      textClass += '" font-style="italic';
      displayText = text.slice(1, -1);
    }

    return `<text x="${x}" y="${y + height / 2 + 5}" class="${textClass}">${this.escapeXml(displayText)}</text>`;
  }

  /**
   * Render a checkbox
   */
  private renderCheckbox(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, height } = bounds;
    const size = this.theme.components.checkbox.size;
    const checked = node.modifiers.checked;

    let svg = `<rect x="${x}" y="${y + (height - size) / 2}" width="${size}" height="${size}" rx="2" fill="${this.theme.colors.inputBackground}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />`;

    if (checked) {
      const cx = x + size / 2;
      const cy = y + height / 2;
      svg += `<path d="M${x + 4} ${cy} L${cx - 1} ${cy + 4} L${x + size - 4} ${cy - 4}" stroke="${this.theme.colors.primary}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
    }

    svg += `<text x="${x + size + 8}" y="${y + height / 2 + 5}" class="wire-text">${this.escapeXml(node.text || '')}</text>`;

    return `<g>${svg}</g>`;
  }

  /**
   * Render a radio button
   */
  private renderRadio(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, height } = bounds;
    const size = this.theme.components.radio.size;
    const selected = node.modifiers.selected;

    const cx = x + size / 2;
    const cy = y + height / 2;

    let svg = `<circle cx="${cx}" cy="${cy}" r="${size / 2}" fill="${this.theme.colors.inputBackground}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />`;

    if (selected) {
      svg += `<circle cx="${cx}" cy="${cy}" r="${size / 4}" fill="${this.theme.colors.primary}" />`;
    }

    svg += `<text x="${x + size + 8}" y="${y + height / 2 + 5}" class="wire-text">${this.escapeXml(node.text || '')}</text>`;

    return `<g>${svg}</g>`;
  }

  /**
   * Render a dropdown
   */
  private renderDropdown(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;

    // Get first option as placeholder or use placeholder
    let displayText = node.placeholder || 'Select...';
    if (node.children && node.children.length > 0 && isControlNode(node.children[0])) {
      displayText = (node.children[0] as ControlNode).text || displayText;
    }

    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${this.theme.borders.radius}" fill="${this.theme.colors.inputBackground}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />
      <text x="${x + 12}" y="${y + height / 2 + 5}" class="wire-text">${this.escapeXml(displayText)}</text>
      <path d="M${x + width - 20} ${y + height / 2 - 2} L${x + width - 14} ${y + height / 2 + 4} L${x + width - 8} ${y + height / 2 - 2}" stroke="${this.theme.colors.text}" stroke-width="2" fill="none" />
    </g>`;
  }

  /**
   * Render a separator
   */
  private renderSeparator(_node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width } = bounds;
    return `<line x1="${x}" y1="${y}" x2="${x + width}" y2="${y}" stroke="${this.theme.colors.border}" stroke-width="1" />`;
  }

  /**
   * Render an icon
   */
  private renderIcon(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    return this.renderIconPlaceholder(x, y, Math.min(width, height), this.theme.colors.text, node.icon);
  }

  /**
   * Render an icon placeholder
   */
  private renderIconPlaceholder(x: number, y: number, size: number, color: string, iconName?: string): string {
    // Render a simple icon based on name, or a generic placeholder
    const icons: Record<string, string> = {
      close: `M${x + 3} ${y + 3} L${x + size - 3} ${y + size - 3} M${x + size - 3} ${y + 3} L${x + 3} ${y + size - 3}`,
      check: `M${x + 3} ${y + size / 2} L${x + size / 2 - 1} ${y + size - 4} L${x + size - 3} ${y + 4}`,
      add: `M${x + size / 2} ${y + 3} V${y + size - 3} M${x + 3} ${y + size / 2} H${x + size - 3}`,
      menu: `M${x + 3} ${y + 5} H${x + size - 3} M${x + 3} ${y + size / 2} H${x + size - 3} M${x + 3} ${y + size - 5} H${x + size - 3}`,
      search: `M${x + size / 2 - 2} ${y + size / 2 - 2} m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0 M${x + size / 2 + 1} ${y + size / 2 + 1} L${x + size - 4} ${y + size - 4}`,
      settings: `M${x + size / 2} ${y + size / 2} m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0`,
      user: `M${x + size / 2} ${y + 4} a3,3 0 1,0 0,6 a3,3 0 1,0 0,-6 M${x + 3} ${y + size - 3} Q${x + size / 2} ${y + size / 2 + 2} ${x + size - 3} ${y + size - 3}`,
      home: `M${x + size / 2} ${y + 3} L${x + 3} ${y + size / 2} H${x + 5} V${y + size - 3} H${x + size - 5} V${y + size / 2} H${x + size - 3} Z`,
      save: `M${x + 4} ${y + 3} H${x + size - 6} L${x + size - 3} ${y + 6} V${y + size - 3} H${x + 4} Z M${x + 6} ${y + 3} V${y + 7} H${x + size - 8} V${y + 3}`,
      edit: `M${x + 3} ${y + size - 5} L${x + size - 5} ${y + 3} L${x + size - 3} ${y + 5} L${x + 5} ${y + size - 3} Z`,
      delete: `M${x + 5} ${y + 4} H${x + size - 5} M${x + 6} ${y + 4} V${y + size - 3} H${x + size - 6} V${y + 4} M${x + size / 2} ${y + 3} V${y + 4}`,
      cart: `M${x + 3} ${y + 4} H${x + 5} L${x + 7} ${y + size - 6} H${x + size - 5} L${x + size - 3} ${y + 4} M${x + 8} ${y + size - 3} a1,1 0 1,0 0,0.1 M${x + size - 7} ${y + size - 3} a1,1 0 1,0 0,0.1`,
    };

    const path = iconName && icons[iconName.toLowerCase()];
    if (path) {
      return `<path d="${path}" stroke="${color}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
    }

    // Generic icon placeholder (circle)
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="2" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="2,2" />`;
  }

  /**
   * Render an image placeholder
   */
  private renderImage(_node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;

    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${this.theme.colors.surface}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />
      <line x1="${x}" y1="${y}" x2="${x + width}" y2="${y + height}" stroke="${this.theme.colors.border}" stroke-width="1" />
      <line x1="${x + width}" y1="${y}" x2="${x}" y2="${y + height}" stroke="${this.theme.colors.border}" stroke-width="1" />
      <text x="${x + width / 2}" y="${y + height / 2 + 5}" text-anchor="middle" class="wire-text wire-text-secondary wire-text-small">Image</text>
    </g>`;
  }

  /**
   * Render an avatar
   */
  private renderAvatar(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const size = Math.min(width, height);
    const cx = x + size / 2;
    const cy = y + size / 2;

    // Get initials from text
    const text = node.text || '';
    const initials = text
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return `<g>
      <circle cx="${cx}" cy="${cy}" r="${size / 2}" fill="${this.theme.colors.primary}" />
      <text x="${cx}" y="${cy + 5}" text-anchor="middle" class="wire-text" fill="${this.theme.colors.primaryText}">${initials || '?'}</text>
    </g>`;
  }

  /**
   * Render a progress bar
   */
  private renderProgress(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const value = (node.attributes['value'] as number) || 0;
    const progressWidth = (width * Math.min(100, Math.max(0, value))) / 100;

    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${this.theme.colors.surface}" />
      <rect x="${x}" y="${y}" width="${progressWidth}" height="${height}" rx="${height / 2}" fill="${this.theme.colors.primary}" />
    </g>`;
  }

  /**
   * Render a slider
   */
  private renderSlider(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const value = (node.attributes['value'] as number) || 50;
    const position = x + (width * Math.min(100, Math.max(0, value))) / 100;
    const trackY = y + height / 2;

    return `<g>
      <line x1="${x}" y1="${trackY}" x2="${x + width}" y2="${trackY}" stroke="${this.theme.colors.border}" stroke-width="4" stroke-linecap="round" />
      <line x1="${x}" y1="${trackY}" x2="${position}" y2="${trackY}" stroke="${this.theme.colors.primary}" stroke-width="4" stroke-linecap="round" />
      <circle cx="${position}" cy="${trackY}" r="8" fill="${this.theme.colors.primary}" stroke="${this.theme.colors.background}" stroke-width="2" />
    </g>`;
  }

  /**
   * Render a switch
   */
  private renderSwitch(node: ControlNode, bounds: BoundingBox): string {
    const { x, y } = bounds;
    const checked = node.modifiers.checked;
    const trackWidth = 44;
    const trackHeight = 24;
    const knobSize = 20;

    const bgColor = checked ? this.theme.colors.primary : this.theme.colors.border;
    const knobX = checked ? x + trackWidth - knobSize - 2 : x + 2;

    let svg = `<rect x="${x}" y="${y}" width="${trackWidth}" height="${trackHeight}" rx="${trackHeight / 2}" fill="${bgColor}" />`;
    svg += `<circle cx="${knobX + knobSize / 2}" cy="${y + trackHeight / 2}" r="${knobSize / 2}" fill="${this.theme.colors.background}" />`;

    if (node.text) {
      svg += `<text x="${x + trackWidth + 8}" y="${y + trackHeight / 2 + 5}" class="wire-text">${this.escapeXml(node.text)}</text>`;
    }

    return `<g>${svg}</g>`;
  }

  /**
   * Render a chip
   */
  private renderChip(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const selected = node.modifiers.selected;

    const bgColor = selected ? this.theme.colors.primary : this.theme.colors.surface;
    const textColor = selected ? this.theme.colors.primaryText : this.theme.colors.text;

    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${bgColor}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />
      <text x="${x + width / 2}" y="${y + height / 2 + 4}" text-anchor="middle" class="wire-text wire-text-small" fill="${textColor}">${this.escapeXml(node.text || '')}</text>
    </g>`;
  }

  /**
   * Render a generic control
   */
  private renderGenericControl(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;

    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${this.theme.colors.surface}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" stroke-dasharray="4,2" />
      <text x="${x + width / 2}" y="${y + height / 2 + 5}" text-anchor="middle" class="wire-text wire-text-secondary wire-text-small">${node.controlType}</text>
    </g>`;
  }

  /**
   * Render a section
   */
  private renderSection(node: SectionNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;

    let bgColor = this.theme.colors.surface;
    let strokeColor = this.theme.colors.border;

    // Different styles for different section types
    if (node.sectionType === 'Card') {
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${this.theme.borders.radiusLarge}" fill="${this.theme.colors.background}" stroke="${strokeColor}" stroke-width="${this.theme.borders.width}" filter="url(#shadow)" />`;
    }

    if (node.sectionType === 'Header' || node.sectionType === 'Footer') {
      bgColor = this.theme.colors.surface;
    }

    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${bgColor}" stroke="${strokeColor}" stroke-width="${this.theme.borders.width}" />`;
  }

  /**
   * Render a layout node (container)
   */
  private renderLayoutNode(_node: LayoutNode, _bounds: BoundingBox): string {
    // Layouts are transparent containers - no visual rendering
    return '';
  }

  /**
   * Render a component
   */
  private renderComponent(node: ComponentNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;

    switch (node.componentType) {
      case 'Card':
        return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${this.theme.borders.radiusLarge}" fill="${this.theme.colors.background}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />`;

      case 'Dialog':
        // Add a darkened overlay effect
        return `<g>
          <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${this.theme.borders.radiusLarge}" fill="${this.theme.colors.background}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />
          ${node.text ? `<text x="${x + 16}" y="${y + 24}" class="wire-text wire-text-bold">${this.escapeXml(node.text)}</text>` : ''}
        </g>`;

      case 'Alert':
        const alertType = (node.attributes['type'] as string) || 'info';
        const alertColors: Record<string, string> = {
          info: this.theme.colors.info,
          success: this.theme.colors.success,
          warning: this.theme.colors.warning,
          error: this.theme.colors.error,
        };
        const alertColor = alertColors[alertType] || alertColors.info;

        return `<g>
          <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${this.theme.borders.radius}" fill="${alertColor}20" stroke="${alertColor}" stroke-width="${this.theme.borders.width}" />
          <rect x="${x}" y="${y}" width="4" height="${height}" fill="${alertColor}" />
        </g>`;

      case 'Tabs':
        return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />`;

      default:
        return '';
    }
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

/**
 * Convenience function to render a document
 */
export function render(document: DocumentNode, options: RenderOptions = {}): string {
  const theme = getTheme(options.theme || document.style || 'clean');
  const renderer = new SVGRenderer(theme);
  return renderer.render(document, options);
}
