import {
  DocumentNode,
  ElementNode,
  LayoutNode,
  SectionNode,
  ControlNode,
  ComponentNode,
  RepeatNode,
  isLayoutNode,
  isSectionNode,
  isControlNode,
  isComponentNode,
  isRepeatNode,
} from '../parser/ast.js';
import { Theme } from './theme.js';

/**
 * Represents a bounding box for layout calculations
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Layout context passed during layout calculation
 */
export interface LayoutContext {
  x: number;
  y: number;
  availableWidth: number;
  availableHeight: number;
  theme: Theme;
}

/**
 * Calculated layout information for a node
 */
export interface LayoutInfo {
  bounds: BoundingBox;
  children: LayoutInfo[];
  node: ElementNode | DocumentNode;
}

/**
 * Default sizes for controls
 */
const DEFAULT_SIZES = {
  button: { width: 100, height: 36 },
  iconButton: { width: 36, height: 36 },
  input: { width: 200, height: 36 },
  textarea: { width: 300, height: 100 },
  label: { width: 100, height: 20 },
  heading: { width: 200, height: 32 },
  link: { width: 100, height: 20 },
  checkbox: { width: 150, height: 24 },
  radio: { width: 150, height: 24 },
  dropdown: { width: 200, height: 36 },
  separator: { width: 200, height: 1 },
  spacer: { width: 16, height: 16 },
  icon: { width: 24, height: 24 },
  image: { width: 150, height: 100 },
  avatar: { width: 40, height: 40 },
  badge: { width: 24, height: 24 },
  progress: { width: 200, height: 8 },
  slider: { width: 200, height: 24 },
  switch: { width: 48, height: 24 },
  chip: { width: 80, height: 28 },
  card: { width: 300, height: 200 },
  panel: { width: 300, height: 200 },
  tabs: { width: 300, height: 40 },
  tab: { width: 100, height: 40 },
  menu: { width: 180, height: 200 },
  menuItem: { width: 180, height: 36 },
  breadcrumb: { width: 300, height: 24 },
  pagination: { width: 300, height: 36 },
  table: { width: 400, height: 200 },
  tree: { width: 250, height: 200 },
  treeItem: { width: 250, height: 32 },
  accordion: { width: 300, height: 200 },
  accordionSection: { width: 300, height: 48 },
  dataGrid: { width: 500, height: 300 },
  toast: { width: 320, height: 56 },
  skeleton: { width: 200, height: 20 },
  stepper: { width: 400, height: 60 },
};

/**
 * Layout Engine
 *
 * Calculates positions and sizes for all elements in a Wireframe document.
 */
export class LayoutEngine {
  private theme: Theme;

  constructor(theme: Theme) {
    this.theme = theme;
  }

  /**
   * Calculate layout for a document
   */
  calculateLayout(document: DocumentNode, width: number, height: number): LayoutInfo {
    const context: LayoutContext = {
      x: 0,
      y: 0,
      availableWidth: width,
      availableHeight: height,
      theme: this.theme,
    };

    const children = this.layoutChildren(document.children, context, 'Vertical');

    // Calculate total height from children
    let totalHeight = 0;
    for (const child of children) {
      const bottom = child.bounds.y + child.bounds.height;
      if (bottom > totalHeight) {
        totalHeight = bottom;
      }
    }

    return {
      bounds: {
        x: 0,
        y: 0,
        width,
        height: Math.max(height, totalHeight + this.theme.spacing.padding),
      },
      children,
      node: document,
    };
  }

  /**
   * Calculate layout for an element
   */
  private layoutElement(node: ElementNode, context: LayoutContext): LayoutInfo {
    if (isLayoutNode(node)) {
      return this.layoutLayout(node, context);
    }
    if (isSectionNode(node)) {
      return this.layoutSection(node, context);
    }
    if (isControlNode(node)) {
      return this.layoutControl(node, context);
    }
    if (isComponentNode(node)) {
      return this.layoutComponent(node, context);
    }
    if (isRepeatNode(node)) {
      return this.layoutRepeat(node, context);
    }

    // Default fallback
    return {
      bounds: { x: context.x, y: context.y, width: 100, height: 20 },
      children: [],
      node,
    };
  }

