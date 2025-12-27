import { SourceLocation } from '../lexer/tokens.js';

/**
 * Base interface for all AST nodes
 */
export interface ASTNode {
  type: string;
  start: SourceLocation;
  end: SourceLocation;
}

/**
 * Wireframe styles
 */
export type WireframeStyle = 'sketch' | 'blueprint' | 'clean' | 'realistic';

/**
 * Document-level attributes
 */
export interface DocumentAttributes {
  title?: string;
  version?: string;
  author?: string;
  date?: string;
  figma?: string;
  jira?: string;
  [key: string]: string | undefined;
}

/**
 * Root document node
 */
export interface DocumentNode extends ASTNode {
  type: 'Document';
  style: WireframeStyle;
  attributes: DocumentAttributes;
  children: ElementNode[];
  dataSections: DataSectionNode[];
}

/**
 * Union type for all element nodes
 */
export type ElementNode =
  | LayoutNode
  | SectionNode
  | ControlNode
  | ComponentNode
  | RepeatNode
  | ConditionalNode;

/**
 * Common properties for elements
 */
export interface ElementBase extends ASTNode {
  id?: string;
  binding?: string;
  navigation?: string;
  attributes: AttributeMap;
  modifiers: ModifierSet;
}

/**
 * Attribute map type
 */
export type AttributeMap = Record<string, string | number | boolean>;

/**
 * Modifier set type
 */
export interface ModifierSet {
  primary?: boolean;
  secondary?: boolean;
  required?: boolean;
  disabled?: boolean;
  checked?: boolean;
  selected?: boolean;
  readonly?: boolean;
  editable?: boolean;
  active?: boolean;
  expanded?: boolean;
}

// ============ Layout Nodes ============

/**
 * Layout types
 */
export type LayoutType = 'Grid' | 'Vertical' | 'Horizontal' | 'Dock' | 'Canvas' | 'Scroll';

/**
 * Layout node
 */
export interface LayoutNode extends ElementBase {
  type: 'Layout';
  layoutType: LayoutType;
  children: ElementNode[];
}

/**
 * Grid-specific attributes
 */
export interface GridAttributes {
  rows?: number;
  cols?: number;
  gap?: number;
}

/**
 * Flex-specific attributes (Vertical/Horizontal)
 */
export interface FlexAttributes {
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  padding?: number;
}

// ============ Section Nodes ============

/**
 * Section types
 */
export type SectionType =
  | 'Header'
  | 'Footer'
  | 'Sidebar'
  | 'Content'
  | 'Panel'
  | 'Card'
  | 'Toolbar'
  | 'StatusBar'
  | 'Modal'
  | 'Drawer';

/**
 * Dock positions
 */
export type DockPosition = 'top' | 'bottom' | 'left' | 'right' | 'fill';

/**
 * Section node
 */
export interface SectionNode extends ElementBase {
  type: 'Section';
  sectionType: SectionType;
  dock?: DockPosition;
  children: ElementNode[];
}

// ============ Control Nodes ============

/**
 * Control types
 */
export type ControlType =
  | 'Button'
  | 'IconButton'
  | 'TextInput'
  | 'NumberInput'
  | 'DateInput'
  | 'PasswordInput'
  | 'TextArea'
  | 'Label'
  | 'Heading'
  | 'Link'
  | 'Checkbox'
  | 'Radio'
  | 'Dropdown'
  | 'Option'
  | 'Separator'
  | 'Spacer'
  | 'Icon'
  | 'Image'
  | 'Avatar'
  | 'Badge'
  | 'Progress'
  | 'Slider'
  | 'Switch'
  | 'Chip'
  | 'Tabs'
  | 'Tab'
  | 'Menu'
  | 'MenuItem'
  | 'Breadcrumb'
  | 'Pagination'
  | 'Table'
  | 'Tree'
  | 'TreeItem'
  | 'Accordion'
  | 'AccordionSection'
  | 'DataGrid'
  | 'Toast'
  | 'Skeleton'
  | 'Stepper';

/**
 * Control node
 */
export interface ControlNode extends ElementBase {
  type: 'Control';
  controlType: ControlType;
  text?: string;
  icon?: string;
  placeholder?: string;
  tooltip?: string;
  children?: ElementNode[]; // For Dropdown options
}

// ============ Component Nodes ============

/**
 * Component types (containers with special behavior)
 */
