/**
 * Wireframe Token Types
 * Defines all token types recognized by the Wireframe lexer.
 */
export enum TokenType {
  // Document
  WIREFRAME = 'WIREFRAME',
  END_WIREFRAME = 'END_WIREFRAME',

  // Layouts
  GRID = 'GRID',
  VERTICAL = 'VERTICAL',
  HORIZONTAL = 'HORIZONTAL',
  DOCK = 'DOCK',
  CANVAS = 'CANVAS',
  SCROLL = 'SCROLL',

  // Sections
  HEADER = 'HEADER',
  FOOTER = 'FOOTER',
  SIDEBAR = 'SIDEBAR',
  CONTENT = 'CONTENT',
  PANEL = 'PANEL',
  CARD = 'CARD',
  TOOLBAR = 'TOOLBAR',
  STATUSBAR = 'STATUSBAR',
  MODAL = 'MODAL',
  DRAWER = 'DRAWER',

  // Controls
  BUTTON = 'BUTTON',
  ICON_BUTTON = 'ICON_BUTTON',
  TEXT_INPUT = 'TEXT_INPUT',
  NUMBER_INPUT = 'NUMBER_INPUT',
  DATE_INPUT = 'DATE_INPUT',
  PASSWORD_INPUT = 'PASSWORD_INPUT',
  TEXT_AREA = 'TEXT_AREA',
  LABEL = 'LABEL',
  HEADING = 'HEADING',
  LINK = 'LINK',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
  DROPDOWN = 'DROPDOWN',
  OPTION = 'OPTION',
  SEPARATOR = 'SEPARATOR',
  SPACER = 'SPACER',

  // Components
  TABS = 'TABS',
  TAB = 'TAB',
  EXPANDER = 'EXPANDER',
  TREE = 'TREE',
  TREE_ITEM = 'TREE_ITEM',
  LIST = 'LIST',
  MENU = 'MENU',
  MENU_ITEM = 'MENU_ITEM',
  HAMBURGER = 'HAMBURGER',
  BREADCRUMB = 'BREADCRUMB',
  BREADCRUMB_ITEM = 'BREADCRUMB_ITEM',
  PAGINATION = 'PAGINATION',
  AVATAR = 'AVATAR',
  BADGE = 'BADGE',
  PROGRESS = 'PROGRESS',
  SLIDER = 'SLIDER',
  SWITCH = 'SWITCH',
  CHIP = 'CHIP',
  ACCORDION = 'ACCORDION',
  ACCORDION_SECTION = 'ACCORDION_SECTION',
  STEPPER = 'STEPPER',
  STEP = 'STEP',
  DIALOG = 'DIALOG',
  TOAST = 'TOAST',
  ALERT = 'ALERT',
  SKELETON = 'SKELETON',
  HOVER = 'HOVER',
  TABLE = 'TABLE',
  ROW = 'ROW',
  CELL = 'CELL',
  DATA_GRID = 'DATA_GRID',
  COLUMN = 'COLUMN',
  COLUMN_TEXT = 'COLUMN_TEXT',
  COLUMN_DATE = 'COLUMN_DATE',
  COLUMN_NUMBER = 'COLUMN_NUMBER',
  COLUMN_CHECKBOX = 'COLUMN_CHECKBOX',
  COLUMN_IMAGE = 'COLUMN_IMAGE',
  COLUMN_LINK = 'COLUMN_LINK',
  COLUMN_BUTTON = 'COLUMN_BUTTON',

  // Icons & Images
  ICON = 'ICON',
  IMAGE = 'IMAGE',

  // Data Sections
  DATA = 'DATA',
  VALIDATIONS = 'VALIDATIONS',
  CALCULATIONS = 'CALCULATIONS',
  RULES = 'RULES',
  FIELDS = 'FIELDS',
  COMPONENT = 'COMPONENT',

  // Repeat
  REPEAT = 'REPEAT',

