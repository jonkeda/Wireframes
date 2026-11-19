using System.Text;

namespace Wireframe.Markdown;

/// <summary>One fenced <c>wireframe</c> block of a Markdown text.</summary>
public sealed class WireframeBlock
{
    internal WireframeBlock(
        int number, string? id, string info, string source, int fenceLine, int contentLine, int closingLine,
        int fenceIndent, int[] lineIndents)
    {
        Number = number;
        Id = id;
        Info = info;
        Source = source;
        FenceLine = fenceLine;
        ContentLine = contentLine;
        ClosingLine = closingLine;
        FenceIndent = fenceIndent;
        this.lineIndents = lineIndents;
    }

    private readonly int[] lineIndents;

    /// <summary>The block's number among the document's wireframe blocks, from 1.</summary>
    public int Number { get; }

    /// <summary>The block's id (<c>```wireframe id=login</c>), or null when its fence has none.</summary>
    public string? Id { get; }

    /// <summary>The fence's whole info string, trimmed (<c>wireframe id=login</c>).</summary>
    public string Info { get; }

    /// <summary>The block's text exactly as written between the fences (line ends as they are), with the
    /// fence's own indentation taken off each line as CommonMark does.</summary>
    public string Source { get; }

    /// <summary>The line of the opening fence, from 1.</summary>
    public int FenceLine { get; }

    /// <summary>The line where the block's content starts, from 1 (the line after the opening fence).</summary>
    public int ContentLine { get; }

    /// <summary>The line of the closing fence, from 1; 0 when the block runs to the end of the document.</summary>
    public int ClosingLine { get; }

    /// <summary>The opening fence's indentation, in columns.</summary>
    public int FenceIndent { get; }

    /// <summary>The number of content lines.</summary>
    public int LineCount => lineIndents.Length;

    /// <summary>
    /// Where a position in <see cref="Source"/> is in the document.
    /// </summary>
    /// <param name="line">The line in the block's source, from 1.</param>
    /// <param name="column">The column in the block's source, from 1.</param>
    /// <returns>The line and column in the document, from 1.</returns>
    public (int Line, int Column) ToDocument(int line, int column)
    {
        var indent = line >= 1 && line <= lineIndents.Length ? lineIndents[line - 1] : FenceIndent;
        return (ContentLine + line - 1, column + indent);
    }
}

/// <summary>Finds the fenced <c>wireframe</c> blocks of a Markdown text. Text in, data out; no file access.</summary>
public static class WireframeBlocks
{
    private sealed class Line
    {
        public Line(string text, string ending)
        {
            Text = text;
            Ending = ending;
        }

        public string Text { get; }

        public string Ending { get; }
    }

    /// <summary>The wireframe blocks of a Markdown text, in the order they appear.</summary>
    /// <param name="markdown">The Markdown text (LF or CRLF line ends).</param>
    public static IReadOnlyList<WireframeBlock> Find(string markdown)
    {
        if (markdown is null)
        {
            throw new ArgumentNullException(nameof(markdown));
        }

        var lines = Split(markdown);
        var blocks = new List<WireframeBlock>();

        // The content indents of the list items open around the current line (a simple model of CommonMark's
        // containers: enough to find a fence inside a list item).
        var lists = new List<int>();
        var previousBlank = true;
        var inIndentedCode = false;

        for (var i = 0; i < lines.Count; i++)
        {
            var text = lines[i].Text;
            if (IsBlank(text))
            {
                previousBlank = true;
                continue;
            }

            var indent = IndentOf(text, out var firstChar);

            // A list item's marker opens (or continues) a list item
            if (TryListMarker(text, firstChar, indent, out var contentIndent, out var afterMarker))
            {
                var keep = lists.Count;
                while (keep > 0 && lists[keep - 1] > indent)
                {
                    keep--;
                }

                var markerBase = keep > 0 ? lists[keep - 1] : 0;
                if (indent - markerBase <= 3 && !inIndentedCode)
                {
                    lists.RemoveRange(keep, lists.Count - keep);
                    lists.Add(contentIndent);
                    inIndentedCode = false;

                    // The item's own first line may be a fence: "- ```wireframe"
                    var rest = text.Substring(afterMarker);
                    if (TryOpenFence(rest, out var restFence))
                    {
                        i = TakeFence(lines, i, contentIndent, restFence, contentIndent, blocks);
                        previousBlank = false;
                        continue;
                    }

                    previousBlank = false;
                    continue;
                }
            }

            while (lists.Count > 0 && indent < lists[lists.Count - 1] && previousBlank)
            {
                lists.RemoveAt(lists.Count - 1);
            }

            var container = lists.Count > 0 ? lists[lists.Count - 1] : 0;
            var relative = indent - container;
            if (relative < 0)
            {
                // A lazy continuation line of a paragraph in the list item
                relative = 0;
                container = indent;
            }

            if (relative >= 4)
            {
                // An indented code block when it does not continue a paragraph
                if (previousBlank || inIndentedCode)
                {
                    inIndentedCode = true;
                }

                previousBlank = false;
                continue;
            }

            inIndentedCode = false;
            var trimmed = text.Substring(firstChar);
            if (TryOpenFence(trimmed, out var fence))
            {
                i = TakeFence(lines, i, indent, fence, container, blocks);
                previousBlank = false;
                continue;
            }

            previousBlank = false;
        }

        return blocks;
    }

    private sealed class Fence
    {
        public Fence(char marker, int length, string info)
        {
            Marker = marker;
            Length = length;
            Info = info;
        }

        public char Marker { get; }

        public int Length { get; }

        public string Info { get; }
    }