  /**
   * Layout a layout container
   */
  private layoutLayout(node: LayoutNode, context: LayoutContext): LayoutInfo {
    const gap = this.getGap(node);
    const padding = this.getPadding(node);

    const innerContext: LayoutContext = {
      x: context.x + padding,
      y: context.y + padding,
      availableWidth: context.availableWidth - padding * 2,
      availableHeight: context.availableHeight - padding * 2,
      theme: this.theme,
    };

    const children = this.layoutChildren(node.children, innerContext, node.layoutType, gap);

    // Calculate bounds
    const bounds = this.calculateBoundsFromChildren(children, context, padding);

    return {
      bounds,
      children,
      node,
    };
  }

  /**
   * Layout a section container
   */
  private layoutSection(node: SectionNode, context: LayoutContext): LayoutInfo {
    const padding = this.theme.spacing.padding;
    let width = context.availableWidth;
    let height = context.availableHeight;

    // Handle dock-specific sizing
    if (node.dock === 'top' || node.dock === 'bottom') {
      height = this.getSizeAttribute(node, 'h') || this.theme.components.header.height;
    } else if (node.dock === 'left' || node.dock === 'right') {
      width = this.getSizeAttribute(node, 'w') || this.theme.components.sidebar.width;
    }

    const innerContext: LayoutContext = {
      x: context.x + padding,
      y: context.y + padding,
      availableWidth: width - padding * 2,
      availableHeight: height - padding * 2,
      theme: this.theme,
    };

    const children = this.layoutChildren(node.children, innerContext, 'Vertical');

    return {
      bounds: {
        x: context.x,
        y: context.y,
        width,
        height: Math.max(height, this.calculateContentHeight(children) + padding * 2),
      },
      children,
      node,
    };
  }

  /**
   * Layout a control
   */
  private layoutControl(node: ControlNode, context: LayoutContext): LayoutInfo {
    const size = this.getControlSize(node);
    const width = this.getSizeAttribute(node, 'w') || size.width;
    const height = this.getSizeAttribute(node, 'h') || size.height;

    // Handle children (e.g., Dropdown options)
    let children: LayoutInfo[] = [];
    if (node.children && node.children.length > 0) {
      const childContext: LayoutContext = {
        x: context.x,
        y: context.y + height,
        availableWidth: width,
        availableHeight: context.availableHeight - height,
        theme: this.theme,
      };
      children = this.layoutChildren(node.children, childContext, 'Vertical');
    }

    return {
      bounds: {
        x: context.x,
        y: context.y,
        width,
        height,
      },
      children,
      node,
    };
  }

  /**
   * Layout a component
   */
  private layoutComponent(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const padding = this.theme.spacing.md;
    const gap = this.theme.spacing.gap;

    // Get explicit size or default
    const width = this.getSizeAttribute(node, 'w') || context.availableWidth;
    const minHeight = this.getSizeAttribute(node, 'h') || 0;

    const innerContext: LayoutContext = {
      x: context.x + padding,
      y: context.y + padding,
      availableWidth: width - padding * 2,
      availableHeight: context.availableHeight - padding * 2,
      theme: this.theme,
    };

    const children = this.layoutChildren(node.children, innerContext, 'Vertical', gap);

    const contentHeight = this.calculateContentHeight(children);
    const height = Math.max(minHeight, contentHeight + padding * 2);

    return {
      bounds: {
        x: context.x,
        y: context.y,
        width,
        height,
      },
      children,
      node,
    };
  }

