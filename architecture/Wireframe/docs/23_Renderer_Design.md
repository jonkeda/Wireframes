# Wireframe Renderer Design

## Document Information
- **Version:** 1.0
- **Date:** 2025
- **Status:** Draft
- **Parent:** [20_Architecture_Overview](./20_Architecture_Overview.md)

---

## 1. Overview

This document describes the Wireframe rendering system, which transforms the AST into visual SVG/HTML output with support for multiple themes and interactive features.

---

## 2. Renderer Architecture

### 2.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Renderer Pipeline                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │   AST    │ → │  Layout  │ → │  Render  │ → │   SVG    │  │
│  │          │    │  Engine  │    │  Engine  │    │  Output  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                       │               │                         │
│                       ▼               ▼                         │
│                ┌──────────┐    ┌──────────┐                    │
│                │  Layout  │    │  Theme   │                    │
│                │  Tree    │    │  Styles  │                    │
│                └──────────┘    └──────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Rendering Phases

| Phase | Input | Output | Description |
|-------|-------|--------|-------------|
| 1. Layout | AST | Layout Tree | Calculate sizes and positions |
| 2. Render | Layout Tree | SVG Elements | Generate SVG primitives |
| 3. Style | SVG Elements | Styled SVG | Apply theme CSS |
| 4. Output | Styled SVG | String/DOM | Serialize or insert |

---

## 3. Layout Engine

### 3.1 Layout Tree

```typescript
// src/layout/types.ts

interface LayoutNode {
    element: Element;          // Reference to AST node
    bounds: Rectangle;         // Calculated bounds
    contentBounds: Rectangle;  // Inner content area
    children: LayoutNode[];    // Child layouts
    style: ComputedStyle;      // Resolved styles
}

interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ComputedStyle {
    width: number | 'auto';
    height: number | 'auto';
    padding: Spacing;
    margin: Spacing;
    gap: number;
    align: 'start' | 'center' | 'end' | 'stretch';
    justify: 'start' | 'center' | 'end' | 'between' | 'around';
}

interface Spacing {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
```

### 3.2 Layout Algorithms

