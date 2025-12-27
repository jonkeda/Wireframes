# Wireframe Parser Specification

## Document Information
- **Version:** 1.0
- **Date:** 2025
- **Status:** Draft
- **Parent:** [20_Architecture_Overview](./20_Architecture_Overview.md)

---

## 1. Overview

This document specifies the Wireframe parser, including the lexer, grammar, AST structure, and error handling.

---

## 2. Lexer Specification

### 2.1 Token Types

```typescript
enum TokenType {
    // Structure
    KEYWORD,            // Button, Label, Vertical, etc.
    CLOSE_KEYWORD,      // /Vertical, /Grid, etc.
    
    // Literals
    STRING,             // "quoted text"
    NUMBER,             // 123, 45.67
    BOOLEAN,            // true, false
    
    // Identifiers
    ID,                 // :btnSave, :txtName
    BINDING,            // .user.name
    ICON,               // $save, $home
    NAVIGATION,         // @Dashboard, @:back
    
    // Attributes
    ATTRIBUTE_NAME,     // gap, width, required
    EQUALS,             // =
    
    // Punctuation
    OPEN_PAREN,         // (
    CLOSE_PAREN,        // )
    PIPE,               // |
    
    // Layout
    INDENT,             // Indentation increase
    DEDENT,             // Indentation decrease
    NEWLINE,            // Line break
    
    // Comments
    LINE_COMMENT,       // // comment
    BLOCK_COMMENT,      // /* comment */
    
    // Special
    SEPARATOR,          // Separator keyword
    SPACER,             // Spacer keyword
    
    // Markers
    DOCUMENT_START,     // uiwire
    DOCUMENT_END,       // /uiwire
    METADATA,           // %name: value
    
    // Control
    EOF,                // End of file
    ERROR               // Lexer error token
}
```

### 2.2 Token Structure

```typescript
interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
    length: number;
    raw.: string;           // Original text
}

interface SourceLocation {
    start: Position;
    end: Position;
}

interface Position {
    line: number;
    column: number;
    offset: number;
}
```

### 2.3 Lexer Implementation

