import {
  Token,
  TokenType,
  SourceLocation,
  isLayoutToken,
  isSectionToken,
  isControlToken,
  isComponentToken,
  isModifierToken,
} from '../lexer/tokens.js';
import { Lexer } from '../lexer/lexer.js';
import {
  DocumentNode,
  ElementNode,
  LayoutNode,
  SectionNode,
  ControlNode,
  ComponentNode,
  RepeatNode,
  DataSectionNode,
  WireframeStyle,
  LayoutType,
  SectionType,
  ControlType,
  ComponentType,
  DockPosition,
  AttributeMap,
  ModifierSet,
  TableRowData,
  TreeItemNode,
  createDocumentNode,
  createLayoutNode,
  createSectionNode,
  createControlNode,
  createComponentNode,
  createModifierSet,
  createLocation,
} from './ast.js';

/**
 * Parser error information
 */
export interface ParserError {
  message: string;
  location: SourceLocation;
  token?: Token;
}

/**
 * Parser result
 */
export interface ParseResult {
  document: DocumentNode | null;
  errors: ParserError[];
}

/**
 * Token type to layout type mapping
 */
const TOKEN_TO_LAYOUT: Record<string, LayoutType> = {
  [TokenType.GRID]: 'Grid',
  [TokenType.VERTICAL]: 'Vertical',
  [TokenType.HORIZONTAL]: 'Horizontal',
  [TokenType.DOCK]: 'Dock',
  [TokenType.CANVAS]: 'Canvas',
  [TokenType.SCROLL]: 'Scroll',
};

/**
 * Token type to section type mapping
 */
const TOKEN_TO_SECTION: Record<string, SectionType> = {
  [TokenType.HEADER]: 'Header',
  [TokenType.FOOTER]: 'Footer',
  [TokenType.SIDEBAR]: 'Sidebar',
  [TokenType.CONTENT]: 'Content',
  [TokenType.PANEL]: 'Panel',
  [TokenType.CARD]: 'Card',
  [TokenType.TOOLBAR]: 'Toolbar',
  [TokenType.STATUSBAR]: 'StatusBar',
  [TokenType.MODAL]: 'Modal',
  [TokenType.DRAWER]: 'Drawer',
};

/**
 * Token type to control type mapping
 */
const TOKEN_TO_CONTROL: Record<string, ControlType> = {
  [TokenType.BUTTON]: 'Button',
  [TokenType.ICON_BUTTON]: 'IconButton',
  [TokenType.TEXT_INPUT]: 'TextInput',
  [TokenType.NUMBER_INPUT]: 'NumberInput',
  [TokenType.DATE_INPUT]: 'DateInput',
  [TokenType.PASSWORD_INPUT]: 'PasswordInput',
  [TokenType.TEXT_AREA]: 'TextArea',
  [TokenType.LABEL]: 'Label',
  [TokenType.HEADING]: 'Heading',
  [TokenType.LINK]: 'Link',
  [TokenType.CHECKBOX]: 'Checkbox',
  [TokenType.RADIO]: 'Radio',
  [TokenType.DROPDOWN]: 'Dropdown',
  [TokenType.OPTION]: 'Option',
  [TokenType.SEPARATOR]: 'Separator',
  [TokenType.SPACER]: 'Spacer',
  [TokenType.ICON]: 'Icon',
  [TokenType.IMAGE]: 'Image',
  [TokenType.AVATAR]: 'Avatar',
  [TokenType.BADGE]: 'Badge',
  [TokenType.PROGRESS]: 'Progress',
  [TokenType.SLIDER]: 'Slider',
  [TokenType.SWITCH]: 'Switch',
  [TokenType.CHIP]: 'Chip',
  [TokenType.PAGINATION]: 'Pagination',
  [TokenType.TOAST]: 'Toast',
  [TokenType.SKELETON]: 'Skeleton',
};

/**
 * Token type to component type mapping
 */