  // Responsive
  DESKTOP = 'DESKTOP',
  TABLET = 'TABLET',
  MOBILE = 'MOBILE',

  // Conditionals
  IF = 'IF',
  ELSE = 'ELSE',
  ELSE_IF = 'ELSE_IF',
  END_IF = 'END_IF',

  // Identifiers and Values
  ID = 'ID', // :identifier
  BINDING = 'BINDING', // ?binding
  NAVIGATION = 'NAVIGATION', // @target
  ICON_REF = 'ICON_REF', // $icon
  ATTRIBUTE = 'ATTRIBUTE', // name=value
  STRING = 'STRING', // "string" or 'string'
  NUMBER = 'NUMBER', // 123, 12.5
  BOOLEAN = 'BOOLEAN', // true, false
  IDENTIFIER = 'IDENTIFIER', // general identifier

  // Modifiers
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  REQUIRED = 'REQUIRED',
  DISABLED = 'DISABLED',
  CHECKED = 'CHECKED',
  SELECTED = 'SELECTED',
  READONLY = 'READONLY',
  EDITABLE = 'EDITABLE',
  ACTIVE = 'ACTIVE',
  EXPANDED = 'EXPANDED',
  REMOVABLE = 'REMOVABLE',
  CIRCLE = 'CIRCLE',
  INDETERMINATE = 'INDETERMINATE',
  COMPLETED = 'COMPLETED',
  BORDER = 'BORDER',

  // Table Syntax
  TABLE_ROW = 'TABLE_ROW', // | col | col | col |
  TABLE_SEPARATOR = 'TABLE_SEPARATOR', // |---|---|---|

  // Tree Syntax
  TREE_BRANCH = 'TREE_BRANCH', // +
  TREE_LEAF = 'TREE_LEAF', // -

  // Block Closing
  END_BLOCK = 'END_BLOCK', // /Keyword

  // Document Attributes
  DOC_ATTRIBUTE = 'DOC_ATTRIBUTE', // %name: value

  // Comments
  COMMENT = 'COMMENT',
  MULTILINE_COMMENT = 'MULTILINE_COMMENT',

  // Whitespace and Structure
  NEWLINE = 'NEWLINE',
  INDENT = 'INDENT',
  DEDENT = 'DEDENT',
  EOF = 'EOF',

  // Errors
  ERROR = 'ERROR',
}

/**
 * Maps keywords to their token types
 */