```typescript
// src/lexer/lexer.ts

export class Lexer {
    private input: string = '';
    private pos: number = 0;
    private line: number = 1;
    private column: number = 1;
    private tokens: Token[] = [];
    private indentStack: number[] = [0];

    tokenize(input: string): Token[] {
        this.input = input;
        this.pos = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
        this.indentStack = [0];

        while (!this.isAtEnd()) {
            this.scanToken();
        }

        // Emit remaining DEDENTs
        while (this.indentStack.length > 1) {
            this.indentStack.pop();
            this.addToken(TokenType.DEDENT, '');
        }

        this.addToken(TokenType.EOF, '');
        return this.tokens;
    }

    private scanToken(): void {
        // Handle newlines and indentation
        if (this.isAtLineStart()) {
            this.handleIndentation();
            return;
        }

        // Skip whitespace (not at line start)
        this.skipWhitespace();
        if (this.isAtEnd()) return;

        const char = this.peek();

        // Comments
        if (char === '/' && this.peekNext() === '/') {
            this.scanLineComment();
            return;
        }
        if (char === '/' && this.peekNext() === '*') {
            this.scanBlockComment();
            return;
        }

        // String literals
        if (char === '"') {
            this.scanString();
            return;
        }

        // Numbers
        if (this.isDigit(char)) {
            this.scanNumber();
            return;
        }

        // Identifiers and keywords
        if (this.isAlpha(char)) {
            this.scanIdentifier();
            return;
        }

        // Special prefixes
        if (char === ':') {
            this.scanId();
            return;
        }
        if (char === '.') {
            this.scanBinding();
            return;
        }
        if (char === '$') {
            this.scanIcon();
            return;
        }
        if (char === '@') {
            this.scanNavigation();
            return;
        }
        if (char === '%') {
            this.scanMetadata();
            return;
        }

        // Operators and punctuation
        switch (char) {
            case '=':
                this.addToken(TokenType.EQUALS, this.advance());
                break;
            case '|':
                this.addToken(TokenType.PIPE, this.advance());
                break;
            case '(':
                this.addToken(TokenType.OPEN_PAREN, this.advance());
                break;
            case ')':
                this.addToken(TokenType.CLOSE_PAREN, this.advance());
                break;
            case '\n':
                this.addToken(TokenType.NEWLINE, this.advance());
                this.line++;
                this.column = 1;
                break;
            default:
                this.addToken(TokenType.ERROR, this.advance());
        }
    }

    private handleIndentation(): void {
        let indent = 0;
        while (this.peek() === ' ') {
            indent++;
            this.advance();
        }
        while (this.peek() === '\t') {
            indent += 4; // Treat tab as 4 spaces
            this.advance();
        }

        // Skip blank lines
        if (this.peek() === '\n' || this.peek() === '\r') {
            return;
        }

        // Skip comment-only lines for indentation
        if (this.peek() === '/' && (this.peekNext() === '/' || this.peekNext() === '*')) {
            return;
        }

        const currentIndent = this.indentStack[this.indentStack.length - 1];

        if (indent > currentIndent) {
            this.indentStack.push(indent);
            this.addToken(TokenType.INDENT, '');
        } else if (indent < currentIndent) {
            while (this.indentStack.length > 1 && 
                   this.indentStack[this.indentStack.length - 1] > indent) {
                this.indentStack.pop();
                this.addToken(TokenType.DEDENT, '');
            }
        }
    }

    private scanString(): void {
        this.advance(); // Opening quote
        const start = this.pos;

        while (!this.isAtEnd() && this.peek() !== '"') {
            if (this.peek() === '\\') {
                this.advance(); // Skip escape char
            }
            if (this.peek() === '\n') {
                this.line++;
                this.column = 1;
            }
            this.advance();
        }

        const value = this.input.substring(start, this.pos);
        this.advance(); // Closing quote
        
        this.addToken(TokenType.STRING, value);
    }

    private scanIdentifier(): void {
        const start = this.pos;

        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }

        const value = this.input.substring(start, this.pos);
        const type = this.getKeywordType(value);
        
        this.addToken(type, value);
    }

    private getKeywordType(value: string): TokenType {
        const keywords: Record<string, TokenType> = {
            // Document
            'uiwire': TokenType.DOCUMENT_START,
            
            // Layouts
            'Grid': TokenType.KEYWORD,
            'Vertical': TokenType.KEYWORD,
            'Horizontal': TokenType.KEYWORD,
            'Dock': TokenType.KEYWORD,
            'Canvas': TokenType.KEYWORD,
            'Scroll': TokenType.KEYWORD,
            
            // Sections
            'Header': TokenType.KEYWORD,
            'Footer': TokenType.KEYWORD,
            'Sidebar': TokenType.KEYWORD,
            'Content': TokenType.KEYWORD,
            'Panel': TokenType.KEYWORD,
            'Card': TokenType.KEYWORD,
            
            // Controls
            'Button': TokenType.KEYWORD,
            'IconButton': TokenType.KEYWORD,
            'TextInput': TokenType.KEYWORD,
            'NumberInput': TokenType.KEYWORD,
            'DateInput': TokenType.KEYWORD,
            'PasswordInput': TokenType.KEYWORD,
            'TextArea': TokenType.KEYWORD,
            'Label': TokenType.KEYWORD,
            'Checkbox': TokenType.KEYWORD,
            'Radio': TokenType.KEYWORD,
            'Dropdown': TokenType.KEYWORD,
            'Option': TokenType.KEYWORD,
            'Separator': TokenType.KEYWORD,
            'Spacer': TokenType.KEYWORD,
            
            // Components
            'Tabs': TokenType.KEYWORD,
            'Tab': TokenType.KEYWORD,
            'Accordion': TokenType.KEYWORD,
            'AccordionSection': TokenType.KEYWORD,
            'Menu': TokenType.KEYWORD,
            'MenuItem': TokenType.KEYWORD,
            // ... more keywords
            
            // Modifiers
            'primary': TokenType.ATTRIBUTE_NAME,
            'secondary': TokenType.ATTRIBUTE_NAME,
            'required': TokenType.ATTRIBUTE_NAME,
            'disabled': TokenType.ATTRIBUTE_NAME,
            'checked': TokenType.ATTRIBUTE_NAME,
            'selected': TokenType.ATTRIBUTE_NAME,
            
            // Boolean
            'true': TokenType.BOOLEAN,
            'false': TokenType.BOOLEAN,
        };

        // Check for close keywords
        if (value.startsWith('/')) {
            const keyword = value.substring(1);
            if (keywords[keyword] === TokenType.KEYWORD) {
                return TokenType.CLOSE_KEYWORD;
            }
        }

        return keywords[value] || TokenType.ATTRIBUTE_NAME;
    }

    // ... helper methods
}
```