const TOKEN_TO_COMPONENT: Record<string, ComponentType> = {
  [TokenType.TABS]: 'Tabs',
  [TokenType.TAB]: 'Tab',
  [TokenType.EXPANDER]: 'Expander',
  [TokenType.TREE]: 'Tree',
  [TokenType.TREE_ITEM]: 'TreeItem',
  [TokenType.LIST]: 'List',
  [TokenType.MENU]: 'Menu',
  [TokenType.MENU_ITEM]: 'MenuItem',
  [TokenType.HAMBURGER]: 'Hamburger',
  [TokenType.BREADCRUMB]: 'Breadcrumb',
  [TokenType.BREADCRUMB_ITEM]: 'BreadcrumbItem',
  [TokenType.ACCORDION]: 'Accordion',
  [TokenType.ACCORDION_SECTION]: 'AccordionSection',
  [TokenType.STEPPER]: 'Stepper',
  [TokenType.STEP]: 'Step',
  [TokenType.DIALOG]: 'Dialog',
  [TokenType.ALERT]: 'Alert',
  [TokenType.HOVER]: 'Hover',
  [TokenType.TABLE]: 'Table',
  [TokenType.DATA_GRID]: 'DataGrid',
  [TokenType.COLUMN]: 'Column',
};

/**
 * Wireframe Parser
 *
 * Parses Wireframe tokens into an Abstract Syntax Tree (AST).
 */
export class Parser {
  private tokens: Token[] = [];
  private current: number = 0;
  private errors: ParserError[] = [];
  private ids: Set<string> = new Set();

  /**
   * Parse Wireframe source code
   */
  parse(source: string): ParseResult {
    const lexer = new Lexer(source);
    const { tokens, errors: lexerErrors } = lexer.tokenize();

    this.tokens = tokens;
    this.current = 0;
    this.errors = [];
    this.ids = new Set();

    // Add lexer errors
    for (const error of lexerErrors) {
      this.errors.push({
        message: error.message,
        location: error.location,
      });
    }

    try {
      const document = this.parseDocument();
      return {
        document,
        errors: this.errors,
      };
    } catch (error) {
      this.addError(`Unexpected parser error: ${error}`);
      return {
        document: null,
        errors: this.errors,
      };
    }
  }

  /**
   * Parse from pre-lexed tokens
   */
  parseTokens(tokens: Token[]): ParseResult {
    this.tokens = tokens;
    this.current = 0;
    this.errors = [];
    this.ids = new Set();

    try {
      const document = this.parseDocument();
      return {
        document,
        errors: this.errors,
      };
    } catch (error) {
      this.addError(`Unexpected parser error: ${error}`);
      return {
        document: null,
        errors: this.errors,
      };
    }
  }

  // ============ Private Parsing Methods ============

  private parseDocument(): DocumentNode {
    this.skipNewlines();

    // Check for wireframe keyword
    if (!this.check(TokenType.WIREFRAME)) {
      // Allow documents without explicit wireframe wrapper
      const doc = createDocumentNode('clean');
      doc.children = this.parseElements();
      return doc;
    }

    const startToken = this.advance(); // consume 'wireframe'
    const doc = createDocumentNode();
    doc.start = startToken.start;

    // Parse style
    this.skipNewlines();
    if (this.check(TokenType.IDENTIFIER)) {
      const styleToken = this.advance();
      const style = styleToken.value.toLowerCase();
      if (['sketch', 'blueprint', 'clean', 'realistic'].includes(style)) {
        doc.style = style as WireframeStyle;
      } else {
        this.addError(`Unknown wireframe style: ${style}`);
      }
    }

    this.skipNewlines();

    // Parse document attributes (%name: value)
    while (this.check(TokenType.DOC_ATTRIBUTE)) {
      const attrToken = this.advance();
      if (attrToken.attributeName && attrToken.attributeValue !== undefined) {
        doc.attributes[attrToken.attributeName] = attrToken.attributeValue;
      }
      this.skipNewlines();
    }

    // Parse children
    doc.children = this.parseElements();

    // Parse data sections
    doc.dataSections = this.parseDataSections();

    // Expect /wireframe
    this.skipNewlines();
    if (this.check(TokenType.END_WIREFRAME)) {
      const endToken = this.advance();
      doc.end = endToken.end;
    } else if (!this.isAtEnd()) {
      this.addError('Expected /wireframe to close document');
    }

    return doc;
  }

  private parseElements(): ElementNode[] {
    const elements: ElementNode[] = [];

    while (!this.isAtEnd() && !this.isBlockEnd()) {
      this.skipNewlines();

      if (this.isAtEnd() || this.isBlockEnd()) {
        break;
      }

      const element = this.parseElement();
      if (element) {
        elements.push(element);
      }

      this.skipNewlines();
    }

    return elements;
  }

