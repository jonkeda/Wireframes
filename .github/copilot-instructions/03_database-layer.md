# Database Layer Implementation

This instruction file documents the database/state management pattern for Mermaid diagrams.

## DiagramDB Interface

Every diagram database must implement the `DiagramDB` interface:

```typescript
import type { DiagramDB } from '../../diagram-api/types.js';

export class {Name}DB implements DiagramDB {
  // State properties
  private nodes = new Map<string, {Name}Node>();
  private edges: {Name}Edge[] = [];
  
  constructor() {
    this.clear();
  }
  
  // Required: Clear all state
  public clear(): void {
    this.nodes.clear();
    this.edges = [];
    commonClear();  // Clear common state (title, accessibility)
  }
  
  // ... additional methods
}
```

## Required Common Methods

Import and expose these common database utilities:

```typescript
import {
  clear as commonClear,
  getAccTitle,
  setAccTitle,
  getAccDescription,
  setAccDescription,
  getDiagramTitle,
  setDiagramTitle,
} from '../common/commonDb.js';

export class {Name}DB implements DiagramDB {
  // Expose common methods
  public getAccTitle = getAccTitle;
  public setAccTitle = setAccTitle;
  public getAccDescription = getAccDescription;
  public setAccDescription = setAccDescription;
  public getDiagramTitle = getDiagramTitle;
  public setDiagramTitle = setDiagramTitle;
  
  public clear(): void {
    // Clear diagram-specific state
    this.nodes.clear();
    this.edges = [];
    // Clear common state
    commonClear();
  }
}
```

## State Management Patterns

### Node Management

```typescript
export class {Name}DB implements DiagramDB {
  private nodes = new Map<string, {Name}Node>();
  private nodeOrder: string[] = [];  // Maintain insertion order if needed
  
  public addNode(node: {Name}Node): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node with id '${node.id}' already exists`);
    }
    this.nodes.set(node.id, node);
    this.nodeOrder.push(node.id);
  }
  
  public getNode(id: string): {Name}Node | undefined {
    return this.nodes.get(id);
  }
  
  public getNodes(): {Name}Node[] {
    return Array.from(this.nodes.values());
  }
  
  public getNodesInOrder(): {Name}Node[] {
    return this.nodeOrder
      .map(id => this.nodes.get(id))
      .filter((n): n is {Name}Node => n !== undefined);
  }
  
  public hasNode(id: string): boolean {
    return this.nodes.has(id);
  }
  
  public updateNode(id: string, updates: Partial<{Name}Node>): void {
    const node = this.nodes.get(id);
    if (!node) {
      throw new Error(`Node with id '${id}' not found`);
    }
    this.nodes.set(id, { ...node, ...updates });
  }
}
```

### Edge Management

```typescript
export class {Name}DB implements DiagramDB {
  private edges: {Name}Edge[] = [];
  private edgeIndex = new Map<string, {Name}Edge>();
  
  public addEdge(edge: {Name}Edge): void {
    const edgeId = `${edge.source}-${edge.target}`;
    if (this.edgeIndex.has(edgeId)) {
      // Handle duplicate edge (update or error)
      return;
    }
    this.edges.push(edge);
    this.edgeIndex.set(edgeId, edge);
  }
  
  public getEdges(): {Name}Edge[] {
    return [...this.edges];
  }
  
  public getEdgesFrom(nodeId: string): {Name}Edge[] {
    return this.edges.filter(e => e.source === nodeId);
  }
  
  public getEdgesTo(nodeId: string): {Name}Edge[] {
    return this.edges.filter(e => e.target === nodeId);
  }
}
```

### Hierarchical Data (Groups/Parents)

```typescript
export class {Name}DB implements DiagramDB {
  private nodes = new Map<string, {Name}Node>();
  private groups = new Map<string, {Name}Group>();
  private registeredIds = new Map<string, 'node' | 'group'>();
  
  public addGroup(group: {Name}Group): void {
    if (this.registeredIds.has(group.id)) {
      throw new Error(`ID '${group.id}' already in use`);
    }
    this.registeredIds.set(group.id, 'group');
    this.groups.set(group.id, group);
  }
  
  public addNode(node: {Name}Node): void {
    if (this.registeredIds.has(node.id)) {
      throw new Error(`ID '${node.id}' already in use`);
    }
    
    // Validate parent exists and is a group
    if (node.parent) {
      const parentType = this.registeredIds.get(node.parent);
      if (!parentType) {
        throw new Error(`Parent '${node.parent}' not found`);
      }
      if (parentType !== 'group') {
        throw new Error(`Parent '${node.parent}' is not a group`);
      }
    }
    
    this.registeredIds.set(node.id, 'node');
    this.nodes.set(node.id, node);
  }
  
  public getChildren(groupId: string): {Name}Node[] {
    return this.getNodes().filter(n => n.parent === groupId);
  }
  