---

## 3. Grammar Specification

### 3.1 EBNF Grammar

```ebnf
(* Document Structure *)
document        = "uiwire" style NEWLINE
                  metadata*
                  content
                  "/uiwire" ;

style           = "sketch" | "clean" | "blueprint" | "realistic" ;

metadata        = "%" identifier ":" value NEWLINE ;

content         = (element | comment)* ;

(* Elements *)
element         = layout
                | section
                | control
                | component
                | data_section ;

(* Layouts *)
layout          = layout_keyword attributes. NEWLINE
                  INDENT content DEDENT
                  close_keyword ;

layout_keyword  = "Grid" | "Vertical" | "Horizontal" 
                | "Dock" | "Canvas" | "Scroll" ;

(* Sections *)
section         = section_keyword attributes. NEWLINE
                  INDENT content DEDENT
                  close_keyword ;

section_keyword = "Header" | "Footer" | "Sidebar" | "Content"
                | "Panel" | "Card" | "Toolbar" | "Modal" | "Drawer" ;

(* Controls *)
control         = button
                | input
                | label
                | checkbox
                | radio
                | dropdown
                | separator
                | spacer ;

button          = "Button" STRING modifiers. id. navigation. attributes. ;
icon_button     = "IconButton" ICON STRING. modifiers. id. navigation. attributes. ;

input           = input_type STRING id. modifiers. binding. attributes. ;
input_type      = "TextInput" | "NumberInput" | "DateInput" 
                | "PasswordInput" | "TextArea" ;

label           = "Label" STRING id. navigation. attributes. ;

checkbox        = "Checkbox" STRING id. modifiers. binding. attributes. ;
radio           = "Radio" STRING id. modifiers. attributes. ;

dropdown        = "Dropdown" id. binding. NEWLINE
                  INDENT option+ DEDENT
                  "/Dropdown" ;
option          = "Option" STRING ;

separator       = "Separator" ;
spacer          = "Spacer" ;

(* Components *)
component       = tabs | accordion | menu | stepper | alert
                | datagrid | table | repeat | hover | dialog ;

tabs            = "Tabs" id. NEWLINE
                  INDENT tab+ DEDENT
                  "/Tabs" ;
tab             = "Tab" STRING NEWLINE
                  INDENT content DEDENT
                  "/Tab" ;

(* ... more component definitions *)

(* Attributes *)
attributes      = attribute+ ;
attribute       = attribute_name "=" attribute_value
                | modifier ;
attribute_name  = identifier ;
attribute_value = STRING | NUMBER | BOOLEAN | identifier ;
modifier        = "primary" | "secondary" | "required" 
                | "disabled" | "checked" | "selected" ;

(* Identifiers *)
id              = ":" identifier ;
binding         = "." dotted_identifier ;
navigation      = "@" navigation_target ;
navigation_target = identifier | ":back" | ":close" | ":modal:" identifier ;

(* Data Sections *)
data_section    = data_definition
                | validations
                | calculations
                | rules
                | fields ;

data_definition = "data" NEWLINE table_content "/data" ;
validations     = "validations" NEWLINE table_content "/validations" ;
calculations    = "calculations" NEWLINE table_content "/calculations" ;
rules           = "rules" NEWLINE table_content "/rules" ;
fields          = "fields" NEWLINE table_content "/fields" ;

table_content   = table_header table_separator table_row* ;
table_header    = "|" (cell "|")+ NEWLINE ;
table_separator = "|" ("-"+ "|")+ NEWLINE ;
table_row       = "|" (cell "|")+ NEWLINE ;
cell            = [^|]* ;

(* Comments *)
comment         = line_comment | block_comment ;
line_comment    = "//" [^\n]* NEWLINE ;
block_comment   = "/*" .* "*/" ;

(* Primitives *)
identifier      = letter (letter | digit | "_")* ;
dotted_identifier = identifier ("." identifier)* ;
STRING          = '"' [^"]* '"' ;
NUMBER          = digit+ ("." digit+). ;
BOOLEAN         = "true" | "false" ;
ICON            = "$" identifier ;
letter          = [a-zA-Z] ;
digit           = [0-9] ;
```