```typescript
// src/layout/engine.ts

export class LayoutEngine {
    private theme: Theme;
    private defaultSizes: Map<string, Size>;

    constructor(theme: Theme) {
        this.theme = theme;
        this.initDefaultSizes();
    }

    calculate(document: Document, options: LayoutOptions): LayoutNode {
        const root: LayoutNode = {
            element: document as any,
            bounds: { x: 0, y: 0, width: options.width, height: 0 },
            contentBounds: { x: 0, y: 0, width: options.width, height: 0 },
            children: [],
            style: this.getDefaultStyle()
        };

        // First pass: measure all elements
        this.measureTree(root, document.body);

        // Second pass: layout all elements
        this.layoutTree(root);

        return root;
    }

    private measureTree(parent: LayoutNode, elements: Element[]): void {
        for (const element of elements) {
            const node = this.createLayoutNode(element);
            parent.children.push(node);

            // Recursively measure children
            if ('children' in element && element.children) {
                this.measureTree(node, element.children);
            }
        }
    }

    private layoutTree(node: LayoutNode): void {
        const element = node.element;

        switch (element.type) {
            case 'Layout':
                this.layoutLayout(node, element as Layout);
                break;
            case 'Section':
                this.layoutSection(node, element as Section);
                break;
            case 'Control':
                this.layoutControl(node, element as Control);
                break;
            case 'Component':
                this.layoutComponent(node, element as Component);
                break;
        }

        // Layout children
        node.children.forEach(child => this.layoutTree(child));
    }

    private layoutLayout(node: LayoutNode, layout: Layout): void {
        switch (layout.layoutType) {
            case 'Vertical':
                this.layoutVertical(node);
                break;
            case 'Horizontal':
                this.layoutHorizontal(node);
                break;
            case 'Grid':
                this.layoutGrid(node, layout.attributes);
                break;
            case 'Dock':
                this.layoutDock(node);
                break;
        }
    }

    private layoutVertical(node: LayoutNode): void {
        const gap = node.style.gap;
        const padding = node.style.padding;
        let y = padding.top;
        let maxWidth = 0;

        for (const child of node.children) {
            // Position child
            child.bounds.x = padding.left;
            child.bounds.y = y;

            // Apply alignment
            if (node.style.align === 'stretch') {
                child.bounds.width = node.contentBounds.width - padding.left - padding.right;
            }

            y += child.bounds.height + gap;
            maxWidth = Math.max(maxWidth, child.bounds.width);
        }

        // Update node bounds
        node.bounds.height = y - gap + padding.bottom;
        if (node.style.width === 'auto') {
            node.bounds.width = maxWidth + padding.left + padding.right;
        }
    }

    private layoutHorizontal(node: LayoutNode): void {
        const gap = node.style.gap;
        const padding = node.style.padding;
        let x = padding.left;
        let maxHeight = 0;

        // Calculate total width and flexible space
        let totalWidth = 0;
        let flexCount = 0;
        for (const child of node.children) {
            if (child.style.width === 'auto' || child.style.width === '*') {
                flexCount++;
            } else {
                totalWidth += child.bounds.width;
            }
        }

        const availableWidth = node.bounds.width - padding.left - padding.right - 
                               (node.children.length - 1) * gap;
        const flexWidth = flexCount > 0 . (availableWidth - totalWidth) / flexCount : 0;

        for (const child of node.children) {
            // Position child
            child.bounds.x = x;
            child.bounds.y = padding.top;

            // Apply flex width
            if (child.style.width === 'auto' || child.style.width === '*') {
                child.bounds.width = flexWidth;
            }

            x += child.bounds.width + gap;
            maxHeight = Math.max(maxHeight, child.bounds.height);
        }

        // Handle justification
        if (node.style.justify === 'end') {
            const shift = node.bounds.width - x + gap - padding.right;
            for (const child of node.children) {
                child.bounds.x += shift;
            }
        } else if (node.style.justify === 'center') {
            const shift = (node.bounds.width - x + gap - padding.right) / 2;
            for (const child of node.children) {
                child.bounds.x += shift;
            }
        } else if (node.style.justify === 'between' && node.children.length > 1) {
            const totalChildWidth = node.children.reduce((sum, c) => sum + c.bounds.width, 0);
            const extraSpace = availableWidth - totalChildWidth;
            const spacing = extraSpace / (node.children.length - 1);
            let currentX = padding.left;
            for (const child of node.children) {
                child.bounds.x = currentX;
                currentX += child.bounds.width + spacing;
            }
        }

        // Update node bounds
        node.bounds.height = maxHeight + padding.top + padding.bottom;
    }

    private layoutGrid(node: LayoutNode, attributes: Attributes): void {
        const cols = (attributes.cols as number) || 1;
        const rows = (attributes.rows as number) || Math.ceil(node.children.length / cols);
        const gap = node.style.gap;
        const padding = node.style.padding;

        const availableWidth = node.bounds.width - padding.left - padding.right - (cols - 1) * gap;
        const cellWidth = availableWidth / cols;

        let maxRowHeight = 0;
        let currentRow = 0;
        let currentCol = 0;
        let y = padding.top;

        for (const child of node.children) {
            child.bounds.x = padding.left + currentCol * (cellWidth + gap);
            child.bounds.y = y;
            child.bounds.width = cellWidth;

            maxRowHeight = Math.max(maxRowHeight, child.bounds.height);

            currentCol++;
            if (currentCol >= cols) {
                currentCol = 0;
                currentRow++;
                y += maxRowHeight + gap;
                maxRowHeight = 0;
            }
        }

        if (currentCol > 0) {
            y += maxRowHeight;
        }

        node.bounds.height = y + padding.bottom;
    }

    private layoutDock(node: LayoutNode): void {
        let top = 0, bottom = node.bounds.height, left = 0, right = node.bounds.width;

        for (const child of node.children) {
            const dock = (child.element as any).attributes..dock || 'fill';

            switch (dock) {
                case 'top':
                    child.bounds.x = left;
                    child.bounds.y = top;
                    child.bounds.width = right - left;
                    top += child.bounds.height;
                    break;
                case 'bottom':
                    child.bounds.x = left;
                    child.bounds.y = bottom - child.bounds.height;
                    child.bounds.width = right - left;
                    bottom -= child.bounds.height;
                    break;
                case 'left':
                    child.bounds.x = left;
                    child.bounds.y = top;
                    child.bounds.height = bottom - top;
                    left += child.bounds.width;
                    break;
                case 'right':
                    child.bounds.x = right - child.bounds.width;
                    child.bounds.y = top;
                    child.bounds.height = bottom - top;
                    right -= child.bounds.width;
                    break;
                case 'fill':
                    child.bounds.x = left;
                    child.bounds.y = top;
                    child.bounds.width = right - left;
                    child.bounds.height = bottom - top;
                    break;
            }
        }
    }
}
```

