/**
 * Diagnostics for Wireframe documents
 */

import * as vscode from 'vscode';
import { parse } from '@jonkeda/wireframe-core';
import { toDiagnosticRange } from './shared/diagnostic-range';

/**
 * Parse the document and publish its errors to the collection.
 */
export function validateDocument(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
): void {
  const source = document.getText();
  const { errors } = parse(source);
  const lines = source.split(/\r?\n/);

  const diagnostics: vscode.Diagnostic[] = errors.map((error) => {
    const r = toDiagnosticRange(
      {
        line: error.location.line,
        column: error.location.column,
        endLine: error.token?.end.line,
        endColumn: error.token?.end.column,
      },
      lines
    );
    const range = new vscode.Range(r.startLine, r.startCharacter, r.endLine, r.endCharacter);

    return new vscode.Diagnostic(range, error.message, vscode.DiagnosticSeverity.Error);
  });

  collection.set(document.uri, diagnostics);
}
