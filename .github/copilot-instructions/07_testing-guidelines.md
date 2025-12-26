# Testing Guidelines

This instruction file defines testing requirements for new Mermaid diagram types.

## Testing Stack

Mermaid uses:
- **Vitest**: Unit testing framework
- **Cypress**: E2E and visual regression testing
- **Snapshot testing**: For rendered output verification

## Required Test Files

| Test Type | Location | Purpose |
|-----------|----------|---------|
| Parser tests | `packages/parser/tests/{name}.test.ts` | Grammar and parsing |
| Database tests | `packages/mermaid/src/diagrams/{name}/{name}Db.spec.ts` | State management |
| Diagram tests | `packages/mermaid/src/diagrams/{name}/{name}.spec.ts` | Integration |
| Cypress tests | `cypress/integration/rendering/{name}.spec.ts` | Visual rendering |

## Parser Tests

Test the grammar and AST generation:

```typescript
// packages/parser/tests/{name}.test.ts
import { describe, expect, it } from 'vitest';
import { {Name} } from '../src/language/index.js';

describe('{name} parser', () => {
  describe('basic parsing', () => {
    it('should parse empty diagram', () => {
      const result = {Name}.parse(`{name}`);
      expect(result).toBeDefined();
      expect(result.nodes).toHaveLength(0);
    });

    it('should parse single node', () => {
      const result = {Name}.parse(`{name}
        node A
      `);
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe('A');
    });

    it('should parse node with title', () => {
      const result = {Name}.parse(`{name}
        node A "My Node"
      `);
      expect(result.nodes[0].title).toBe('My Node');
    });

    it('should parse multiple nodes', () => {
      const result = {Name}.parse(`{name}
        node A
        node B
        node C
      `);
      expect(result.nodes).toHaveLength(3);
    });
  });

  describe('edge parsing', () => {
    it('should parse simple edge', () => {
      const result = {Name}.parse(`{name}
        node A
        node B
        A --> B
      `);
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].source).toBe('A');
      expect(result.edges[0].target).toBe('B');
    });

    it('should parse edge with label', () => {
      const result = {Name}.parse(`{name}
        node A
        node B
        A -- "connects to" --> B
      `);
      expect(result.edges[0].label).toBe('connects to');
    });
  });

  describe('accessibility', () => {
    it('should parse title', () => {
      const result = {Name}.parse(`{name}
        accTitle: My Title
        node A
      `);
      expect(result.accTitle).toBe('My Title');
    });

    it('should parse description', () => {
      const result = {Name}.parse(`{name}
        accDescr: My Description
        node A
      `);
      expect(result.accDescr).toBe('My Description');
    });
  });

  describe('error handling', () => {
    it('should throw on invalid syntax', () => {
      expect(() => {
        {Name}.parse(`{name}
          invalid syntax here %%%
        `);
      }).toThrow();
    });
  });
});
```

## Database Tests

Test state management and data operations:

```typescript
// packages/mermaid/src/diagrams/{name}/{name}Db.spec.ts
import { describe, expect, it, beforeEach } from 'vitest';
import { {Name}DB } from './{name}Db.js';

describe('{Name}DB', () => {
  let db: {Name}DB;

  beforeEach(() => {
    db = new {Name}DB();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      expect(db.getNodes()).toHaveLength(0);
      expect(db.getEdges()).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should clear all state', () => {
      db.addNode({ id: 'A', title: 'Node A' });
      db.addEdge({ source: 'A', target: 'A' });
      
      db.clear();
      
      expect(db.getNodes()).toHaveLength(0);
      expect(db.getEdges()).toHaveLength(0);
    });
  });

  describe('node management', () => {
    it('should add node', () => {
      db.addNode({ id: 'A', title: 'Node A' });
      
      expect(db.getNodes()).toHaveLength(1);
      expect(db.getNode('A')).toBeDefined();
    });

    it('should reject duplicate node IDs', () => {
      db.addNode({ id: 'A' });
      
      expect(() => db.addNode({ id: 'A' })).toThrow();
    });

    it('should return undefined for missing node', () => {
      expect(db.getNode('missing')).toBeUndefined();
    });

    it('should check node existence', () => {
      db.addNode({ id: 'A' });
      
      expect(db.hasNode('A')).toBe(true);
      expect(db.hasNode('B')).toBe(false);
    });
  });

  describe('edge management', () => {
    beforeEach(() => {
      db.addNode({ id: 'A' });
      db.addNode({ id: 'B' });
    });

    it('should add edge', () => {
      db.addEdge({ source: 'A', target: 'B' });
      
      expect(db.getEdges()).toHaveLength(1);
    });

    it('should reject edge with missing source', () => {
      expect(() => {
        db.addEdge({ source: 'missing', target: 'B' });
      }).toThrow();
    });

    it('should reject edge with missing target', () => {
      expect(() => {
        db.addEdge({ source: 'A', target: 'missing' });
      }).toThrow();
    });
  });

  describe('accessibility', () => {
    it('should set and get title', () => {
      db.setAccTitle('My Title');
      expect(db.getAccTitle()).toBe('My Title');
    });

    it('should set and get description', () => {
      db.setAccDescription('My Description');
      expect(db.getAccDescription()).toBe('My Description');
    });
  });

  describe('text sanitization', () => {
    it('should sanitize node titles', () => {
      db.addNode({ id: 'A', title: '<script>alert("xss")</script>' });
      
      const node = db.getNode('A');
      expect(node?.title).not.toContain('<script>');
    });
  });
});
```

## Integration Tests

Test the complete diagram flow:

```typescript
// packages/mermaid/src/diagrams/{name}/{name}.spec.ts
import { describe, expect, it, beforeEach } from 'vitest';
import mermaid from '../../mermaid.js';
import { diagram } from './{name}Diagram.js';

describe('{name} diagram', () => {
  beforeEach(() => {
    mermaid.initialize({ startOnLoad: false });
  });

  it('should have required components', () => {
    expect(diagram.parser).toBeDefined();
    expect(diagram.db).toBeDefined();
    expect(diagram.renderer).toBeDefined();
    expect(diagram.styles).toBeDefined();
  });

  it('should parse and render basic diagram', async () => {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    try {
      const { svg } = await mermaid.render('test-id', `{name}
        node A "First"
        node B "Second"
        A --> B
      `);
      
      expect(svg).toContain('svg');
      expect(svg).toContain('First');
      expect(svg).toContain('Second');
    } finally {
      container.remove();
    }
  });

  describe('detector', () => {
    it('should detect {name} diagram', async () => {
      const type = await mermaid.detectType(`{name}
        node A
      `);
      
      expect(type).toBe('{name}');
    });
  });
});
```

## Cypress Visual Tests

Test rendered output in browser:

```typescript
// cypress/integration/rendering/{name}.spec.ts
import { imgSnapshotTest } from '../../helpers/util.ts';

describe('{Name} Diagram', () => {
  it('should render basic diagram', () => {
    imgSnapshotTest(
      `{name}
        node A "First Node"
        node B "Second Node"
        A --> B
      `,
      { logLevel: 1 }
    );
  });

  it('should render with multiple nodes', () => {
    imgSnapshotTest(
      `{name}
        node A
        node B
        node C
        node D
        A --> B
        B --> C
        C --> D
      `,
      { logLevel: 1 }
    );
  });

  it('should render with groups', () => {
    imgSnapshotTest(
      `{name}
        group G1 "Group 1"
        node A in G1
        node B in G1
        node C
        A --> B
        B --> C
      `,
      { logLevel: 1 }
    );
  });

  it('should render with labels', () => {
    imgSnapshotTest(
      `{name}
        node A "Start"
        node B "End"
        A -- "connects" --> B
      `,
      { logLevel: 1 }
    );
  });

  it('should render with accessibility', () => {
    imgSnapshotTest(
      `{name}
        accTitle: Accessible Diagram
        accDescr: This is a test diagram
        node A
        node B
        A --> B
      `,
      { logLevel: 1 }
    );
  });

  it('should apply theme', () => {
    imgSnapshotTest(
      `{name}
        node A
        node B
        A --> B
      `,
      { logLevel: 1, theme: 'dark' }
    );
  });
});
```

## Snapshot Testing

For complex rendered output:

```typescript
// packages/mermaid/src/diagrams/{name}/{name}.spec.ts
import { describe, expect, it } from 'vitest';
import mermaid from '../../mermaid.js';

describe('{name} snapshots', () => {
  it('should match basic diagram snapshot', async () => {
    const { svg } = await mermaid.render('snapshot-test', `{name}
      node A "Node A"
      node B "Node B"
      A --> B
    `);
    
    expect(svg).toMatchSnapshot();
  });
});
```

## Test Utilities

### Helper Functions

```typescript
// packages/mermaid/src/diagrams/{name}/testUtils.ts
import { {Name}DB } from './{name}Db.js';

export function createTestDB(): {Name}DB {
  const db = new {Name}DB();
  return db;
}

export function createPopulatedDB(): {Name}DB {
  const db = createTestDB();
  db.addNode({ id: 'A', title: 'Node A' });
  db.addNode({ id: 'B', title: 'Node B' });
  db.addEdge({ source: 'A', target: 'B' });
  return db;
}

export function parseDiagram(text: string): {Name}DB {
  const db = createTestDB();
  // Parse and populate
  return db;
}
```

### Mock Data

```typescript
// packages/mermaid/src/diagrams/{name}/__mocks__/{name}Data.ts
export const basicDiagram = `{name}
  node A
  node B
  A --> B
`;

export const complexDiagram = `{name}
  accTitle: Complex Diagram
  
  group G1 "Frontend"
  group G2 "Backend"
  
  node UI "User Interface" in G1
  node API "REST API" in G2
  node DB "Database" in G2
  
  UI --> API
  API --> DB
`;

export const edgeCases = {
  empty: `{name}`,
  singleNode: `{name}\n  node A`,
  selfLoop: `{name}\n  node A\n  A --> A`,
  unicodeLabels: `{name}\n  node A "???"`,
};
```

## Running Tests

### Unit Tests

```bash
# Run all tests
pnpm test

# Run specific diagram tests
pnpm test {name}

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### Cypress Tests

```bash
# Open Cypress UI
pnpm cypress:open

# Run headless
pnpm cypress:run

# Update snapshots
pnpm cypress:run --env updateSnapshots=true
```

## Test Coverage Requirements

| Component | Minimum Coverage |
|-----------|-----------------|
| Parser | 90% |
| Database | 95% |
| Detector | 100% |
| Renderer | 80% |

## Best Practices

1. **Test in isolation**: Each test should be independent
2. **Use beforeEach**: Reset state between tests
3. **Test edge cases**: Empty inputs, special characters, large data
4. **Test errors**: Verify error messages and handling
5. **Use snapshots wisely**: For complex output, not for every test
6. **Mock external dependencies**: Don't rely on network/filesystem
7. **Test accessibility**: Verify ARIA attributes and roles
8. **Test themes**: Check rendering with different themes
9. **Document test cases**: Use descriptive test names
10. **Keep tests fast**: Unit tests should run in milliseconds
