# Renderer Implementation Guide

This instruction file guides SVG rendering implementation for Mermaid diagrams.

## Renderer Structure

The renderer exports a `draw` function that creates SVG elements:

```typescript
import type { DrawDefinition } from '../../diagram-api/types.js';
import type { Diagram } from '../../Diagram.js';

export const renderer: DrawDefinition = {
  draw: async (text: string, id: string, version: string, diagObj: Diagram) => {
    // Get database instance
    const db = diagObj.db as {Name}DB;
    
    // Select SVG container
    const svg = selectSvgElement(id);
    
    // Render diagram
    await renderNodes(svg, db);
    await renderEdges(svg, db);
    
    // Set viewBox for responsive sizing
    setupGraphViewbox(undefined, svg, ...);
  },
};
```

## Essential Imports

```typescript
import { select } from 'd3';
import type { DrawDefinition, SVG } from '../../diagram-api/types.js';
import type { Diagram } from '../../Diagram.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { {Name}DB } from './{name}Db.js';
```

## SVG Container Setup

```typescript
export const renderer: DrawDefinition = {
  draw: async (text: string, id: string, version: string, diagObj: Diagram) => {
    const db = diagObj.db as {Name}DB;
    const config = db.getConfig();
    
    // Get or create SVG element
    const svg = selectSvgElement(id);
    
    // Clear previous content
    svg.selectAll('*').remove();
    
    // Add accessibility attributes
    svg.attr('role', 'img');
    svg.attr('aria-label', db.getAccTitle() || 'Diagram');
    
    // Create main group for transformations
    const g = svg.append('g')
      .attr('class', '{name}-diagram');
    
    // ... render content
  },
};
```

## Rendering Nodes

### Basic Node Rendering

```typescript
function renderNodes(g: SVG, db: {Name}DB): void {
  const nodes = db.getNodes();
  const nodeGroup = g.append('g').attr('class', 'nodes');
  
  nodes.forEach((node, index) => {
    const nodeEl = nodeGroup.append('g')
      .attr('class', 'node')
      .attr('id', `node-${node.id}`)
      .attr('transform', `translate(${node.x ?? 0}, ${node.y ?? 0})`);
    
    // Draw node shape
    nodeEl.append('rect')
      .attr('class', 'node-bg')
      .attr('width', node.width ?? 100)
      .attr('height', node.height ?? 50)
      .attr('rx', 5)
      .attr('ry', 5);
    
    // Draw node label
    nodeEl.append('text')
      .attr('class', 'node-label')
      .attr('x', (node.width ?? 100) / 2)
      .attr('y', (node.height ?? 50) / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(node.title ?? node.id);
    
    // Store element reference in database
    db.setElement(node.id, nodeEl);
  });
}
```

### Node Shapes

```typescript
function drawShape(
  parent: SVG,
  shape: 'rect' | 'circle' | 'diamond' | 'ellipse',
  width: number,
  height: number
): void {
  switch (shape) {
    case 'rect':
      parent.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('rx', 5);
      break;
      
    case 'circle':
      parent.append('circle')
        .attr('r', Math.min(width, height) / 2)
        .attr('cx', width / 2)
        .attr('cy', height / 2);
      break;
      
    case 'diamond':
      const points = [
        [width / 2, 0],
        [width, height / 2],
        [width / 2, height],
        [0, height / 2],
      ];
      parent.append('polygon')
        .attr('points', points.map(p => p.join(',')).join(' '));
      break;
      
    case 'ellipse':
      parent.append('ellipse')
        .attr('rx', width / 2)
        .attr('ry', height / 2)
        .attr('cx', width / 2)
        .attr('cy', height / 2);
      break;
  }
}
```

## Rendering Edges

### Basic Edge Rendering