export const KEYWORDS: Record<string, TokenType> = {
  // Document
  wireframe: TokenType.WIREFRAME,

  // Wireframe styles (used after wireframe)
  sketch: TokenType.IDENTIFIER,
  blueprint: TokenType.IDENTIFIER,
  clean: TokenType.IDENTIFIER,
  realistic: TokenType.IDENTIFIER,

  // Layouts
  Grid: TokenType.GRID,
  Vertical: TokenType.VERTICAL,
  Horizontal: TokenType.HORIZONTAL,
  Dock: TokenType.DOCK,
  Canvas: TokenType.CANVAS,
  Scroll: TokenType.SCROLL,

  // Sections
  Header: TokenType.HEADER,
  Footer: TokenType.FOOTER,
  Sidebar: TokenType.SIDEBAR,
  Content: TokenType.CONTENT,
  Panel: TokenType.PANEL,
  Card: TokenType.CARD,
  Toolbar: TokenType.TOOLBAR,
  StatusBar: TokenType.STATUSBAR,
  Modal: TokenType.MODAL,
  Drawer: TokenType.DRAWER,

  // Controls
  Button: TokenType.BUTTON,
  IconButton: TokenType.ICON_BUTTON,
  TextInput: TokenType.TEXT_INPUT,
  NumberInput: TokenType.NUMBER_INPUT,
  DateInput: TokenType.DATE_INPUT,
  PasswordInput: TokenType.PASSWORD_INPUT,
  TextArea: TokenType.TEXT_AREA,
  Label: TokenType.LABEL,
  Heading: TokenType.HEADING,
  Link: TokenType.LINK,
  Checkbox: TokenType.CHECKBOX,
  Radio: TokenType.RADIO,
  Dropdown: TokenType.DROPDOWN,
  Option: TokenType.OPTION,
  Separator: TokenType.SEPARATOR,
  Spacer: TokenType.SPACER,

  // Components
  Tabs: TokenType.TABS,
  Tab: TokenType.TAB,
  Expander: TokenType.EXPANDER,
  Tree: TokenType.TREE,
  TreeItem: TokenType.TREE_ITEM,
  List: TokenType.LIST,
  Menu: TokenType.MENU,
  MenuItem: TokenType.MENU_ITEM,
  Hamburger: TokenType.HAMBURGER,
  Breadcrumb: TokenType.BREADCRUMB,
  BreadcrumbItem: TokenType.BREADCRUMB_ITEM,
  Pagination: TokenType.PAGINATION,
  Avatar: TokenType.AVATAR,
  Badge: TokenType.BADGE,
  Progress: TokenType.PROGRESS,
  Slider: TokenType.SLIDER,
  Switch: TokenType.SWITCH,
  Chip: TokenType.CHIP,
  Accordion: TokenType.ACCORDION,
  AccordionSection: TokenType.ACCORDION_SECTION,
  Stepper: TokenType.STEPPER,
  Step: TokenType.STEP,
  Dialog: TokenType.DIALOG,
  Toast: TokenType.TOAST,
  Alert: TokenType.ALERT,
  Skeleton: TokenType.SKELETON,
  Hover: TokenType.HOVER,
  Table: TokenType.TABLE,
  Row: TokenType.ROW,
  Cell: TokenType.CELL,
  DataGrid: TokenType.DATA_GRID,
  Column: TokenType.COLUMN,
  ColumnText: TokenType.COLUMN_TEXT,
  ColumnDate: TokenType.COLUMN_DATE,
  ColumnNumber: TokenType.COLUMN_NUMBER,
  ColumnCheckbox: TokenType.COLUMN_CHECKBOX,
  ColumnImage: TokenType.COLUMN_IMAGE,
  ColumnLink: TokenType.COLUMN_LINK,
  ColumnButton: TokenType.COLUMN_BUTTON,

  // Icons & Images
  Icon: TokenType.ICON,
  Image: TokenType.IMAGE,

  // Data Sections
  data: TokenType.DATA,
  validations: TokenType.VALIDATIONS,
  calculations: TokenType.CALCULATIONS,
  rules: TokenType.RULES,
  fields: TokenType.FIELDS,
  component: TokenType.COMPONENT,

  // Repeat
  Repeat: TokenType.REPEAT,

  // Conditionals
  if: TokenType.IF,
  else: TokenType.ELSE,

  // Modifiers
  primary: TokenType.PRIMARY,
  secondary: TokenType.SECONDARY,
  required: TokenType.REQUIRED,
  disabled: TokenType.DISABLED,
  checked: TokenType.CHECKED,
  selected: TokenType.SELECTED,
  readonly: TokenType.READONLY,
  editable: TokenType.EDITABLE,
  active: TokenType.ACTIVE,
  expanded: TokenType.EXPANDED,
  removable: TokenType.REMOVABLE,
  circle: TokenType.CIRCLE,
  indeterminate: TokenType.INDETERMINATE,
  completed: TokenType.COMPLETED,
  border: TokenType.BORDER,

  // Boolean literals
  true: TokenType.BOOLEAN,
  false: TokenType.BOOLEAN,
};

/**
 * Maps closing keywords to their block type
 */