---

## 4. Abstract Syntax Tree (AST)

### 4.1 Node Types

```typescript
// src/ast/types.ts

// Base node
interface ASTNode {
    type: string;
    location: SourceLocation;
}

// Document root
interface Document extends ASTNode {
    type: 'Document';
    style: 'sketch' | 'clean' | 'blueprint' | 'realistic';
    metadata: Metadata[];
    body: Element[];
    dataSections: DataSection[];
}

interface Metadata extends ASTNode {
    type: 'Metadata';
    name: string;
    value: string;
}

// Elements
type Element = Layout | Section | Control | Component;

// Layouts
interface Layout extends ASTNode {
    type: 'Layout';
    layoutType: LayoutType;
    attributes: Attributes;
    children: Element[];
}

type LayoutType = 'Grid' | 'Vertical' | 'Horizontal' | 'Dock' | 'Canvas' | 'Scroll';

// Sections
interface Section extends ASTNode {
    type: 'Section';
    sectionType: SectionType;
    attributes: Attributes;
    children: Element[];
}

type SectionType = 'Header' | 'Footer' | 'Sidebar' | 'Content' | 
                   'Panel' | 'Card' | 'Toolbar' | 'Modal' | 'Drawer';

// Controls
interface Control extends ASTNode {
    type: 'Control';
    controlType: ControlType;
    text.: string;
    id.: string;
    binding.: string;
    navigation.: Navigation;
    icon.: string;
    modifiers: Modifier[];
    attributes: Attributes;
    children.: Element[];  // For Dropdown
}

type ControlType = 'Button' | 'IconButton' | 'TextInput' | 'NumberInput' |
                   'DateInput' | 'PasswordInput' | 'TextArea' | 'Label' |
                   'Checkbox' | 'Radio' | 'Dropdown' | 'Option' |
                   'Separator' | 'Spacer' | 'Icon' | 'Image';

type Modifier = 'primary' | 'secondary' | 'required' | 'disabled' | 
                'checked' | 'selected';

// Components
interface Component extends ASTNode {
    type: 'Component';
    componentType: ComponentType;
    attributes: Attributes;
    children: Element[];
}

type ComponentType = 'Tabs' | 'Tab' | 'Accordion' | 'AccordionSection' |
                     'Menu' | 'MenuItem' | 'Stepper' | 'Step' |
                     'Table' | 'DataGrid' | 'Column' | 'Alert' |
                     'Dialog' | 'Toast' | 'Hover' | 'Repeat' |
                     'Breadcrumb' | 'BreadcrumbItem' | 'Pagination' |
                     'Avatar' | 'Progress' | 'Slider' | 'Switch' | 'Chip';

// Navigation
interface Navigation {
    target: string;
    type: 'page' | 'back' | 'close' | 'modal' | 'drawer';
}

// Attributes
interface Attributes {
    [key: string]: string | number | boolean;
}

// Data Sections
interface DataSection extends ASTNode {
    type: 'DataSection';
    sectionType: 'data' | 'validations' | 'calculations' | 'rules' | 'fields';
    rows: TableRow[];
}

interface TableRow {
    cells: string[];
}
```

