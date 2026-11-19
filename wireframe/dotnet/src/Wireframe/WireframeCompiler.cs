using Wireframe.Rendering;
using Wireframe.Syntax;

namespace Wireframe;

/// <summary>What compiling a source gives: the SVG (empty when the parser gave up) and the diagnostics.</summary>
/// <param name="Svg">The SVG text, or an empty text when there is no document.</param>
/// <param name="Diagnostics">The lexer's and the parser's errors, in the order they were found.</param>
public sealed record CompileResult(string Svg, IReadOnlyList<Diagnostic> Diagnostics);

/// <summary>The entry point from a source to its picture: parse, then render (the TypeScript <c>compile</c>, without its cache).</summary>
public static class WireframeCompiler
{
    /// <summary>Compile a source to SVG.</summary>
    /// <param name="source">The source, exactly as written.</param>
    /// <param name="options">
    /// The options. As the TypeScript <c>compile</c>: a width or height of 0 is no width or height, and the theme
    /// is the document's style when none is given.
    /// </param>
    public static CompileResult Compile(string source, RenderOptions? options = null)
    {
        var result = WireframeParser.Parse(source);
        if (result.Document is null)
        {
            return new CompileResult("", result.Diagnostics);
        }

        options ??= new RenderOptions();
        var renderOptions = new RenderOptions
        {
            Width = options.Width is double w && w != 0 && !double.IsNaN(w) ? w : null,
            Height = options.Height is double h && h != 0 && !double.IsNaN(h) ? h : null,
            Theme = !string.IsNullOrEmpty(options.Theme) ? options.Theme : result.Document.Style,
        };

        return new CompileResult(WireframeRenderer.Render(result.Document, renderOptions), result.Diagnostics);
    }
}
