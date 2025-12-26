# Mermaid Diagram Type Development Guidelines

This document proposes GitHub Copilot instruction markdown files for creating new Mermaid diagram types in the Wireframes project.

## Table of Contents

1. [Overview](#overview)
2. [Proposed Instruction Files](#proposed-instruction-files)
3. [File Descriptions](#file-descriptions)
4. [Implementation Priority](#implementation-priority)

---

## Overview

When developing new Mermaid diagram types, developers need guidance on the architecture, patterns, and conventions used throughout the codebase. GitHub Copilot can leverage instruction files (`.github/copilot-instructions.md` or project-specific instructions) to provide contextual assistance.

This proposal outlines a set of guideline documents that will help GitHub Copilot understand and assist with Mermaid diagram development.

---

## Proposed Instruction Files

The following instruction files should be created in the `.github/copilot-instructions/` directory:

```
.github/
??? copilot-instructions/
    ??? 01_diagram-architecture.md
    ??? 02_parser-development.md
    ??? 03_database-layer.md
    ??? 04_renderer-implementation.md
    ??? 05_detector-patterns.md
    ??? 06_styles-theming.md
    ??? 07_testing-guidelines.md
    ??? 08_documentation-requirements.md
```

---

## File Descriptions

### 01_diagram-architecture.md

**Purpose**: Explain the core architecture of Mermaid diagram types.

**Contents**:
- Diagram module structure overview
- Required files for each diagram type:
  - `{diagramName}Diagram.ts` - Main diagram definition
  - `{diagramName}Db.ts` - Database/state management
  - `{diagramName}Detector.ts` - Syntax detection
  - `{diagramName}Parser.ts` - Parser implementation
  - `{diagramName}Renderer.ts` - SVG rendering
  - `{diagramName}Styles.ts` - CSS styling
  - `{diagramName}Types.ts` - TypeScript interfaces
- DiagramDefinition interface explanation
- Registration with Mermaid core

**Example Structure**:
```markdown
# Mermaid Diagram Architecture

## Diagram Definition Interface

Every diagram must implement the `DiagramDefinition` interface:

\`\`\`typescript
interface DiagramDefinition {
  parser: Parser;
  db: DiagramDB;
  renderer: Renderer;
  styles: StylesFunction;
  init?: (config: MermaidConfig) => void;
}
\`\`\`

## Required Files

When creating a new diagram type called `{name}`, create these files:
- `mermaid/packages/mermaid/src/diagrams/{name}/{name}Diagram.ts`
- `mermaid/packages/mermaid/src/diagrams/{name}/{name}Db.ts`
...
```

---

### 02_parser-development.md

**Purpose**: Guide parser implementation for new diagram syntaxes.

**Contents**:
- Parser architecture (JISON vs Langium)
- Grammar file structure (`.jison` or `.langium`)
- Token definitions
- AST node types
- Error handling patterns
- Parser testing strategies

**Key Topics**:
```markdown
# Parser Development Guide

## Grammar Definition

Mermaid supports two parser technologies:
1. **JISON** - Legacy parser (flowchart, sequence, etc.)
2. **Langium** - Modern parser (architecture, newer diagrams)

## Langium Grammar Example

\`\`\`langium
grammar MyDiagram

entry MyDiagram:
    'mydiagram' direction=Direction?
    (elements+=Element)*;

Element:
    Node | Edge;
...
\`\`\`
```

---

### 03_database-layer.md

**Purpose**: Document the database/state management pattern.

**Contents**:
- DiagramDB interface implementation
- State management patterns
- Common methods (clear, setAccTitle, getAccTitle, etc.)
- Data structures for nodes, edges, relationships
- Serialization patterns

**Key Topics**:
```markdown
# Database Layer Implementation

## DiagramDB Interface

The database class manages diagram state during parsing and rendering:

\`\`\`typescript
export class MyDiagramDB implements DiagramDB {
  private nodes = new Map<string, Node>();
  private edges: Edge[] = [];
  
  clear = () => {
    this.nodes.clear();
    this.edges = [];
    commonClear();
  };
  
  // Implement required methods...
}
\`\`\`
```

---

### 04_renderer-implementation.md

**Purpose**: Guide SVG rendering implementation.

**Contents**:
- Renderer function signature
- D3.js integration patterns
- SVG element creation
- Layout algorithms
- Responsive sizing
- Accessibility attributes
- Animation patterns

**Key Topics**:
```markdown
# Renderer Implementation Guide

## Renderer Function

\`\`\`typescript
export const renderer = {
  draw: async (text: string, id: string, version: string, diagObj: Diagram) => {
    const db = diagObj.db as MyDiagramDB;
    const svg = select(\`#\${id}\`);
    
    // Render nodes
    // Render edges
    // Apply layout
    // Set viewBox
  }
};
\`\`\`
```

---

### 05_detector-patterns.md

**Purpose**: Explain diagram type detection implementation.

**Contents**:
- DiagramDetector function pattern
- Regular expression patterns for syntax detection
- Loader pattern for lazy loading
- ExternalDiagramDefinition structure
- Plugin registration

**Key Topics**:
```markdown
# Detector Implementation

## Detector Function

\`\`\`typescript
const detector: DiagramDetector = (txt, config) => {
  return /^\s*mydiagram/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./myDiagram.js');
  return { id: 'mydiagram', diagram };
};

export default { id: 'mydiagram', detector, loader };
\`\`\`
```

---

### 06_styles-theming.md

**Purpose**: Document styling and theming patterns.

**Contents**:
- Style function signature
- CSS-in-JS patterns
- Theme variable integration
- Dark/light mode support
- Custom class styling

**Key Topics**:
```markdown
# Styles and Theming

## Style Function

\`\`\`typescript
const styles = (options: ThemeOptions) => \`
  .node {
    fill: \${options.primaryColor};
    stroke: \${options.primaryBorderColor};
  }
  .edge {
    stroke: \${options.lineColor};
  }
\`;

export default styles;
\`\`\`
```

---

### 07_testing-guidelines.md

**Purpose**: Define testing requirements for new diagrams.

**Contents**:
- Unit test patterns for parsers
- Database state testing
- Renderer snapshot testing
- Cypress integration tests
- Test file locations and naming

**Key Topics**:
```markdown
# Testing Guidelines

## Required Tests

1. **Parser Tests** - `{name}.spec.ts`
2. **Database Tests** - `{name}Db.spec.ts`  
3. **Renderer Tests** - Snapshot tests
4. **Integration Tests** - `cypress/integration/rendering/{name}.spec.ts`

## Parser Test Example

\`\`\`typescript
describe('MyDiagram Parser', () => {
  it('should parse basic diagram', () => {
    const result = parser.parse('mydiagram\\n  node1\\n  node2');
    expect(result).toBeDefined();
  });
});
\`\`\`
```

---

### 08_documentation-requirements.md

**Purpose**: Define documentation requirements for new diagrams.

**Contents**:
- Syntax documentation format
- Example diagrams
- Configuration options
- Live editor examples
- Accessibility considerations

**Key Topics**:
```markdown
# Documentation Requirements

## Required Documentation

1. **Syntax Guide** - `docs/syntax/{name}.md`
2. **Examples** - `packages/examples/src/examples/{name}.ts`
3. **Demo Page** - `demos/{name}.html`

## Syntax Documentation Template

\`\`\`markdown
# {Diagram Name}

> Description of what this diagram type visualizes.

## Syntax

\\\`\`\`mermaid
mydiagram
  node1
  node2
  node1 --> node2
\\\`\`\`
\`\`\`
```

---

## Implementation Priority

| Priority | File | Rationale |
|----------|------|-----------|
| 1 | `01_diagram-architecture.md` | Foundation for all other guides |
| 2 | `02_parser-development.md` | Parser is the first step in development |
| 3 | `03_database-layer.md` | State management follows parsing |
| 4 | `04_renderer-implementation.md` | Visual output generation |
| 5 | `05_detector-patterns.md` | Integration with Mermaid core |
| 6 | `07_testing-guidelines.md` | Quality assurance |
| 7 | `06_styles-theming.md` | Visual refinement |
| 8 | `08_documentation-requirements.md` | Final documentation |

---

## Usage with GitHub Copilot

Once these files are created, GitHub Copilot will:

1. **Understand Project Structure**: Recognize the pattern of files needed for new diagrams
2. **Generate Boilerplate**: Create properly structured diagram files
3. **Follow Conventions**: Use consistent naming and coding patterns
4. **Suggest Tests**: Recommend appropriate test coverage
5. **Guide Documentation**: Help create comprehensive syntax docs

### Activating Instructions

Add to `.github/copilot-instructions.md`:

```markdown
# Project Instructions

This project extends Mermaid with custom diagram types.

See `/docs/copilot-instructions/` for detailed guides on:
- Creating new diagram types
- Parser development with Langium
- Renderer implementation with D3.js
- Testing and documentation requirements
```

---

## Next Steps

1. Create the `.github/copilot-instructions/` directory
2. Implement instruction files in priority order
3. Add examples from existing diagram implementations
4. Test with GitHub Copilot during development
5. Iterate based on developer feedback

---

*Document created: 2025*
