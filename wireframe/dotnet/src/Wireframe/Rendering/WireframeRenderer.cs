using Wireframe.Syntax;

namespace Wireframe.Rendering;

/// <summary>How to render a document to SVG, as the TypeScript <c>RenderOptions</c>.</summary>
public sealed record RenderOptions
{
    /// <summary>The theme's name: clean, sketch, blueprint or realistic (any case); another name is clean. When not
    /// given, the document's own style.</summary>
    public string? Theme { get; init; }

    /// <summary>The width. When not given, the picture is as wide as its content (at most 800).</summary>
    public double? Width { get; init; }

    /// <summary>The height. When not given, the picture is as tall as its content.</summary>
    public double? Height { get; init; }

    /// <summary>The space around the content; the theme's padding when not given.</summary>
    public double? Padding { get; init; }

    /// <summary>Whether to write ARIA roles and attributes; true when not given.</summary>
    public bool? Accessible { get; init; }

    /// <summary>A title for the picture, written as its &lt;title&gt;.</summary>
    public string? Title { get; init; }

    /// <summary>A description of the picture, written as its &lt;desc&gt;.</summary>
    public string? Description { get; init; }

    /// <summary>The language of the document, written as <c>xml:lang</c>.</summary>
    public string? Lang { get; init; }
}

/// <summary>Renders a Wireframe document to SVG, exactly as the TypeScript implementation's <c>render</c> does.</summary>
public static class WireframeRenderer
{
    /// <summary>Render a document to SVG text.</summary>
    /// <param name="document">The syntax tree, as <see cref="WireframeParser.Parse"/> gives it.</param>
    /// <param name="options">The options; none means the document's style, fitted to its content.</param>
    public static string Render(DocumentNode document, RenderOptions? options = null)
    {
        if (document is null)
        {
            throw new ArgumentNullException(nameof(document));
        }

        options ??= new RenderOptions();
        var themeName = !string.IsNullOrEmpty(options.Theme)
            ? options.Theme!
            : !string.IsNullOrEmpty(document.Style) ? document.Style : "clean";
        var renderer = new SvgRenderer(Themes.Get(themeName));
        return renderer.Render(document, options);
    }
}