---

## 4. SVG Renderer

### 4.1 Render Engine

```typescript
// src/renderer/svg-renderer.ts

export class SvgRenderer {
    private theme: Theme;
    private defs: string[] = [];

    constructor(theme: Theme) {
        this.theme = theme;
    }

    render(layout: LayoutNode): string {
        this.defs = [];

        const content = this.renderNode(layout);
        const defsContent = this.defs.length > 0 
            . `<defs>${this.defs.join('\n')}</defs>`
            : '';

        return `
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${layout.bounds.width}" 
     height="${layout.bounds.height}"
     class="Wireframe-container Wireframe-theme-${this.theme.name}">
    ${defsContent}
    ${content}
</svg>
        `.trim();
    }

    private renderNode(node: LayoutNode): string {
        const element = node.element;

        switch (element.type) {
            case 'Layout':
            case 'Section':
                return this.renderContainer(node);
            case 'Control':
                return this.renderControl(node, element as Control);
            case 'Component':
                return this.renderComponent(node, element as Component);
            default:
                return '';
        }
    }

    private renderContainer(node: LayoutNode): string {
        const children = node.children.map(child => this.renderNode(child)).join('\n');
        
        // Check if section needs background
        const element = node.element;
        const sectionType = (element as Section).sectionType;
        
        let background = '';
        if (['Card', 'Panel', 'Header', 'Footer', 'Sidebar'].includes(sectionType)) {
            background = this.renderRectangle(node.bounds, `Wireframe-${sectionType.toLowerCase()}`);
        }

        return `
<g transform="translate(${node.bounds.x}, ${node.bounds.y})">
    ${background}
    ${children}
</g>
        `.trim();
    }

    private renderControl(node: LayoutNode, control: Control): string {
        switch (control.controlType) {
            case 'Button':
                return this.renderButton(node, control);
            case 'IconButton':
                return this.renderIconButton(node, control);
            case 'TextInput':
            case 'NumberInput':
            case 'DateInput':
            case 'PasswordInput':
                return this.renderInput(node, control);
            case 'TextArea':
                return this.renderTextArea(node, control);
            case 'Label':
                return this.renderLabel(node, control);
            case 'Checkbox':
                return this.renderCheckbox(node, control);
            case 'Radio':
                return this.renderRadio(node, control);
            case 'Dropdown':
                return this.renderDropdown(node, control);
            case 'Separator':
                return this.renderSeparator(node);
            case 'Icon':
                return this.renderIcon(node, control);
            case 'Image':
                return this.renderImage(node, control);
            default:
                return '';
        }
    }

    private renderButton(node: LayoutNode, control: Control): string {
        const { x, y, width, height } = node.bounds;
        const isPrimary = control.modifiers.includes('primary');
        const isSecondary = control.modifiers.includes('secondary');
        const isDisabled = control.modifiers.includes('disabled');

        const classes = [
            'Wireframe-button',
            isPrimary && 'primary',
            isSecondary && 'secondary',
            isDisabled && 'disabled'
        ].filter(Boolean).join(' ');

        const textY = y + height / 2;

        return `
