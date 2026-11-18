/**
 * The parser never loses content silently.
 * One test per finding of the review (W1–W11, R5), each failing before its fix.
 */
import { describe, it, expect } from 'vitest';
import { parse } from './parser.js';
import { Lexer, TokenType } from '../lexer/index.js';
import { compile } from '../index.js';
import type { ConditionalNode, ControlNode, LayoutNode } from './ast.js';

const messages = (source: string): string[] => parse(source).errors.map((e) => e.message);

describe('Tables keep empty cells (W1)', () => {
  const source = `wireframe clean
    TextInput "Name" :Name required
validations
    | Field | Rule | Message |
    |---|---|---|
    | Name | | Name is required |
/validations
/wireframe`;

  it('keeps an empty cell in its column', () => {
    const { document, errors } = parse(source);
    expect(errors).toEqual([]);
    expect(document!.dataSections[0].rows[2].cells).toEqual(['Name', '', 'Name is required']);
  });

  it('reads the header as columns and the rows below as records', () => {
    const section = parse(source).document!.dataSections[0];
    expect(section.columns).toEqual(['Field', 'Rule', 'Message']);
    expect(section.records).toEqual([{ Field: 'Name', Rule: '', Message: 'Name is required' }]);
  });

  it('reports a row with more cells than the header', () => {
    const errors = messages(`wireframe clean
validations
    | Field | Rule |
    |---|---|
    | Name | required | extra |
/validations
/wireframe`);
    expect(errors.some((m) => m.includes('3 cells, the header 2'))).toBe(true);
  });

  it('keeps empty cells in a Table component too', () => {
    const { document } = parse(`wireframe clean
    Table
        | A | | C |
    /Table
/wireframe`);
    const table = document!.children[0] as { tableRows?: { cells: string[] }[] };
    expect(table.tableRows![0].cells).toEqual(['A', '', 'C']);
  });
});

describe('A wrong closing keyword loses nothing (W2)', () => {
  it('reports an unknown closing keyword at its own line and keeps what follows', () => {
    const { document, errors } = parse(`wireframe clean
    Vertical
        Button "A"
    /Vertcal
    Button "B"
    Button "C"
/wireframe`);
    expect(errors.map((e) => `${e.location.line}: ${e.message}`)).toEqual([
      '4: Unknown closing keyword /Vertcal',
    ]);
    const texts = document!.children.map((c) => (c as ControlNode).text ?? (c as LayoutNode).layoutType);
    expect(texts).toEqual(['Vertical', 'B', 'C']);
  });

  it('reports a closing keyword for a block that is not open, and keeps what follows', () => {
    const { document, errors } = parse(`wireframe clean
    Horizontal
        Button "A"
    /Horizontal
    /Card
    Button "B"
/wireframe`);
    expect(errors.map((e) => e.message)).toEqual(['Unexpected /Card: no Card is open here']);
    expect(document!.children).toHaveLength(2);
  });

  it('still accepts a matching closing keyword after an indented block', () => {
    const { document, errors } = parse(`wireframe clean
    Vertical
        Horizontal
            Button "A"
        /Horizontal
        Button "B"
    /Vertical
    Button "C"
/wireframe`);
    expect(errors).toEqual([]);
    expect(document!.children).toHaveLength(2);
    expect((document!.children[0] as LayoutNode).children).toHaveLength(2);
  });
});

describe('if / else (W3)', () => {
  it('parses both branches into a conditional', () => {
    const { document, errors } = parse(`wireframe clean
    if loggedIn
        Button "Log out"
    else
        Button "Log in"
    /if
    Button "After"
/wireframe`);
    expect(errors).toEqual([]);
    const conditional = document!.children[0] as ConditionalNode;
    expect(conditional.type).toBe('Conditional');
    expect(conditional.condition).toBe('loggedIn');
    expect((conditional.thenChildren[0] as ControlNode).text).toBe('Log out');
    expect((conditional.elseChildren![0] as ControlNode).text).toBe('Log in');
    expect((document!.children[1] as ControlNode).text).toBe('After');
  });

  it('keeps a condition with any characters, as written', () => {
    const conditional = parse(`wireframe clean
    if user.role == "admin"
        Button "Settings"
    /if
/wireframe`).document!.children[0] as ConditionalNode;
    expect(conditional.condition).toBe('user.role == "admin"');
  });

  it('nests else if', () => {
    const conditional = parse(`wireframe clean
    if a
        Label "A"
    else if b
        Label "B"
    else
        Label "C"
    /if
/wireframe`).document!.children[0] as ConditionalNode;
    const nested = conditional.elseChildren![0] as ConditionalNode;
    expect(nested.condition).toBe('b');
    expect((nested.elseChildren![0] as ControlNode).text).toBe('C');
  });

  it('reports an else or /if outside an if, and keeps what follows', () => {
    const { document, errors } = parse(`wireframe clean
    else
    Button "A"
    /if
    Button "B"
/wireframe`);
    expect(errors.map((e) => e.message)).toEqual([
      'Unexpected else: no if is open here',
      'Unexpected /if: no if is open here',
    ]);
    expect(document!.children).toHaveLength(2);
  });

  it('reports an if without a condition', () => {
    expect(messages(`wireframe clean
    if
        Button "A"
    /if
/wireframe`)).toContain('An if needs a condition');
  });
});