export type ComponentType =
  | 'Card'
  | 'Tabs'
  | 'Tab'
  | 'Expander'
  | 'Tree'
  | 'List'
  | 'Menu'
  | 'MenuItem'
  | 'Hamburger'
  | 'Breadcrumb'
  | 'BreadcrumbItem'
  | 'Accordion'
  | 'AccordionSection'
  | 'Stepper'
  | 'Step'
  | 'Dialog'
  | 'Toast'
  | 'Alert'
  | 'Skeleton'
  | 'Hover'
  | 'Table'
  | 'DataGrid'
  | 'Column';

/**
 * Component node
 */
export interface ComponentNode extends ElementBase {
  type: 'Component';
  componentType: ComponentType;
  text?: string;
  children: ElementNode[];
  tableRows?: TableRowData[];
  treeItems?: TreeItemNode[];
  listItems?: string[];
}

/**
 * Table row data
 */
export interface TableRowData {
  cells: string[];
  isSeparator: boolean;
}

/**
 * Tree item node
 */
export interface TreeItemNode {
  text: string;
  isBranch: boolean;
  children: TreeItemNode[];
}

// ============ Repeat Node ============

/**
 * Repeat node for repeating content
 */
export interface RepeatNode extends ElementBase {
  type: 'Repeat';
  count: number;
  children: ElementNode[];
}

// ============ Conditional Node ============

/**
 * Conditional node for if/else
 */
export interface ConditionalNode extends ElementBase {
  type: 'Conditional';
  condition: string;
  thenChildren: ElementNode[];
  elseChildren?: ElementNode[];
}

// ============ Data Section Nodes ============

/**
 * Data section types
 */
export type DataSectionType =
  | 'data'
  | 'validations'
  | 'calculations'
  | 'rules'
  | 'fields'
  | 'component';

/**
 * Data section node
 */
export interface DataSectionNode extends ASTNode {
  type: 'DataSection';
  sectionType: DataSectionType;
  rows: TableRowData[];
  /** For component definitions */
  componentName?: string;
  componentParams?: string;
  componentBody?: ElementNode[];
}

// ============ Type Guards ============

export function isLayoutNode(node: ASTNode): node is LayoutNode {
  return node.type === 'Layout';
}

export function isSectionNode(node: ASTNode): node is SectionNode {
  return node.type === 'Section';
}

export function isControlNode(node: ASTNode): node is ControlNode {
  return node.type === 'Control';
}

export function isComponentNode(node: ASTNode): node is ComponentNode {
  return node.type === 'Component';
}

export function isRepeatNode(node: ASTNode): node is RepeatNode {
  return node.type === 'Repeat';
}

export function isConditionalNode(node: ASTNode): node is ConditionalNode {
  return node.type === 'Conditional';
}

export function isDataSectionNode(node: ASTNode): node is DataSectionNode {
  return node.type === 'DataSection';
}

export function isDocumentNode(node: ASTNode): node is DocumentNode {
  return node.type === 'Document';
}

// ============ Factory Functions ============

/**
 * Create a default source location
 */
export function createLocation(
  line: number = 1,
  column: number = 1,
  offset: number = 0
): SourceLocation {
  return { line, column, offset };
}

/**
 * Create an empty modifier set
 */
export function createModifierSet(): ModifierSet {
  return {};
}

/**
 * Create an empty document node
 */
export function createDocumentNode(style: WireframeStyle = 'clean'): DocumentNode {
  const loc = createLocation();
  return {
    type: 'Document',
    style,
    attributes: {},
    children: [],
    dataSections: [],
    start: loc,
    end: loc,
  };
}

/**
 * Create a layout node
 */
export function createLayoutNode(layoutType: LayoutType): LayoutNode {
  const loc = createLocation();
  return {
    type: 'Layout',
    layoutType,
    children: [],
    attributes: {},
    modifiers: createModifierSet(),
    start: loc,
    end: loc,
  };
}

/**
 * Create a section node
 */
export function createSectionNode(sectionType: SectionType): SectionNode {
  const loc = createLocation();
  return {
    type: 'Section',
    sectionType,
    children: [],
    attributes: {},
    modifiers: createModifierSet(),
    start: loc,
    end: loc,
  };
}

/**
 * Create a control node
 */
export function createControlNode(controlType: ControlType): ControlNode {
  const loc = createLocation();
  return {
    type: 'Control',
    controlType,
    attributes: {},
    modifiers: createModifierSet(),
    start: loc,
    end: loc,
  };
}

/**
 * Create a component node
 */
export function createComponentNode(componentType: ComponentType): ComponentNode {
  const loc = createLocation();
  return {
    type: 'Component',
    componentType,
    children: [],
    attributes: {},
    modifiers: createModifierSet(),
    start: loc,
    end: loc,
  };
}