```typescript
function renderEdges(g: SVG, db: {Name}DB): void {
  const edges = db.getEdges();
  const edgeGroup = g.append('g').attr('class', 'edges');
  
  edges.forEach((edge, index) => {
    const sourceNode = db.getNode(edge.source);
    const targetNode = db.getNode(edge.target);
    
    if (!sourceNode || !targetNode) {
      log.warn(`Edge references missing node: ${edge.source} -> ${edge.target}`);
      return;
    }
    
    const edgeEl = edgeGroup.append('g')
      .attr('class', 'edge')
      .attr('id', `edge-${index}`);
    
    // Calculate path
    const path = calculateEdgePath(sourceNode, targetNode);
    
    // Draw edge line
    edgeEl.append('path')
      .attr('class', 'edge-line')
      .attr('d', path)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowhead)');
    
    // Draw edge label if present
    if (edge.label) {
      const midpoint = getPathMidpoint(path);
      edgeEl.append('text')
        .attr('class', 'edge-label')
        .attr('x', midpoint.x)
        .attr('y', midpoint.y)
        .attr('text-anchor', 'middle')
        .text(edge.label);
    }
  });
}
```

### Arrow Markers

```typescript
function defineMarkers(svg: SVG): void {
  const defs = svg.append('defs');
  
  // Arrowhead marker
  defs.append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('class', 'arrow');
  
  // Circle marker
  defs.append('marker')
    .attr('id', 'circle')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 5)
    .attr('refY', 5)
    .attr('markerWidth', 5)
    .attr('markerHeight', 5)
    .append('circle')
    .attr('cx', 5)
    .attr('cy', 5)
    .attr('r', 4)
    .attr('class', 'marker-circle');
}
```

### Path Calculations

```typescript
import { line, curveBasis, curveLinear } from 'd3';

function calculateEdgePath(
  source: {Name}Node,
  target: {Name}Node,
  curved: boolean = false
): string {
  const sourceCenter = {
    x: (source.x ?? 0) + (source.width ?? 100) / 2,
    y: (source.y ?? 0) + (source.height ?? 50) / 2,
  };
  
  const targetCenter = {
    x: (target.x ?? 0) + (target.width ?? 100) / 2,
    y: (target.y ?? 0) + (target.height ?? 50) / 2,
  };
  
  const points: [number, number][] = [
    [sourceCenter.x, sourceCenter.y],
    [targetCenter.x, targetCenter.y],
  ];
  
  const lineGenerator = line()
    .curve(curved ? curveBasis : curveLinear);
  
  return lineGenerator(points) ?? '';
}

function calculateOrthogonalPath(
  source: {Name}Node,
  target: {Name}Node
): string {
  const sx = (source.x ?? 0) + (source.width ?? 100);
  const sy = (source.y ?? 0) + (source.height ?? 50) / 2;
  const tx = target.x ?? 0;
  const ty = (target.y ?? 0) + (target.height ?? 50) / 2;
  
  const mx = (sx + tx) / 2;
  
  return `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${ty} L ${tx} ${ty}`;
}
```

## Layout Algorithms

### Manual Positioning

```typescript
function applyManualLayout(nodes: {Name}Node[], config: {Name}Config): void {
  const padding = config.nodePadding ?? 20;
  const nodeWidth = config.nodeWidth ?? 100;
  const nodeHeight = config.nodeHeight ?? 50;
  
  let x = padding;
  let y = padding;
  let rowHeight = 0;
  const maxWidth = config.diagramWidth ?? 800;
  
  nodes.forEach(node => {
    if (x + nodeWidth > maxWidth) {
      x = padding;
      y += rowHeight + padding;
      rowHeight = 0;
    }
    
    node.x = x;
    node.y = y;
    node.width = nodeWidth;
    node.height = nodeHeight;
    
    x += nodeWidth + padding;
    rowHeight = Math.max(rowHeight, nodeHeight);
  });
}
```

### Using Cytoscape for Layout