  private parseElement(): ElementNode | null {
    const token = this.peek();

    if (isLayoutToken(token.type)) {
      return this.parseLayout();
    }

    if (isSectionToken(token.type)) {
      return this.parseSection();
    }

    if (isControlToken(token.type)) {
      return this.parseControl();
    }

    if (isComponentToken(token.type)) {
      return this.parseComponent();
    }

    if (token.type === TokenType.REPEAT) {
      return this.parseRepeat();
    }

    // Skip unknown tokens
    if (
      token.type !== TokenType.EOF &&
      token.type !== TokenType.NEWLINE &&
      token.type !== TokenType.END_BLOCK &&
      token.type !== TokenType.END_WIREFRAME
    ) {
      this.addError(`Unexpected token: ${token.value}`);
      this.advance();
    }

    return null;
  }

  private parseLayout(): LayoutNode {
    const token = this.advance();
    const layoutType = TOKEN_TO_LAYOUT[token.type];
    const node = createLayoutNode(layoutType);
    node.start = token.start;

    // Parse attributes
    this.parseElementModifiers(node);

    this.skipNewlines();

    // Check for INDENT
    if (this.check(TokenType.INDENT)) {
      this.advance();
      node.children = this.parseElements();

      // Expect DEDENT
      if (this.check(TokenType.DEDENT)) {
        this.advance();
      }
    }

    // Check for explicit end block
    this.skipNewlines();
    if (this.check(TokenType.END_BLOCK) && this.peek().closingKeyword === layoutType) {
      const endToken = this.advance();
      node.end = endToken.end;
    } else {
      node.end = this.previousEnd();
    }

    return node;
  }

  private parseSection(): SectionNode {
    const token = this.advance();
    const sectionType = TOKEN_TO_SECTION[token.type];
    const node = createSectionNode(sectionType);
    node.start = token.start;

    // Parse attributes (including dock=)
    this.parseElementModifiers(node);

    // Extract dock position if present
    if (node.attributes['dock']) {
      node.dock = node.attributes['dock'] as DockPosition;
    }

    this.skipNewlines();

    // Check for INDENT
    if (this.check(TokenType.INDENT)) {
      this.advance();
      node.children = this.parseElements();

      // Expect DEDENT
      if (this.check(TokenType.DEDENT)) {
        this.advance();
      }
    }

    // Check for explicit end block
    this.skipNewlines();
    if (this.check(TokenType.END_BLOCK) && this.peek().closingKeyword === sectionType) {
      const endToken = this.advance();
      node.end = endToken.end;
    } else {
      node.end = this.previousEnd();
    }

    return node;
  }

  private parseControl(): ControlNode {
    const token = this.advance();
    const controlType = TOKEN_TO_CONTROL[token.type];
    const node = createControlNode(controlType);
    node.start = token.start;

    // Parse text/placeholder for controls that have them
    if (this.check(TokenType.STRING)) {
      const textToken = this.advance();
      if (
        [
          'Button',
          'Label',
          'Checkbox',
          'Radio',
          'Switch',
          'Chip',
          'Avatar',
          'Dialog',
          'Toast',
        ].includes(controlType)
      ) {
        node.text = textToken.value;
      } else {
        node.placeholder = textToken.value;
      }
    }

    // For IconButton, parse icon reference first
    if (controlType === 'IconButton' && this.check(TokenType.ICON_REF)) {
      const iconToken = this.advance();
      node.icon = iconToken.value.substring(1); // Remove $

      // Then optional text
      if (this.check(TokenType.STRING)) {
        node.text = this.advance().value;
      }
    }

    // For Icon, parse icon reference
    if (controlType === 'Icon' && this.check(TokenType.ICON_REF)) {
      const iconToken = this.advance();
      node.icon = iconToken.value.substring(1);
    }

    // For Image, parse name
    if (controlType === 'Image' && this.check(TokenType.STRING)) {
      node.text = this.advance().value;
    }

    // Parse remaining modifiers and attributes
    this.parseElementModifiers(node);

    // Extract tooltip if present
    if (node.attributes['tooltip']) {
      node.tooltip = String(node.attributes['tooltip']);
    }

    // For Dropdown, check for inline options or children
    if (controlType === 'Dropdown') {
      // Check for inline options (quoted strings)
      const inlineOptions: string[] = [];
      while (this.check(TokenType.STRING)) {
        inlineOptions.push(this.advance().value);
      }

      // Continue parsing modifiers after inline options
      this.parseElementModifiers(node);

      this.skipNewlines();

      // Check for children (Option elements)
      if (this.check(TokenType.INDENT)) {
        this.advance();
        node.children = this.parseElements();
        if (this.check(TokenType.DEDENT)) {
          this.advance();
        }
      } else if (inlineOptions.length > 0) {
        // Convert inline options to Option nodes
        node.children = inlineOptions.map((opt) => {
          const optNode = createControlNode('Option');
          optNode.text = opt;
          return optNode;
        });
      }

      // Check for explicit end block
      this.skipNewlines();
      if (this.check(TokenType.END_BLOCK) && this.peek().closingKeyword === 'Dropdown') {
        const endToken = this.advance();
        node.end = endToken.end;
      }
    }

    node.end = this.previousEnd();
    return node;
  }

