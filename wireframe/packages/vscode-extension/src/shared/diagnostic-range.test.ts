import { describe, expect, it } from 'vitest';
import { toDiagnosticRange } from './diagnostic-range';

const lines = ['wireframe clean', '  Vertical', '    Buton "Save"', '/wireframe'];

describe('toDiagnosticRange', () => {
  it('converts 1-based line/column to 0-based and ends at the token end', () => {
    expect(toDiagnosticRange({ line: 3, column: 5, endLine: 3, endColumn: 10 }, lines)).toEqual({
      startLine: 2,
      startCharacter: 4,
      endLine: 2,
      endCharacter: 9,
    });
  });

  it('ends at the end of the line when the token end is unknown', () => {
    expect(toDiagnosticRange({ line: 3, column: 5 }, lines)).toEqual({
      startLine: 2,
      startCharacter: 4,
      endLine: 2,
      endCharacter: 16,
    });
  });

  it('ignores a token end that lies before the start', () => {
    expect(toDiagnosticRange({ line: 2, column: 3, endLine: 1, endColumn: 2 }, lines)).toEqual({
      startLine: 1,
      startCharacter: 2,
      endLine: 1,
      endCharacter: 10,
    });
  });

  it('underlines the line when the error sits at its end', () => {
    expect(toDiagnosticRange({ line: 2, column: 50 }, lines)).toEqual({
      startLine: 1,
      startCharacter: 2,
      endLine: 1,
      endCharacter: 10,
    });
  });

  it('clamps lines past the end of the document', () => {
    expect(toDiagnosticRange({ line: 99, column: 1 }, lines)).toEqual({
      startLine: 3,
      startCharacter: 0,
      endLine: 3,
      endCharacter: 10,
    });
  });

  it('handles an empty document', () => {
    expect(toDiagnosticRange({ line: 1, column: 1 }, [''])).toEqual({
      startLine: 0,
      startCharacter: 0,
      endLine: 0,
      endCharacter: 0,
    });
  });
});
