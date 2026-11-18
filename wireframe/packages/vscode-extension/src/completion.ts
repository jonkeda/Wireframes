/**
 * Completion provider for Wireframe language
 */

import * as vscode from 'vscode';

export class WireframeCompletionProvider implements vscode.CompletionItemProvider {
  private controls = [
    'Button', 'IconButton', 'TextInput', 'NumberInput', 'DateInput',
    'PasswordInput', 'TextArea', 'Label', 'Heading', 'Link', 'Checkbox',
    'Radio', 'Dropdown', 'Option', 'Separator', 'Spacer', 'Icon', 'Image', 'Avatar',
    'Badge', 'Progress', 'Slider', 'Switch', 'Chip', 'Tabs', 'Tab',
    'Menu', 'MenuItem', 'Breadcrumb', 'Pagination', 'Table', 'Tree',
    'Accordion', 'DataGrid', 'Toast', 'Skeleton', 'Stepper'
  ];

  private layouts = ['Vertical', 'Horizontal', 'Grid', 'Dock', 'Canvas', 'Scroll'];
  private sections = ['Header', 'Footer', 'Sidebar', 'Content', 'Panel', 'Card', 'Modal', 'Drawer', 'Dialog', 'Alert', 'Toolbar'];
  private modifiers = ['primary', 'secondary', 'required', 'disabled', 'checked', 'selected', 'readonly', 'active', 'expanded'];
  private themes = ['clean', 'sketch', 'blueprint', 'realistic'];

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const lineText = document.lineAt(position).text;
    const linePrefix = lineText.substring(0, position.character);
    const trimmedLine = lineText.trim();
    const items: vscode.CompletionItem[] = [];

    // At document start or empty line at root level - suggest wireframe keyword
    if (position.line === 0 || (trimmedLine === '' && this.getIndentLevel(lineText) === 0)) {
      const wireframeItem = new vscode.CompletionItem('wireframe', vscode.CompletionItemKind.Keyword);
      wireframeItem.detail = 'Start a new wireframe document';
      wireframeItem.insertText = new vscode.SnippetString('wireframe ${1|clean,sketch,blueprint,realistic|}\n    %title: ${2:My Wireframe}\n\n    $0\n/wireframe');
      wireframeItem.sortText = '0';
      items.push(wireframeItem);
    }

    // After wireframe keyword - suggest themes
    if (linePrefix.match(/^\s*wireframe\s+$/)) {
      for (const theme of this.themes) {
        const item = new vscode.CompletionItem(theme, vscode.CompletionItemKind.EnumMember);
        item.detail = 'Wireframe theme';
        items.push(item);
      }
      return items;
    }

    // Directive completions after %
    if (linePrefix.match(/%\w*$/)) {
      const directives = ['title', 'description', 'author', 'version', 'theme', 'width', 'height'];
      for (const dir of directives) {
        const item = new vscode.CompletionItem(dir, vscode.CompletionItemKind.Property);
        item.detail = 'Directive';
        item.insertText = new vscode.SnippetString(`${dir}: \${1}`);
        items.push(item);
      }
      return items;
    }

    // Closing tag completions after /
    if (linePrefix.match(/\/\w*$/)) {
      const openTags = this.findOpenTags(document, position);
      for (const tag of openTags) {
        const item = new vscode.CompletionItem(tag, vscode.CompletionItemKind.Keyword);
        item.detail = `Close ${tag}`;
        items.push(item);
      }
      return items;
    }

    // Inside a wireframe block - show controls, layouts, sections
    if (this.isInsideWireframe(document, position)) {
      // Add layout completions
      for (const layout of this.layouts) {
        const item = new vscode.CompletionItem(layout, vscode.CompletionItemKind.Module);
        item.detail = 'Layout container';
        item.insertText = new vscode.SnippetString(`${layout}\n    $0\n/${layout}`);
        item.sortText = '1' + layout;
        items.push(item);
      }

      // Add section completions
      for (const section of this.sections) {
        const item = new vscode.CompletionItem(section, vscode.CompletionItemKind.Struct);
        item.detail = 'Section container';
        item.insertText = new vscode.SnippetString(`${section}\n    $0\n/${section}`);
        item.sortText = '2' + section;
        items.push(item);
      }

      // Add control completions
      for (const control of this.controls) {
        const item = new vscode.CompletionItem(control, vscode.CompletionItemKind.Class);
        item.detail = 'UI Control';
        item.sortText = '3' + control;
        items.push(item);
      }
    }

    // Modifier completions - only suggest after control/layout names or in attribute context
    if (linePrefix.match(/\b(Button|TextInput|Label|Checkbox|Radio|Dropdown)\b.*\s$/)) {
      for (const mod of this.modifiers) {
        const item = new vscode.CompletionItem(mod, vscode.CompletionItemKind.Keyword);
        item.detail = 'Modifier';
        items.push(item);
      }
    }

    // Attribute completions after control names
    if (linePrefix.match(/\b[A-Z][a-z]+\b.*\s$/)) {
      const attributes = ['gap', 'padding', 'margin', 'align', 'width', 'height', 'rows', 'cols', 'placeholder'];
      for (const attr of attributes) {
        const item = new vscode.CompletionItem(attr + '=', vscode.CompletionItemKind.Property);
        item.detail = 'Attribute';
        item.insertText = new vscode.SnippetString(`${attr}=\${1}`);
        items.push(item);
      }
    }

    return items;
  }

  private getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  private isInsideWireframe(document: vscode.TextDocument, position: vscode.Position): boolean {
    for (let i = position.line; i >= 0; i--) {
      const line = document.lineAt(i).text.trim();
      if (line.startsWith('wireframe')) return true;
      if (line === '/wireframe') return false;
    }
    return false;
  }

  private findOpenTags(document: vscode.TextDocument, position: vscode.Position): string[] {
    const tagStack: string[] = [];
    const tagPattern = /^\s*(Vertical|Horizontal|Grid|Card|Panel|Header|Footer|Sidebar|Modal|Drawer|Tabs|Accordion|Dropdown|Menu|wireframe)\b/;
    const closePattern = /^\s*\/(Vertical|Horizontal|Grid|Card|Panel|Header|Footer|Sidebar|Modal|Drawer|Tabs|Accordion|Dropdown|Menu|wireframe)\b/;

    for (let i = 0; i < position.line; i++) {
      const line = document.lineAt(i).text;
      const openMatch = line.match(tagPattern);
      const closeMatch = line.match(closePattern);

      if (openMatch) {
        tagStack.push(openMatch[1]);
      } else if (closeMatch) {
        const idx = tagStack.lastIndexOf(closeMatch[1]);
        if (idx !== -1) {
          tagStack.splice(idx, 1);
        }
      }
    }

    return tagStack.reverse(); // Most recent first
  }
}