  private parseComponent(): ComponentNode {
    const token = this.advance();
    const componentType = TOKEN_TO_COMPONENT[token.type];
    const node = createComponentNode(componentType);
    node.start = token.start;

    // Parse text for components that have it
    if (this.check(TokenType.STRING)) {
      node.text = this.advance().value;
    }

    // Parse modifiers and attributes
    this.parseElementModifiers(node);

    this.skipNewlines();

    // Parse children based on component type
    if (componentType === 'Table') {
      // Parse table rows
      node.tableRows = [];
      if (this.check(TokenType.INDENT)) {
        this.advance();
        while (this.check(TokenType.TABLE_ROW) || this.check(TokenType.TABLE_SEPARATOR)) {
          const rowToken = this.advance();
          node.tableRows.push(this.parseTableRow(rowToken));
          this.skipNewlines();
        }
        if (this.check(TokenType.DEDENT)) {
          this.advance();
        }
      }
    } else if (componentType === 'Tree') {
      // Parse tree items - support both +/- syntax and TreeItem syntax
      if (this.check(TokenType.INDENT)) {
        this.advance();
        // Check if using +/- tree syntax or TreeItem syntax
        if (this.check(TokenType.TREE_BRANCH) || this.check(TokenType.TREE_LEAF)) {
          node.treeItems = this.parseTreeItems(0);
        } else {
          // Using TreeItem component syntax
          node.children = this.parseElements();
        }
        if (this.check(TokenType.DEDENT)) {
          this.advance();
        }
      }
    } else if (componentType === 'List') {
      // Parse list items
      node.listItems = [];
      if (this.check(TokenType.INDENT)) {
        this.advance();
        while (this.check(TokenType.TREE_LEAF)) {
          const itemToken = this.advance();
          node.listItems.push(itemToken.value);
          this.skipNewlines();
        }
        if (this.check(TokenType.DEDENT)) {
          this.advance();
        }
      }
    } else {
      // Parse regular children
      if (this.check(TokenType.INDENT)) {
        this.advance();
        node.children = this.parseElements();
        if (this.check(TokenType.DEDENT)) {
          this.advance();
        }
      }
    }

    // Check for explicit end block
    this.skipNewlines();
    if (this.check(TokenType.END_BLOCK) && this.peek().closingKeyword === componentType) {
      const endToken = this.advance();
      node.end = endToken.end;
    } else {
      node.end = this.previousEnd();
    }

    return node;
  }

  private parseRepeat(): RepeatNode {
    const token = this.advance(); // consume 'Repeat'
    const loc = createLocation();
    const node: RepeatNode = {
      type: 'Repeat',
      count: 1,
      children: [],
      attributes: {},
      modifiers: createModifierSet(),
      start: token.start,
      end: loc,
    };

    // Parse count
    if (this.check(TokenType.NUMBER)) {
      node.count = parseInt(this.advance().value, 10);
    }

    // Parse modifiers
    this.parseElementModifiers(node);

    this.skipNewlines();

    // Parse children
    if (this.check(TokenType.INDENT)) {
      this.advance();
      node.children = this.parseElements();
      if (this.check(TokenType.DEDENT)) {
        this.advance();
      }
    } else {
      // Inline repeat - single element on same line
      const element = this.parseElement();
      if (element) {
        node.children = [element];
      }
    }

    // Check for explicit end block
    this.skipNewlines();
    if (this.check(TokenType.END_BLOCK) && this.peek().closingKeyword === 'Repeat') {
      const endToken = this.advance();
      node.end = endToken.end;
    } else {
      node.end = this.previousEnd();
    }

    return node;
  }