export const CLOSING_KEYWORDS: Record<string, TokenType> = {
  '/wireframe': TokenType.END_WIREFRAME,
  '/Grid': TokenType.END_BLOCK,
  '/Vertical': TokenType.END_BLOCK,
  '/Horizontal': TokenType.END_BLOCK,
  '/Dock': TokenType.END_BLOCK,
  '/Canvas': TokenType.END_BLOCK,
  '/Scroll': TokenType.END_BLOCK,
  '/Header': TokenType.END_BLOCK,
  '/Footer': TokenType.END_BLOCK,
  '/Sidebar': TokenType.END_BLOCK,
  '/Content': TokenType.END_BLOCK,
  '/Panel': TokenType.END_BLOCK,
  '/Card': TokenType.END_BLOCK,
  '/Toolbar': TokenType.END_BLOCK,
  '/StatusBar': TokenType.END_BLOCK,
  '/Modal': TokenType.END_BLOCK,
  '/Drawer': TokenType.END_BLOCK,
  '/Dropdown': TokenType.END_BLOCK,
  '/Tabs': TokenType.END_BLOCK,
  '/Tab': TokenType.END_BLOCK,
  '/Expander': TokenType.END_BLOCK,
  '/Tree': TokenType.END_BLOCK,
  '/TreeItem': TokenType.END_BLOCK,
  '/List': TokenType.END_BLOCK,
  '/Menu': TokenType.END_BLOCK,
  '/MenuItem': TokenType.END_BLOCK,
  '/Hamburger': TokenType.END_BLOCK,
  '/Breadcrumb': TokenType.END_BLOCK,
  '/Accordion': TokenType.END_BLOCK,
  '/AccordionSection': TokenType.END_BLOCK,
  '/Stepper': TokenType.END_BLOCK,
  '/Dialog': TokenType.END_BLOCK,
  '/Alert': TokenType.END_BLOCK,
  '/Hover': TokenType.END_BLOCK,
  '/Toast': TokenType.END_BLOCK,
  '/Skeleton': TokenType.END_BLOCK,
  '/Table': TokenType.END_BLOCK,
  '/DataGrid': TokenType.END_BLOCK,
  '/Column': TokenType.END_BLOCK,
  '/data': TokenType.END_BLOCK,
  '/validations': TokenType.END_BLOCK,
  '/calculations': TokenType.END_BLOCK,
  '/rules': TokenType.END_BLOCK,
  '/fields': TokenType.END_BLOCK,
  '/component': TokenType.END_BLOCK,
  '/Repeat': TokenType.END_BLOCK,
  '/if': TokenType.END_IF,
};

/**
 * Built-in icon names
 */
export const BUILTIN_ICONS = new Set([
  // Actions
  'add',
  'edit',
  'delete',
  'save',
  'cancel',
  'refresh',
  'undo',
  'redo',
  'copy',
  'paste',
  // Navigation
  'back',
  'forward',
  'up',
  'down',
  'home',
  'menu',
  'close',
  'expand',
  'collapse',
  // Status
  'check',
  'error',
  'warning',
  'info',
  'loading',
  'success',
  // Objects
  'file',
  'folder',
  'user',
  'users',
  'bot',
  'chat',
  'settings',
  'search',
  'star',
  // Media
  'image',
  'video',
  'audio',
  'attach',
  'camera',
  'mic',
  // Auth
  'login',
  'logout',
  'lock',
  'unlock',
  'key',
  // Other common icons
  'cart',
  'heart',
  'notification',
  'bell',
  'calendar',
  'clock',
  'mail',
  'phone',
  'link',
  'print',
  'download',
  'upload',
  'filter',
  'sort',
]);

/**
 * Source location information for a token
 */
export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

/**
 * Represents a token in the Wireframe language
 */
export interface Token {
  type: TokenType;
  value: string;
  start: SourceLocation;
  end: SourceLocation;
  /** For END_BLOCK tokens, the keyword being closed */
  closingKeyword?: string;
  /** For ATTRIBUTE tokens, the attribute name */
  attributeName?: string;
  /** For ATTRIBUTE tokens, the attribute value */
  attributeValue?: string;
}

/**
 * Checks if a token type is a layout type
 */