### 4.2 AST Builder

```typescript
// src/ast/builder.ts

export class ASTBuilder {
    createDocument(
        style: string,
        metadata: Metadata[],
        body: Element[],
        dataSections: DataSection[],
        location: SourceLocation
    ): Document {
        return {
            type: 'Document',
            style: style as Document['style'],
            metadata,
            body,
            dataSections,
            location
        };
    }

    createLayout(
        layoutType: LayoutType,
        attributes: Attributes,
        children: Element[],
        location: SourceLocation
    ): Layout {
        return {
            type: 'Layout',
            layoutType,
            attributes,
            children,
            location
        };
    }

    createControl(
        controlType: ControlType,
        options: {
            text.: string;
            id.: string;
            binding.: string;
            navigation.: Navigation;
            icon.: string;
            modifiers.: Modifier[];
            attributes.: Attributes;
            children.: Element[];
        },
        location: SourceLocation
    ): Control {
        return {
            type: 'Control',
            controlType,
            text: options.text,
            id: options.id,
            binding: options.binding,
            navigation: options.navigation,
            icon: options.icon,
            modifiers: options.modifiers || [],
            attributes: options.attributes || {},
            children: options.children,
            location
        };
    }

    // ... more builders
}
```

---

## 5. Parser Implementation

### 5.1 Recursive Descent Parser

