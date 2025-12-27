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
import { sketchyRect, sketchyRoundedRect } from './sketch.js';

/**
 * Render options
 */
export interface RenderOptions {
  width?: number;
  height?: number;
  theme?: string;
  padding?: number;
  /** Enable accessibility features (ARIA attributes, roles) */
  accessible?: boolean;
  /** Title for the SVG (accessibility) */
  title?: string;
  /** Description for the SVG (accessibility) */
  description?: string;
  /** Language code for the document */
  lang?: string;
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
    const accessible = options.accessible !== false; // Default to true

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

    // Build accessibility attributes
    const a11yAttrs: string[] = [];
    if (accessible) {
      a11yAttrs.push('role="img"');
      if (options.lang) {
        a11yAttrs.push(`xml:lang="${options.lang}"`);
      }
    }

    // Build title and description elements
    let a11yElements = '';
    if (accessible) {
      const titleId = options.title ? 'wireframe-title' : '';
      const descId = options.description ? 'wireframe-desc' : '';
      const labelledBy = [titleId, descId].filter(Boolean).join(' ');
      
      if (labelledBy) {
        a11yAttrs.push(`aria-labelledby="${labelledBy}"`);
      }
      
      if (options.title) {
        a11yElements += `\n  <title id="wireframe-title">${this.escapeXml(options.title)}</title>`;
      }
      if (options.description) {
        a11yElements += `\n  <desc id="wireframe-desc">${this.escapeXml(options.description)}</desc>`;
      }
    }

