import {
  DocumentNode,
  ElementNode,
  LayoutNode,
  SectionNode,
  ControlNode,
  ComponentNode,
  RepeatNode,
  ConditionalNode,
  isLayoutNode,
  isSectionNode,
  isControlNode,
  isComponentNode,
  isRepeatNode,
  isConditionalNode,
} from '../parser/ast.js';
import { Theme } from './theme.js';
import {
  controlText,
  hasInputLabel,
  INPUT_LABEL_HEIGHT,
  COMPONENT_TITLE_HEIGHT,
  TABLE_ROW_HEIGHT,
  MENU_TITLE_HEIGHT,
  MENU_PADDING,
  BREADCRUMB_SEPARATOR_WIDTH,
  STEP_LABEL_HEIGHT,
  TREE_PADDING,
  LIST_ITEM_HEIGHT,
  FOLD_HEADER_HEIGHT,
  HOVER_TIP_HEIGHT,
  HOVER_TIP_GAP,
  componentTitle,
  breadcrumbTexts,
  tableSize,
  countTreeItems,
  hoverTipWidth,
} from './control-helpers.js';

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
  /** Set by a Dock for its children: a section takes the whole of the region it is given */
  fill?: boolean;
}

/**
 * Calculated layout information for a node
 */
export interface LayoutInfo {
  bounds: BoundingBox;
  children: LayoutInfo[];
  node: ElementNode | DocumentNode;
  /** How deep a tree item lies under its tree; 0 for the top ones */
  level?: number;
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
  private documentShow: string | undefined;

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

