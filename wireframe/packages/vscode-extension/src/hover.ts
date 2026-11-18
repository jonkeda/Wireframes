/**
 * Hover provider for Wireframe language
 */

import * as vscode from 'vscode';

export class WireframeHoverProvider implements vscode.HoverProvider {
  private docs: Record<string, string> = {
    'Button': 'A clickable button control.\n\nModifiers: [primary], [secondary], [disabled]',
    'TextInput': 'A text input field.\n\nModifiers: [required], [disabled], [readonly]',
    'Label': 'A text label. Use **text** for bold, *text* for italic.',
    'Vertical': 'Arranges children vertically (top to bottom).',
    'Horizontal': 'Arranges children horizontally (left to right).',
    'Grid': 'Arranges children in a 2-column grid.',
    'Card': 'A container with rounded corners and shadow.',
    'Header': 'A header section, typically at the top.',
    'Footer': 'A footer section, typically at the bottom.',
    'Tabs': 'A tab container. Use Tab children for individual tabs.',
    'Table': 'A data table.\n\nAttributes: rows=N, cols=N',
    'Pagination': 'Page navigation controls.\n\nAttributes: page=N, total=N',
    'Stepper': 'A step progress indicator.\n\nAttributes: steps=N, current=N',
  };

  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) return undefined;

    const word = document.getText(wordRange);
    const doc = this.docs[word];

    if (doc) {
      return new vscode.Hover(new vscode.MarkdownString(doc));
    }

    return undefined;
  }
}