<g class="${classes}" data-id="${control.id || ''}">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" 
          rx="${this.theme.borderRadius}" />
    <text x="${x + width / 2}" y="${textY}" 
          text-anchor="middle" dominant-baseline="central">
        ${this.escapeXml(control.text || '')}
    </text>
</g>
        `.trim();
    }

    private renderIconButton(node: LayoutNode, control: Control): string {
        const { x, y, width, height } = node.bounds;
        const isPrimary = control.modifiers.includes('primary');
        const hasText = !!control.text;

        const classes = [
            'Wireframe-button',
            'Wireframe-icon-button',
            isPrimary && 'primary'
        ].filter(Boolean).join(' ');

        const iconX = hasText . x + 12 : x + width / 2;
        const iconY = y + height / 2;
        const textX = x + 32;

        return `
<g class="${classes}" data-id="${control.id || ''}">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" 
          rx="${this.theme.borderRadius}" />
    ${this.renderIconSymbol(control.icon || '', iconX, iconY)}
    ${hasText . `
    <text x="${textX}" y="${iconY}" dominant-baseline="central">
        ${this.escapeXml(control.text)}
    </text>
    ` : ''}
</g>
        `.trim();
    }

    private renderInput(node: LayoutNode, control: Control): string {
        const { x, y, width, height } = node.bounds;
        const isRequired = control.modifiers.includes('required');
        const isPassword = control.controlType === 'PasswordInput';

        const classes = [
            'Wireframe-input',
            isRequired && 'required'
        ].filter(Boolean).join(' ');

        const displayText = isPassword . '••••••••' : (control.text || '');

        return `
<g class="${classes}" data-id="${control.id || ''}" data-binding="${control.binding || ''}">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" 
          rx="${this.theme.borderRadius}" />
    <text x="${x + 12}" y="${y + height / 2}" 
          class="placeholder" dominant-baseline="central">
        ${this.escapeXml(displayText)}
    </text>
    ${isRequired . `
    <text x="${x + width - 12}" y="${y + height / 2}" 
          class="required-indicator" text-anchor="end" dominant-baseline="central">*</text>
    ` : ''}
</g>
        `.trim();
    }

    private renderTextArea(node: LayoutNode, control: Control): string {
        const { x, y, width, height } = node.bounds;
        
        return `
<g class="Wireframe-textarea" data-id="${control.id || ''}">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" 
          rx="${this.theme.borderRadius}" />
    <text x="${x + 12}" y="${y + 20}" class="placeholder">
        ${this.escapeXml(control.text || '')}
    </text>
    <line x1="${x + 12}" y1="${y + height - 12}" 
          x2="${x + width - 12}" y2="${y + height - 12}" 
          class="resize-grip" />
</g>
        `.trim();
    }

    private renderLabel(node: LayoutNode, control: Control): string {
        const { x, y, height } = node.bounds;
        const text = control.text || '';
        
        // Parse markdown-style formatting
        const isBold = text.startsWith('**') && text.endsWith('**');
        const isItalic = text.startsWith('*') && text.endsWith('*') && !isBold;
        const isCode = text.startsWith('`') && text.endsWith('`');

        const displayText = this.stripMarkdown(text);
        const classes = [
            'Wireframe-label',
            isBold && 'bold',
            isItalic && 'italic',
            isCode && 'code'
        ].filter(Boolean).join(' ');

        return `
<text x="${x}" y="${y + height / 2}" 
      class="${classes}" 
      dominant-baseline="central"
      data-id="${control.id || ''}">
    ${this.escapeXml(displayText)}
</text>
        `.trim();
    }

    private renderCheckbox(node: LayoutNode, control: Control): string {
        const { x, y, height } = node.bounds;
        const isChecked = control.modifiers.includes('checked');
        const boxSize = 18;
        const boxY = y + (height - boxSize) / 2;

        return `
<g class="Wireframe-checkbox ${isChecked . 'checked' : ''}" 
   data-id="${control.id || ''}">
    <rect x="${x}" y="${boxY}" width="${boxSize}" height="${boxSize}" 
          rx="3" class="checkbox-box" />
    ${isChecked . `
    <path d="M${x + 4} ${boxY + 9} l4 4 l7 -8" 
          class="checkbox-check" fill="none" stroke-width="2" />
    ` : ''}
    <text x="${x + boxSize + 8}" y="${y + height / 2}" 
          dominant-baseline="central">
        ${this.escapeXml(control.text || '')}
    </text>