    const show = document.attributes?.['show'];
    this.documentShow = show === undefined ? undefined : String(show);

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
    if (isConditionalNode(node)) {
      return this.layoutConditional(node, context);
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

    const children = this.layoutChildren(node.children, innerContext, node.layoutType, gap, node);

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
    // A section is as wide as it is given room and as high as what it holds, unless it says
    // `w=` or `h=` itself. In a Dock it takes the whole region it is given.
    let width = this.getSizeAttribute(node, 'w') || context.availableWidth;
    let height = this.getSizeAttribute(node, 'h') || (context.fill ? context.availableHeight : 0);
    const top = componentTitle(node) ? COMPONENT_TITLE_HEIGHT : 0;

    // Handle dock-specific sizing
    if (node.dock === 'top' || node.dock === 'bottom') {
      width = context.availableWidth;
      height = this.getSizeAttribute(node, 'h')
        || (node.dock === 'bottom' ? this.theme.components.footer.height : this.theme.components.header.height);
    } else if (node.dock === 'left' || node.dock === 'right') {
      width = this.getSizeAttribute(node, 'w') || this.theme.components.sidebar.width;
      height = context.fill ? context.availableHeight : height;
    }

    const innerContext: LayoutContext = {
      x: context.x + padding,
      y: context.y + padding + top,
      availableWidth: width - padding * 2,
      availableHeight: Math.max(height, context.availableHeight) - padding * 2 - top,
      theme: this.theme,
    };

    const children = this.layoutChildren(node.children, innerContext, 'Vertical');

    return {
      bounds: {
        x: context.x,
        y: context.y,
        width,
        height: Math.max(height, this.calculateContentHeight(children) + padding * 2 + top),
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
    const labelHeight = hasInputLabel(node) ? INPUT_LABEL_HEIGHT : 0;
    const height = (this.getSizeAttribute(node, 'h') || size.height) + labelHeight;

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
   * Layout a component. Each kind has its own shape: a bar of tabs, a list of menu items,
   * rows of cells. What the renderer draws for it is in `SVGRenderer.renderComponent`.
   */
  private layoutComponent(node: ComponentNode, context: LayoutContext): LayoutInfo {
    switch (node.componentType) {
      case 'Tabs':
        return this.layoutTabs(node, context);
      case 'Menu':
        return this.layoutMenu(node, context);
      case 'Breadcrumb':
        return this.layoutBreadcrumb(node, context);
      case 'Stepper':
        return this.layoutStepper(node, context);
      case 'Table':
        return this.layoutTable(node, context);
      case 'Row':
        return this.layoutRow(node, context);
      case 'Tree':
        return this.layoutTree(node, context);
      case 'TreeItem':
        return this.layoutTreeItem(node, context, 0);
      case 'List':
        return this.layoutList(node, context);
      case 'Accordion':
        return this.layoutAccordion(node, context);
      case 'AccordionSection':
      case 'Expander':
        return this.layoutFold(node, context);
      case 'DataGrid':
        return this.layoutDataGrid(node, context);
      case 'Hamburger':
        return this.layoutHamburger(node, context);
      case 'Hover':
        return this.layoutHover(node, context);
      case 'Tab':
      case 'MenuItem':
      case 'Cell':
      case 'Step':
      case 'BreadcrumbItem':
      case 'Column':
      case 'ColumnText':
      case 'ColumnDate':
      case 'ColumnNumber':
      case 'ColumnCheckbox':
      case 'ColumnImage':
      case 'ColumnLink':
      case 'ColumnButton':
        return this.layoutPart(node, context);
      case 'Dialog':
        return this.layoutComponentBox(node, context, componentTitle(node) ? COMPONENT_TITLE_HEIGHT : 0, 0);
      case 'Alert':
        return this.layoutComponentBox(
          node,
          context,
          node.text && node.children.length > 0 ? COMPONENT_TITLE_HEIGHT : 0,
          node.text ? 48 : 0
        );
      default:
        return this.layoutComponentBox(node, context, 0, 0);
    }
  }

  /**
   * A component drawn as a box around its children, which start `top` below its upper edge
   * (the room of a title)
   */
  private layoutComponentBox(node: ComponentNode, context: LayoutContext, top: number, least: number): LayoutInfo {
    const padding = this.theme.spacing.md;
    const gap = this.theme.spacing.gap;

    // Get explicit size or default
    const width = this.getSizeAttribute(node, 'w') || context.availableWidth;
    const minHeight = Math.max(this.getSizeAttribute(node, 'h') || 0, least);

    const innerContext: LayoutContext = {
      x: context.x + padding,
      y: context.y + padding + top,
      availableWidth: width - padding * 2,
      availableHeight: context.availableHeight - padding * 2 - top,
      theme: this.theme,
    };

    const children = this.layoutChildren(node.children, innerContext, 'Vertical', gap);

    const contentHeight = this.calculateContentHeight(children);
    const height = Math.max(minHeight, contentHeight + padding * 2 + top);

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

  /** A part with a size of its own: a tab, a menu item, a cell, a column header */
  private layoutPart(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const size = this.getPartSize(node, context);
    return {
      bounds: {
        x: context.x,
        y: context.y,
        width: this.getSizeAttribute(node, 'w') || size.width,
        height: this.getSizeAttribute(node, 'h') || size.height,
      },
      children: [],
      node,
    };
  }

  private getPartSize(node: ComponentNode, context: LayoutContext): { width: number; height: number } {
    const sizes = DEFAULT_SIZES;
    switch (node.componentType) {
      case 'Tab':
        return { width: Math.max(80, (node.text?.length || 3) * 8 + 32), height: sizes.tab.height };
      case 'MenuItem':
        return { width: context.availableWidth, height: sizes.menuItem.height };
      case 'Cell':
        return { width: 120, height: TABLE_ROW_HEIGHT };
      case 'Step':
        return { width: Math.max(80, (node.text?.length || 4) * 8 + 16), height: 24 };
      case 'BreadcrumbItem':
        return { width: (node.text?.length || 4) * 8, height: sizes.breadcrumb.height };
      default:
        return { width: 120, height: 40 };
    }
  }

  /** The tabs in a bar, and below it the content of the open tab */
  private layoutTabs(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const padding = this.theme.spacing.md;
    const width = this.getSizeAttribute(node, 'w') || context.availableWidth;
    const barHeight = DEFAULT_SIZES.tab.height;
    const tabs = node.children.filter((c): c is ComponentNode => isComponentNode(c) && c.componentType === 'Tab');
    const others = node.children.filter((c) => !(isComponentNode(c) && c.componentType === 'Tab'));

    let x = context.x;
    const bar: LayoutInfo[] = tabs.map((tab) => {
      const tabWidth = this.getSizeAttribute(tab, 'w') || this.getPartSize(tab, context).width;
      const layout: LayoutInfo = {
        bounds: { x, y: context.y, width: tabWidth, height: barHeight },
        children: [],
        node: tab,
      };
      x += tabWidth;
      return layout;
    });

    // The open tab is the one marked active or selected, else the first
    const open = tabs.find((tab) => tab.modifiers.active || tab.modifiers.selected) ?? tabs[0];
    const content = [...(open ? open.children : []), ...others];
    const innerContext: LayoutContext = {
      x: context.x + padding,
      y: context.y + barHeight + padding,
      availableWidth: width - padding * 2,
      availableHeight: context.availableHeight - barHeight - padding * 2,
      theme: this.theme,
    };
    const below = this.layoutVertical(content, innerContext, this.theme.spacing.gap);
    const contentHeight = below.length > 0 ? this.calculateContentHeight(below) + padding * 2 : 0;

    return {
      bounds: {
        x: context.x,
        y: context.y,
        width,
        height: Math.max(this.getSizeAttribute(node, 'h') || 0, barHeight + contentHeight),
      },
      children: [...bar, ...below],
      node,
    };
  }

  /** The items of a menu one under the other, under its title when it has one */
  private layoutMenu(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const width = this.getSizeAttribute(node, 'w') || Math.min(context.availableWidth, DEFAULT_SIZES.menu.width);
    const top = node.text ? MENU_TITLE_HEIGHT : MENU_PADDING;
    const innerContext: LayoutContext = {
      x: context.x,
      y: context.y + top,
      availableWidth: width,
      availableHeight: context.availableHeight - top,
      theme: this.theme,
    };
    const children = this.layoutVertical(node.children, innerContext, 0);
    const height = top + this.calculateContentHeight(children) + MENU_PADDING;

    return {
      bounds: { x: context.x, y: context.y, width, height: Math.max(this.getSizeAttribute(node, 'h') || 0, height) },
      children,
      node,
    };
  }

  /**
   * A breadcrumb of BreadcrumbItems is drawn whole by the renderer; one of other elements
   * (links) has them side by side, with room for the separator between
   */
  private layoutBreadcrumb(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const height = DEFAULT_SIZES.breadcrumb.height;
    const items = node.children.filter(
      (c): c is ComponentNode => isComponentNode(c) && c.componentType === 'BreadcrumbItem'
    );

    if (items.length > 0 || node.children.length === 0) {
      const texts = items.length > 0
        ? items.map((item) => item.text || '')
        : breadcrumbTexts(node.text);
      const width = texts.reduce(
        (sum, text, i) => sum + text.length * 8 + 8 + (i < texts.length - 1 ? BREADCRUMB_SEPARATOR_WIDTH : 0),
        0
      );
      return {
        bounds: { x: context.x, y: context.y, width: this.getSizeAttribute(node, 'w') || width, height },
        children: [],
        node,
      };
    }

    let x = context.x;
    const children = node.children.map((child) => {
      const childContext: LayoutContext = {
        x,
        y: context.y,
        availableWidth: this.getIntrinsicWidth(child) ?? Math.max(0, context.availableWidth - (x - context.x)),
        availableHeight: context.availableHeight,
        theme: this.theme,
      };
      const layout = this.layoutElement(child, childContext);
      x = layout.bounds.x + layout.bounds.width + 8 + BREADCRUMB_SEPARATOR_WIDTH;
      return layout;
    });
    const last = children[children.length - 1];

    return {
      bounds: {
        x: context.x,
        y: context.y,
        width: last.bounds.x + last.bounds.width - context.x,
        height: Math.max(height, this.calculateContentHeight(children)),
      },
      children,
      node,
    };
  }

  /** A stepper is drawn whole by the renderer, from its Step children or from `steps=` and `current=` */
  private layoutStepper(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const named = node.children.some((c) => isComponentNode(c) && c.componentType === 'Step' && !!c.text);
    return {
      bounds: {
        x: context.x,
        y: context.y,
        width: this.getSizeAttribute(node, 'w') || context.availableWidth,
        height: this.getSizeAttribute(node, 'h') || DEFAULT_SIZES.stepper.height + (named ? STEP_LABEL_HEIGHT : 0),
      },
      children: [],
      node,
    };
  }

  /**
   * A table of Row elements has its rows one under the other. One written as `| a | b |` lines,
   * or with only `rows=` and `cols=`, is drawn whole by the renderer.
   */
  private layoutTable(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const width = this.getSizeAttribute(node, 'w') || context.availableWidth;

    if (node.children.length > 0) {
      const innerContext: LayoutContext = { ...context, availableWidth: width };
      const children = this.layoutVertical(node.children, innerContext, 0);
      return {
        bounds: { x: context.x, y: context.y, width, height: this.calculateContentHeight(children) },
        children,
        node,
      };
    }

    const written = (node.tableRows ?? []).filter((row) => !row.isSeparator).length;
    const rows = written > 0 ? written : tableSize(node.attributes['rows'], 4);
    return {
      bounds: {
        x: context.x,
        y: context.y,
        width,
        height: this.getSizeAttribute(node, 'h') || rows * TABLE_ROW_HEIGHT,
      },
      children: [],
      node,
    };
  }

  /** The cells of a row share its width evenly */
  private layoutRow(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const width = this.getSizeAttribute(node, 'w') || context.availableWidth;
    const cellWidth = width / Math.max(1, node.children.length);

    const children = node.children.map((child, i) => {
      const x = context.x + i * cellWidth;
      if (isComponentNode(child) && child.componentType === 'Cell') {
        return {
          bounds: { x, y: context.y, width: cellWidth, height: TABLE_ROW_HEIGHT },
          children: [],
          node: child,
        } as LayoutInfo;
      }
      // Anything else in a row (a button, a badge) sits in its cell
      return this.layoutElement(child, {
        x: x + 8,
        y: context.y + 6,
        availableWidth: cellWidth - 16,
        availableHeight: TABLE_ROW_HEIGHT - 12,
        theme: this.theme,
      });
    });

    return {
      bounds: {
        x: context.x,
        y: context.y,
        width,
        height: Math.max(TABLE_ROW_HEIGHT, this.calculateContentHeight(children)),
      },
      children,
      node,
    };
  }

  /** A tree of `+ branch` and `- leaf` lines is drawn whole by the renderer; one of TreeItems has them stacked */
  private layoutTree(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const width = this.getSizeAttribute(node, 'w') || Math.min(context.availableWidth, DEFAULT_SIZES.tree.width);
    const rowHeight = DEFAULT_SIZES.treeItem.height;

    if (node.treeItems && node.treeItems.length > 0) {
      const height = countTreeItems(node.treeItems) * rowHeight + TREE_PADDING * 2;
      return {
        bounds: { x: context.x, y: context.y, width, height: Math.max(this.getSizeAttribute(node, 'h') || 0, height) },
        children: [],
        node,
      };
    }

    const children = this.layoutTreeItems(node.children, context.x, context.y + TREE_PADDING, width, 0);
    const bottom = children.reduce((y, child) => Math.max(y, this.lowestEdge(child)), context.y + TREE_PADDING);

    return {
      bounds: {
        x: context.x,
        y: context.y,
        width,
        height: Math.max(this.getSizeAttribute(node, 'h') || 0, bottom - context.y + TREE_PADDING),
      },
      children,
      node,
    };
  }

  /** Tree items one under the other; an expanded item's own items come between it and the next */
  private layoutTreeItems(items: ElementNode[], x: number, top: number, width: number, level: number): LayoutInfo[] {
    let y = top;
    return items.map((item) => {
      const itemContext: LayoutContext = {
        x,
        y,
        availableWidth: width,
        availableHeight: 0,
        theme: this.theme,
      };
      const layout = isComponentNode(item) && item.componentType === 'TreeItem'
        ? this.layoutTreeItem(item, itemContext, level)
        : this.layoutElement(item, itemContext);
      y = this.lowestEdge(layout);
      return layout;
    });
  }

  /** One line of a tree. Its bounds are the line alone; the items under it are its children. */
  private layoutTreeItem(node: ComponentNode, context: LayoutContext, level: number): LayoutInfo {
    const rowHeight = DEFAULT_SIZES.treeItem.height;
    const children = node.modifiers.expanded
      ? this.layoutTreeItems(node.children, context.x, context.y + rowHeight, context.availableWidth, level + 1)
      : [];

    return {
      bounds: { x: context.x, y: context.y, width: context.availableWidth, height: rowHeight },
      children,
      node,
      level,
    };
  }

  /** The lower edge of an element and everything under it */
  private lowestEdge(layout: LayoutInfo): number {
    return layout.children.reduce(
      (bottom, child) => Math.max(bottom, this.lowestEdge(child)),
      layout.bounds.y + layout.bounds.height
    );
  }

  /** A list is drawn whole by the renderer: a line per item */
  private layoutList(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const items = node.listItems ?? [];
    return {
      bounds: {
        x: context.x,
        y: context.y,
        width: this.getSizeAttribute(node, 'w') || context.availableWidth,
        height: Math.max(this.getSizeAttribute(node, 'h') || 0, items.length * LIST_ITEM_HEIGHT),
      },
      children: [],
      node,
    };
  }

  /** The sections of an accordion one under the other, with nothing between */
  private layoutAccordion(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const width = this.getSizeAttribute(node, 'w') || context.availableWidth;
    const children = this.layoutVertical(node.children, { ...context, availableWidth: width }, 0);

    return {
      bounds: {
        x: context.x,
        y: context.y,
        width,
        height: Math.max(this.getSizeAttribute(node, 'h') || 0, this.calculateContentHeight(children)),
      },
      children,
      node,
    };
  }

  /** A header that folds: an accordion section or an expander. Its content shows when it is expanded. */
  private layoutFold(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const padding = this.theme.spacing.md;
    const width = this.getSizeAttribute(node, 'w') || context.availableWidth;
    let children: LayoutInfo[] = [];
    let height = FOLD_HEADER_HEIGHT;

    if (node.modifiers.expanded && node.children.length > 0) {
      const innerContext: LayoutContext = {
        x: context.x + padding,
        y: context.y + FOLD_HEADER_HEIGHT + padding,
        availableWidth: width - padding * 2,
        availableHeight: context.availableHeight - FOLD_HEADER_HEIGHT - padding * 2,
        theme: this.theme,
      };
      children = this.layoutVertical(node.children, innerContext, this.theme.spacing.gap);
      height += this.calculateContentHeight(children) + padding * 2;
    }

    return {
      bounds: { x: context.x, y: context.y, width, height: Math.max(this.getSizeAttribute(node, 'h') || 0, height) },
      children,
      node,
    };
  }

  /** A data grid is drawn whole by the renderer, from its Column children or from `cols=` */
  private layoutDataGrid(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const rows = tableSize(node.attributes['rows'], 5);
    return {
      bounds: {
        x: context.x,
        y: context.y,
        width: this.getSizeAttribute(node, 'w') || context.availableWidth,
        height: this.getSizeAttribute(node, 'h') || 40 + (rows - 1) * TABLE_ROW_HEIGHT,
      },
      children: [],
      node,
    };
  }

  /** The three-line button, and under it what it opens when it is expanded */
  private layoutHamburger(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const size = DEFAULT_SIZES.icon.width;
    let children: LayoutInfo[] = [];
    let width = size;
    let height = size;

    if (node.modifiers.expanded && node.children.length > 0) {
      const innerContext: LayoutContext = {
        x: context.x,
        y: context.y + size + this.theme.spacing.gap,
        availableWidth: context.availableWidth,
        availableHeight: context.availableHeight - size - this.theme.spacing.gap,
        theme: this.theme,
      };
      children = this.layoutVertical(node.children, innerContext, this.theme.spacing.gap);
      width = children.reduce((right, child) => Math.max(right, child.bounds.x + child.bounds.width), context.x + size) - context.x;
      height = size + this.theme.spacing.gap + this.calculateContentHeight(children);
    }

    return { bounds: { x: context.x, y: context.y, width, height }, children, node };
  }

  /** What is hovered over, and under it the tip that shows */
  private layoutHover(node: ComponentNode, context: LayoutContext): LayoutInfo {
    const tipWidth = hoverTipWidth(node.text);
    const children = this.layoutVertical(node.children, context, this.theme.spacing.gap);
    const contentHeight = this.calculateContentHeight(children);
    const contentWidth = children.reduce(
      (right, child) => Math.max(right, child.bounds.x + child.bounds.width),
      context.x
    ) - context.x;

    return {
      bounds: {
        x: context.x,
        y: context.y,
        width: Math.max(tipWidth, contentWidth),
        height: contentHeight + (children.length > 0 ? HOVER_TIP_GAP : 0) + HOVER_TIP_HEIGHT,
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
   * Layout a conditional: a transparent vertical container showing one branch.
   * The then-branch is shown unless `show="else"` is set on the node or the document.
   */
  private layoutConditional(node: ConditionalNode, context: LayoutContext): LayoutInfo {
    const nodeShow = node.attributes?.['show'];
    const show = nodeShow !== undefined ? String(nodeShow) : this.documentShow;
    const branch = show === 'else' ? (node.elseChildren ?? []) : (node.thenChildren ?? []);

    const children = this.layoutVertical(branch, context, this.theme.spacing.gap);

    return {
      bounds: {
        x: context.x,
        y: context.y,
        width: context.availableWidth,
        height: this.calculateContentHeight(children),
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
    gap?: number,
    parentNode?: ElementNode
  ): LayoutInfo[] {
    const effectiveGap = gap ?? this.theme.spacing.gap;

    switch (layoutType) {
      case 'Vertical':
        return this.layoutVertical(children, context, effectiveGap);
      case 'Horizontal':
        return this.justifyHorizontal(this.layoutHorizontal(children, context, effectiveGap), context, parentNode);
      case 'Grid':
        return this.layoutGrid(children, context, effectiveGap, parentNode);
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

    // Children with a known width keep it; the others share what is left evenly
    const intrinsic = children.map((child) => this.getIntrinsicWidth(child));
    const fixedTotal = intrinsic.reduce<number>((sum, w) => sum + (w ?? 0), 0);
    const flexCount = intrinsic.filter((w) => w === undefined).length;
    const gaps = gap * Math.max(0, children.length - 1);
    const flexWidth = flexCount > 0
      ? Math.max(0, (context.availableWidth - gaps - fixedTotal) / flexCount)
      : 0;

    children.forEach((child, i) => {
      const childContext: LayoutContext = {
        x,
        y: context.y,
        availableWidth: intrinsic[i] ?? flexWidth,
        availableHeight: context.availableHeight,
        theme: this.theme,
      };

      const layout = this.layoutElement(child, childContext);
      layouts.push(layout);
      x = layout.bounds.x + layout.bounds.width + gap;
    });

    return layouts;
  }

  /**
   * `justify=` on a Horizontal: where its children stand when they do not fill the row.
   * `end` (or `right`), `center`, and `between`, which spreads the room left over between them.
   */
  private justifyHorizontal(layouts: LayoutInfo[], context: LayoutContext, parentNode?: ElementNode): LayoutInfo[] {
    const justify = parentNode?.attributes['justify'];
    if (typeof justify !== 'string' || layouts.length === 0) {
      return layouts;
    }
    const last = layouts[layouts.length - 1];
    const free = context.x + context.availableWidth - (last.bounds.x + last.bounds.width);
    if (free <= 0) {
      return layouts;
    }

    layouts.forEach((layout, i) => {
      let dx = 0;
      if (justify === 'end' || justify === 'right') {
        dx = free;
      } else if (justify === 'center') {
        dx = free / 2;
      } else if ((justify === 'between' || justify === 'space-between') && layouts.length > 1) {
        dx = (free * i) / (layouts.length - 1);
      }
      if (dx !== 0) {
        this.shiftRight(layout, dx);
      }
    });
    return layouts;
  }

  private shiftRight(layout: LayoutInfo, dx: number): void {
    layout.bounds.x += dx;
    for (const child of layout.children) {
      this.shiftRight(child, dx);
    }
  }

  /**
   * Layout children in a grid with support for grid=row,col,rowSpan,colSpan attribute
   */
  private layoutGrid(children: ElementNode[], context: LayoutContext, gap: number, parentNode?: ElementNode): LayoutInfo[] {
    const layouts: LayoutInfo[] = [];

    // Get cols/rows from parent attributes; cols defaults to 2
    const parentAttrs = parentNode && (isLayoutNode(parentNode) || isSectionNode(parentNode))
      ? parentNode.attributes
      : undefined;
    const cols = this.toPositiveInt(parentAttrs?.['cols']) ?? 2;
    const rows = this.toPositiveInt(parentAttrs?.['rows']);

    // Calculate cell dimensions
    const cellWidth = (context.availableWidth - gap * (cols - 1)) / cols;
    const cellHeight = rows ? (context.availableHeight - gap * (rows - 1)) / rows : undefined;
    
    // Track which cells are occupied (for spanning)
    const occupied: Set<string> = new Set();
    
    // First pass: layout children with explicit grid positions
    const positioned: Map<ElementNode, { row: number; col: number; rowSpan: number; colSpan: number }> = new Map();
    let autoRow = 0;
    let autoCol = 0;
    
    for (const child of children) {
      // grid=row,col,rowSpan,colSpan (0-indexed); unreadable values fall back to auto placement
      const pos = this.parseGridPosition(child.attributes?.['grid'], cols);
      if (pos) {
        positioned.set(child, pos);

        // Mark cells as occupied
        for (let r = pos.row; r < pos.row + pos.rowSpan; r++) {
          for (let c = pos.col; c < pos.col + pos.colSpan; c++) {
            occupied.add(`${r},${c}`);
          }
        }
      }
    }
    
    // Second pass: assign auto positions to children without grid attribute
    for (const child of children) {
      if (!positioned.has(child)) {
        // Find next available cell
        while (occupied.has(`${autoRow},${autoCol}`)) {
          autoCol++;
          if (autoCol >= cols) {
            autoCol = 0;
            autoRow++;
          }
        }
        positioned.set(child, { row: autoRow, col: autoCol, rowSpan: 1, colSpan: 1 });
        occupied.add(`${autoRow},${autoCol}`);
        autoCol++;
        if (autoCol >= cols) {
          autoCol = 0;
          autoRow++;
        }
      }
    }
    
    // Lay each child out in its column at the grid's top, then size the rows to fit
    const measured = children.map((child) => {
      const pos = positioned.get(child)!;
      const x = context.x + pos.col * (cellWidth + gap);
      const spanWidth = cellWidth * pos.colSpan + gap * (pos.colSpan - 1);
      const spanHeight = cellHeight ? cellHeight * pos.rowSpan + gap * (pos.rowSpan - 1) : undefined;

      const layout = this.layoutElement(child, {
        x,
        y: context.y,
        availableWidth: spanWidth,
        availableHeight: spanHeight || context.availableHeight,
        theme: this.theme,
      });

      // Adjust width to fit cell if needed
      if (layout.bounds.width > spanWidth) {
        layout.bounds.width = spanWidth;
      }
      return { layout, pos };
    });

    // Each row is as tall as its tallest child (and at least the fixed cell height, if rows= is set)
    const rowCount = measured.reduce((max, m) => Math.max(max, m.pos.row + m.pos.rowSpan), rows ?? 0);
    const rowHeights: number[] = new Array<number>(rowCount).fill(cellHeight ?? 0);
    for (const { layout, pos } of measured) {
      if (pos.rowSpan === 1) {
        rowHeights[pos.row] = Math.max(rowHeights[pos.row], layout.bounds.height);
      }
    }
    // A spanning child taller than the rows it spans grows the last of them
    for (const { layout, pos } of measured) {
      if (pos.rowSpan > 1) {
        const last = pos.row + pos.rowSpan - 1;
        let spanned = gap * (pos.rowSpan - 1);
        for (let r = pos.row; r <= last; r++) spanned += rowHeights[r];
        if (layout.bounds.height > spanned) {
          rowHeights[last] += layout.bounds.height - spanned;
        }
      }
    }

    const rowTops: number[] = [];
    let top = context.y;
    for (let r = 0; r < rowCount; r++) {
      rowTops.push(top);
      top += rowHeights[r] + gap;
    }

    for (const { layout, pos } of measured) {
      this.translate(layout, 0, rowTops[pos.row] - context.y);
      layouts.push(layout);
    }

    return layouts;
  }

  /**
   * Layout children with canvas (absolute) positioning using canvas=x,y attribute
   */
  private layoutCanvas(children: ElementNode[], context: LayoutContext): LayoutInfo[] {
    const layouts: LayoutInfo[] = [];

    for (const child of children) {
      let childX = 0;
      let childY = 0;
      
      if (isControlNode(child) || isComponentNode(child)) {
        // Check for canvas=x,y attribute first
        const canvasAttr = child.attributes['canvas'];
        if (canvasAttr !== undefined && canvasAttr !== '' && typeof canvasAttr !== 'boolean') {
          const parts = String(canvasAttr).split(',').map(p => parseFloat(p.trim()));
          childX = parts[0] || 0;
          childY = parts[1] || 0;
        } else {
          // Fall back to individual x, y attributes
          childX = this.getSizeAttribute(child, 'x') ?? 0;
          childY = this.getSizeAttribute(child, 'y') ?? 0;
        }
      }

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
            fill: true,
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
            fill: true,
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
            fill: true,
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
            fill: true,
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
            fill: true,
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
        // Size variants: xs=24, sm=32, md=40, lg=56, xl=80
        const avatarSizes: Record<string, number> = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 };
        const avatarSize = avatarSizes[(node.attributes['size'] as string) || 'md'] || 40;
        return { width: avatarSize, height: avatarSize };
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
      case 'Row':
        return { width: sizes.table.width, height: 36 };
      case 'Cell':
        return { width: 120, height: 36 };
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
      case 'Column':
      case 'ColumnText':
      case 'ColumnDate':
      case 'ColumnNumber':
      case 'ColumnCheckbox':
      case 'ColumnImage':
      case 'ColumnLink':
      case 'ColumnButton':
        return { width: 120, height: 40 };
      case 'Heading':
        const headingWidth = (controlText(node)?.length || 10) * 12;
        return { width: Math.max(100, headingWidth), height: sizes.heading.height };
      case 'Link':
        const linkWidth = (controlText(node)?.length || 6) * 8;
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

  /**
   * The width a Horizontal child takes when it has one of its own:
   * an explicit `w`, or a control's intrinsic size. Undefined means it shares the rest.
   */
  private getIntrinsicWidth(child: ElementNode): number | undefined {
    const explicit = this.getSizeAttribute(child, 'w');
    if (explicit) return explicit;
    if (isControlNode(child)) return this.getControlSize(child).width;
    return undefined;
  }

  /**
   * Parse grid=row,col,rowSpan,colSpan. Numbers and strings are accepted; missing parts
   * default (col 0, spans 1). Anything unreadable returns undefined so the child is auto-placed.
   */
  private parseGridPosition(
    value: unknown,
    cols: number
  ): { row: number; col: number; rowSpan: number; colSpan: number } | undefined {
    if (value === undefined || value === null || value === '' || typeof value === 'boolean') {
      return undefined;
    }
    const nums = String(value).split(',').map((p) => (p.trim() === '' ? undefined : Number(p.trim())));
    if (nums.some((n) => n !== undefined && (!Number.isFinite(n) || n < 0))) {
      return undefined;
    }
    const row = Math.floor(nums[0] ?? 0);
    const col = Math.floor(nums[1] ?? 0);
    if (col >= cols) {
      return undefined;
    }
    const rowSpan = Math.max(1, Math.floor(nums[2] || 1));
    const colSpan = Math.min(cols - col, Math.max(1, Math.floor(nums[3] || 1)));
    return { row, col, rowSpan, colSpan };
  }

  private toPositiveInt(value: unknown): number | undefined {
    const num = typeof value === 'number' ? value : typeof value === 'string' ? parseInt(value, 10) : NaN;
    return Number.isFinite(num) && num >= 1 ? Math.floor(num) : undefined;
  }

  /**
   * Move a laid-out subtree
   */
  private translate(layout: LayoutInfo, dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;
    layout.bounds.x += dx;
    layout.bounds.y += dy;
    for (const child of layout.children) {
      this.translate(child, dx, dy);
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
    // `width=` and `height=` say the same as `w=` and `h=`
    const long = attr === 'w' ? 'width' : attr === 'h' ? 'height' : attr;
    const value = node.attributes[attr] ?? node.attributes[long];
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