  /**
   * Layout a repeat node
   */
  private layoutRepeat(node: RepeatNode, context: LayoutContext): LayoutInfo {
    const children: LayoutInfo[] = [];
    let y = context.y;
    const gap = this.theme.spacing.gap;

    for (let i = 0; i < node.count; i++) {
      const repeatContext: LayoutContext = {
        x: context.x,
        y,
        availableWidth: context.availableWidth,
        availableHeight: context.availableHeight - (y - context.y),
        theme: this.theme,
      };

      for (const child of node.children) {
        const childLayout = this.layoutElement(child, repeatContext);
        children.push(childLayout);
        y = childLayout.bounds.y + childLayout.bounds.height + gap;
      }
    }

    const height = y - context.y - (children.length > 0 ? gap : 0);

    return {
      bounds: {
        x: context.x,
        y: context.y,
        width: context.availableWidth,
        height,
      },
      children,
      node,
    };
  }

  /**
   * Layout children according to layout type
   */
  private layoutChildren(
    children: ElementNode[],
    context: LayoutContext,
    layoutType: string,
    gap?: number
  ): LayoutInfo[] {
    const effectiveGap = gap ?? this.theme.spacing.gap;

    switch (layoutType) {
      case 'Vertical':
        return this.layoutVertical(children, context, effectiveGap);
      case 'Horizontal':
        return this.layoutHorizontal(children, context, effectiveGap);
      case 'Grid':
        return this.layoutGrid(children, context, effectiveGap);
      case 'Dock':
        return this.layoutDock(children, context);
      case 'Canvas':
        return this.layoutCanvas(children, context);
      case 'Scroll':
        return this.layoutVertical(children, context, effectiveGap); // Scroll is visual, layout same as vertical
      default:
        return this.layoutVertical(children, context, effectiveGap);
    }
  }

  /**
   * Layout children vertically
   */
  private layoutVertical(
    children: ElementNode[],
    context: LayoutContext,
    gap: number
  ): LayoutInfo[] {
    const layouts: LayoutInfo[] = [];
    let y = context.y;

    for (const child of children) {
      const childContext: LayoutContext = {
        x: context.x,
        y,
        availableWidth: context.availableWidth,
        availableHeight: context.availableHeight - (y - context.y),
        theme: this.theme,
      };

      const layout = this.layoutElement(child, childContext);
      layouts.push(layout);
      y = layout.bounds.y + layout.bounds.height + gap;
    }

    return layouts;
  }

  /**
   * Layout children horizontally
   */
  private layoutHorizontal(
    children: ElementNode[],
    context: LayoutContext,
    gap: number
  ): LayoutInfo[] {
    const layouts: LayoutInfo[] = [];
    let x = context.x;

    for (const child of children) {
      const childContext: LayoutContext = {
        x,
        y: context.y,
        availableWidth: context.availableWidth - (x - context.x),
        availableHeight: context.availableHeight,
        theme: this.theme,
      };

      const layout = this.layoutElement(child, childContext);
      layouts.push(layout);
      x = layout.bounds.x + layout.bounds.width + gap;
    }

    return layouts;
  }

  /**
   * Layout children in a grid
   */
  private layoutGrid(children: ElementNode[], context: LayoutContext, gap: number): LayoutInfo[] {
    const layouts: LayoutInfo[] = [];
    
    // Determine grid columns - default to 2 if not specified
    const cols = 2;
    
    // Calculate cell dimensions
    const cellWidth = (context.availableWidth - gap * (cols - 1)) / cols;
    let col = 0;
    let rowHeight = 0;
    let y = context.y;

    for (const child of children) {
      const x = context.x + col * (cellWidth + gap);
      
      const childContext: LayoutContext = {
        x,
        y,
        availableWidth: cellWidth,
        availableHeight: context.availableHeight - (y - context.y),
        theme: this.theme,
      };

      const layout = this.layoutElement(child, childContext);
      
      // Adjust width to fit cell if needed
      if (layout.bounds.width > cellWidth) {
        layout.bounds.width = cellWidth;
      }
      
      layouts.push(layout);
      rowHeight = Math.max(rowHeight, layout.bounds.height);

      col++;
      if (col >= cols) {
        col = 0;
        y += rowHeight + gap;
        rowHeight = 0;
      }
    }

    return layouts;
  }