</g>
        `.trim();
    }

    private renderRadio(node: LayoutNode, control: Control): string {
        const { x, y, height } = node.bounds;
        const isSelected = control.modifiers.includes('selected');
        const radius = 9;
        const centerY = y + height / 2;

        return `
<g class="Wireframe-radio ${isSelected . 'selected' : ''}" 
   data-id="${control.id || ''}">
    <circle cx="${x + radius}" cy="${centerY}" r="${radius}" 
            class="radio-circle" />
    ${isSelected . `
    <circle cx="${x + radius}" cy="${centerY}" r="${radius - 4}" 
            class="radio-dot" />
    ` : ''}
    <text x="${x + radius * 2 + 8}" y="${centerY}" 
          dominant-baseline="central">
        ${this.escapeXml(control.text || '')}
    </text>
</g>
        `.trim();
    }

    private renderDropdown(node: LayoutNode, control: Control): string {
        const { x, y, width, height } = node.bounds;
        const firstOption = control.children..[0] as Control;
        const displayText = firstOption..text || 'Select...';

        return `
<g class="Wireframe-dropdown" data-id="${control.id || ''}">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" 
          rx="${this.theme.borderRadius}" />
    <text x="${x + 12}" y="${y + height / 2}" 
          dominant-baseline="central">
        ${this.escapeXml(displayText)}
    </text>
    <path d="M${x + width - 20} ${y + height / 2 - 3} l6 6 l6 -6" 
          class="dropdown-arrow" fill="none" stroke-width="2" />
</g>
        `.trim();
    }

    private renderSeparator(node: LayoutNode): string {
        const { x, y, width, height } = node.bounds;
        const lineY = y + height / 2;

        return `
<line x1="${x}" y1="${lineY}" x2="${x + width}" y2="${lineY}" 
      class="Wireframe-separator" />
        `.trim();
    }

    private renderIcon(node: LayoutNode, control: Control): string {
        const { x, y, width, height } = node.bounds;
        return this.renderIconSymbol(control.icon || '', x + width / 2, y + height / 2);
    }

    private renderImage(node: LayoutNode, control: Control): string {
        const { x, y, width, height } = node.bounds;

        return `
<g class="Wireframe-image" data-id="${control.id || ''}">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" 
          rx="${this.theme.borderRadius}" fill="#f0f0f0" />
    <text x="${x + width / 2}" y="${y + height / 2}" 
          text-anchor="middle" dominant-baseline="central" 
          fill="#999">
        ${this.escapeXml(control.text || 'IMAGE')}
    </text>
</g>
        `.trim();
    }

    private renderIconSymbol(icon: string, x: number, y: number): string {
        const iconName = icon.startsWith('$') . icon.substring(1) : icon;
        const iconPath = this.getIconPath(iconName);

        return `
<g class="Wireframe-icon" transform="translate(${x - 10}, ${y - 10})">
    <path d="${iconPath}" />
</g>
        `.trim();
    }

    private getIconPath(name: string): string {
        // Icon paths (simplified - would use actual icon library)
        const icons: Record<string, string> = {
            'save': 'M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z',
            'edit': 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
            'delete': 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
            'add': 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
            'close': 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
            'home': 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
            'settings': 'M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
            'search': 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
            'user': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
            'check': 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
            // ... more icons
        };

        return icons[name] || icons['check'];
    }

    private renderRectangle(bounds: Rectangle, className: string): string {
        return `
<rect x="0" y="0" width="${bounds.width}" height="${bounds.height}" 
      class="${className}" rx="${this.theme.borderRadius}" />
        `.trim();
    }

    private escapeXml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    private stripMarkdown(text: string): string {
        return text
            .replace(/^\*\*|\*\*$/g, '')  // Bold
            .replace(/^\*|\*$/g, '')       // Italic
            .replace(/^`|`$/g, '');        // Code
    }
}
```