```typescript
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';

cytoscape.use(fcose);

async function applyGraphLayout(db: {Name}DB): Promise<void> {
  const cy = cytoscape({
    headless: true,
    styleEnabled: false,
  });
  
  // Add nodes
  db.getNodes().forEach(node => {
    cy.add({
      group: 'nodes',
      data: {
        id: node.id,
        width: node.width ?? 100,
        height: node.height ?? 50,
      },
    });
  });
  
  // Add edges
  db.getEdges().forEach((edge, index) => {
    cy.add({
      group: 'edges',
      data: {
        id: `e${index}`,
        source: edge.source,
        target: edge.target,
      },
    });
  });
  
  // Run layout
  const layout = cy.layout({
    name: 'fcose',
    animate: false,
    nodeDimensionsIncludeLabels: true,
    idealEdgeLength: 100,
  });
  
  await layout.run().promiseOn('layoutstop');
  
  // Copy positions back to database
  cy.nodes().forEach(cyNode => {
    const node = db.getNode(cyNode.id());
    if (node) {
      node.x = cyNode.position().x;
      node.y = cyNode.position().y;
    }
  });
}
```

## Responsive Sizing

```typescript
export const renderer: DrawDefinition = {
  draw: async (text: string, id: string, version: string, diagObj: Diagram) => {
    const db = diagObj.db as {Name}DB;
    const svg = selectSvgElement(id);
    
    // Render content...
    const g = svg.append('g');
    renderNodes(g, db);
    renderEdges(g, db);
    
    // Calculate bounding box
    const bbox = (g.node() as SVGGElement).getBBox();
    const padding = 10;
    
    // Set viewBox for responsive sizing
    setupGraphViewbox(
      undefined,  // graph (optional)
      svg,
      padding,
      db.getConfig().useMaxWidth ?? true
    );
    
    // Or manually:
    svg.attr('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`);
  },
};
```

## Accessibility

```typescript
function addAccessibility(svg: SVG, db: {Name}DB): void {
  const title = db.getAccTitle();
  const description = db.getAccDescription();
  
  svg.attr('role', 'img');
  
  if (title) {
    svg.attr('aria-label', title);
    svg.insert('title', ':first-child').text(title);
  }
  
  if (description) {
    svg.insert('desc', 'title + *').text(description);
  }
  
  // Mark decorative elements
  svg.selectAll('.edge-line').attr('aria-hidden', 'true');
}
```

## Interactive Elements

```typescript
function addInteractivity(g: SVG, db: {Name}DB): void {
  g.selectAll('.node')
    .style('cursor', 'pointer')
    .on('click', function(event, d) {
      const nodeId = select(this).attr('id').replace('node-', '');
      db.triggerCallback(nodeId, event);
    })
    .on('mouseover', function() {
      select(this).classed('hover', true);
    })
    .on('mouseout', function() {
      select(this).classed('hover', false);
    });
}
```

## Complete Example

```typescript
import { select } from 'd3';
import type { DrawDefinition, SVG } from '../../diagram-api/types.js';
import type { Diagram } from '../../Diagram.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import type { {Name}DB } from './{name}Db.js';

export const renderer: DrawDefinition = {
  draw: async (text: string, id: string, version: string, diagObj: Diagram) => {
    log.info('Rendering {name} diagram');
    
    const db = diagObj.db as {Name}DB;
    const config = db.getConfig();
    
    // Setup SVG
    const svg = selectSvgElement(id);
    svg.selectAll('*').remove();
    
    // Add markers
    defineMarkers(svg);
    
    // Create main group
    const g = svg.append('g').attr('class', '{name}-diagram');
    
    // Apply layout
    await applyGraphLayout(db);
    
    // Render elements
    renderNodes(g, db);
    renderEdges(g, db);
    
    // Add accessibility
    addAccessibility(svg, db);
    
    // Setup viewBox
    setupGraphViewbox(undefined, svg, 10, config.useMaxWidth ?? true);
    
    log.info('{Name} diagram rendered successfully');
  },
};
```

## Best Practices

1. **Clear previous content**: Always remove existing elements before re-rendering
2. **Use groups**: Organize elements in `<g>` containers for styling and transforms
3. **Define markers once**: Create arrow/shape markers in `<defs>`
4. **Support accessibility**: Add ARIA attributes, title, and description
5. **Handle errors gracefully**: Log warnings for missing nodes/edges
6. **Use viewBox**: Enable responsive sizing instead of fixed dimensions
7. **Separate concerns**: Split rendering into functions (nodes, edges, labels)
8. **Store element references**: Save D3 selections in database for later access
