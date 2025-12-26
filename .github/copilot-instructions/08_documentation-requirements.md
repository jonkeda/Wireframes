# Documentation Requirements

This instruction file defines documentation requirements for new Mermaid diagram types.

## Required Documentation Files

| File | Location | Purpose |
|------|----------|---------|
| Syntax Guide | `docs/syntax/{name}.md` | User-facing syntax reference |
| Source Docs | `packages/mermaid/src/docs/syntax/{name}.md` | Source for generated docs |
| Examples | `packages/examples/src/examples/{name}.ts` | Code examples |
| Demo Page | `demos/{name}.html` | Interactive demo |

## Syntax Documentation Template

Create `packages/mermaid/src/docs/syntax/{name}.md`:

```markdown
# {Diagram Name}

> {Brief description of what this diagram type visualizes and its use cases.}

## Basic Syntax

The basic syntax for a {name} diagram:

\`\`\`mermaid-example
{name}
    node A "First Node"
    node B "Second Node"
    A --> B
\`\`\`

## Nodes

### Simple Nodes

Nodes are defined using the \`node\` keyword:

\`\`\`mermaid-example
{name}
    node myNode
\`\`\`

### Nodes with Labels

Add labels in quotes:

\`\`\`mermaid-example
{name}
    node A "My Label"
\`\`\`

### Node Types

Different node types can be specified:

| Type | Syntax | Description |
|------|--------|-------------|
| Default | \`node A\` | Standard node |
| Service | \`service A\` | Service component |
| Group | \`group A\` | Container for other nodes |

## Edges

### Basic Edges

Connect nodes with arrows:

\`\`\`mermaid-example
{name}
    node A
    node B
    A --> B
\`\`\`

### Edge Labels

Add labels to edges:

\`\`\`mermaid-example
{name}
    node A
    node B
    A -- "connects to" --> B
\`\`\`

### Edge Types

| Type | Syntax | Description |
|------|--------|-------------|
| Arrow | \`A --> B\` | Directional |
| Line | \`A --- B\` | Non-directional |
| Dashed | \`A -.-> B\` | Dashed arrow |

## Groups

Organize nodes into groups:

\`\`\`mermaid-example
{name}
    group G1 "Frontend"
    node A in G1
    node B in G1
    
    group G2 "Backend"
    node C in G2
    
    A --> C
\`\`\`

## Configuration

### Diagram-Specific Config

\`\`\`javascript
mermaid.initialize({
  {name}: {
    nodeWidth: 100,
    nodeHeight: 50,
    edgeWidth: 2,
  }
});
\`\`\`

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| \`nodeWidth\` | \`100\` | Width of nodes in pixels |
| \`nodeHeight\` | \`50\` | Height of nodes in pixels |
| \`edgeWidth\` | \`2\` | Stroke width of edges |
| \`useMaxWidth\` | \`true\` | Scale to container width |

## Accessibility

### Title and Description

Add accessible title and description:

\`\`\`mermaid-example
{name}
    accTitle: System Architecture
    accDescr: Shows the main components of the system
    
    node A
    node B
    A --> B
\`\`\`

## Examples

### Simple Flow

\`\`\`mermaid-example
{name}
    node Start
    node Process
    node End
    
    Start --> Process
    Process --> End
\`\`\`

### With Groups

\`\`\`mermaid-example
{name}
    group Frontend
    node UI in Frontend
    node State in Frontend
    
    group Backend
    node API in Backend
    node DB in Backend
    
    UI --> API
    API --> DB
    State --> UI
\`\`\`

### Complex Example

\`\`\`mermaid-example
{name}
    accTitle: E-Commerce Architecture
    
    group Client "Client Layer"
    node Web "Web App" in Client
    node Mobile "Mobile App" in Client
    
    group Services "Service Layer"
    node Gateway "API Gateway" in Services
    node Auth "Auth Service" in Services
    node Products "Product Service" in Services
    node Orders "Order Service" in Services
    
    group Data "Data Layer"
    node Cache "Redis Cache" in Data
    node MainDB "PostgreSQL" in Data
    
    Web --> Gateway
    Mobile --> Gateway
    Gateway --> Auth
    Gateway --> Products
    Gateway --> Orders
    Products --> Cache
    Products --> MainDB
    Orders --> MainDB
\`\`\`
```

## Code Block Formats

### mermaid-example

Shows both code and rendered diagram:

````markdown
\`\`\`mermaid-example
{name}
    node A
    node B
\`\`\`
````

### mermaid

Shows only rendered diagram:

````markdown
\`\`\`mermaid
{name}
    node A
    node B
\`\`\`
````

### Code-only

Shows only code (no rendering):

````markdown
\`\`\`text
{name}
    node A
    node B
\`\`\`
````

## Examples File

Create `packages/examples/src/examples/{name}.ts`:

```typescript
export const basic = `{name}
    node A "Start"
    node B "End"
    A --> B
`;

export const withGroups = `{name}
    group G1 "Group 1"
    node A in G1
    node B in G1
    
    node C
    
    A --> B
    B --> C
`;

export const withLabels = `{name}
    node A "Node A"
    node B "Node B"
    A -- "connects" --> B
`;

export const complex = `{name}
    accTitle: Complex Diagram
    accDescr: A more complex example
    
    group Frontend
    node UI in Frontend
    node Router in Frontend
    
    group Backend
    node API in Backend
    node Service in Backend
    node DB in Backend
    
    UI --> Router
    Router --> API
    API --> Service
    Service --> DB
`;

export const examples = {
  basic,
  withGroups,
  withLabels,
  complex,
};

export default examples;
```

## Demo Page

Create `demos/{name}.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Name} Diagram Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { color: #333; }
    .demo-container {
      margin: 20px 0;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
    }
    .mermaid {
      background: white;
      padding: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>{Name} Diagram Demo</h1>
  
  <div class="demo-container">
    <h2>Basic Example</h2>
    <pre class="mermaid">
{name}
    node A "Start"
    node B "Process"
    node C "End"
    A --> B
    B --> C
    </pre>
  </div>

  <div class="demo-container">
    <h2>With Groups</h2>
    <pre class="mermaid">
{name}
    group Frontend "Frontend"
    node UI in Frontend
    node State in Frontend
    
    group Backend "Backend"
    node API in Backend
    node DB in Backend
    
    UI --> API
    State --> UI
    API --> DB
    </pre>
  </div>

  <div class="demo-container">
    <h2>Complex Example</h2>
    <pre class="mermaid">
{name}
    accTitle: System Architecture
    
    group Client
    node Web "Web App" in Client
    node Mobile "Mobile App" in Client
    
    group Services
    node Gateway "API Gateway" in Services
    node Auth "Auth" in Services
    node Core "Core API" in Services
    
    group Data
    node Cache "Cache" in Data
    node DB "Database" in Data
    
    Web --> Gateway
    Mobile --> Gateway
    Gateway --> Auth
    Gateway --> Core
    Core --> Cache
    Core --> DB
    </pre>
  </div>

  <script type="module">
    import mermaid from '../packages/mermaid/dist/mermaid.esm.mjs';
    
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      {name}: {
        // Diagram-specific config
      }
    });
  </script>
</body>
</html>
```

## README Updates

Update `README.md` to include new diagram:

```markdown
## Supported Diagrams

...existing diagrams...

- [{Name} Diagram](docs/syntax/{name}.md) - {Brief description}
```

## Documentation Style Guidelines

### Writing Style

- Use **present tense**: "The node displays..." not "The node will display..."
- Use **active voice**: "Configure the diagram" not "The diagram is configured"
- Be **concise**: Avoid unnecessary words
- Use **examples**: Show, don't just tell

### Code Examples

- **Keep examples simple**: Show one concept per example
- **Use meaningful names**: `UserService` not `A` where appropriate
- **Include comments**: In complex examples only
- **Show expected output**: When helpful

### Tables

Use tables for:
- Configuration options
- Syntax reference
- Edge/node type lists

### Accessibility

- Provide alt text concepts for diagrams
- Document accessibility features prominently
- Include `accTitle` and `accDescr` in examples

## Documentation Build

```bash
# Build documentation
pnpm docs:build

# Preview documentation
pnpm docs:dev

# Check for broken links
pnpm docs:check
```

## Best Practices

1. **Start with examples**: Users learn by example
2. **Progressive complexity**: Simple ? Complex examples
3. **Document all options**: Every config option needs docs
4. **Include accessibility**: Always show accTitle/accDescr usage
5. **Keep in sync**: Update docs when code changes
6. **Test examples**: All code examples should work
7. **Use consistent formatting**: Follow existing doc style
8. **Link related docs**: Cross-reference other diagrams
9. **Document errors**: Common mistakes and solutions
10. **Version notes**: Document breaking changes