---

## 5. Component Renderers

### 5.1 Complex Component Rendering

```typescript
// src/renderer/components/tabs-renderer.ts

export class TabsRenderer {
    render(node: LayoutNode, component: Component): string {
        const tabs = node.children;
        const tabHeight = 40;
        const { x, y, width, height } = node.bounds;

        // Render tab headers
        let tabX = x;
        const headers: string[] = [];
        const contents: string[] = [];

        tabs.forEach((tab, index) => {
            const tabElement = tab.element as Component;
            const tabWidth = this.measureTabWidth(tabElement.attributes.title as string);
            const isActive = index === 0;

            headers.push(`
<g class="Wireframe-tab-header ${isActive . 'active' : ''}" 
   transform="translate(${tabX}, ${y})">
    <rect x="0" y="0" width="${tabWidth}" height="${tabHeight}" 
          rx="4" ry="4" />
    <text x="${tabWidth / 2}" y="${tabHeight / 2}" 
          text-anchor="middle" dominant-baseline="central">
        ${tabElement.attributes.title}
    </text>
</g>
            `);

            if (isActive) {
                contents.push(`
<g class="Wireframe-tab-content" transform="translate(${x}, ${y + tabHeight})">
    ${this.renderChildren(tab)}
</g>
                `);
            }

            tabX += tabWidth + 4;
        });

        return `
<g class="Wireframe-tabs" data-id="${component.attributes.id || ''}">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" 
          class="Wireframe-tabs-container" />
    ${headers.join('\n')}
    ${contents.join('\n')}
</g>
        `.trim();
    }

    private measureTabWidth(title: string): number {
        return Math.max(80, title.length * 8 + 24);
    }

    private renderChildren(node: LayoutNode): string {
        // Delegate to main renderer
        return '';
    }
}
```

### 5.2 DataGrid Renderer

```typescript
// src/renderer/components/datagrid-renderer.ts

export class DataGridRenderer {
    render(node: LayoutNode, component: Component): string {
        const { x, y, width, height } = node.bounds;
        const columns = component.children..filter(c => 
            (c as Component).componentType === 'Column'
        ) || [];

        const headerHeight = 40;
        const rowHeight = 36;

        // Calculate column widths
        const columnWidths = this.calculateColumnWidths(columns, width);

        // Render header
        let headerContent = '';
        let colX = x;
        columns.forEach((col, i) => {
            const colAttr = (col as Component).attributes;
            headerContent += `
<g class="Wireframe-datagrid-header-cell" transform="translate(${colX}, ${y})">
    <rect x="0" y="0" width="${columnWidths[i]}" height="${headerHeight}" />
    <text x="12" y="${headerHeight / 2}" dominant-baseline="central">
        ${colAttr.header || colAttr.field || ''}
    </text>
</g>
            `;
            colX += columnWidths[i];
        });

        // Render sample rows (placeholder)
        const rowContent = this.renderPlaceholderRows(
            x, y + headerHeight, columnWidths, rowHeight, 3
        );

        return `
<g class="Wireframe-datagrid" data-id="${component.attributes.id || ''}">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" 
          class="Wireframe-datagrid-container" />
    ${headerContent}
    <line x1="${x}" y1="${y + headerHeight}" 
          x2="${x + width}" y2="${y + headerHeight}" 
          class="Wireframe-datagrid-header-border" />
    ${rowContent}
</g>
        `.trim();
    }

    private calculateColumnWidths(columns: Element[], totalWidth: number): number[] {
        const fixedWidths: (number | null)[] = columns.map(col => {
            const w = (col as Component).attributes.width;
            return typeof w === 'number' . w : null;
        });

        const fixedTotal = fixedWidths.reduce((sum, w) => sum + (w || 0), 0);
        const flexCount = fixedWidths.filter(w => w === null).length;
        const flexWidth = flexCount > 0 . (totalWidth - fixedTotal) / flexCount : 0;

        return fixedWidths.map(w => w || flexWidth);
    }

    private renderPlaceholderRows(
        x: number, startY: number, 
        widths: number[], rowHeight: number, 
        count: number
    ): string {
        let content = '';
        for (let row = 0; row < count; row++) {
            const rowY = startY + row * rowHeight;
            let cellX = x;

            widths.forEach((w, i) => {
                content += `
