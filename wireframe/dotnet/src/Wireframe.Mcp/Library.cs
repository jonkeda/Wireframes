using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using Wireframe.Markdown;

namespace Wireframe.Mcp;

/// <summary>One complete example from the documentation, one that parses without errors.</summary>
/// <param name="Title">Its title (the heading above it, or the file's <c>%title</c>).</param>
/// <param name="Origin">Where it comes from: <c>docs/EXAMPLES.md</c> or <c>docs/examples/button.wire</c>.</param>
/// <param name="Source">The wireframe.</param>
public sealed record Example(string Title, string Origin, string Source);

/// <summary>
/// What the server offers without the repository, embedded in the assembly: the one-page reference
/// (<c>Resources/reference.md</c>) and the documentation's examples (<c>docs/EXAMPLES.md</c>, <c>docs/examples/*.wire</c>),
/// of which only those that parse without errors are kept.
/// </summary>
public static partial class Library
{
    /// <summary>The reference's URI.</summary>
    public const string ReferenceUri = "wireframe://reference";

    /// <summary>The start of a component's URI: <c>wireframe://components/Button</c>.</summary>
    public const string ComponentUriPrefix = "wireframe://components/";

    private const string ExamplesPrefix = "Wireframe.Mcp.docs.examples.";

    private static readonly Lazy<string> reference = new(() => ReadResource("Wireframe.Mcp.reference.md"));
    private static readonly Lazy<IReadOnlyList<Example>> examples = new(LoadExamples);

    /// <summary>The language in one page (Markdown).</summary>
    public static string Reference => reference.Value;

    /// <summary>The documentation's examples that parse without errors: <c>EXAMPLES.md</c>'s blocks first, then the files.</summary>
    public static IReadOnlyList<Example> Examples => examples.Value;

    private static string ReadResource(string name)
    {
        using var stream = typeof(Library).Assembly.GetManifestResourceStream(name)
            ?? throw new InvalidOperationException("The resource " + name + " is not in the assembly");
        using var reader = new StreamReader(stream, new UTF8Encoding(false));
        return reader.ReadToEnd().ReplaceLineEndings("\n");
    }

    private static List<Example> LoadExamples()
    {
        var list = new List<Example>();
        var markdown = ReadResource("Wireframe.Mcp.docs.EXAMPLES.md");
        var lines = markdown.Split('\n');
        foreach (var block in WireframeBlocks.Find(markdown))
        {
            if (!Parses(block.Source))
            {
                continue;
            }

            var title = "Example " + block.Number.ToString(System.Globalization.CultureInfo.InvariantCulture);
            for (var k = block.FenceLine - 2; k >= 0; k--)
            {
                if (lines[k].StartsWith('#'))
                {
                    title = lines[k].TrimStart('#').Trim();
                    break;
                }
            }

            list.Add(new Example(title, "docs/EXAMPLES.md", block.Source.TrimEnd('\n')));
        }

        var assembly = typeof(Library).Assembly;
        foreach (var name in assembly.GetManifestResourceNames().Where(n => n.StartsWith(ExamplesPrefix, StringComparison.Ordinal)).Order(StringComparer.Ordinal))
        {
            var file = name.Substring(ExamplesPrefix.Length);
            var source = ReadResource(name);
            if (!Parses(source))
            {
                continue;
            }

            var match = TitleLine().Match(source);
            var title = match.Success ? match.Groups[1].Value.Trim() : Path.GetFileNameWithoutExtension(file);
            list.Add(new Example(title, "docs/examples/" + file, source.TrimEnd('\n')));
        }

        return list;
    }

    private static bool Parses(string source) => WireframeParser.Parse(source).Diagnostics.Count == 0;

    [GeneratedRegex(@"^\s*%title:\s*(.+)$", RegexOptions.Multiline | RegexOptions.CultureInvariant)]
    private static partial Regex TitleLine();

    /// <summary>Up to <paramref name="count"/> examples that fit a word (<c>form</c>, <c>table</c>, <c>dialog</c>):
    /// by their title first, then by the elements they use.</summary>
    public static IReadOnlyList<Example> Find(string about, int count = 3)
    {
        ArgumentNullException.ThrowIfNull(about);
        var words = about.Split(new[] { ' ', ',', ';', '/', '-', '_' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(w => w.ToLowerInvariant())
            .Select(w => w.Length > 3 && w.EndsWith('s') ? w.Substring(0, w.Length - 1) : w)
            .ToList();
        if (words.Count == 0)
        {
            return Array.Empty<Example>();
        }

        var scored = new List<(Example Example, int Score, int Index)>();
        for (var i = 0; i < Examples.Count; i++)
        {
            var example = Examples[i];
            var title = (example.Title + " " + example.Origin).ToLowerInvariant();
            var source = example.Source.ToLowerInvariant();
            var score = 0;
            foreach (var word in words)
            {
                if (title.Contains(word, StringComparison.Ordinal))
                {
                    score += 100;
                }

                score += Math.Min(20, CountWord(source, word));
            }

            if (score > 0)
            {
                scored.Add((example, score, i));
            }
        }

        // The best fit first; of equal fits the shorter, so a model reads less
        return scored
            .OrderByDescending(s => s.Score)
            .ThenBy(s => s.Example.Source.Length)
            .ThenBy(s => s.Index)
            .Take(count)
            .Select(s => s.Example)
            .ToList();
    }

    /// <summary>How often a word starts a word in a text (<c>table</c> in <c>Table</c> and <c>DataTable</c>' start only).</summary>
    private static int CountWord(string text, string word)
    {
        var n = 0;
        var at = 0;
        while ((at = text.IndexOf(word, at, StringComparison.Ordinal)) >= 0)
        {
            if (at == 0 || !char.IsLetterOrDigit(text[at - 1]))
            {
                n++;
            }

            at += word.Length;
        }

        return n;
    }
}
