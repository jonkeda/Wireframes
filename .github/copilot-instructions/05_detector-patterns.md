# Detector Implementation Patterns

This instruction file explains diagram type detection implementation for Mermaid diagrams.

## Detector Overview

The detector system allows Mermaid to:
1. **Identify** which diagram type a text input represents
2. **Lazy load** diagram implementations for better performance
3. **Register** diagrams as plugins

## Detector Structure

Create `{name}Detector.ts` in the diagram folder:

```typescript
import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = '{name}';

const detector: DiagramDetector = (txt, config) => {
  // Return true if text matches this diagram type
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

## DiagramDetector Function

The detector is a function that checks if input text matches the diagram type:

```typescript
type DiagramDetector = (
  text: string,
  config?: MermaidConfig
) => boolean;
```

### Simple Keyword Detection

```typescript
// Match diagram type at start of text
const detector: DiagramDetector = (txt) => {
  return /^\s*{name}/.test(txt);
};
```

### Multiple Keywords

```typescript
// Match multiple possible keywords
const detector: DiagramDetector = (txt) => {
  return /^\s*({name}|{alias})/.test(txt);
};
```

### Version-Specific Detection

```typescript
// Match specific version syntax
const detector: DiagramDetector = (txt) => {
  // Match "{name}" or "{name}-beta"
  return /^\s*{name}(-beta)?/.test(txt);
};
```

### Config-Aware Detection

```typescript
// Use config to modify detection behavior
const detector: DiagramDetector = (txt, config) => {
  // Skip if diagram type is disabled
  if (config?.{name}?.disabled) {
    return false;
  }
  
  // Check for default renderer preference
  if (config?.{name}?.defaultRenderer === 'alternative') {
    return false;  // Let alternative detector handle it
  }
  
  return /^\s*{name}/.test(txt);
};
```

### Complex Detection with Preprocessing

```typescript
const detector: DiagramDetector = (txt) => {
  // Preprocess: remove comments and directives
  const cleaned = txt
    .split('\n')
    .filter(line => !line.trim().startsWith('%%'))
    .join('\n')
    .trim();
  
  // Check first non-empty, non-comment line
  return /^{name}/.test(cleaned);
};
```

## DiagramLoader Function

The loader dynamically imports the diagram module:

```typescript
type DiagramLoader = () => Promise<{
  id: string;
  diagram: DiagramDefinition;
}>;
```

### Basic Loader

```typescript
const loader: DiagramLoader = async () => {
  const { diagram } = await import('./{name}Diagram.js');
  return { id, diagram };
};
```

### Loader with Error Handling

```typescript
const loader: DiagramLoader = async () => {
  try {
    const { diagram } = await import('./{name}Diagram.js');
    return { id, diagram };
  } catch (error) {
    console.error(`Failed to load ${id} diagram:`, error);
    throw error;
  }
};
```

### Loader with Dependencies

```typescript
const loader: DiagramLoader = async () => {
  // Load required dependencies first
  await import('some-layout-library');
  
  const { diagram } = await import('./{name}Diagram.js');
  return { id, diagram };
};
```

## ExternalDiagramDefinition

The plugin object combines the detector and loader:

```typescript
interface ExternalDiagramDefinition {
  id: string;           // Unique diagram identifier
  detector: DiagramDetector;
  loader: DiagramLoader;
}
```

### Complete Plugin Export

```typescript
const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
```

## Registration with Mermaid Core

Diagrams are registered in `mermaid/packages/mermaid/src/diagram-api/diagram-orchestration.ts`:

### Adding to Lazy-Loaded Diagrams

```typescript
// In diagram-orchestration.ts
import {name}Detector from '../diagrams/{name}/{name}Detector.js';

// Add to the lazy loaded diagrams list
const lazyLoadedDiagrams: ExternalDiagramDefinition[] = [
  // ... existing diagrams
  {name}Detector,
];

// Or use the registration function
export function registerLazyLoadedDiagrams() {
  lazyLoadedDiagrams.forEach(diagram => {
    registerDiagram(
      diagram.id,
      diagram.detector,
      diagram.loader
    );
  });
}
```

### Direct Registration (Non-Lazy)

For diagrams that should load immediately:

```typescript
import { registerDiagram } from '../diagram-api/diagramAPI.js';
import { diagram as {name}Diagram } from './{name}Diagram.js';