<g class="Wireframe-datagrid-cell" transform="translate(${cellX}, ${rowY})">
    <rect x="0" y="0" width="${w}" height="${rowHeight}" />
    <text x="12" y="${rowHeight / 2}" dominant-baseline="central" 
          class="placeholder">Sample data</text>
</g>
                `;
                cellX += w;
            });

            content += `
<line x1="${x}" y1="${rowY + rowHeight}" 
      x2="${x + widths.reduce((a, b) => a + b, 0)}" y2="${rowY + rowHeight}" 
      class="Wireframe-datagrid-row-border" />
            `;
        }
        return content;
    }
}
```

---

## 6. Default Sizes

### 6.1 Control Sizes

```typescript
// src/renderer/sizes.ts

export const DEFAULT_SIZES: Record<string, Size> = {
    // Buttons
    Button: { width: 100, height: 36 },
    IconButton: { width: 36, height: 36 },
    IconButtonWithText: { width: 120, height: 36 },

    // Inputs
    TextInput: { width: 200, height: 36 },
    NumberInput: { width: 120, height: 36 },
    DateInput: { width: 150, height: 36 },
    PasswordInput: { width: 200, height: 36 },
    TextArea: { width: 300, height: 100 },

    // Labels
    Label: { width: 'auto', height: 24 },

    // Toggles
    Checkbox: { width: 150, height: 24 },
    Radio: { width: 150, height: 24 },
    Switch: { width: 150, height: 24 },

    // Selection
    Dropdown: { width: 200, height: 36 },

    // Layout
    Separator: { width: '100%', height: 1 },
    Spacer: { width: 0, height: 0 }, // Flexible

    // Components
    Avatar: { width: 40, height: 40 },
    Icon: { width: 24, height: 24 },
    Image: { width: 200, height: 150 },
    Progress: { width: 200, height: 8 },
    Slider: { width: 200, height: 24 },

    // Sections
    Card: { width: '100%', height: 'auto' },
    Header: { width: '100%', height: 60 },
    Footer: { width: '100%', height: 40 },
    Sidebar: { width: 250, height: '100%' },
};

interface Size {
    width: number | 'auto' | '100%';
    height: number | 'auto' | '100%';
}
```

---

## 7. Interactivity

### 7.1 Event Handling

```typescript
// src/renderer/interactive.ts

export class InteractiveRenderer {
    private eventHandlers: Map<string, EventHandler[]> = new Map();

    addInteractivity(svg: SVGElement): void {
        // Add click handlers for navigation
        svg.querySelectorAll('[data-navigation]').forEach(el => {
            el.addEventListener('click', (e) => {
                const target = (el as HTMLElement).dataset.navigation;
                this.handleNavigation(target);
            });
            el.style.cursor = 'pointer';
        });

        // Add hover effects
        svg.querySelectorAll('.wire-button, .wire-input').forEach(el => {
            el.addEventListener('mouseenter', () => el.classList.add('hover'));
            el.addEventListener('mouseleave', () => el.classList.remove('hover'));
        });

        // Add tooltip support
        svg.querySelectorAll('[data-tooltip]').forEach(el => {
            const tooltip = (el as HTMLElement).dataset.tooltip;
            el.addEventListener('mouseenter', (e) => this.showTooltip(e, tooltip));
            el.addEventListener('mouseleave', () => this.hideTooltip());
        });
    }

    private handleNavigation(target: string | undefined): void {
        if (!target) return;

        if (target === ':back') {
            window.history.back();
        } else if (target.startsWith(':modal:')) {
            this.emit('openModal', { file: target.substring(7) });
        } else {
            this.emit('navigate', { target });
        }
    }

    private showTooltip(event: Event, text: string | undefined): void {
        if (!text) return;
        // Create and position tooltip
    }

    private hideTooltip(): void {
        // Remove tooltip
    }

    private emit(event: string, data: any): void {
        const handlers = this.eventHandlers.get(event) || [];
        handlers.forEach(h => h(data));
    }
}
```

