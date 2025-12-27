import { describe, it, expect } from 'vitest';
import { Lexer, TokenType } from './index.js';

describe('Lexer', () => {
  describe('Basic Tokenization', () => {
    it('should tokenize empty input', () => {
      const lexer = new Lexer('');
      const { tokens, errors } = lexer.tokenize();
      expect(errors).toHaveLength(0);
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe(TokenType.EOF);
    });

    it('should tokenize wireframe keyword', () => {
      const lexer = new Lexer('wireframe sketch\n/wireframe');
      const { tokens, errors } = lexer.tokenize();
      expect(errors).toHaveLength(0);
      expect(tokens[0].type).toBe(TokenType.WIREFRAME);
      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1].value).toBe('sketch');
    });

    it('should tokenize document attributes', () => {
      const lexer = new Lexer('%title: My Wireframe\n%version: 1.0');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.DOC_ATTRIBUTE);
      expect(tokens[0].attributeName).toBe('title');
      expect(tokens[0].attributeValue).toBe('My Wireframe');

      expect(tokens[2].type).toBe(TokenType.DOC_ATTRIBUTE);
      expect(tokens[2].attributeName).toBe('version');
      expect(tokens[2].attributeValue).toBe('1.0');
    });
  });

  describe('Control Keywords', () => {
    it('should tokenize Button keyword', () => {
      const lexer = new Lexer('Button "Click me"');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.BUTTON);
      expect(tokens[1].type).toBe(TokenType.STRING);
      expect(tokens[1].value).toBe('Click me');
    });

    it('should tokenize IconButton keyword', () => {
      const lexer = new Lexer('IconButton $save "Save"');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.ICON_BUTTON);
      expect(tokens[1].type).toBe(TokenType.ICON_REF);
      expect(tokens[1].value).toBe('$save');
      expect(tokens[2].type).toBe(TokenType.STRING);
    });

    it('should tokenize input controls', () => {
      const lexer = new Lexer('TextInput "placeholder" :txtId\nNumberInput "0" :numId\nDateInput "date" :dateId');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.TEXT_INPUT);
      // Find the ID token
      const idToken = tokens.find(t => t.type === TokenType.ID && t.value === ':txtId');
      expect(idToken).toBeDefined();
      expect(idToken?.value).toBe(':txtId');
    });

    it('should tokenize Label keyword', () => {
      const lexer = new Lexer('Label "Hello World"');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.LABEL);
      expect(tokens[1].type).toBe(TokenType.STRING);
      expect(tokens[1].value).toBe('Hello World');
    });

    it('should tokenize Checkbox keyword', () => {
      const lexer = new Lexer('Checkbox "Accept terms" :chkTerms checked');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.CHECKBOX);
      expect(tokens[1].type).toBe(TokenType.STRING);
      expect(tokens[2].type).toBe(TokenType.ID);
      expect(tokens[3].type).toBe(TokenType.CHECKED);
    });

    it('should tokenize Radio keyword', () => {
      const lexer = new Lexer('Radio "Option A" :radA selected');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.RADIO);
      expect(tokens[3].type).toBe(TokenType.SELECTED);
    });

    it('should tokenize Dropdown keyword', () => {
      const lexer = new Lexer('Dropdown :ddlCountry');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.DROPDOWN);
      expect(tokens[1].type).toBe(TokenType.ID);
    });

    it('should tokenize Separator and Spacer', () => {
      const lexer = new Lexer('Separator\nSpacer');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.SEPARATOR);
      expect(tokens[2].type).toBe(TokenType.SPACER);
    });
  });

  describe('Layout Keywords', () => {
    it('should tokenize Grid keyword', () => {
      const lexer = new Lexer('Grid rows=3 cols=2 gap=16');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.GRID);
      expect(tokens[1].type).toBe(TokenType.ATTRIBUTE);
      expect(tokens[1].attributeName).toBe('rows');
      expect(tokens[1].attributeValue).toBe('3');
    });

    it('should tokenize Vertical keyword', () => {
      const lexer = new Lexer('Vertical gap=8 align=center');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.VERTICAL);
      expect(tokens[1].type).toBe(TokenType.ATTRIBUTE);
      expect(tokens[2].type).toBe(TokenType.ATTRIBUTE);
      expect(tokens[2].attributeName).toBe('align');
      expect(tokens[2].attributeValue).toBe('center');
    });

    it('should tokenize Horizontal keyword', () => {
      const lexer = new Lexer('Horizontal justify=end');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.HORIZONTAL);
      expect(tokens[1].type).toBe(TokenType.ATTRIBUTE);
      expect(tokens[1].attributeName).toBe('justify');
    });

    it('should tokenize Dock keyword', () => {
      const lexer = new Lexer('Dock');
      const { tokens } = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.DOCK);
    });

    it('should tokenize Canvas keyword', () => {
      const lexer = new Lexer('Canvas');
      const { tokens } = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.CANVAS);
    });

    it('should tokenize Scroll keyword', () => {
      const lexer = new Lexer('Scroll');
      const { tokens } = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.SCROLL);
    });
  });

  describe('Section Keywords', () => {
    it('should tokenize Header keyword', () => {
      const lexer = new Lexer('Header dock=top h=60');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.HEADER);
      expect(tokens[1].type).toBe(TokenType.ATTRIBUTE);
      expect(tokens[1].attributeName).toBe('dock');
      expect(tokens[1].attributeValue).toBe('top');
    });

    it('should tokenize Footer keyword', () => {
      const lexer = new Lexer('Footer dock=bottom');
      const { tokens } = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.FOOTER);
    });

    it('should tokenize Sidebar keyword', () => {
      const lexer = new Lexer('Sidebar dock=left w=200');
      const { tokens } = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.SIDEBAR);
    });

    it('should tokenize Content keyword', () => {
      const lexer = new Lexer('Content dock=fill');
      const { tokens } = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.CONTENT);
    });

    it('should tokenize Panel and Card keywords', () => {
      const lexer = new Lexer('Panel :pnl1\nCard :crd1');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.PANEL);
      expect(tokens[3].type).toBe(TokenType.CARD);
    });
  });

  describe('Identifiers', () => {
    it('should tokenize ID with colon prefix', () => {
      const lexer = new Lexer(':myId :another_id :id123');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.ID);
      expect(tokens[0].value).toBe(':myId');
      expect(tokens[1].type).toBe(TokenType.ID);
      expect(tokens[1].value).toBe(':another_id');
      expect(tokens[2].type).toBe(TokenType.ID);
      expect(tokens[2].value).toBe(':id123');
    });

    it('should tokenize binding with question mark prefix', () => {
      const lexer = new Lexer('?user.name ?order.items');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.BINDING);
      expect(tokens[0].value).toBe('?user.name');
      expect(tokens[1].type).toBe(TokenType.BINDING);
      expect(tokens[1].value).toBe('?order.items');
    });

    it('should tokenize navigation with @ prefix', () => {
      const lexer = new Lexer('@Dashboard @:back @:modal:HelpDialog');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.NAVIGATION);
      expect(tokens[0].value).toBe('@Dashboard');
      expect(tokens[1].type).toBe(TokenType.NAVIGATION);
      expect(tokens[1].value).toBe('@:back');
      expect(tokens[2].type).toBe(TokenType.NAVIGATION);
      expect(tokens[2].value).toBe('@:modal:HelpDialog');
    });

    it('should tokenize icon reference with $ prefix', () => {
      const lexer = new Lexer('$save $edit $delete');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.ICON_REF);
      expect(tokens[0].value).toBe('$save');
      expect(tokens[1].type).toBe(TokenType.ICON_REF);
      expect(tokens[2].type).toBe(TokenType.ICON_REF);
    });
  });

  describe('Modifiers', () => {
    it('should tokenize primary modifier', () => {
      const lexer = new Lexer('Button "Submit" primary');
      const { tokens } = lexer.tokenize();

      expect(tokens[2].type).toBe(TokenType.PRIMARY);
    });

    it('should tokenize secondary modifier', () => {
      const lexer = new Lexer('Button "Cancel" secondary');
      const { tokens } = lexer.tokenize();

      expect(tokens[2].type).toBe(TokenType.SECONDARY);
    });

    it('should tokenize required modifier', () => {
      const lexer = new Lexer('TextInput "Name" required');
      const { tokens } = lexer.tokenize();

      expect(tokens[2].type).toBe(TokenType.REQUIRED);
    });

    it('should tokenize disabled modifier', () => {
      const lexer = new Lexer('Button "Disabled" disabled');
      const { tokens } = lexer.tokenize();

      expect(tokens[2].type).toBe(TokenType.DISABLED);
    });

    it('should tokenize multiple modifiers', () => {
      const lexer = new Lexer('Button "Submit" :btnSubmit primary disabled');
      const { tokens } = lexer.tokenize();

      expect(tokens[2].type).toBe(TokenType.ID);
      expect(tokens[3].type).toBe(TokenType.PRIMARY);
      expect(tokens[4].type).toBe(TokenType.DISABLED);
    });
  });

  describe('Attributes', () => {
    it('should tokenize attributes with numeric values', () => {
      const lexer = new Lexer('w=200 h=100 gap=16');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.ATTRIBUTE);
      expect(tokens[0].attributeName).toBe('w');
      expect(tokens[0].attributeValue).toBe('200');
    });

    it('should tokenize attributes with string values', () => {
      const lexer = new Lexer('tooltip="Save changes" align=center');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.ATTRIBUTE);
      expect(tokens[0].attributeName).toBe('tooltip');
      expect(tokens[0].attributeValue).toBe('Save changes');
    });

    it('should tokenize attributes with percentage values', () => {
      const lexer = new Lexer('w=50% h=100%');
      const { tokens } = lexer.tokenize();

      // Note: percentage is tokenized separately
      expect(tokens[0].type).toBe(TokenType.ATTRIBUTE);
    });
  });

  describe('Comments', () => {
    it('should skip single-line comments by default', () => {
      const lexer = new Lexer('Button "A"\n// This is a comment\nButton "B"');
      const { tokens } = lexer.tokenize();

      const buttonTokens = tokens.filter((t) => t.type === TokenType.BUTTON);
      expect(buttonTokens).toHaveLength(2);
    });

    it('should include comments when option is set', () => {
      const lexer = new Lexer('// Comment\nButton "A"', { includeComments: true });
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.COMMENT);
      expect(tokens[0].value).toContain('Comment');
    });

    it('should skip multi-line comments by default', () => {
      const lexer = new Lexer('Button "A"\n/* Multi\nline\ncomment */\nButton "B"');
      const { tokens } = lexer.tokenize();

      const buttonTokens = tokens.filter((t) => t.type === TokenType.BUTTON);
      expect(buttonTokens).toHaveLength(2);
    });

    it('should include multi-line comments when option is set', () => {
      const lexer = new Lexer('/* Multi\nline */', { includeComments: true });
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.MULTILINE_COMMENT);
    });
  });

  describe('Indentation', () => {
    it('should generate INDENT token on increased indentation', () => {
      const lexer = new Lexer('Vertical\n    Button "A"');
      const { tokens } = lexer.tokenize();

      const indentTokens = tokens.filter((t) => t.type === TokenType.INDENT);
      expect(indentTokens).toHaveLength(1);
    });

    it('should generate DEDENT token on decreased indentation', () => {
      const lexer = new Lexer('Vertical\n    Button "A"\nButton "B"');
      const { tokens } = lexer.tokenize();

      const dedentTokens = tokens.filter((t) => t.type === TokenType.DEDENT);
      expect(dedentTokens).toHaveLength(1);
    });

    it('should handle nested indentation', () => {
      const lexer = new Lexer('Vertical\n    Horizontal\n        Button "A"\n    Button "B"\nButton "C"');
      const { tokens } = lexer.tokenize();

      const indentTokens = tokens.filter((t) => t.type === TokenType.INDENT);
      const dedentTokens = tokens.filter((t) => t.type === TokenType.DEDENT);

      expect(indentTokens).toHaveLength(2);
      expect(dedentTokens).toHaveLength(2);
    });
  });

  describe('Closing Keywords', () => {
    it('should tokenize /wireframe', () => {
      const lexer = new Lexer('/wireframe');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.END_WIREFRAME);
    });

    it('should tokenize /Vertical', () => {
      const lexer = new Lexer('/Vertical');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.END_BLOCK);
      expect(tokens[0].closingKeyword).toBe('Vertical');
    });

    it('should tokenize various closing keywords', () => {
      const lexer = new Lexer('/Grid\n/Horizontal\n/Card\n/Dropdown');
      const { tokens } = lexer.tokenize();

      const endBlocks = tokens.filter((t) => t.type === TokenType.END_BLOCK);
      expect(endBlocks).toHaveLength(4);
      expect(endBlocks[0].closingKeyword).toBe('Grid');
      expect(endBlocks[1].closingKeyword).toBe('Horizontal');
      expect(endBlocks[2].closingKeyword).toBe('Card');
      expect(endBlocks[3].closingKeyword).toBe('Dropdown');
    });
  });

  describe('Table Syntax', () => {
    it('should tokenize table rows', () => {
      const lexer = new Lexer('| Name | Age | City |');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.TABLE_ROW);
    });

    it('should tokenize table separator', () => {
      const lexer = new Lexer('|------|-----|------|');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.TABLE_SEPARATOR);
    });
  });

  describe('Tree Syntax', () => {
    it('should tokenize tree branch', () => {
      const lexer = new Lexer('+ Root Node');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.TREE_BRANCH);
      expect(tokens[0].value).toBe('Root Node');
    });

    it('should tokenize tree leaf', () => {
      const lexer = new Lexer('- Leaf Node');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.TREE_LEAF);
      expect(tokens[0].value).toBe('Leaf Node');
    });
  });

  describe('String Literals', () => {
    it('should tokenize double-quoted strings', () => {
      const lexer = new Lexer('"Hello World"');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe('Hello World');
    });

    it('should tokenize single-quoted strings', () => {
      const lexer = new Lexer("'Hello World'");
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe('Hello World');
    });

    it('should handle escape sequences', () => {
      const lexer = new Lexer('"Hello\\nWorld"');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe('Hello\nWorld');
    });

    it('should handle escaped quotes', () => {
      const lexer = new Lexer('"Say \\"Hello\\""');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe('Say "Hello"');
    });
  });

  describe('Numbers', () => {
    it('should tokenize integers', () => {
      const lexer = new Lexer('123');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].value).toBe('123');
    });

    it('should tokenize decimals', () => {
      const lexer = new Lexer('3.14');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].value).toBe('3.14');
    });

    it('should tokenize negative numbers', () => {
      const lexer = new Lexer('-42');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].value).toBe('-42');
    });
  });

  describe('Component Keywords', () => {
    it('should tokenize Tabs and Tab', () => {
      const lexer = new Lexer('Tabs :tabMain\n    Tab "General"');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.TABS);
      expect(tokens[4].type).toBe(TokenType.TAB);
    });

    it('should tokenize Accordion and AccordionSection', () => {
      const lexer = new Lexer('Accordion :acc\n    AccordionSection "Q1"');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.ACCORDION);
      expect(tokens[4].type).toBe(TokenType.ACCORDION_SECTION);
    });

    it('should tokenize Menu and MenuItem', () => {
      const lexer = new Lexer('Menu :mnuMain\n    MenuItem "File"');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.MENU);
      expect(tokens[4].type).toBe(TokenType.MENU_ITEM);
    });

    it('should tokenize DataGrid and Column', () => {
      const lexer = new Lexer('DataGrid :dgOrders\n    Column field=name');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.DATA_GRID);
      expect(tokens[4].type).toBe(TokenType.COLUMN);
    });
  });

  describe('Data Section Keywords', () => {
    it('should tokenize data keyword', () => {
      const lexer = new Lexer('data\n/data');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.DATA);
    });

    it('should tokenize validations keyword', () => {
      const lexer = new Lexer('validations');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.VALIDATIONS);
    });

    it('should tokenize calculations keyword', () => {
      const lexer = new Lexer('calculations');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.CALCULATIONS);
    });

    it('should tokenize rules keyword', () => {
      const lexer = new Lexer('rules');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.RULES);
    });

    it('should tokenize fields keyword', () => {
      const lexer = new Lexer('fields');
      const { tokens } = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.FIELDS);
    });
  });

  describe('Error Handling', () => {
    it('should report unterminated string', () => {
      const lexer = new Lexer('"unterminated');
      const { errors } = lexer.tokenize();

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Unterminated string');
    });

    it('should continue after error', () => {
      const lexer = new Lexer('"unterminated\nButton "Valid"');
      const { tokens } = lexer.tokenize();

      const buttonTokens = tokens.filter((t) => t.type === TokenType.BUTTON);
      expect(buttonTokens).toHaveLength(1);
    });
  });

  describe('Complex Examples', () => {
    it('should tokenize a complete button with all modifiers', () => {
      const lexer = new Lexer('Button "Submit Order" :btnSubmit primary @OrderConfirmation tooltip="Submit this order"');
      const { tokens, errors } = lexer.tokenize();

      expect(errors).toHaveLength(0);
      expect(tokens[0].type).toBe(TokenType.BUTTON);
      expect(tokens[1].type).toBe(TokenType.STRING);
      expect(tokens[2].type).toBe(TokenType.ID);
      expect(tokens[3].type).toBe(TokenType.PRIMARY);
      expect(tokens[4].type).toBe(TokenType.NAVIGATION);
      expect(tokens[5].type).toBe(TokenType.ATTRIBUTE);
    });

    it('should tokenize a complete input with validation', () => {
      const lexer = new Lexer('TextInput "Username" :txtUser required min=3 max=20 ?user.name');
      const { tokens, errors } = lexer.tokenize();

      expect(errors).toHaveLength(0);
      expect(tokens[0].type).toBe(TokenType.TEXT_INPUT);
      expect(tokens[1].type).toBe(TokenType.STRING);
      expect(tokens[2].type).toBe(TokenType.ID);
      expect(tokens[3].type).toBe(TokenType.REQUIRED);
      expect(tokens[4].type).toBe(TokenType.ATTRIBUTE);
      expect(tokens[5].type).toBe(TokenType.ATTRIBUTE);
      expect(tokens[6].type).toBe(TokenType.BINDING);
    });
  });
});
