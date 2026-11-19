namespace Wireframe.Syntax;

/// <summary>A place in the source: line and column from 1, offset from 0, counted in UTF-16 code units.</summary>
/// <param name="Line">The line, from 1.</param>
/// <param name="Column">The column, from 1.</param>
/// <param name="Offset">The offset in the source, from 0.</param>
public sealed record SourceLocation(int Line, int Column, int Offset)
{
    /// <summary>Line 1, column 1, offset 0: where a node made by the parser itself (not from a token) is.</summary>
    public static SourceLocation Default { get; } = new(1, 1, 0);
}

/// <summary>A token of the Wireframe language.</summary>
/// <param name="Kind">What the token is.</param>
/// <param name="Value">The token's text (for a string, its value without quotes).</param>
/// <param name="Start">Where it starts.</param>
/// <param name="End">Where it ends.</param>
public sealed record Token(TokenKind Kind, string Value, SourceLocation Start, SourceLocation End)
{
    /// <summary>For an end block, the keyword being closed (without the slash).</summary>
    public string? ClosingKeyword { get; init; }

    /// <summary>For an attribute or a document attribute, its name.</summary>
    public string? AttributeName { get; init; }

    /// <summary>For an attribute or a document attribute, its value; for <c>if</c>, its condition.</summary>
    public string? AttributeValue { get; init; }
}