describe('Text is text, a placeholder is a placeholder (W4, W5)', () => {
  const controls = (source: string) => parse(source).document!.children as ControlNode[];

  it('stores the words of a Heading, a Link and a Badge as text', () => {
    const [heading, link, badge] = controls(`wireframe clean
    Heading "Create department"
    Link "Back" @Departments
    Badge "New"
/wireframe`);
    expect(heading.text).toBe('Create department');
    expect(link.text).toBe('Back');
    expect(badge.text).toBe('New');
    expect(heading.placeholder).toBeUndefined();
  });

  it('keeps the string of an input as its placeholder', () => {
    const [input] = controls(`wireframe clean
    TextInput "Enter your email"
/wireframe`);
    expect(input.placeholder).toBe('Enter your email');
    expect(input.text).toBeUndefined();
  });

  it('reads label= and placeholder= into the node', () => {
    const [input] = controls(`wireframe clean
    TextInput :Name label="Name" placeholder="e.g. Office" required
/wireframe`);
    expect(input.label).toBe('Name');
    expect(input.placeholder).toBe('e.g. Office');
    expect(input.modifiers.required).toBe(true);
  });

  it('renders a heading with its own words', () => {
    const { svg } = compile(`wireframe clean
    Heading "Create department"
/wireframe`, { useCache: false });
    expect(svg).toContain('Create department');
  });
});

describe('Letters beyond ASCII (W6)', () => {
  it('accepts ids and navigation targets with accents', () => {
    const { document, errors } = parse(`wireframe clean
    TextInput "Categorie" :Categorieën
    Button "Overzicht" @Overzicht_Categorieën
/wireframe`);
    expect(errors).toEqual([]);
    const [input, button] = document!.children as ControlNode[];
    expect(input.id).toBe('Categorieën');
    expect(button.navigation).toBe('Overzicht_Categorieën');
  });
});

describe('Data sections anywhere after the screen (W7)', () => {
  it('reads a data section between elements', () => {
    const { document, errors } = parse(`wireframe clean
    Button "A"
validations
    | Field | Rule | Message |
    |---|---|---|
    | A | required | A is required |
/validations
    Button "B"
/wireframe`);
    expect(errors).toEqual([]);
    expect(document!.children).toHaveLength(2);
    expect(document!.dataSections).toHaveLength(1);
  });

  it('reads data sections in a document without the wireframe wrapper', () => {
    const { document } = parse(`Button "A"
rules
    | Rule |
    |---|
    | One |
/rules`);
    expect(document!.dataSections[0].records).toEqual([{ Rule: 'One' }]);
  });

  it('reads a component definition: its name, parameters and body', () => {
    const { document, errors } = parse(`wireframe clean
    Button "A"
component SearchBox placeholder
    Horizontal
        TextInput "Search"
        Button "Go"
/component
/wireframe`);
    expect(errors).toEqual([]);
    const section = document!.dataSections[0];
    expect(section.componentName).toBe('SearchBox');
    expect(section.componentParams).toBe('placeholder');
    expect((section.componentBody![0] as LayoutNode).children).toHaveLength(2);
  });
});

describe('Error positions (W8)', () => {
  it('points a duplicate id at the id itself', () => {
    const { errors } = parse(`wireframe clean
    Button "A" :Same
    Button "B" :Same primary
/wireframe`);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Duplicate ID: Same');
    expect(errors[0].location).toMatchObject({ line: 3, column: 16 });
  });
});

describe('Escapes are the same in strings and attribute values (W10)', () => {
  it('reads \\n as a new line in a quoted attribute value', () => {
    const [input] = parse(`wireframe clean
    TextInput "x" message="Line\\nTwo" note="say \\"hi\\""
/wireframe`).document!.children as ControlNode[];
    expect(input.attributes['message']).toBe('Line\nTwo');
    expect(input.attributes['note']).toBe('say "hi"');
  });
});

describe('A dash in the middle of a line is not a list item (W11)', () => {
  it('lexes "- text" as a tree item only at the start of a line', () => {
    const { tokens } = new Lexer(`Label "Price" - excl. VAT
- item`).tokenize();
    const leaves = tokens.filter((t) => t.type === TokenType.TREE_LEAF).map((t) => t.value);
    expect(leaves).toEqual(['item']);
  });
});

describe('The cache never hides errors (R5)', () => {
  it('reports the same errors on a second compile of the same source', () => {
    const source = `wireframe clean
    Button "A"
    /Nope
/wireframe`;
    const first = compile(source);
    const second = compile(source);
    expect(first.errors.length).toBeGreaterThan(0);
    expect(second.errors).toEqual(first.errors);
  });
});