export function isLayoutToken(type: TokenType): boolean {
  return [
    TokenType.GRID,
    TokenType.VERTICAL,
    TokenType.HORIZONTAL,
    TokenType.DOCK,
    TokenType.CANVAS,
    TokenType.SCROLL,
  ].includes(type);
}

/**
 * Checks if a token type is a section type
 */
export function isSectionToken(type: TokenType): boolean {
  return [
    TokenType.HEADER,
    TokenType.FOOTER,
    TokenType.SIDEBAR,
    TokenType.CONTENT,
    TokenType.PANEL,
    TokenType.CARD,
    TokenType.TOOLBAR,
    TokenType.STATUSBAR,
    TokenType.MODAL,
    TokenType.DRAWER,
  ].includes(type);
}

/**
 * Checks if a token type is a control type
 */
export function isControlToken(type: TokenType): boolean {
  return [
    TokenType.BUTTON,
    TokenType.ICON_BUTTON,
    TokenType.TEXT_INPUT,
    TokenType.NUMBER_INPUT,
    TokenType.DATE_INPUT,
    TokenType.PASSWORD_INPUT,
    TokenType.TEXT_AREA,
    TokenType.LABEL,
    TokenType.HEADING,
    TokenType.LINK,
    TokenType.CHECKBOX,
    TokenType.RADIO,
    TokenType.DROPDOWN,
    TokenType.OPTION,
    TokenType.SEPARATOR,
    TokenType.SPACER,
    TokenType.ICON,
    TokenType.IMAGE,
    TokenType.AVATAR,
    TokenType.BADGE,
    TokenType.PROGRESS,
    TokenType.SLIDER,
    TokenType.SWITCH,
    TokenType.CHIP,
    TokenType.PAGINATION,
    TokenType.TOAST,
    TokenType.SKELETON,
  ].includes(type);
}

/**
 * Checks if a token type is a component type (has children)
 */
export function isComponentToken(type: TokenType): boolean {
  return [
    TokenType.TABS,
    TokenType.TAB,
    TokenType.EXPANDER,
    TokenType.TREE,
    TokenType.TREE_ITEM,
    TokenType.LIST,
    TokenType.MENU,
    TokenType.MENU_ITEM,
    TokenType.HAMBURGER,
    TokenType.BREADCRUMB,
    TokenType.ACCORDION,
    TokenType.ACCORDION_SECTION,
    TokenType.STEPPER,
    TokenType.DIALOG,
    TokenType.ALERT,
    TokenType.HOVER,
    TokenType.TABLE,
    TokenType.DATA_GRID,
    TokenType.COLUMN,
  ].includes(type);
}

/**
 * Checks if a token type is a modifier
 */
export function isModifierToken(type: TokenType): boolean {
  return [
    TokenType.PRIMARY,
    TokenType.SECONDARY,
    TokenType.REQUIRED,
    TokenType.DISABLED,
    TokenType.CHECKED,
    TokenType.SELECTED,
    TokenType.READONLY,
    TokenType.EDITABLE,
    TokenType.ACTIVE,
    TokenType.EXPANDED,
    TokenType.REMOVABLE,
    TokenType.CIRCLE,
    TokenType.INDETERMINATE,
    TokenType.COMPLETED,
    TokenType.BORDER,
  ].includes(type);
}

/**
 * Checks if a token type can have children
 */
export function canHaveChildren(type: TokenType): boolean {
  return (
    isLayoutToken(type) ||
    isSectionToken(type) ||
    isComponentToken(type) ||
    type === TokenType.WIREFRAME ||
    type === TokenType.DROPDOWN ||
    type === TokenType.DATA ||
    type === TokenType.VALIDATIONS ||
    type === TokenType.CALCULATIONS ||
    type === TokenType.RULES ||
    type === TokenType.FIELDS ||
    type === TokenType.COMPONENT ||
    type === TokenType.REPEAT
  );
}