```typescript
// src/parser/parser.ts

export class Parser {
    private tokens: Token[] = [];
    private current: number = 0;
    private builder: ASTBuilder;

    constructor() {
        this.builder = new ASTBuilder();
    }

    parse(tokens: Token[]): Document {
        this.tokens = tokens;
        this.current = 0;
        return this.parseDocument();
    }

    private parseDocument(): Document {
        const startLocation = this.currentLocation();

        // Parse "uiwire style"
        this.expect(TokenType.DOCUMENT_START, 'Expected "uiwire"');
        const styleToken = this.expect(TokenType.ATTRIBUTE_NAME, 'Expected style');
        const style = styleToken.value;

        this.expectNewline();

        // Parse metadata
        const metadata: Metadata[] = [];
        while (this.check(TokenType.METADATA)) {
            metadata.push(this.parseMetadata());
        }

        // Parse body
        const body: Element[] = [];
        const dataSections: DataSection[] = [];

        while (!this.check(TokenType.DOCUMENT_END) && !this.isAtEnd()) {
            if (this.isDataSection()) {
                dataSections.push(this.parseDataSection());
            } else {
                const element = this.parseElement();
                if (element) {
                    body.push(element);
                }
            }
        }

        // Parse "/uiwire"
        this.expect(TokenType.CLOSE_KEYWORD, 'Expected "/uiwire"');

        return this.builder.createDocument(
            style,
            metadata,
            body,
            dataSections,
            this.locationFrom(startLocation)
        );
    }

    private parseElement(): Element | null {
        // Skip comments
        if (this.check(TokenType.LINE_COMMENT) || this.check(TokenType.BLOCK_COMMENT)) {
            this.advance();
            return null;
        }

        const token = this.peek();

        // Layouts
        if (this.isLayout(token.value)) {
            return this.parseLayout();
        }

        // Sections
        if (this.isSection(token.value)) {
            return this.parseSection();
        }

        // Controls
        if (this.isControl(token.value)) {
            return this.parseControl();
        }

        // Components
        if (this.isComponent(token.value)) {
            return this.parseComponent();
        }

        throw this.error(`Unexpected token: ${token.value}`);
    }

    private parseLayout(): Layout {
        const startLocation = this.currentLocation();
        const layoutType = this.advance().value as LayoutType;
        const attributes = this.parseAttributes();

        this.expectNewline();
        this.expect(TokenType.INDENT, 'Expected indented block');

        const children: Element[] = [];
        while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
            const element = this.parseElement();
            if (element) {
                children.push(element);
            }
        }

        this.expect(TokenType.DEDENT, 'Expected dedent');
        this.expectCloseKeyword(layoutType);

        return this.builder.createLayout(
            layoutType,
            attributes,
            children,
            this.locationFrom(startLocation)
        );
    }

    private parseControl(): Control {
        const startLocation = this.currentLocation();
        const controlType = this.advance().value as ControlType;

        let text: string | undefined;
        let icon: string | undefined;
        let id: string | undefined;
        let binding: string | undefined;
        let navigation: Navigation | undefined;
        const modifiers: Modifier[] = [];
        const attributes: Attributes = {};

        // IconButton: $icon "text".
        if (controlType === 'IconButton') {
            icon = this.expect(TokenType.ICON, 'Expected icon').value;
            if (this.check(TokenType.STRING)) {
                text = this.advance().value;
            }
        }
        // Other controls: "text"
        else if (this.check(TokenType.STRING)) {
            text = this.advance().value;
        }

        // Parse remaining parts in any order
        while (true) {
            if (this.check(TokenType.ID)) {
                id = this.advance().value.substring(1); // Remove ':'
            } else if (this.check(TokenType.BINDING)) {
                binding = this.advance().value.substring(1); // Remove '.'
            } else if (this.check(TokenType.NAVIGATION)) {
                navigation = this.parseNavigation();
            } else if (this.isModifier(this.peek().value)) {
                modifiers.push(this.advance().value as Modifier);
            } else if (this.check(TokenType.ATTRIBUTE_NAME) && this.checkNext(TokenType.EQUALS)) {
                const name = this.advance().value;
                this.advance(); // =
                const value = this.parseAttributeValue();
                attributes[name] = value;
            } else {
                break;
            }
        }

        // Handle Dropdown children
        let children: Element[] | undefined;
        if (controlType === 'Dropdown' && this.checkNewlineAndIndent()) {
            this.advance(); // NEWLINE
            this.advance(); // INDENT
            children = [];
            while (!this.check(TokenType.DEDENT)) {
                children.push(this.parseControl());
            }
            this.advance(); // DEDENT
            this.expectCloseKeyword('Dropdown');
        }

        return this.builder.createControl(
            controlType,
            { text, icon, id, binding, navigation, modifiers, attributes, children },
            this.locationFrom(startLocation)
        );
    }

    private parseAttributes(): Attributes {
        const attributes: Attributes = {};

        while (this.check(TokenType.ATTRIBUTE_NAME) && 
               (this.checkNext(TokenType.EQUALS) || this.isModifier(this.peek().value))) {
            
            if (this.isModifier(this.peek().value)) {
                // Boolean modifier
                const name = this.advance().value;
                attributes[name] = true;
            } else {
                // key=value
                const name = this.advance().value;
                this.advance(); // =
                attributes[name] = this.parseAttributeValue();
            }
        }

        return attributes;
    }

    private parseAttributeValue(): string | number | boolean {
        const token = this.advance();
        
        switch (token.type) {
            case TokenType.STRING:
                return token.value;
            case TokenType.NUMBER:
                return parseFloat(token.value);
            case TokenType.BOOLEAN:
                return token.value === 'true';
            default:
                return token.value;
        }
    }

    private parseNavigation(): Navigation {
        const token = this.advance();
        const value = token.value.substring(1); // Remove '@'

        if (value === ':back') {
            return { target: '', type: 'back' };
        }
        if (value === ':close') {
            return { target: '', type: 'close' };
        }
        if (value.startsWith(':modal:')) {
            return { target: value.substring(7), type: 'modal' };
        }
        if (value.startsWith(':drawer:')) {
            return { target: value.substring(8), type: 'drawer' };
        }

        return { target: value, type: 'page' };
    }

    // ... helper methods
}
```

