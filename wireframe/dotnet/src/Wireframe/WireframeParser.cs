using Wireframe.Syntax;

namespace Wireframe;

/// <summary>The entry point for reading a Wireframe source.</summary>
public static class WireframeParser
{
    /// <summary>Parse a source into its syntax tree and its diagnostics.</summary>
    /// <param name="source">The source, exactly as written (line ends and tabs as they are).</param>
    public static ParseResult Parse(string source) => new Parser().Parse(source);
}