registerDiagram(
  '{name}',
  (txt) => /^\s*{name}/.test(txt),
  () => Promise.resolve({ id: '{name}', diagram: {name}Diagram })
);
```

## Detection Priority

When multiple detectors match, priority is determined by:
1. **Registration order**: First registered takes precedence
2. **Specificity**: More specific patterns should register first

### Handling Overlapping Patterns

```typescript
// flowchart-v2 detector (more specific, register first)
const v2Detector: DiagramDetector = (txt, config) => {
  if (config?.flowchart?.defaultRenderer === 'elk') {
    return /^\s*flowchart/.test(txt);
  }
  return false;
};

// flowchart detector (less specific, register second)
const detector: DiagramDetector = (txt, config) => {
  // Only match if v2 didn't claim it
  if (config?.flowchart?.defaultRenderer === 'elk') {
    return false;
  }
  return /^\s*graph/.test(txt);
};
```

## Common Detection Patterns

### Standard Diagram Keywords

| Diagram | Pattern | Example |
|---------|---------|---------|
| flowchart | `/^\s*flowchart/` | `flowchart LR` |
| sequence | `/^\s*sequenceDiagram/` | `sequenceDiagram` |
| class | `/^\s*classDiagram/` | `classDiagram` |
| state | `/^\s*stateDiagram/` | `stateDiagram-v2` |
| er | `/^\s*erDiagram/` | `erDiagram` |
| gantt | `/^\s*gantt/` | `gantt` |
| pie | `/^\s*pie/` | `pie showData` |
| mindmap | `/^\s*mindmap/` | `mindmap` |
| architecture | `/^\s*architecture-beta/` | `architecture-beta` |

### Pattern with Optional Modifiers

```typescript
// Match: "pie", "pie showData", "pie title My Chart"
const detector: DiagramDetector = (txt) => {
  return /^\s*pie(\s|$)/.test(txt);
};

// Match with version: "stateDiagram" or "stateDiagram-v2"
const detector: DiagramDetector = (txt) => {
  return /^\s*stateDiagram(-v2)?/.test(txt);
};
```

### Direction/Layout Modifiers

```typescript
// Match: "flowchart", "flowchart LR", "flowchart TB"
const detector: DiagramDetector = (txt) => {
  return /^\s*flowchart(\s+(LR|RL|TB|BT|TD))?/.test(txt);
};
```

## Testing Detectors

```typescript
import { describe, expect, it } from 'vitest';
import plugin from './{name}Detector.js';

describe('{name} detector', () => {
  it('should detect basic diagram', () => {
    expect(plugin.detector('{name}\n  content')).toBe(true);
  });

  it('should detect with leading whitespace', () => {
    expect(plugin.detector('  {name}\n  content')).toBe(true);
  });

  it('should not detect other diagrams', () => {
    expect(plugin.detector('flowchart\n  A --> B')).toBe(false);
  });

  it('should not detect partial matches', () => {
    expect(plugin.detector('{name}xyz\n  content')).toBe(false);
  });

  it('should load diagram module', async () => {
    const result = await plugin.loader();
    expect(result.id).toBe('{name}');
    expect(result.diagram).toBeDefined();
  });
});
```

## Complete Example

```typescript
// {name}Detector.ts
import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = '{name}';

/**
 * Detects if the input text is a {name} diagram.
 * Matches: "{name}", "{name} direction", "{name}-beta"
 */
const detector: DiagramDetector = (txt, config) => {
  // Check if disabled in config
  if (config?.{name}?.disabled) {
    return false;
  }
  
  // Match diagram keyword at start (with optional modifiers)
  return /^\s*{name}(-beta)?(\s|$)/i.test(txt);
};

/**
 * Lazy loads the {name} diagram implementation.
 */
const loader: DiagramLoader = async () => {
  const { diagram } = await import('./{name}Diagram.js');
  return { id, diagram };
};

/**
 * Plugin definition for {name} diagram.
 */
const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
```

## Best Practices

1. **Use word boundaries**: Ensure pattern doesn't match partial words
2. **Handle whitespace**: Allow leading spaces/newlines
3. **Case sensitivity**: Use `/i` flag if case-insensitive
4. **Config awareness**: Check config for disabled/alternative modes
5. **Test thoroughly**: Cover edge cases (empty, whitespace, similar patterns)
6. **Document patterns**: Add comments explaining the regex
7. **Export default**: Use default export for the plugin object
8. **Keep detectors fast**: Regex check should be O(1)