---

## 6. Validation

### 6.1 Semantic Validation

```typescript
// src/parser/validator.ts

export class Validator {
    private errors: ValidationError[] = [];
    private ids: Set<string> = new Set();

    validate(document: Document): ValidationError[] {
        this.errors = [];
        this.ids.clear();

        this.validateDocument(document);
        return this.errors;
    }

    private validateDocument(doc: Document): void {
        // Validate style
        const validStyles = ['sketch', 'clean', 'blueprint', 'realistic'];
        if (!validStyles.includes(doc.style)) {
            this.addError(`Invalid style: ${doc.style}`, doc.location);
        }

        // Validate body
        doc.body.forEach(element => this.validateElement(element));

        // Validate data sections
        doc.dataSections.forEach(section => this.validateDataSection(section));
    }

    private validateElement(element: Element): void {
        switch (element.type) {
            case 'Layout':
                this.validateLayout(element);
                break;
            case 'Section':
                this.validateSection(element);
                break;
            case 'Control':
                this.validateControl(element);
                break;
            case 'Component':
                this.validateComponent(element);
                break;
        }
    }

    private validateControl(control: Control): void {
        // Check for duplicate IDs
        if (control.id) {
            if (this.ids.has(control.id)) {
                this.addError(`Duplicate ID: ${control.id}`, control.location);
            }
            this.ids.add(control.id);
        }

        // Validate control-specific rules
        switch (control.controlType) {
            case 'Button':
            case 'Label':
                if (!control.text) {
                    this.addError(`${control.controlType} requires text`, control.location);
                }
                break;

            case 'IconButton':
                if (!control.icon) {
                    this.addError('IconButton requires icon', control.location);
                }
                break;

            case 'Dropdown':
                if (!control.children || control.children.length === 0) {
                    this.addError('Dropdown requires at least one Option', control.location);
                }
                break;
        }

        // Validate modifiers
        if (control.modifiers.includes('primary') && control.modifiers.includes('secondary')) {
            this.addError('Cannot have both primary and secondary', control.location);
        }

        // Validate children
        control.children..forEach(child => this.validateElement(child));
    }

    private addError(message: string, location: SourceLocation): void {
        this.errors.push({
            message,
            location,
            severity: 'error'
        });
    }
}

interface ValidationError {
    message: string;
    location: SourceLocation;
    severity: 'error' | 'warning';
}
```

---

## 7. Error Recovery

### 7.1 Error Recovery Strategies

```typescript
// src/parser/error-recovery.ts

export class ErrorRecovery {
    // Synchronization tokens - safe points to resume parsing
    private static SYNC_TOKENS = [
        TokenType.KEYWORD,
        TokenType.CLOSE_KEYWORD,
        TokenType.DOCUMENT_END,
        TokenType.NEWLINE
    ];

    static synchronize(parser: Parser): void {
        parser.advance();

        while (!parser.isAtEnd()) {
            // After a newline at base indentation, try parsing again
            if (parser.previous().type === TokenType.NEWLINE) {
                const currentIndent = parser.currentIndent();
                if (currentIndent === 0) {
                    return;
                }
            }

            // At a sync token, try parsing again
            if (this.SYNC_TOKENS.includes(parser.peek().type)) {
                return;
            }

            parser.advance();
        }
    }
}
```

### 7.2 Error Messages