  private parseDataSections(): DataSectionNode[] {
    const sections: DataSectionNode[] = [];

    while (
      this.check(TokenType.DATA) ||
      this.check(TokenType.VALIDATIONS) ||
      this.check(TokenType.CALCULATIONS) ||
      this.check(TokenType.RULES) ||
      this.check(TokenType.FIELDS) ||
      this.check(TokenType.COMPONENT)
    ) {
      this.skipNewlines();
      const section = this.parseDataSection();
      if (section) {
        sections.push(section);
      }
      this.skipNewlines();
    }

    return sections;
  }

  private parseDataSection(): DataSectionNode | null {
    const token = this.advance();
    const loc = createLocation();

    let sectionType: 'data' | 'validations' | 'calculations' | 'rules' | 'fields' | 'component';

    switch (token.type) {
      case TokenType.DATA:
        sectionType = 'data';
        break;
      case TokenType.VALIDATIONS:
        sectionType = 'validations';
        break;
      case TokenType.CALCULATIONS:
        sectionType = 'calculations';
        break;
      case TokenType.RULES:
        sectionType = 'rules';
        break;
      case TokenType.FIELDS:
        sectionType = 'fields';
        break;
      case TokenType.COMPONENT:
        sectionType = 'component';
        break;
      default:
        return null;
    }

    const node: DataSectionNode = {
      type: 'DataSection',
      sectionType,
      rows: [],
      start: token.start,
      end: loc,
    };

    this.skipNewlines();

    // Parse table rows
    if (this.check(TokenType.INDENT)) {
      this.advance();

      while (this.check(TokenType.TABLE_ROW) || this.check(TokenType.TABLE_SEPARATOR)) {
        const rowToken = this.advance();
        node.rows.push(this.parseTableRow(rowToken));
        this.skipNewlines();
      }

      if (this.check(TokenType.DEDENT)) {
        this.advance();
      }
    }

    // Check for explicit end block
    this.skipNewlines();
    if (this.check(TokenType.END_BLOCK)) {
      const endToken = this.advance();
      node.end = endToken.end;
    } else {
      node.end = this.previousEnd();
    }

    return node;
  }

  private parseTableRow(token: Token): TableRowData {
    const isSeparator = token.type === TokenType.TABLE_SEPARATOR;
    const value = token.value.trim();

    // Split by | and clean up
    const cells = value
      .split('|')
      .filter((cell) => cell.trim() !== '')
      .map((cell) => cell.trim());

    return { cells, isSeparator };
  }

  private parseTreeItems(depth: number): TreeItemNode[] {
    const items: TreeItemNode[] = [];

    while (this.check(TokenType.TREE_BRANCH) || this.check(TokenType.TREE_LEAF)) {
      const token = this.advance();
      const item: TreeItemNode = {
        text: token.value,
        isBranch: token.type === TokenType.TREE_BRANCH,
        children: [],
      };

      this.skipNewlines();

      // Check for nested items
      if (this.check(TokenType.INDENT)) {
        this.advance();
        item.children = this.parseTreeItems(depth + 1);
        if (this.check(TokenType.DEDENT)) {
          this.advance();
        }
      }

      items.push(item);
      this.skipNewlines();
    }

    return items;
  }