    // Rebuild a11yAttrStr with labelledby
    const finalA11yAttrStr = a11yAttrs.length > 0 ? ' ' + a11yAttrs.join(' ') : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.max(height, layout.bounds.height + padding * 2)}" viewBox="0 0 ${width} ${Math.max(height, layout.bounds.height + padding * 2)}"${finalA11yAttrStr}>${a11yElements}
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
      case 'Badge':
        return this.renderBadge(node, bounds);
      case 'Tabs':
        return this.renderTabs(node, bounds);
      case 'Tab':
        return this.renderTab(node, bounds);
      case 'Menu':
        return this.renderMenu(node, bounds);
      case 'MenuItem':
        return this.renderMenuItem(node, bounds);
      case 'Breadcrumb':
        return this.renderBreadcrumb(node, bounds);
      case 'Pagination':
        return this.renderPagination(node, bounds);
      case 'Table':
        return this.renderTable(node, bounds);
      case 'Row':
        return this.renderRow(node, bounds);
      case 'Cell':
        return this.renderCell(node, bounds);
      case 'Tree':
        return this.renderTree(node, bounds);
      case 'TreeItem':
        return this.renderTreeItem(node, bounds);
      case 'Accordion':
        return this.renderAccordion(node, bounds);
      case 'AccordionSection':
        return this.renderAccordionSection(node, bounds);
      case 'DataGrid':
        return this.renderDataGrid(node, bounds);
      case 'Column':
        return this.renderColumn(node, bounds);
      case 'ColumnText':
        return this.renderColumn(node, bounds);
      case 'ColumnDate':
        return this.renderColumn(node, bounds);
      case 'ColumnNumber':
        return this.renderColumn(node, bounds);
      case 'ColumnCheckbox':
        return this.renderColumn(node, bounds);
      case 'ColumnImage':
        return this.renderColumn(node, bounds);
      case 'ColumnLink':
        return this.renderColumn(node, bounds);
      case 'ColumnButton':
        return this.renderColumn(node, bounds);
      case 'Heading':
        return this.renderHeading(node, bounds);
      case 'Link':
        return this.renderLink(node, bounds);
      case 'Toast':
        return this.renderToast(node, bounds);
      case 'Skeleton':
        return this.renderSkeleton(node, bounds);
      case 'Stepper':
        return this.renderStepper(node, bounds);
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

    const rect = this.createRect(x, y, width, height, {
      rx: this.theme.borders.radius,
      fill: bgColor,
      stroke: this.theme.colors.border,
      strokeWidth: this.theme.borders.width,
    });

    return `<g opacity="${opacity}">
      ${rect}
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

    const rect = this.createRect(x, y, width, height, {
      rx: this.theme.borders.radius,
      fill: this.theme.colors.inputBackground,
      stroke: this.theme.colors.border,
      strokeWidth: this.theme.borders.width,
    });

    return `<g>
      ${rect}
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
    const { x, y } = bounds;
    
    // Size variants: xs=24, sm=32, md=40, lg=56, xl=80
    const sizeVariants: Record<string, number> = {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 56,
      xl: 80,
    };
    const sizeAttr = (node.attributes['size'] as string) || 'md';
    const size = sizeVariants[sizeAttr] || sizeVariants.md;
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

    // Adjust font size based on avatar size
    const fontSize = Math.max(10, size / 3);

    return `<g>
      <circle cx="${cx}" cy="${cy}" r="${size / 2}" fill="${this.theme.colors.primary}" />
      <text x="${cx}" y="${cy + fontSize / 3}" text-anchor="middle" class="wire-text" style="font-size: ${fontSize}px" fill="${this.theme.colors.primaryText}">${initials || '?'}</text>
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
   * Render a badge
   */
  private renderBadge(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const variant = (node.attributes['variant'] as string) || 'default';
    
    const variantColors: Record<string, { bg: string; text: string }> = {
      default: { bg: this.theme.colors.secondary, text: this.theme.colors.primaryText },
      primary: { bg: this.theme.colors.primary, text: this.theme.colors.primaryText },
      secondary: { bg: this.theme.colors.secondary, text: this.theme.colors.primaryText },
      success: { bg: this.theme.colors.success, text: '#ffffff' },
      warning: { bg: this.theme.colors.warning, text: '#000000' },
      error: { bg: this.theme.colors.error, text: '#ffffff' },
      danger: { bg: this.theme.colors.error, text: '#ffffff' },
      info: { bg: this.theme.colors.info, text: '#000000' },
    };
    const colors = variantColors[variant] || variantColors.default;

    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${colors.bg}" />
      <text x="${x + width / 2}" y="${y + height / 2 + 4}" text-anchor="middle" class="wire-text wire-text-small" fill="${colors.text}">${this.escapeXml(node.text || '')}</text>
    </g>`;
  }

  /**
   * Render tabs container
   */
  private renderTabs(_node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    
    // Render tab bar background
    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${this.theme.colors.surface}" />
      <line x1="${x}" y1="${y + height}" x2="${x + width}" y2="${y + height}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />
    </g>`;
  }

  /**
   * Render a single tab
   */
  private renderTab(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const isActive = node.modifiers.selected || node.modifiers.active;

    const bgColor = isActive ? this.theme.colors.background : 'transparent';
    const textColor = isActive ? this.theme.colors.primary : this.theme.colors.textSecondary;
    const borderBottom = isActive ? `<rect x="${x}" y="${y + height - 2}" width="${width}" height="2" fill="${this.theme.colors.primary}" />` : '';

    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${bgColor}" />
      <text x="${x + width / 2}" y="${y + height / 2 + 5}" text-anchor="middle" class="wire-text" fill="${textColor}">${this.escapeXml(node.text || 'Tab')}</text>
      ${borderBottom}
    </g>`;
  }

  /**
   * Render a menu container
   */
  private renderMenu(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    
    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${this.theme.borders.radius}" fill="${this.theme.colors.background}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" filter="url(#shadow)" />
      ${node.text ? `<text x="${x + 12}" y="${y + 20}" class="wire-text wire-text-bold wire-text-small">${this.escapeXml(node.text)}</text>` : ''}
    </g>`;
  }

  /**
   * Render a menu item
   */
  private renderMenuItem(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const isDisabled = node.modifiers.disabled;
    const textColor = isDisabled ? this.theme.colors.textDisabled : this.theme.colors.text;

    let svg = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="transparent" />`;
    
    // Icon if present
    let textX = x + 12;
    if (node.icon) {
      svg += this.renderIconPlaceholder(x + 12, y + (height - 16) / 2, 16, textColor, node.icon);
      textX = x + 36;
    }

    svg += `<text x="${textX}" y="${y + height / 2 + 5}" class="wire-text" fill="${textColor}">${this.escapeXml(node.text || 'Menu Item')}</text>`;

    return `<g opacity="${isDisabled ? 0.5 : 1}">${svg}</g>`;
  }

  /**
   * Render a breadcrumb navigation
   */
  private renderBreadcrumb(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, height } = bounds;
    
    // Parse breadcrumb items from text (comma separated) or children
    const items = node.text ? node.text.split(',').map(s => s.trim()) : ['Home', 'Section', 'Page'];
    let currentX = x;
    let svg = '';

    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const textColor = isLast ? this.theme.colors.text : this.theme.colors.primary;
      
      svg += `<text x="${currentX}" y="${y + height / 2 + 5}" class="wire-text" fill="${textColor}">${this.escapeXml(item)}</text>`;
      currentX += item.length * 8 + 8;
      
      if (!isLast) {
        svg += `<text x="${currentX}" y="${y + height / 2 + 5}" class="wire-text" fill="${this.theme.colors.textSecondary}">/</text>`;
        currentX += 16;
      }
    });

    return `<g>${svg}</g>`;
  }

  /**
   * Render pagination controls
   */
  private renderPagination(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, height } = bounds;
    const currentPage = (node.attributes['page'] as number) || 1;
    const totalPages = (node.attributes['total'] as number) || 5;

    let svg = '';
    let currentX = x;
    const buttonWidth = 32;
    const buttonHeight = height;

    // Previous button
    svg += `<rect x="${currentX}" y="${y}" width="${buttonWidth}" height="${buttonHeight}" rx="${this.theme.borders.radius}" fill="${this.theme.colors.buttonBackground}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />`;
    svg += `<path d="M${currentX + 13} ${y + buttonHeight / 2 - 4} L${currentX + 9} ${y + buttonHeight / 2} L${currentX + 13} ${y + buttonHeight / 2 + 4}" stroke="${this.theme.colors.text}" stroke-width="2" fill="none" />`;
    currentX += buttonWidth + 4;

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === currentPage;
      const bgColor = isActive ? this.theme.colors.primary : this.theme.colors.buttonBackground;
      const textColor = isActive ? this.theme.colors.primaryText : this.theme.colors.text;

      svg += `<rect x="${currentX}" y="${y}" width="${buttonWidth}" height="${buttonHeight}" rx="${this.theme.borders.radius}" fill="${bgColor}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />`;
      svg += `<text x="${currentX + buttonWidth / 2}" y="${y + buttonHeight / 2 + 5}" text-anchor="middle" class="wire-text" fill="${textColor}">${i}</text>`;
      currentX += buttonWidth + 4;
    }

    // Next button
    svg += `<rect x="${currentX}" y="${y}" width="${buttonWidth}" height="${buttonHeight}" rx="${this.theme.borders.radius}" fill="${this.theme.colors.buttonBackground}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />`;
    svg += `<path d="M${currentX + 11} ${y + buttonHeight / 2 - 4} L${currentX + 15} ${y + buttonHeight / 2} L${currentX + 11} ${y + buttonHeight / 2 + 4}" stroke="${this.theme.colors.text}" stroke-width="2" fill="none" />`;

    return `<g>${svg}</g>`;
  }

  /**
   * Render a table
   */
  private renderTable(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const rows = (node.attributes['rows'] as number) || 4;
    const cols = (node.attributes['cols'] as number) || 3;
    const headerHeight = 36;
    const rowHeight = (height - headerHeight) / (rows - 1);
    const colWidth = width / cols;

    let svg = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${this.theme.colors.background}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />`;

    // Header row
    svg += `<rect x="${x}" y="${y}" width="${width}" height="${headerHeight}" fill="${this.theme.colors.surface}" />`;
    svg += `<line x1="${x}" y1="${y + headerHeight}" x2="${x + width}" y2="${y + headerHeight}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />`;

    // Column headers
    for (let c = 0; c < cols; c++) {
      const cellX = x + c * colWidth;
      if (c > 0) {
        svg += `<line x1="${cellX}" y1="${y}" x2="${cellX}" y2="${y + height}" stroke="${this.theme.colors.border}" stroke-width="1" />`;
      }
      svg += `<text x="${cellX + 12}" y="${y + headerHeight / 2 + 5}" class="wire-text wire-text-bold wire-text-small">Column ${c + 1}</text>`;
    }

    // Data rows
    for (let r = 1; r < rows; r++) {
      const rowY = y + headerHeight + (r - 1) * rowHeight;
      if (r > 1) {
        svg += `<line x1="${x}" y1="${rowY}" x2="${x + width}" y2="${rowY}" stroke="${this.theme.colors.border}" stroke-width="1" />`;
      }
      for (let c = 0; c < cols; c++) {
        const cellX = x + c * colWidth;
        svg += `<text x="${cellX + 12}" y="${rowY + rowHeight / 2 + 5}" class="wire-text wire-text-small wire-text-secondary">Data</text>`;
      }
    }

    return `<g>${svg}</g>`;
  }

  /**
   * Render a tree view
   */
  private renderTree(_node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    
    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${this.theme.colors.background}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />
    </g>`;
  }

  /**
   * Render a tree item
   */
  private renderTreeItem(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const level = (node.attributes['level'] as number) || 0;
    const expanded = node.modifiers.expanded;
    const hasChildren = node.children && node.children.length > 0;
    const indent = level * 20;
    
    let svg = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="transparent" />`;
    
    // Expand/collapse icon - only show if node has children
    const iconX = x + indent + 4;
    const iconY = y + height / 2;
    if (hasChildren) {
      svg += expanded
        ? `<path d="M${iconX} ${iconY - 4} L${iconX + 8} ${iconY - 4} L${iconX + 4} ${iconY + 4} Z" fill="${this.theme.colors.textSecondary}" />`
        : `<path d="M${iconX} ${iconY - 4} L${iconX + 8} ${iconY} L${iconX} ${iconY + 4} Z" fill="${this.theme.colors.textSecondary}" />`;
    }
    
    // Text - adjust position based on whether there's an expand icon
    const textX = hasChildren ? x + indent + 24 : x + indent + 8;
    svg += `<text x="${textX}" y="${y + height / 2 + 5}" class="wire-text">${this.escapeXml(node.text || 'Tree Item')}</text>`;

    return `<g>${svg}</g>`;
  }

  /**
   * Render an accordion container
   */
  private renderAccordion(_node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    
    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${this.theme.colors.background}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />
    </g>`;
  }

  /**
   * Render an accordion section
   */
  private renderAccordionSection(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const expanded = node.modifiers.expanded;
    const headerHeight = 40;

    let svg = `<rect x="${x}" y="${y}" width="${width}" height="${expanded ? height : headerHeight}" fill="${this.theme.colors.background}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />`;
    
    // Header
    svg += `<rect x="${x}" y="${y}" width="${width}" height="${headerHeight}" fill="${this.theme.colors.surface}" />`;
    svg += `<text x="${x + 16}" y="${y + headerHeight / 2 + 5}" class="wire-text wire-text-bold">${this.escapeXml(node.text || 'Section')}</text>`;
    
    // Expand/collapse icon
    const iconX = x + width - 24;
    const iconY = y + headerHeight / 2;
    svg += expanded
      ? `<path d="M${iconX - 4} ${iconY - 2} L${iconX} ${iconY + 4} L${iconX + 4} ${iconY - 2}" stroke="${this.theme.colors.text}" stroke-width="2" fill="none" />`
      : `<path d="M${iconX - 4} ${iconY + 2} L${iconX} ${iconY - 4} L${iconX + 4} ${iconY + 2}" stroke="${this.theme.colors.text}" stroke-width="2" fill="none" />`;

    return `<g>${svg}</g>`;
  }

  /**
   * Render a data grid with typed columns and sample data
   */
  private renderDataGrid(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const rows = (node.attributes['rows'] as number) || 5;
    const headerHeight = 40;
    const showSelection = node.modifiers.selected; // Enable row selection checkboxes
    
    // Get column definitions from children or use defaults
    const columnChildren = (node.children?.filter(
      (c): c is ControlNode => isControlNode(c) && (c.controlType?.startsWith('Column') || c.controlType === 'Column')
    ) || []) as ControlNode[];
    const cols = columnChildren.length > 0 ? columnChildren.length : (node.attributes['cols'] as number) || 4;
    
    // Calculate column widths
    const selectionColWidth = showSelection ? 40 : 0;
    const availableWidth = width - selectionColWidth;
    const colWidth = availableWidth / cols;
    const rowHeight = Math.min(36, (height - headerHeight) / (rows - 1));

    let svg = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${this.theme.colors.background}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" />`;

    // Header row background
    svg += `<rect x="${x}" y="${y}" width="${width}" height="${headerHeight}" fill="${this.theme.colors.surface}" />`;
    
    // Selection column header (checkbox)
    if (showSelection) {
      const checkX = x + (selectionColWidth - 14) / 2;
      const checkY = y + (headerHeight - 14) / 2;
      svg += `<rect x="${checkX}" y="${checkY}" width="14" height="14" rx="2" fill="${this.theme.colors.inputBackground}" stroke="${this.theme.colors.border}" stroke-width="1" />`;
      svg += `<line x1="${x + selectionColWidth}" y1="${y}" x2="${x + selectionColWidth}" y2="${y + height}" stroke="${this.theme.colors.border}" stroke-width="1" />`;
    }
    
    // Column headers
    for (let c = 0; c < cols; c++) {
      const cellX = x + selectionColWidth + c * colWidth;
      if (c > 0) {
        svg += `<line x1="${cellX}" y1="${y}" x2="${cellX}" y2="${y + height}" stroke="${this.theme.colors.border}" stroke-width="1" />`;
      }
      
      // Get column info from children if available
      const colDef = columnChildren[c];
      const colName = colDef?.text || `Column ${c + 1}`;
      const colType = colDef?.controlType || 'ColumnText';
      
      svg += `<text x="${cellX + 12}" y="${y + headerHeight / 2 + 5}" class="wire-text wire-text-bold wire-text-small">${this.escapeXml(colName)}</text>`;
      
      // Sort indicator
      svg += `<path d="M${cellX + colWidth - 20} ${y + headerHeight / 2 - 2} L${cellX + colWidth - 16} ${y + headerHeight / 2 - 6} L${cellX + colWidth - 12} ${y + headerHeight / 2 - 2}" stroke="${this.theme.colors.textSecondary}" stroke-width="1" fill="none" />`;
      
      // Type indicator for typed columns
      svg += this.renderColumnTypeIcon(colType, cellX + colWidth - 36, y + headerHeight / 2);
    }

    // Data rows with alternating background
    for (let r = 1; r < rows; r++) {
      const rowY = y + headerHeight + (r - 1) * rowHeight;
      if (r % 2 === 0) {
        svg += `<rect x="${x}" y="${rowY}" width="${width}" height="${rowHeight}" fill="${this.theme.colors.surface}40" />`;
      }
      svg += `<line x1="${x}" y1="${rowY}" x2="${x + width}" y2="${rowY}" stroke="${this.theme.colors.border}" stroke-width="1" />`;
      
      // Selection checkbox
      if (showSelection) {
        const checkX = x + (selectionColWidth - 14) / 2;
        const checkY = rowY + (rowHeight - 14) / 2;
        svg += `<rect x="${checkX}" y="${checkY}" width="14" height="14" rx="2" fill="${this.theme.colors.inputBackground}" stroke="${this.theme.colors.border}" stroke-width="1" />`;
      }
      
      // Render sample data for each column
      for (let c = 0; c < cols; c++) {
        const cellX = x + selectionColWidth + c * colWidth;
        const colDef = columnChildren[c];
        const colType = colDef?.controlType || 'ColumnText';
        svg += this.renderSampleData(colType, cellX, rowY, colWidth, rowHeight, r);
      }
    }

    return `<g>${svg}</g>`;
  }

  /**
   * Render column type indicator icon
   */
  private renderColumnTypeIcon(colType: string, x: number, y: number): string {
    switch (colType) {
      case 'ColumnDate':
        return `<text x="${x}" y="${y + 4}" class="wire-text wire-text-small wire-text-secondary">📅</text>`;
      case 'ColumnNumber':
        return `<text x="${x}" y="${y + 4}" class="wire-text wire-text-small wire-text-secondary" font-family="monospace">#</text>`;
      case 'ColumnCheckbox':
        return `<rect x="${x}" y="${y - 5}" width="10" height="10" rx="2" fill="none" stroke="${this.theme.colors.textSecondary}" stroke-width="1" />`;
      case 'ColumnImage':
        return `<rect x="${x}" y="${y - 5}" width="10" height="10" rx="1" fill="none" stroke="${this.theme.colors.textSecondary}" stroke-width="1" /><line x1="${x + 2}" y1="${y + 3}" x2="${x + 8}" y2="${y - 3}" stroke="${this.theme.colors.textSecondary}" stroke-width="1" />`;
      case 'ColumnLink':
        return `<text x="${x}" y="${y + 4}" class="wire-text wire-text-small" fill="${this.theme.colors.primary}">🔗</text>`;
      case 'ColumnButton':
        return `<rect x="${x}" y="${y - 4}" width="12" height="8" rx="2" fill="none" stroke="${this.theme.colors.textSecondary}" stroke-width="1" />`;
      default:
        return '';
    }
  }

  /**
   * Render sample data based on column type
   */
  private renderSampleData(colType: string, x: number, y: number, width: number, height: number, rowIndex: number): string {
    const textY = y + height / 2 + 4;
    const textX = x + 12;
    
    switch (colType) {
      case 'ColumnDate':
        const month = ((rowIndex * 3) % 12) + 1;
        const day = ((rowIndex * 7) % 28) + 1;
        return `<text x="${textX}" y="${textY}" class="wire-text wire-text-small wire-text-secondary">${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/2024</text>`;
      
      case 'ColumnNumber':
        const num = (rowIndex * 123 + 42).toString();
        return `<text x="${textX}" y="${textY}" class="wire-text wire-text-small wire-text-secondary" font-family="monospace">${num}</text>`;
      
      case 'ColumnCheckbox':
        const checked = rowIndex % 3 === 0;
        const checkX = x + (width - 14) / 2;
        const checkY = y + (height - 14) / 2;
        let svg = `<rect x="${checkX}" y="${checkY}" width="14" height="14" rx="2" fill="${this.theme.colors.inputBackground}" stroke="${this.theme.colors.border}" stroke-width="1" />`;
        if (checked) {
          svg += `<path d="M${checkX + 3} ${checkY + 7} L${checkX + 6} ${checkY + 10} L${checkX + 11} ${checkY + 4}" stroke="${this.theme.colors.primary}" stroke-width="2" fill="none" />`;
        }
        return svg;
      
      case 'ColumnImage':
        const imgSize = Math.min(height - 8, 28);
        const imgX = x + 8;
        const imgY = y + (height - imgSize) / 2;
        return `<rect x="${imgX}" y="${imgY}" width="${imgSize}" height="${imgSize}" rx="4" fill="${this.theme.colors.surface}" stroke="${this.theme.colors.border}" stroke-width="1" />`;
      
      case 'ColumnLink':
        return `<text x="${textX}" y="${textY}" class="wire-text wire-text-small" fill="${this.theme.colors.primary}" style="text-decoration: underline">Link ${rowIndex}</text>`;
      
      case 'ColumnButton':
        const btnWidth = width - 24;
        const btnHeight = height - 12;
        const btnX = x + 12;
        const btnY = y + 6;
        return `<rect x="${btnX}" y="${btnY}" width="${btnWidth}" height="${btnHeight}" rx="4" fill="${this.theme.colors.buttonBackground}" stroke="${this.theme.colors.border}" stroke-width="1" /><text x="${btnX + btnWidth / 2}" y="${btnY + btnHeight / 2 + 4}" text-anchor="middle" class="wire-text wire-text-small">Action</text>`;
      
      default: // ColumnText or Column
        return `<text x="${textX}" y="${textY}" class="wire-text wire-text-small wire-text-secondary">Data ${rowIndex}</text>`;
    }
  }

  /**
   * Render a row (container for cells)
   */
  private renderRow(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const isHeader = node.modifiers.selected; // Using 'selected' modifier for header styling
    
    const bgColor = isHeader ? this.theme.colors.surface : 'transparent';
    
    let svg = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${bgColor}" />`;
    svg += `<line x1="${x}" y1="${y + height}" x2="${x + width}" y2="${y + height}" stroke="${this.theme.colors.border}" stroke-width="1" />`;
    
    return `<g>${svg}</g>`;
  }

  /**
   * Render a cell within a row
   */
  private renderCell(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const align = (node.attributes['align'] as string) || 'left';
    
    let textAnchor = 'start';
    let textX = x + 8;
    if (align === 'center') {
      textAnchor = 'middle';
      textX = x + width / 2;
    } else if (align === 'right') {
      textAnchor = 'end';
      textX = x + width - 8;
    }
    
    let svg = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="transparent" />`;
    svg += `<line x1="${x + width}" y1="${y}" x2="${x + width}" y2="${y + height}" stroke="${this.theme.colors.border}" stroke-width="1" />`;
    svg += `<text x="${textX}" y="${y + height / 2 + 5}" text-anchor="${textAnchor}" class="wire-text wire-text-small">${this.escapeXml(node.text || '')}</text>`;
    
    return `<g>${svg}</g>`;
  }

  /**
   * Render a column header (for DataGrid)
   */
  private renderColumn(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const controlType = node.controlType;
    const sortable = node.modifiers.selected; // Using 'selected' modifier for sortable
    
    // Column type indicator
    let typeIcon = '';
    const iconY = y + height / 2;
    const iconX = x + width - 20;
    
    switch (controlType) {
      case 'ColumnDate':
        typeIcon = `<text x="${iconX}" y="${iconY + 4}" class="wire-text wire-text-small wire-text-secondary">📅</text>`;
        break;
      case 'ColumnNumber':
        typeIcon = `<text x="${iconX}" y="${iconY + 4}" class="wire-text wire-text-small wire-text-secondary">#</text>`;
        break;
      case 'ColumnCheckbox':
        typeIcon = `<rect x="${iconX}" y="${iconY - 6}" width="12" height="12" rx="2" fill="none" stroke="${this.theme.colors.textSecondary}" stroke-width="1" />`;
        break;
      case 'ColumnImage':
        typeIcon = `<rect x="${iconX}" y="${iconY - 6}" width="12" height="12" rx="1" fill="none" stroke="${this.theme.colors.textSecondary}" stroke-width="1" />`;
        break;
      case 'ColumnLink':
        typeIcon = `<text x="${iconX}" y="${iconY + 4}" class="wire-text wire-text-small" fill="${this.theme.colors.primary}">🔗</text>`;
        break;
      case 'ColumnButton':
        typeIcon = `<rect x="${iconX - 2}" y="${iconY - 5}" width="16" height="10" rx="2" fill="none" stroke="${this.theme.colors.textSecondary}" stroke-width="1" />`;
        break;
    }
    
    let svg = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${this.theme.colors.surface}" />`;
    svg += `<line x1="${x + width}" y1="${y}" x2="${x + width}" y2="${y + height}" stroke="${this.theme.colors.border}" stroke-width="1" />`;
    svg += `<text x="${x + 8}" y="${y + height / 2 + 5}" class="wire-text wire-text-bold wire-text-small">${this.escapeXml(node.text || 'Column')}</text>`;
    
    // Sort indicator if sortable
    if (sortable) {
      svg += `<path d="M${x + width - 32} ${y + height / 2 - 2} L${x + width - 28} ${y + height / 2 - 6} L${x + width - 24} ${y + height / 2 - 2}" stroke="${this.theme.colors.textSecondary}" stroke-width="1" fill="none" />`;
    }
    
    svg += typeIcon;
    
    return `<g>${svg}</g>`;
  }

  /**
   * Render a heading
   */
  private renderHeading(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, height } = bounds;
    const level = (node.attributes['level'] as number) || 1;
    
    const fontSizes: Record<number, number> = { 1: 24, 2: 20, 3: 18, 4: 16, 5: 14, 6: 12 };
    const fontSize = fontSizes[level] || 18;
    
    return `<text x="${x}" y="${y + height / 2 + fontSize / 3}" class="wire-text wire-text-bold" style="font-size: ${fontSize}px">${this.escapeXml(node.text || 'Heading')}</text>`;
  }

  /**
   * Render a link
   */
  private renderLink(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, height } = bounds;
    
    return `<g>
      <text x="${x}" y="${y + height / 2 + 5}" class="wire-text" fill="${this.theme.colors.primary}" style="text-decoration: underline">${this.escapeXml(node.text || 'Link')}</text>
    </g>`;
  }

  /**
   * Render a toast notification
   */
  private renderToast(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const variant = (node.attributes['variant'] as string) || 'info';
    
    const variantColors: Record<string, string> = {
      info: this.theme.colors.info,
      success: this.theme.colors.success,
      warning: this.theme.colors.warning,
      error: this.theme.colors.error,
    };
    const accentColor = variantColors[variant] || variantColors.info;

    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${this.theme.borders.radius}" fill="${this.theme.colors.background}" stroke="${this.theme.colors.border}" stroke-width="${this.theme.borders.width}" filter="url(#shadow)" />
      <rect x="${x}" y="${y}" width="4" height="${height}" rx="${this.theme.borders.radius} 0 0 ${this.theme.borders.radius}" fill="${accentColor}" />
      <text x="${x + 16}" y="${y + height / 2 + 5}" class="wire-text">${this.escapeXml(node.text || 'Notification')}</text>
      ${this.renderIconPlaceholder(x + width - 28, y + (height - 16) / 2, 16, this.theme.colors.textSecondary, 'close')}
    </g>`;
  }

  /**
   * Render a skeleton placeholder
   */
  private renderSkeleton(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const variant = (node.attributes['variant'] as string) || 'text';

    if (variant === 'circular') {
      const size = Math.min(width, height);
      return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" fill="${this.theme.colors.surface}">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
      </circle>`;
    }

    const radius = variant === 'rectangular' ? 0 : this.theme.borders.radius;
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${this.theme.colors.surface}">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
    </rect>`;
  }

  /**
   * Render a stepper
   */
  private renderStepper(node: ControlNode, bounds: BoundingBox): string {
    const { x, y, width, height } = bounds;
    const steps = (node.attributes['steps'] as number) || 4;
    const current = (node.attributes['current'] as number) || 1;
    const stepWidth = width / steps;
    const circleRadius = 14;

    let svg = '';

    for (let i = 1; i <= steps; i++) {
      const stepX = x + (i - 0.5) * stepWidth;
      const stepY = y + height / 2;
      const isCompleted = i < current;
      const isCurrent = i === current;

      // Connector line (except for first step)
      if (i > 1) {
        const prevX = x + (i - 1.5) * stepWidth;
        const lineColor = isCompleted ? this.theme.colors.primary : this.theme.colors.border;
        svg += `<line x1="${prevX + circleRadius}" y1="${stepY}" x2="${stepX - circleRadius}" y2="${stepY}" stroke="${lineColor}" stroke-width="2" />`;
      }

      // Step circle
      const bgColor = isCompleted ? this.theme.colors.primary : isCurrent ? this.theme.colors.background : this.theme.colors.surface;
      const borderColor = isCompleted || isCurrent ? this.theme.colors.primary : this.theme.colors.border;
      const textColor = isCompleted ? this.theme.colors.primaryText : isCurrent ? this.theme.colors.primary : this.theme.colors.textSecondary;

      svg += `<circle cx="${stepX}" cy="${stepY}" r="${circleRadius}" fill="${bgColor}" stroke="${borderColor}" stroke-width="2" />`;
      
      if (isCompleted) {
        svg += `<path d="M${stepX - 5} ${stepY} L${stepX - 1} ${stepY + 4} L${stepX + 5} ${stepY - 4}" stroke="${textColor}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
      } else {
        svg += `<text x="${stepX}" y="${stepY + 5}" text-anchor="middle" class="wire-text wire-text-small" fill="${textColor}">${i}</text>`;
      }
    }

    return `<g>${svg}</g>`;
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
    const strokeColor = this.theme.colors.border;

    // Different styles for different section types
    if (node.sectionType === 'Card') {
      const cardRect = this.createRect(x, y, width, height, {
        rx: this.theme.borders.radiusLarge,
        fill: this.theme.colors.background,
        stroke: strokeColor,
        strokeWidth: this.theme.borders.width,
      });
      return cardRect.replace('/>', ' filter="url(#shadow)" />');
    }

    if (node.sectionType === 'Header' || node.sectionType === 'Footer') {
      bgColor = this.theme.colors.surface;
    }

    return this.createRect(x, y, width, height, {
      fill: bgColor,
      stroke: strokeColor,
      strokeWidth: this.theme.borders.width,
    });
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
        return this.createRect(x, y, width, height, {
          rx: this.theme.borders.radiusLarge,
          fill: this.theme.colors.background,
          stroke: this.theme.colors.border,
          strokeWidth: this.theme.borders.width,
        });

      case 'Dialog':
        // Add a darkened overlay effect
        const dialogRect = this.createRect(x, y, width, height, {
          rx: this.theme.borders.radiusLarge,
          fill: this.theme.colors.background,
          stroke: this.theme.colors.border,
          strokeWidth: this.theme.borders.width,
        });
        return `<g>
          ${dialogRect}
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
        const alertRect = this.createRect(x, y, width, height, {
          rx: this.theme.borders.radius,
          fill: `${alertColor}20`,
          stroke: alertColor,
          strokeWidth: this.theme.borders.width,
        });

        return `<g>
          ${alertRect}
          <rect x="${x}" y="${y}" width="4" height="${height}" fill="${alertColor}" />
        </g>`;

      case 'Tabs':
        return this.createRect(x, y, width, height, {
          fill: 'none',
          stroke: this.theme.colors.border,
          strokeWidth: this.theme.borders.width,
        });

      default:
        return '';
    }
  }

  /**
   * Check if the current theme is the sketch theme
   */
  private isSketchTheme(): boolean {
    return this.theme.name === 'sketch';
  }

  /**
   * Create a rectangle - sketchy style if sketch theme is active
   */
  private createRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options: { rx?: number; fill?: string; stroke?: string; strokeWidth?: number } = {}
  ): string {
    const fill = options.fill ?? 'none';
    const stroke = options.stroke ?? this.theme.colors.border;
    const strokeWidth = options.strokeWidth ?? this.theme.borders.width;
    const rx = options.rx ?? 0;

    if (this.isSketchTheme()) {
      const path = rx > 0
        ? sketchyRoundedRect(x, y, width, height, rx, { roughness: 1 })
        : sketchyRect(x, y, width, height, { roughness: 1 });
      return `<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
    }

    return rx > 0
      ? `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`
      : `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
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