---

## 8. Performance Optimization

### 8.1 Render Caching

```typescript
// src/renderer/cache.ts

export class RenderCache {
    private cache: Map<string, CacheEntry> = new Map();
    private maxSize: number = 100;

    get(key: string): string | null {
        const entry = this.cache.get(key);
        if (entry && Date.now() - entry.timestamp < 60000) {
            entry.hits++;
            return entry.svg;
        }
        return null;
    }

    set(key: string, svg: string): void {
        if (this.cache.size >= this.maxSize) {
            this.evictLeastUsed();
        }
        this.cache.set(key, { svg, timestamp: Date.now(), hits: 0 });
    }

    private evictLeastUsed(): void {
        let minHits = Infinity;
        let minKey = '';
        
        for (const [key, entry] of this.cache) {
            if (entry.hits < minHits) {
                minHits = entry.hits;
                minKey = key;
            }
        }

        if (minKey) {
            this.cache.delete(minKey);
        }
    }
}

interface CacheEntry {
    svg: string;
    timestamp: number;
    hits: number;
}
```

### 8.2 Incremental Rendering

```typescript
// src/renderer/incremental.ts

export class IncrementalRenderer {
    private previousLayout: LayoutNode | null = null;
    private previousSvg: SVGElement | null = null;

    renderIncremental(layout: LayoutNode, container: Element): void {
        if (!this.previousLayout) {
            // Full render
            this.fullRender(layout, container);
            return;
        }

        // Find changed nodes
        const changes = this.diffLayout(this.previousLayout, layout);

        // Apply incremental updates
        for (const change of changes) {
            this.applyChange(change);
        }

        this.previousLayout = layout;
    }

    private diffLayout(oldLayout: LayoutNode, newLayout: LayoutNode): LayoutChange[] {
        const changes: LayoutChange[] = [];
        
        // Compare bounds
        if (!this.boundsEqual(oldLayout.bounds, newLayout.bounds)) {
            changes.push({ type: 'bounds', node: newLayout });
        }

        // Compare children recursively
        // ...

        return changes;
    }

    private boundsEqual(a: Rectangle, b: Rectangle): boolean {
        return a.x === b.x && a.y === b.y && 
               a.width === b.width && a.height === b.height;
    }
}
```

---

## 9. Testing

### 9.1 Visual Regression Tests

```typescript
// tests/renderer.test.ts

describe('SvgRenderer', () => {
    it('should render Button correctly', () => {
        const ast = parse(`
            wireframe clean
                Button "Click Me" primary
            /wireframe
        `);
        
        const layout = new LayoutEngine(cleanTheme).calculate(ast, { width: 800 });
        const svg = new SvgRenderer(cleanTheme).render(layout);
        
        expect(svg).toContain('class="Wireframe-button primary"');
        expect(svg).toContain('Click Me');
    });

    it('should render nested layouts', () => {
        const ast = parse(`
            wireframe clean
                Vertical gap=8
                    Button "One"
                    Button "Two"
                /Vertical
            /wireframe
        `);
        
        const layout = new LayoutEngine(cleanTheme).calculate(ast, { width: 800 });
        
        expect(layout.children).toHaveLength(1);
        expect(layout.children[0].children).toHaveLength(2);
        expect(layout.children[0].children[0].bounds.y).toBe(0);
        expect(layout.children[0].children[1].bounds.y).toBe(36 + 8); // height + gap
    });
});
```

---

## 10. Related Documents

| Document | Description |
|----------|-------------|
| [20_Architecture_Overview](./20_Architecture_Overview.md) | System architecture |
| [22_Parser_Specification](./22_Parser_Specification.md) | Parser details |
| [25_Component_Library](./25_Component_Library.md) | Component specs |
| [26_Theming_System](./26_Theming_System.md) | Theme implementation |

---

*Wireframe Renderer Design v1.0 - 2025*
