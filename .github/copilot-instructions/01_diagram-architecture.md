# Mermaid Diagram Architecture

This instruction file explains the core architecture of Mermaid diagram types to help GitHub Copilot generate correct diagram implementations.

## Diagram Definition Interface

Every diagram must implement the `DiagramDefinition` interface from `mermaid/packages/mermaid/src/diagram-api/types.js`:

```typescript
import type { DiagramDefinition } from '../../diagram-api/types.js';

export const diagram: DiagramDefinition = {
  parser,           // Parser instance for syntax parsing
  get db() {        // Database getter for state management
    return new MyDiagramDB();
  },
  renderer,         // Renderer object with draw function
  styles,           // Style function for theming
  init?: (config: MermaidConfig) => void,  // Optional initialization
};
```

## Required Files Structure

When creating a new diagram type called `{name}`, create these files in `mermaid/packages/mermaid/src/diagrams/{name}/`:

| File | Purpose |
|------|---------|
| `{name}Diagram.ts` | Main diagram definition exporting `DiagramDefinition` |
| `{name}Db.ts` | Database class implementing `DiagramDB` interface |
| `{name}Detector.ts` | Syntax detector for identifying diagram type |
| `{name}Parser.ts` | Parser wrapper connecting to grammar |
| `{name}Renderer.ts` | SVG rendering logic with D3.js |
| `{name}Styles.ts` | CSS-in-JS styling function |
| `{name}Types.ts` | TypeScript interfaces and types |
| `{name}.spec.ts` | Unit tests |

For Langium-based parsers, also create in `mermaid/packages/parser/src/language/{name}/`:

| File | Purpose |
|------|---------|
| `{name}.langium` | Langium grammar definition |
| `index.ts` | Parser exports |
| `module.ts` | Langium module configuration |
| `tokenBuilder.ts` | Custom token handling (if needed) |
| `valueConverter.ts` | Value conversion utilities (if needed) |

## Diagram Definition Example

```typescript
// {name}Diagram.ts
import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './{name}Parser.js';
import { {Name}DB } from './{name}Db.js';
import styles from './{name}Styles.js';
import { renderer } from './{name}Renderer.js';

export const diagram: DiagramDefinition = {
  parser,
  get db() {
    return new {Name}DB();
  },
  renderer,
  styles,
};
```

## Detector Pattern

The detector registers the diagram with Mermaid's core:

```typescript
// {name}Detector.ts
import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = '{name}';

const detector: DiagramDetector = (txt, config) => {
  return /^\s*{name}/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./{name}Diagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
```

## Registration with Mermaid Core

Diagrams are registered in `mermaid/packages/mermaid/src/diagram-api/diagram-orchestration.ts`:

```typescript
import {name}Detector from '../diagrams/{name}/{name}Detector.js';

// Add to the registerLazyLoadedDiagrams function
registerLazyLoadedDiagrams({name}Detector);
```

## Existing Diagram Types Reference

Study these existing implementations for patterns:

| Diagram | Parser Type | Complexity | Good For |
|---------|-------------|------------|----------|
| `architecture` | Langium | Medium | Modern parser patterns |
| `flowchart` | JISON | High | Complex state management |
| `pie` | JISON | Low | Simple diagram pattern |
| `mindmap` | Langium | Medium | Tree structures |
| `kanban` | Langium | Medium | Board layouts |

## Key Imports

Common imports needed across diagram files:

```typescript
// Configuration
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { MermaidConfig } from '../../config.type.js';

// Logging
import { log } from '../../logger.js';

// D3 for rendering
import { select } from 'd3';

// Common database utilities
import {
  clear as commonClear,
  getAccTitle,
  setAccTitle,
  getAccDescription,
  setAccDescription,
  getDiagramTitle,
  setDiagramTitle,
} from '../common/commonDb.js';

// SVG utilities
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
```

## Best Practices

1. **Use getter for db**: Always use `get db()` to return a new instance for isolation
2. **Implement clear()**: Every database must have a `clear()` method
3. **Support accessibility**: Implement `setAccTitle`, `getAccTitle`, `setAccDescription`, `getAccDescription`
4. **Handle errors gracefully**: Use try-catch and log errors
5. **Follow naming conventions**: Use PascalCase for classes, camelCase for functions
6. **Export types separately**: Keep types in `{name}Types.ts`
