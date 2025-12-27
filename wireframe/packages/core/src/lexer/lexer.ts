import {
  Token,
  TokenType,
  SourceLocation,
  KEYWORDS,
  CLOSING_KEYWORDS,
} from './tokens.js';

/**
 * Error information from the lexer
 */
export interface LexerError {
  message: string;
  location: SourceLocation;
  source: string;
}

/**
 * Configuration options for the lexer
 */
export interface LexerOptions {
  /** Include comment tokens in output (default: false) */
  includeComments?: boolean;
  /** Tab width for indentation calculation (default: 4) */
  tabWidth?: number;
}

/**
 * Wireframe Lexer
 *
 * Tokenizes Wireframe source code into a stream of tokens.
 * Handles indentation-based structure, comments, and all Wireframe syntax.
 */
export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  private errors: LexerError[] = [];
  private indentStack: number[] = [0];
  private options: LexerOptions;
  private atLineStart: boolean = true;

  constructor(source: string, options: LexerOptions = {}) {
    this.source = source;
    this.options = {
      includeComments: false,
      tabWidth: 4,
      ...options,
    };
  }

  /**
   * Tokenize the source code
   */
  tokenize(): { tokens: Token[]; errors: LexerError[] } {
    this.tokens = [];
    this.errors = [];
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.indentStack = [0];
    this.atLineStart = true;

    while (!this.isAtEnd()) {
      this.scanToken();
    }

    // Emit any remaining DEDENTs
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      this.addToken(TokenType.DEDENT, '');
    }

    this.addToken(TokenType.EOF, '');

    return {
      tokens: this.tokens,
      errors: this.errors,
    };
  }

  /**
   * Get all tokens (convenience method)
   */
  getTokens(): Token[] {
    return this.tokenize().tokens;
  }

  /**
   * Get all errors
   */
  getErrors(): LexerError[] {
    return this.errors;
  }

  // ============ Private Methods ============

  private isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  private peek(offset: number = 0): string {
    const idx = this.pos + offset;
    if (idx >= this.source.length) return '\0';
    return this.source[idx];
  }

  private advance(): string {
    const char = this.source[this.pos];
    this.pos++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private getLocation(): SourceLocation {
    return {
      line: this.line,
      column: this.column,
      offset: this.pos,
    };
  }

  private addToken(type: TokenType, value: string, extra?: Partial<Token>): void {
    const end = this.getLocation();
    const start: SourceLocation = {
      line: end.line,
      column: end.column - value.length,
      offset: end.offset - value.length,
    };

    this.tokens.push({
      type,
      value,
      start,
      end,
      ...extra,
    });
  }

  private addError(message: string): void {
    this.errors.push({
      message,
      location: this.getLocation(),
      source: this.getCurrentLineSource(),
    });
  }

  private getCurrentLineSource(): string {
    let start = this.pos;
    while (start > 0 && this.source[start - 1] !== '\n') {
      start--;
    }
    let end = this.pos;
    while (end < this.source.length && this.source[end] !== '\n') {
      end++;
    }
    return this.source.substring(start, end);
  }

  private skipWhitespace(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === ' ' || char === '\t') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private scanToken(): void {
    // Handle start of line - process indentation
    if (this.atLineStart) {
      this.handleIndentation();
      this.atLineStart = false;
    }

    // Skip non-newline whitespace
    this.skipWhitespace();

    if (this.isAtEnd()) return;

    const char = this.peek();

    // Newline
    if (char === '\n') {
      this.advance();
      this.addToken(TokenType.NEWLINE, '\n');
      this.atLineStart = true;
      return;
    }

    // Carriage return (handle Windows line endings)
    if (char === '\r') {
      this.advance();
      if (this.peek() === '\n') {
        this.advance();
      }
      this.addToken(TokenType.NEWLINE, '\n');
      this.atLineStart = true;
      return;
    }

    // Single-line comment
    if (char === '/' && this.peek(1) === '/') {
      this.scanSingleLineComment();
      return;
    }

    // Multi-line comment
    if (char === '/' && this.peek(1) === '*') {
      this.scanMultiLineComment();
      return;
    }

    // Closing keyword (e.g., /Grid, /uiwire)
    if (char === '/') {
      if (this.scanClosingKeyword()) {
        return;
      }
    }

    // Document attribute (%name: value)
    if (char === '%') {
      this.scanDocAttribute();
      return;
    }

    // ID (:identifier)
    if (char === ':') {
      this.scanId();
      return;
    }

    // Binding (?path)
    if (char === '?') {
      this.scanBinding();
      return;
    }

    // Navigation (@target)
    if (char === '@') {
      this.scanNavigation();
      return;
    }

    // Icon reference ($icon)
    if (char === '$') {
      this.scanIconRef();
      return;
    }

    // String literal
    if (char === '"' || char === "'") {
      this.scanString();
      return;
    }

    // Number
    if (this.isDigit(char) || (char === '-' && this.isDigit(this.peek(1)))) {
      this.scanNumber();
      return;
    }

    // Table row (starts with |)
    if (char === '|') {
      this.scanTableRow();
      return;
    }

    // Tree branch (+) or leaf (-)
    if (char === '+' || char === '-') {
      // Check if it's at the start of content (tree syntax)
      const nextChar = this.peek(1);
      if (nextChar === ' ' || nextChar === '\t') {
        this.scanTreeItem(char);
        return;
      }
    }

    // Identifier or keyword
    if (this.isAlpha(char)) {
      this.scanIdentifierOrKeyword();
      return;
    }

    // Unknown character
    this.addError(`Unexpected character: ${char}`);
    this.advance();
  }

  private handleIndentation(): void {
    let indent = 0;
    const startPos = this.pos;

    // Count indentation
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === ' ') {
        indent++;
        this.advance();
      } else if (char === '\t') {
        indent += this.options.tabWidth!;
        this.advance();
      } else {
        break;
      }
    }

    // Skip empty lines or comment-only lines
    if (this.isAtEnd() || this.peek() === '\n' || this.peek() === '\r') {
      return;
    }

    // Skip comment lines for indentation purposes
    if (this.peek() === '/' && (this.peek(1) === '/' || this.peek(1) === '*')) {
      return;
    }

    const currentIndent = this.indentStack[this.indentStack.length - 1];

    if (indent > currentIndent) {
      this.indentStack.push(indent);
      this.tokens.push({
        type: TokenType.INDENT,
        value: this.source.substring(startPos, this.pos),
        start: { line: this.line, column: 1, offset: startPos },
        end: this.getLocation(),
      });
    } else if (indent < currentIndent) {
      while (
        this.indentStack.length > 1 &&
        this.indentStack[this.indentStack.length - 1] > indent
      ) {
        this.indentStack.pop();
        this.tokens.push({
          type: TokenType.DEDENT,
          value: '',
          start: this.getLocation(),
          end: this.getLocation(),
        });
      }

      // Check for inconsistent indentation
      if (this.indentStack[this.indentStack.length - 1] !== indent) {
        this.addError('Inconsistent indentation');
      }
    }
  }

  private scanSingleLineComment(): void {
    const start = this.getLocation();
    this.advance(); // /
    this.advance(); // /

    let value = '//';
    while (!this.isAtEnd() && this.peek() !== '\n') {
      value += this.advance();
    }

    if (this.options.includeComments) {
      this.tokens.push({
        type: TokenType.COMMENT,
        value,
        start,
        end: this.getLocation(),
      });
    }
  }

  private scanMultiLineComment(): void {
    const start = this.getLocation();
    this.advance(); // /
    this.advance(); // *

    let value = '/*';
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peek(1) === '/') {
        value += this.advance(); // *
        value += this.advance(); // /
        break;
      }
      value += this.advance();
    }

    if (this.options.includeComments) {
      this.tokens.push({
        type: TokenType.MULTILINE_COMMENT,
        value,
        start,
        end: this.getLocation(),
      });
    }
  }

  private scanClosingKeyword(): boolean {
    // Save position to restore if not a closing keyword
    const savedPos = this.pos;
    const savedLine = this.line;
    const savedColumn = this.column;

    this.advance(); // consume /

    // Check for valid keyword after /
    if (!this.isAlpha(this.peek())) {
      // Restore position - not a closing keyword
      this.pos = savedPos;
      this.line = savedLine;
      this.column = savedColumn;
      return false;
    }

    let keyword = '/';
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      keyword += this.advance();
    }

    const tokenType = CLOSING_KEYWORDS[keyword];
    if (tokenType) {
      this.addToken(tokenType, keyword, {
        closingKeyword: keyword.substring(1),
      });
      return true;
    }

    // Unknown closing keyword - emit as error token
    this.addToken(TokenType.END_BLOCK, keyword, {
      closingKeyword: keyword.substring(1),
    });
    return true;
  }

  private scanDocAttribute(): void {
    const start = this.getLocation();
    this.advance(); // %

    let name = '';
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      name += this.advance();
    }

    // Skip colon and whitespace
    if (this.peek() === ':') {
      this.advance();
    }
    this.skipWhitespace();

    // Read value until end of line
    let value = '';
    while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
      value += this.advance();
    }

    this.tokens.push({
      type: TokenType.DOC_ATTRIBUTE,
      value: `%${name}: ${value.trim()}`,
      start,
      end: this.getLocation(),
      attributeName: name,
      attributeValue: value.trim(),
    });
  }

  private scanId(): void {
    const start = this.getLocation();
    this.advance(); // :

    let value = ':';
    while (!this.isAtEnd() && (this.isAlphaNumeric(this.peek()) || this.peek() === '_')) {
      value += this.advance();
    }

    this.tokens.push({
      type: TokenType.ID,
      value,
      start,
      end: this.getLocation(),
    });
  }

  private scanBinding(): void {
    const start = this.getLocation();
    this.advance(); // ?

    let value = '?';
    while (
      !this.isAtEnd() &&
      (this.isAlphaNumeric(this.peek()) || this.peek() === '.' || this.peek() === '_')
    ) {
      value += this.advance();
    }

    this.tokens.push({
      type: TokenType.BINDING,
      value,
      start,
      end: this.getLocation(),
    });
  }

  private scanNavigation(): void {
    const start = this.getLocation();
    this.advance(); // @

    let value = '@';
    // Handle special navigation targets like @:back, @:modal:File
    while (
      !this.isAtEnd() &&
      (this.isAlphaNumeric(this.peek()) || this.peek() === ':' || this.peek() === '_')
    ) {
      value += this.advance();
    }

    this.tokens.push({
      type: TokenType.NAVIGATION,
      value,
      start,
      end: this.getLocation(),
    });
  }

  private scanIconRef(): void {
    const start = this.getLocation();
    this.advance(); // $

    let value = '$';
    while (!this.isAtEnd() && (this.isAlphaNumeric(this.peek()) || this.peek() === '_')) {
      value += this.advance();
    }

    this.tokens.push({
      type: TokenType.ICON_REF,
      value,
      start,
      end: this.getLocation(),
    });
  }

  private scanString(): void {
    const start = this.getLocation();
    const quote = this.advance(); // " or '
    let value = '';

    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance();
        const escaped = this.advance();
        switch (escaped) {
          case 'n':
            value += '\n';
            break;
          case 't':
            value += '\t';
            break;
          case 'r':
            value += '\r';
            break;
          case '\\':
            value += '\\';
            break;
          case '"':
            value += '"';
            break;
          case "'":
            value += "'";
            break;
          default:
            value += escaped;
        }
      } else if (this.peek() === '\n') {
        this.addError('Unterminated string literal');
        break;
      } else {
        value += this.advance();
      }
    }

    if (this.peek() === quote) {
      this.advance(); // closing quote
    } else {
      this.addError('Unterminated string literal');
    }

    this.tokens.push({
      type: TokenType.STRING,
      value,
      start,
      end: this.getLocation(),
    });
  }

  private scanNumber(): void {
    const start = this.getLocation();
    let value = '';

    // Handle negative sign
    if (this.peek() === '-') {
      value += this.advance();
    }

    // Integer part
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      value += this.advance();
    }

    // Decimal part
    if (this.peek() === '.' && this.isDigit(this.peek(1))) {
      value += this.advance(); // .
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        value += this.advance();
      }
    }

    // Check for percentage
    if (this.peek() === '%') {
      value += this.advance();
    }

    this.tokens.push({
      type: TokenType.NUMBER,
      value,
      start,
      end: this.getLocation(),
    });
  }

  private scanTableRow(): void {
    const start = this.getLocation();
    let value = '';

    // Check if this is a separator row (|---|---|)
    let isSeparator = true;
    let tempPos = this.pos;
    while (tempPos < this.source.length && this.source[tempPos] !== '\n') {
      const c = this.source[tempPos];
      if (c !== '|' && c !== '-' && c !== ' ' && c !== '\t' && c !== ':') {
        isSeparator = false;
        break;
      }
      tempPos++;
    }

    // Read the entire row
    while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
      value += this.advance();
    }

    this.tokens.push({
      type: isSeparator ? TokenType.TABLE_SEPARATOR : TokenType.TABLE_ROW,
      value,
      start,
      end: this.getLocation(),
    });
  }

  private scanTreeItem(marker: string): void {
    const start = this.getLocation();
    this.advance(); // + or -
    this.skipWhitespace();

    let text = '';
    while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
      text += this.advance();
    }

    this.tokens.push({
      type: marker === '+' ? TokenType.TREE_BRANCH : TokenType.TREE_LEAF,
      value: text.trim(),
      start,
      end: this.getLocation(),
    });
  }

  private scanIdentifierOrKeyword(): void {
    const start = this.getLocation();
    let value = '';

    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }

    // Check for attribute syntax (name=value)
    if (this.peek() === '=') {
      this.advance(); // =
      const attrName = value;
      let attrValue = '';

      // Value can be quoted or unquoted
      if (this.peek() === '"' || this.peek() === "'") {
        const quote = this.advance();
        while (!this.isAtEnd() && this.peek() !== quote && this.peek() !== '\n') {
          if (this.peek() === '\\') {
            this.advance();
            attrValue += this.advance();
          } else {
            attrValue += this.advance();
          }
        }
        if (this.peek() === quote) {
          this.advance();
        }
      } else {
        // Unquoted value - read until whitespace
        while (
          !this.isAtEnd() &&
          !this.isWhitespace(this.peek()) &&
          this.peek() !== '\n' &&
          this.peek() !== '\r'
        ) {
          attrValue += this.advance();
        }
      }

      this.tokens.push({
        type: TokenType.ATTRIBUTE,
        value: `${attrName}=${attrValue}`,
        start,
        end: this.getLocation(),
        attributeName: attrName,
        attributeValue: attrValue,
      });
      return;
    }

    // Check if it's a keyword
    const tokenType = KEYWORDS[value];
    if (tokenType) {
      this.tokens.push({
        type: tokenType,
        value,
        start,
        end: this.getLocation(),
      });
    } else {
      this.tokens.push({
        type: TokenType.IDENTIFIER,
        value,
        start,
        end: this.getLocation(),
      });
    }
  }

  // ============ Character Classification ============

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }
}