  private parseElementModifiers(
    node: { attributes: AttributeMap; modifiers: ModifierSet; id?: string; binding?: string; navigation?: string; icon?: string }
  ): void {
    while (!this.isAtEnd() && !this.check(TokenType.NEWLINE) && !this.check(TokenType.INDENT)) {
      const token = this.peek();

      // ID (:identifier)
      if (token.type === TokenType.ID) {
        this.advance();
        const id = token.value.substring(1); // Remove :
        if (this.ids.has(id)) {
          this.addError(`Duplicate ID: ${id}`);
        } else {
          this.ids.add(id);
        }
        node.id = id;
        continue;
      }

      // Binding (?path)
      if (token.type === TokenType.BINDING) {
        this.advance();
        node.binding = token.value.substring(1); // Remove ?
        continue;
      }

      // Navigation (@target)
      if (token.type === TokenType.NAVIGATION) {
        this.advance();
        node.navigation = token.value.substring(1); // Remove @
        continue;
      }

      // Modifiers (primary, secondary, required, etc.)
      if (isModifierToken(token.type)) {
        this.advance();
        switch (token.type) {
          case TokenType.PRIMARY:
            node.modifiers.primary = true;
            break;
          case TokenType.SECONDARY:
            node.modifiers.secondary = true;
            break;
          case TokenType.REQUIRED:
            node.modifiers.required = true;
            break;
          case TokenType.DISABLED:
            node.modifiers.disabled = true;
            break;
          case TokenType.CHECKED:
            node.modifiers.checked = true;
            break;
          case TokenType.SELECTED:
            node.modifiers.selected = true;
            break;
          case TokenType.READONLY:
            node.modifiers.readonly = true;
            break;
          case TokenType.EDITABLE:
            node.modifiers.editable = true;
            break;
          case TokenType.ACTIVE:
            node.modifiers.active = true;
            break;
          case TokenType.EXPANDED:
            node.modifiers.expanded = true;
            break;
          case TokenType.REMOVABLE:
            node.modifiers.removable = true;
            break;
          case TokenType.CIRCLE:
            node.modifiers.circle = true;
            break;
          case TokenType.INDETERMINATE:
            node.modifiers.indeterminate = true;
            break;
          case TokenType.COMPLETED:
            node.modifiers.completed = true;
            break;
          case TokenType.BORDER:
            node.modifiers.border = true;
            break;
        }
        continue;
      }

      // Attributes (name=value)
      if (token.type === TokenType.ATTRIBUTE) {
        this.advance();
        if (token.attributeName && token.attributeValue !== undefined) {
          // Try to convert to number if possible
          const numValue = parseFloat(token.attributeValue);
          if (!isNaN(numValue) && token.attributeValue === String(numValue)) {
            node.attributes[token.attributeName] = numValue;
          } else if (token.attributeValue === 'true') {
            node.attributes[token.attributeName] = true;
          } else if (token.attributeValue === 'false') {
            node.attributes[token.attributeName] = false;
          } else {
            node.attributes[token.attributeName] = token.attributeValue;
          }
        }
        continue;
      }

      // Icon reference ($icon:name or $iconName)
      if (token.type === TokenType.ICON_REF) {
        this.advance();
        // Extract icon name from $icon:name or $iconName format
        let iconValue = token.value.substring(1); // Remove $
        if (iconValue.startsWith('icon:')) {
          iconValue = iconValue.substring(5); // Remove 'icon:'
        }
        node.icon = iconValue;
        continue;
      }

      // String (handled in control-specific parsing)
      if (token.type === TokenType.STRING) {
        break;
      }

      // Number (handled in control-specific parsing)
      if (token.type === TokenType.NUMBER) {
        break;
      }

      // Unknown token on same line - skip
      if (token.type !== TokenType.EOF) {
        break;
      }
    }
  }

  // ============ Utility Methods ============

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private isBlockEnd(): boolean {
    const token = this.peek();
    return (
      token.type === TokenType.END_BLOCK ||
      token.type === TokenType.END_WIREFRAME ||
      token.type === TokenType.DEDENT ||
      token.type === TokenType.DATA ||
      token.type === TokenType.VALIDATIONS ||
      token.type === TokenType.CALCULATIONS ||
      token.type === TokenType.RULES ||
      token.type === TokenType.FIELDS
    );
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: TokenType.EOF, value: '', start: createLocation(), end: createLocation() };
  }

  private previous(): Token {
    return this.tokens[this.current - 1] || this.peek();
  }

  private previousEnd(): SourceLocation {
    return this.previous().end;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private skipNewlines(): void {
    while (this.check(TokenType.NEWLINE)) {
      this.advance();
    }
  }

  private addError(message: string, token?: Token): void {
    this.errors.push({
      message,
      location: token?.start || this.peek().start,
      token,
    });
  }
}

/**
 * Convenience function to parse Wireframe source
 */
export function parse(source: string): ParseResult {
  const parser = new Parser();
  return parser.parse(source);
}