    /// <summary>Reads a fenced block from its opening line; returns the index of its last line.</summary>
    private static int TakeFence(List<Line> lines, int open, int fenceIndent, Fence fence, int container, List<WireframeBlock> blocks)
    {
        var close = -1;
        var end = lines.Count;
        for (var j = open + 1; j < lines.Count; j++)
        {
            if (IsClosingFence(lines[j].Text, fence, container))
            {
                close = j;
                end = j;
                break;
            }

            // A line indented less than the list item's content ends the item, and the block with it
            if (container > 0 && !IsBlank(lines[j].Text) && IndentOf(lines[j].Text, out _) < container)
            {
                end = j;
                break;
            }
        }

        var last = close >= 0 ? close : end - 1;
        var words = fence.Info.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
        if (words.Length > 0 && words[0] == "wireframe")
        {
            string? id = null;
            for (var w = 1; w < words.Length; w++)
            {
                if (words[w].StartsWith("id=", StringComparison.Ordinal) && words[w].Length > 3)
                {
                    id = words[w].Substring(3);
                    break;
                }
            }

            var source = new StringBuilder();
            var indents = new List<int>();
            for (var j = open + 1; j < end; j++)
            {
                var stripped = StripIndent(lines[j].Text, fenceIndent, out var removed);
                source.Append(stripped).Append(lines[j].Ending);
                indents.Add(removed);
            }

            blocks.Add(new WireframeBlock(
                blocks.Count + 1, id, fence.Info, source.ToString(), open + 1, open + 2, close >= 0 ? close + 1 : 0,
                fenceIndent, indents.ToArray()));
        }

        return last;
    }

    private static bool TryOpenFence(string trimmed, out Fence fence)
    {
        fence = null!;
        if (trimmed.Length < 3 || (trimmed[0] != '`' && trimmed[0] != '~'))
        {
            return false;
        }

        var marker = trimmed[0];
        var length = 0;
        while (length < trimmed.Length && trimmed[length] == marker)
        {
            length++;
        }

        if (length < 3)
        {
            return false;
        }

        var info = trimmed.Substring(length).Trim();
        if (marker == '`' && info.IndexOf('`') >= 0)
        {
            return false;
        }

        fence = new Fence(marker, length, info);
        return true;
    }

    private static bool IsClosingFence(string text, Fence fence, int container)
    {
        var indent = IndentOf(text, out var first);
        if (indent - container > 3 || (indent > 3 && indent < container))
        {
            return false;
        }

        var length = 0;
        while (first + length < text.Length && text[first + length] == fence.Marker)
        {
            length++;
        }

        if (length < fence.Length)
        {
            return false;
        }

        for (var k = first + length; k < text.Length; k++)
        {
            if (text[k] != ' ' && text[k] != '\t')
            {
                return false;
            }
        }

        return true;
    }

    /// <summary>A list marker (<c>-</c>, <c>+</c>, <c>*</c>, <c>1.</c>, <c>1)</c>) followed by a space, and where
    /// the item's content starts.</summary>
    private static bool TryListMarker(string text, int first, int indent, out int contentIndent, out int afterMarker)
    {
        contentIndent = 0;
        afterMarker = 0;
        var k = first;
        if (k < text.Length && (text[k] == '-' || text[k] == '+' || text[k] == '*'))
        {
            k++;
        }
        else
        {
            var digits = 0;
            while (k < text.Length && text[k] >= '0' && text[k] <= '9' && digits < 9)
            {
                k++;
                digits++;
            }

            if (digits == 0 || k >= text.Length || (text[k] != '.' && text[k] != ')'))
            {
                return false;
            }

            k++;
        }

        if (k >= text.Length || text[k] != ' ')
        {
            return false;
        }

        // A thematic break (- - -, * * *) is not a list item
        var rest = text.Substring(first).Replace(" ", "");
        if (rest.Length >= 3 && (rest.Trim('-').Length == 0 || rest.Trim('*').Length == 0))
        {
            return false;
        }

        var markerEnd = indent + (k - first);
        var spaces = 0;
        while (k + spaces < text.Length && text[k + spaces] == ' ')
        {
            spaces++;
        }

        if (spaces > 4)
        {
            // Content indented 5 or more after the marker: the item's content starts one space after it
            spaces = 1;
        }

        contentIndent = markerEnd + spaces;
        afterMarker = k + spaces;
        return true;
    }

    private static string StripIndent(string text, int count, out int removed)
    {
        var k = 0;
        removed = 0;
        while (k < text.Length && removed < count)
        {
            if (text[k] == ' ')
            {
                removed++;
            }
            else if (text[k] == '\t')
            {
                var width = 4 - (removed % 4);
                if (removed + width > count)
                {
                    break;
                }

                removed += width;
            }
            else
            {
                break;
            }

            k++;
        }

        return text.Substring(k);
    }

    private static int IndentOf(string text, out int firstChar)
    {
        var columns = 0;
        var k = 0;
        while (k < text.Length && (text[k] == ' ' || text[k] == '\t'))
        {
            columns += text[k] == '\t' ? 4 - (columns % 4) : 1;
            k++;
        }

        firstChar = k;
        return columns;
    }

    private static bool IsBlank(string text)
    {
        foreach (var c in text)
        {
            if (c != ' ' && c != '\t')
            {
                return false;
            }
        }

        return true;
    }

    private static List<Line> Split(string text)
    {
        var lines = new List<Line>();
        var start = 0;
        for (var k = 0; k < text.Length; k++)
        {
            if (text[k] == '\n')
            {
                var crlf = k > start && text[k - 1] == '\r';
                lines.Add(new Line(text.Substring(start, k - start - (crlf ? 1 : 0)), crlf ? "\r\n" : "\n"));
                start = k + 1;
            }
        }

        if (start < text.Length)
        {
            lines.Add(new Line(text.Substring(start), ""));
        }

        return lines;
    }
}