  /**
   * Layout children with canvas (absolute) positioning
   */
  private layoutCanvas(children: ElementNode[], context: LayoutContext): LayoutInfo[] {
    const layouts: LayoutInfo[] = [];

    for (const child of children) {
      // Get explicit x, y positions from attributes if available
      const childX = (isControlNode(child) || isComponentNode(child)) 
        ? (this.getSizeAttribute(child, 'x') ?? context.x)
        : context.x;
      const childY = (isControlNode(child) || isComponentNode(child))
        ? (this.getSizeAttribute(child, 'y') ?? context.y)
        : context.y;

      const childContext: LayoutContext = {
        x: context.x + childX,
        y: context.y + childY,
        availableWidth: context.availableWidth,
        availableHeight: context.availableHeight,
        theme: this.theme,
      };

      const layout = this.layoutElement(child, childContext);
      layouts.push(layout);
    }

    return layouts;
  }

  /**
   * Layout children with dock positioning
   */
  private layoutDock(children: ElementNode[], context: LayoutContext): LayoutInfo[] {
    const layouts: LayoutInfo[] = [];
    let top = context.y;
    let bottom = context.y + context.availableHeight;
    let left = context.x;
    let right = context.x + context.availableWidth;

    for (const child of children) {
      if (!isSectionNode(child)) {
        continue;
      }

      const dock = child.dock || 'fill';
      let childContext: LayoutContext;

      switch (dock) {
        case 'top': {
          const height = this.getSizeAttribute(child, 'h') || this.theme.components.header.height;
          childContext = {
            x: left,
            y: top,
            availableWidth: right - left,
            availableHeight: height,
            theme: this.theme,
          };
          const layout = this.layoutElement(child, childContext);
          layouts.push(layout);
          top += layout.bounds.height;
          break;
        }
        case 'bottom': {
          const height = this.getSizeAttribute(child, 'h') || this.theme.components.footer.height;
          childContext = {
            x: left,
            y: bottom - height,
            availableWidth: right - left,
            availableHeight: height,
            theme: this.theme,
          };
          const layout = this.layoutElement(child, childContext);
          layouts.push(layout);
          bottom -= layout.bounds.height;
          break;
        }
        case 'left': {
          const width = this.getSizeAttribute(child, 'w') || this.theme.components.sidebar.width;
          childContext = {
            x: left,
            y: top,
            availableWidth: width,
            availableHeight: bottom - top,
            theme: this.theme,
          };
          const layout = this.layoutElement(child, childContext);
          layouts.push(layout);
          left += layout.bounds.width;
          break;
        }
        case 'right': {
          const width = this.getSizeAttribute(child, 'w') || this.theme.components.sidebar.width;
          childContext = {
            x: right - width,
            y: top,
            availableWidth: width,
            availableHeight: bottom - top,
            theme: this.theme,
          };
          const layout = this.layoutElement(child, childContext);
          layouts.push(layout);
          right -= layout.bounds.width;
          break;
        }
        case 'fill':
        default: {
          childContext = {
            x: left,
            y: top,
            availableWidth: right - left,
            availableHeight: bottom - top,
            theme: this.theme,
          };
          const layout = this.layoutElement(child, childContext);
          layouts.push(layout);
          break;
        }
      }
    }

    return layouts;
  }

  // ============ Helper Methods ============

