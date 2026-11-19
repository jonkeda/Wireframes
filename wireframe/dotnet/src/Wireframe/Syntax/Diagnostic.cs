namespace Wireframe.Syntax;

/// <summary>An error found in a source, by the lexer or the parser.</summary>
/// <param name="Message">What is wrong, in the words of the TypeScript implementation.</param>
/// <param name="Line">The line, from 1.</param>
/// <param name="Column">The column, from 1, in UTF-16 code units.</param>
/// <param name="Offset">The offset in the source, from 0, in UTF-16 code units.</param>
public sealed record Diagnostic(string Message, int Line, int Column, int Offset)
{
    internal static Diagnostic At(string message, SourceLocation location) =>
        new(message, location.Line, location.Column, location.Offset);
}

/// <summary>What parsing a source gives: the document (none when the parser gave up) and the diagnostics.</summary>
/// <param name="Document">The syntax tree, or null.</param>
/// <param name="Diagnostics">The lexer's errors first, then the parser's, in the order they were found.</param>
public sealed record ParseResult(DocumentNode? Document, IReadOnlyList<Diagnostic> Diagnostics);
