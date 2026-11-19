using System.Text;

namespace Wireframe.Tests;

/// <summary>Where two texts first differ: the line and column, with a little context. Only for finding faults.</summary>
public static class SvgDiff
{
    /// <summary>Null when the texts are equal; otherwise a description of the first difference.</summary>
    public static string? Describe(string expected, string actual, int context = 60)
    {
        if (string.Equals(expected, actual, StringComparison.Ordinal))
        {
            return null;
        }

        var length = Math.Min(expected.Length, actual.Length);
        var at = 0;
        while (at < length && expected[at] == actual[at])
        {
            at++;
        }

        var line = 1;
        var lineStart = 0;
        for (var i = 0; i < at; i++)
        {
            if (expected[i] == '\n')
            {
                line++;
                lineStart = i + 1;
            }
        }

        var text = new StringBuilder();
        text.Append("First difference at line ").Append(line).Append(", column ").Append(at - lineStart + 1)
            .Append(" (offset ").Append(at).Append("; expected length ").Append(expected.Length)
            .Append(", actual length ").Append(actual.Length).Append(")\n");
        text.Append("  expected: ").Append(Excerpt(expected, at, context)).Append('\n');
        text.Append("  actual:   ").Append(Excerpt(actual, at, context));
        return text.ToString();
    }

    private static string Excerpt(string text, int at, int context)
    {
        var start = Math.Max(0, at - context);
        var end = Math.Min(text.Length, at + context);
        var excerpt = new StringBuilder();
        if (start > 0)
        {
            excerpt.Append('…');
        }

        for (var i = start; i < end; i++)
        {
            if (i == at)
            {
                excerpt.Append("⟦");
            }

            excerpt.Append(text[i] switch
            {
                '\n' => "\\n",
                '\r' => "\\r",
                '\t' => "\\t",
                var c => c.ToString(),
            });
        }

        if (at >= end)
        {
            excerpt.Append("⟦<end>");
        }

        if (end < text.Length)
        {
            excerpt.Append('…');
        }

        return excerpt.ToString();
    }
}
