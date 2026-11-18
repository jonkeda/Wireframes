/**
 * Map a 1-based parser error location to a 0-based editor range.
 *
 * This module must not import `vscode` (it is unit-tested).
 */

export interface ErrorLocation {
  /** 1-based line */
  line: number;
  /** 1-based column */
  column: number;
  /** 1-based end line of the offending token, when known */
  endLine?: number;
  /** 1-based end column (exclusive) of the offending token, when known */
  endColumn?: number;
}

export interface ZeroBasedRange {
  startLine: number;
  startCharacter: number;
  endLine: number;
  endCharacter: number;
}

/**
 * Compute the range to underline for an error.
 *
 * @param location the error's 1-based location
 * @param lines the document's lines (without line terminators)
 */
export function toDiagnosticRange(location: ErrorLocation, lines: readonly string[]): ZeroBasedRange {
  const lastLine = Math.max(0, lines.length - 1);
  const startLine = clamp((location.line || 1) - 1, 0, lastLine);
  const lineText = lines[startLine] ?? '';
  const lineLength = lineText.length;
  let startCharacter = clamp((location.column || 1) - 1, 0, lineLength);

  let endLine = startLine;
  let endCharacter = lineLength;

  const hasTokenEnd = location.endLine !== undefined && location.endColumn !== undefined;
  if (hasTokenEnd) {
    const tokenEndLine = clamp(location.endLine! - 1, 0, lastLine);
    const tokenEndCharacter = clamp(location.endColumn! - 1, 0, (lines[tokenEndLine] ?? '').length);
    if (tokenEndLine > startLine || (tokenEndLine === startLine && tokenEndCharacter > startCharacter)) {
      endLine = tokenEndLine;
      endCharacter = tokenEndCharacter;
    }
  }

  // An error at the very end of a line would give an empty range: underline the line instead.
  if (endLine === startLine && endCharacter <= startCharacter) {
    startCharacter = firstNonWhitespace(lineText);
    endCharacter = lineLength;
  }

  return { startLine, startCharacter, endLine, endCharacter };
}

function firstNonWhitespace(text: string): number {
  const match = /\S/.exec(text);
  return match ? match.index : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