```typescript
// src/parser/error-messages.ts

export const ErrorMessages = {
    UNEXPECTED_TOKEN: (token: string) => 
        `Unexpected token: '${token}'`,
    
    EXPECTED_TOKEN: (expected: string, got: string) =>
        `Expected ${expected}, got '${got}'`,
    
    UNCLOSED_BLOCK: (keyword: string) =>
        `Unclosed block: missing '/${keyword}'`,
    
    DUPLICATE_ID: (id: string) =>
        `Duplicate ID: '${id}' is already defined`,
    
    INVALID_ATTRIBUTE: (attr: string, element: string) =>
        `Invalid attribute '${attr}' for ${element}`,
    
    MISSING_REQUIRED: (element: string, attr: string) =>
        `${element} requires ${attr}`,
    
    INVALID_NESTING: (child: string, parent: string) =>
        `${child} cannot be nested inside ${parent}`,
};
```

---

## 8. Performance Optimizations

### 8.1 Token Caching

```typescript
// Reuse token objects for common keywords
const KEYWORD_CACHE = new Map<string, Token>();

function getKeywordToken(value: string, line: number, column: number): Token {
    const key = value;
    let token = KEYWORD_CACHE.get(key);
    if (!token) {
        token = { type: TokenType.KEYWORD, value, line: 0, column: 0, length: value.length };
        KEYWORD_CACHE.set(key, token);
    }
    // Return copy with correct location
    return { ...token, line, column };
}
```

### 8.2 Incremental Parsing

```typescript
// src/parser/incremental.ts

export class IncrementalParser {
    private cache: Map<string, { ast: Element; hash: string }> = new Map();

    parseIncremental(text: string, changes: TextChange[]): Document {
        // For small changes, only reparse affected sections
        if (this.canIncrementalParse(changes)) {
            return this.incrementalParse(text, changes);
        }
        
        // Fall back to full parse
        return this.fullParse(text);
    }

    private canIncrementalParse(changes: TextChange[]): boolean {
        // Can do incremental if changes are within a single block
        return changes.length === 1 && 
               changes[0].rangeLength < 100 &&
               !changes[0].text.includes('\n');
    }
}
```

---

## 9. Testing

### 9.1 Parser Tests

```typescript
// tests/parser.test.ts

describe('Wireframe Parser', () => {
    describe('Document parsing', () => {
        it('should parse minimal document', () => {
            const input = `
uiwire clean
    Button "Click"
/uiwire
            `;
            const ast = parse(input);
            
            expect(ast.type).toBe('Document');
            expect(ast.style).toBe('clean');
            expect(ast.body).toHaveLength(1);
        });

        it('should parse document with metadata', () => {
            const input = `
uiwire sketch
    %title: My Form
    %version: 1.0
    
    Label "Hello"
/uiwire
            `;
            const ast = parse(input);
            
            expect(ast.metadata).toHaveLength(2);
            expect(ast.metadata[0].name).toBe('title');
            expect(ast.metadata[0].value).toBe('My Form');
        });
    });

    describe('Control parsing', () => {
        it('should parse Button with all options', () => {
            const input = `
uiwire clean
    Button "Submit" :btnSubmit primary @Dashboard tooltip="Save"
/uiwire
            `;
            const ast = parse(input);
            const button = ast.body[0] as Control;
            
            expect(button.controlType).toBe('Button');
            expect(button.text).toBe('Submit');
            expect(button.id).toBe('btnSubmit');
            expect(button.modifiers).toContain('primary');
            expect(button.navigation..target).toBe('Dashboard');
            expect(button.attributes.tooltip).toBe('Save');
        });
    });
});
```

---

## 10. Related Documents

| Document | Description |
|----------|-------------|
| [20_Architecture_Overview](./20_Architecture_Overview.md) | System architecture |
| [21_Mermaid_Integration_Design](./21_Mermaid_Integration_Design.md) | Mermaid plugin |
| [23_Renderer_Design](./23_Renderer_Design.md) | Renderer details |
| [06k_Language_Specification_v7](../planning/06k_Language_Specification_v7_Keywords.md) | Language spec |

---

*Wireframe Parser Specification v1.0 - 2025*
