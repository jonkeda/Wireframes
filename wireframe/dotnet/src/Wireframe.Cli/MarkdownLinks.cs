using Wireframe.Markdown;

namespace Wireframe.Cli;

/// <summary>
/// <c>--link</c>: writes or updates an image line under each wireframe block, between two marker comments, and
/// touches nothing else of the document. Run twice, it gives the same document.
/// </summary>
public static class MarkdownLinks
{
    /// <summary>The opening marker.</summary>
    public const string Open = "<!-- wire:image -->";

    /// <summary>The closing marker.</summary>
    public const string Close = "<!-- /wire:image -->";

    /// <summary>The document with an image line under each block that has a picture.</summary>
    /// <param name="markdown">The document.</param>
    /// <param name="images">For each block, its alt text and the picture's path relative to the document (with
    /// forward slashes); a block not in it is left alone.</param>
    public static string Apply(string markdown, IReadOnlyDictionary<WireframeBlock, (string Alt, string Path)> images)
    {
        ArgumentNullException.ThrowIfNull(markdown);
        ArgumentNullException.ThrowIfNull(images);

        var lines = Split(markdown);
        var newline = lines.Select(l => l.Ending).FirstOrDefault(e => e.Length > 0) ?? "\n";

        // From the last block up, so the line numbers of the blocks above stay right
        foreach (var block in images.Keys.Where(b => b.ClosingLine > 0).OrderByDescending(b => b.ClosingLine))
        {
            var (alt, path) = images[block];
            var indent = new string(' ', block.FenceIndent);
            var after = block.ClosingLine; // index of the line after the closing fence
            var region = new List<(string Text, string Ending)>
            {
                (indent + Open, newline),
                (indent + $"![{Escape(alt)}]({EscapePath(path)})", newline),
                (indent + Close, newline),
            };

            var replaceCount = 0;
            if (after < lines.Count && lines[after].Text.Trim() == Open)
            {
                for (var k = after + 1; k < lines.Count && k <= after + 4; k++)
                {
                    if (lines[k].Text.Trim() == Close)
                    {
                        replaceCount = k - after + 1;
                        break;
                    }
                }
            }

            if (replaceCount > 0)
            {
                // Keep the line end the old region's last line had (none at the end of the document)
                var lastEnding = lines[after + replaceCount - 1].Ending;
                region[region.Count - 1] = (region[region.Count - 1].Text, lastEnding);
                lines.RemoveRange(after, replaceCount);
            }
            else if (lines[after - 1].Ending.Length == 0)
            {
                // The closing fence is the document's last line, without a line end
                lines[after - 1] = (lines[after - 1].Text, newline);
                region[region.Count - 1] = (region[region.Count - 1].Text, "");
            }

            lines.InsertRange(after, region);
        }

        return string.Concat(lines.Select(l => l.Text + l.Ending));
    }

    private static string Escape(string alt) => alt.Replace("[", "\\[", StringComparison.Ordinal).Replace("]", "\\]", StringComparison.Ordinal);

    private static string EscapePath(string path) =>
        path.Replace(" ", "%20", StringComparison.Ordinal).Replace("(", "%28", StringComparison.Ordinal).Replace(")", "%29", StringComparison.Ordinal);

    private static List<(string Text, string Ending)> Split(string text)
    {
        var lines = new List<(string Text, string Ending)>();
        var start = 0;
        for (var k = 0; k < text.Length; k++)
        {
            if (text[k] == '\n')
            {
                var crlf = k > start && text[k - 1] == '\r';
                lines.Add((text.Substring(start, k - start - (crlf ? 1 : 0)), crlf ? "\r\n" : "\n"));
                start = k + 1;
            }
        }

        if (start < text.Length)
        {
            lines.Add((text.Substring(start), ""));
        }

        return lines;
    }
}
