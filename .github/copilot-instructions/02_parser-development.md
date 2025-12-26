# Parser Development Guide

This instruction file guides parser implementation for new Mermaid diagram syntaxes.

## Parser Technologies

Mermaid supports two parser technologies:

| Technology | Status | Used By | Location |
|------------|--------|---------|----------|
| **Langium** | Modern (preferred) | architecture, mindmap, kanban | `packages/parser/src/language/` |
| **JISON** | Legacy | flowchart, sequence, gantt | `packages/mermaid/src/diagrams/*/parser/` |

**Use Langium for new diagrams** - it provides better tooling, type safety, and maintainability.

## Langium Grammar Structure

Create grammar files in `mermaid/packages/parser/src/language/{name}/`:

### Main Grammar File (`{name}.langium`)

```langium
grammar {Name}
import "../common/common";

entry {Name}:
    NEWLINE*
    "{name}"                    // Diagram type identifier
    (
        NEWLINE
        | TitleAndAccessibilities
        | Statement
    )*
;

fragment Statement:
    nodes+=Node
    | edges+=Edge
;

Node:
    'node' id=ID title=STRING? EOL
;

Edge:
    source=ID '-->' target=ID EOL
;
```

### Common Imports

The `common.langium` provides shared rules:

```langium
import "../common/common";

// Available from common:
// - NEWLINE, EOL (end of line)
// - TitleAndAccessibilities (title and accDescr)
// - ID (identifier matching)
// - STRING (quoted strings)
// - WHITESPACE handling
```

### Terminal Rules

Define custom tokens for your diagram:

```langium
// Direction tokens
terminal DIRECTION: 'L' | 'R' | 'T' | 'B' | 'LR' | 'RL' | 'TB' | 'BT';

// Custom patterns
terminal ICON: /@[\w-]+:\s*[\w-]+/;
terminal TITLE: /\[[^\]]+\]/;

// Hidden tokens (whitespace, comments)
hidden terminal WS: /[\t ]+/;
hidden terminal COMMENT: /%%[^\n\r]*/;
```

### Fragment Rules

Use fragments for reusable patterns:

```langium
fragment Arrow:
    LeftPort? ('--' | '-' label=STRING '-') RightPort?
;

fragment LeftPort:
    ':' direction=DIRECTION
;

fragment RightPort:
    direction=DIRECTION ':'
;
```

## Parser Module Configuration

### Module File (`module.ts`)

```typescript
import type { Module } from 'langium';
import type { LangiumServices, PartialLangiumServices } from 'langium/lsp';
import { {Name}TokenBuilder } from './tokenBuilder.js';
import { {Name}ValueConverter } from './valueConverter.js';

export const {Name}Module: Module<LangiumServices, PartialLangiumServices> = {
  parser: {
    TokenBuilder: () => new {Name}TokenBuilder(),
    ValueConverter: () => new {Name}ValueConverter(),
  },
};
```

### Token Builder (`tokenBuilder.ts`)

Custom token handling for complex patterns:

```typescript
import { AbstractMermaidTokenBuilder } from '../common/tokenBuilder.js';

export class {Name}TokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['{name}']);  // Diagram type keywords
  }
}
```

### Value Converter (`valueConverter.ts`)

Convert parsed values to usable types:

```typescript
import type { CstNode, GrammarAST, ValueType } from 'langium';
import { AbstractMermaidValueConverter } from '../common/valueConverter.js';

export class {Name}ValueConverter extends AbstractMermaidValueConverter {
  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    // Handle TITLE: strip brackets
    if (rule.name === 'TITLE') {
      return input.slice(1, -1).trim();  // Remove [ and ]
    }
    return super.runConverter(rule, input, cstNode);
  }
}
```

### Index File (`index.ts`)

Export parser utilities:

```typescript
import type { {Name} } from '../generated/ast.js';
import { createParser } from '../parser.js';
import { {Name}Module } from './module.js';

const parser = createParser<{Name}>('{name}', {Name}Module);

export const parse = parser.parse.bind(parser);

export {
  type {Name}Services,
} from '../generated/module.js';
```

## Parser Wrapper for Mermaid

Create `{name}Parser.ts` in the diagram folder:

```typescript
import type { {Name} } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import type { {Name}DB } from './{name}Db.js';

const populate = (ast: {Name}, db: {Name}DB) => {
  // Process AST nodes
  for (const node of ast.nodes ?? []) {
    db.addNode({
      id: node.id,
      title: node.title,
    });
  }
  
  // Process AST edges
  for (const edge of ast.edges ?? []) {
    db.addEdge({
      source: edge.source,
      target: edge.target,
    });
  }
};

export const parser: ParserDefinition = {
  parse: async (input: string, db: {Name}DB): Promise<void> => {
    const ast = await parse('{name}', input);
    log.debug('Parsed {name} AST:', ast);
    populate(ast, db);
  },
};
```

## JISON Parser (Legacy)

For reference, JISON parsers use `.jison` files:

```jison
/* lexical grammar */
%lex
%options case-insensitive

%%
\s+                   /* skip whitespace */
"graph"               return 'GRAPH';
"-->"                 return 'ARROW';
[a-zA-Z][a-zA-Z0-9]*  return 'ID';
<<EOF>>               return 'EOF';

/lex

/* parser grammar */
%start diagram

%%

diagram
    : GRAPH nodes EOF
    ;

nodes
    : node
    | nodes node
    ;

node
    : ID ARROW ID
    ;
```

## Testing Parsers

Create tests in `mermaid/packages/parser/tests/{name}.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { {Name} } from '../src/language/index.js';

describe('{name} parser', () => {
  it('should parse basic diagram', () => {
    const result = {Name}.parse(`{name}
      node A
      node B
      A --> B
    `);
    
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
  });

  it('should parse node with title', () => {
    const result = {Name}.parse(`{name}
      node A "My Title"
    `);
    
    expect(result.nodes[0].title).toBe('My Title');
  });

  it('should handle empty diagram', () => {
    const result = {Name}.parse(`{name}`);
    expect(result.nodes).toHaveLength(0);
  });
});
```

## Error Handling

Implement graceful error handling:

```typescript
export const parser: ParserDefinition = {
  parse: async (input: string, db: {Name}DB): Promise<void> => {
    try {
      const ast = await parse('{name}', input);
      populate(ast, db);
    } catch (error) {
      log.error('Failed to parse {name} diagram:', error);
      throw new Error(`{Name} diagram parse error: ${error.message}`);
    }
  },
};
```

## Best Practices

1. **Use meaningful rule names**: Make grammar self-documenting
2. **Handle whitespace explicitly**: Define hidden terminals for WS
3. **Support comments**: Add `%%` comment syntax
4. **Validate IDs**: Check for duplicate/invalid identifiers
5. **Provide helpful errors**: Include line/column in error messages
6. **Test edge cases**: Empty inputs, special characters, long inputs
7. **Reuse common patterns**: Import from `common.langium`