  public getRootNodes(): {Name}Node[] {
    return this.getNodes().filter(n => !n.parent);
  }
}
```

## Configuration Access

```typescript
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { {Name}DiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { cleanAndMerge } from '../../utils.js';

export class {Name}DB implements DiagramDB {
  private config: {Name}DiagramConfig;
  
  constructor() {
    const defaultConfig = DEFAULT_CONFIG.{name} ?? {};
    const userConfig = getConfig().{name} ?? {};
    this.config = cleanAndMerge(defaultConfig, userConfig);
    this.clear();
  }
  
  public getConfig(): {Name}DiagramConfig {
    return this.config;
  }
  
  public getConfigField<K extends keyof {Name}DiagramConfig>(
    field: K
  ): {Name}DiagramConfig[K] {
    return this.config[field];
  }
}
```

## Element Reference Storage

For storing D3 element references (used by renderer):

```typescript
import type { D3Element } from '../../types.js';

export class {Name}DB implements DiagramDB {
  private elements = new Map<string, D3Element>();
  
  public setElement(id: string, element: D3Element): void {
    this.elements.set(id, element);
  }
  
  public getElementById(id: string): D3Element | undefined {
    return this.elements.get(id);
  }
  
  public clear(): void {
    this.elements.clear();
    // ... clear other state
    commonClear();
  }
}
```

## Callback/Event Functions

For interactive diagrams with click handlers:

```typescript
export class {Name}DB implements DiagramDB {
  private callbacks: ((element: Element) => void)[] = [];
  
  public addCallback(fn: (element: Element) => void): void {
    this.callbacks.push(fn);
  }
  
  public bindFunctions(element: Element): void {
    this.callbacks.forEach(fn => fn(element));
  }
  
  public setClickEvent(nodeId: string, callback: string): void {
    // Register click handler for node
  }
}
```

## Text Sanitization

Always sanitize user-provided text:

```typescript
import common from '../common/common.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';

export class {Name}DB implements DiagramDB {
  private config = getConfig();
  
  private sanitizeText(text: string): string {
    return common.sanitizeText(text, this.config);
  }
  
  public addNode(node: {Name}Node): void {
    const sanitizedNode = {
      ...node,
      title: node.title ? this.sanitizeText(node.title) : undefined,
      description: node.description ? this.sanitizeText(node.description) : undefined,
    };
    this.nodes.set(sanitizedNode.id, sanitizedNode);
  }
}
```

## Complete Example

```typescript
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import common from '../common/common.js';
import {
  clear as commonClear,
  getAccTitle,
  setAccTitle,
  getAccDescription,
  setAccDescription,
  getDiagramTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type { {Name}Node, {Name}Edge, {Name}Config } from './{name}Types.js';

export class {Name}DB implements DiagramDB {
  private nodes = new Map<string, {Name}Node>();
  private edges: {Name}Edge[] = [];
  private config = getConfig();
  
  // Common accessors
  public getAccTitle = getAccTitle;
  public setAccTitle = setAccTitle;
  public getAccDescription = getAccDescription;
  public setAccDescription = setAccDescription;
  public getDiagramTitle = getDiagramTitle;
  public setDiagramTitle = setDiagramTitle;
  
  constructor() {
    this.clear();
  }
  
  public clear(): void {
    this.nodes.clear();
    this.edges = [];
    commonClear();
  }
  
  private sanitizeText(text: string): string {
    return common.sanitizeText(text, this.config);
  }
  
  public addNode(node: {Name}Node): void {
    if (this.nodes.has(node.id)) {
      log.warn(`Node '${node.id}' already exists, skipping`);
      return;
    }
    this.nodes.set(node.id, {
      ...node,
      title: node.title ? this.sanitizeText(node.title) : undefined,
    });
  }
  
  public addEdge(edge: {Name}Edge): void {
    if (!this.nodes.has(edge.source)) {
      throw new Error(`Source node '${edge.source}' not found`);
    }
    if (!this.nodes.has(edge.target)) {
      throw new Error(`Target node '${edge.target}' not found`);
    }
    this.edges.push(edge);
  }
  
  public getNodes(): {Name}Node[] {
    return Array.from(this.nodes.values());
  }
  
  public getEdges(): {Name}Edge[] {
    return [...this.edges];
  }
}
```

## Best Practices

1. **Always implement `clear()`**: Reset all state including calling `commonClear()`
2. **Validate inputs**: Check for duplicates, missing references
3. **Sanitize text**: Use `common.sanitizeText()` for user content
4. **Use Maps for lookups**: Efficient O(1) access by ID
5. **Maintain immutability**: Return copies of arrays, not references
6. **Log warnings**: Use `log.warn()` for non-fatal issues
7. **Throw on errors**: Use descriptive error messages
8. **Type everything**: Define interfaces in `{name}Types.ts`