  private getControlSize(node: ControlNode): { width: number; height: number } {
    const sizes = DEFAULT_SIZES;
    switch (node.controlType) {
      case 'Button':
        // Calculate width based on text length
        const textWidth = (node.text?.length || 6) * 8 + 32;
        return { width: Math.max(sizes.button.width, textWidth), height: sizes.button.height };
      case 'IconButton':
        return node.text
          ? { width: (node.text.length * 8) + 48, height: sizes.button.height }
          : sizes.iconButton;
      case 'TextInput':
      case 'NumberInput':
      case 'DateInput':
      case 'PasswordInput':
        return sizes.input;
      case 'TextArea':
        return sizes.textarea;
      case 'Label':
        const labelWidth = (node.text?.length || 10) * 8;
        return { width: Math.max(50, labelWidth), height: sizes.label.height };
      case 'Checkbox':
        return sizes.checkbox;
      case 'Radio':
        return sizes.radio;
      case 'Dropdown':
        return sizes.dropdown;
      case 'Separator':
        return sizes.separator;
      case 'Spacer':
        return sizes.spacer;
      case 'Icon':
        return sizes.icon;
      case 'Image':
        return sizes.image;
      case 'Avatar':
        return sizes.avatar;
      case 'Badge':
        return sizes.badge;
      case 'Progress':
        return sizes.progress;
      case 'Slider':
        return sizes.slider;
      case 'Switch':
        return sizes.switch;
      case 'Chip':
        return sizes.chip;
      case 'Tabs':
        return sizes.tabs;
      case 'Tab':
        const tabWidth = (node.text?.length || 6) * 8 + 24;
        return { width: Math.max(sizes.tab.width, tabWidth), height: sizes.tab.height };
      case 'Menu':
        return sizes.menu;
      case 'MenuItem':
        return sizes.menuItem;
      case 'Breadcrumb':
        return sizes.breadcrumb;
      case 'Pagination':
        return sizes.pagination;
      case 'Table':
        return sizes.table;
      case 'Tree':
        return sizes.tree;
      case 'TreeItem':
        return sizes.treeItem;
      case 'Accordion':
        return sizes.accordion;
      case 'AccordionSection':
        return sizes.accordionSection;
      case 'DataGrid':
        return sizes.dataGrid;
      case 'Heading':
        const headingWidth = (node.text?.length || 10) * 12;
        return { width: Math.max(100, headingWidth), height: sizes.heading.height };
      case 'Link':
        const linkWidth = (node.text?.length || 6) * 8;
        return { width: Math.max(40, linkWidth), height: sizes.link.height };
      case 'Toast':
        return sizes.toast;
      case 'Skeleton':
        return sizes.skeleton;
      case 'Stepper':
        return sizes.stepper;
      default:
        return { width: 100, height: 30 };
    }
  }

  private getGap(node: LayoutNode): number {
    if (typeof node.attributes['gap'] === 'number') {
      return node.attributes['gap'];
    }
    return this.theme.spacing.gap;
  }

  private getPadding(node: LayoutNode): number {
    if (typeof node.attributes['padding'] === 'number') {
      return node.attributes['padding'];
    }
    return 0;
  }

  private getSizeAttribute(node: { attributes: Record<string, unknown> }, attr: 'w' | 'h' | 'x' | 'y'): number | undefined {
    const value = node.attributes[attr];
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return num;
      }
    }
    return undefined;
  }

  private calculateBoundsFromChildren(
    children: LayoutInfo[],
    context: LayoutContext,
    padding: number
  ): BoundingBox {
    if (children.length === 0) {
      return {
        x: context.x,
        y: context.y,
        width: context.availableWidth,
        height: padding * 2,
      };
    }

    let maxX = context.x;
    let maxY = context.y;

    for (const child of children) {
      const right = child.bounds.x + child.bounds.width;
      const bottom = child.bounds.y + child.bounds.height;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    }

    return {
      x: context.x,
      y: context.y,
      width: Math.max(context.availableWidth, maxX - context.x + padding),
      height: maxY - context.y + padding,
    };
  }

  private calculateContentHeight(children: LayoutInfo[]): number {
    if (children.length === 0) return 0;

    let maxY = 0;
    const minY = children[0]?.bounds.y || 0;

    for (const child of children) {
      const bottom = child.bounds.y + child.bounds.height;
      if (bottom > maxY) maxY = bottom;
    }

    return maxY - minY;
  }
}
