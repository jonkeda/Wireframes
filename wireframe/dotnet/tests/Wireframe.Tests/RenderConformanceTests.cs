using System.Text;
using Wireframe.Rendering;
using Xunit.Sdk;

namespace Wireframe.Tests;

/// <summary>
/// Every case of the conformance set in each of the four themes: the SVG, rendered with no width and no height,
/// exactly as the reference file holds it (after the two normalizations <c>scripts/conformance.mjs</c> applies).
/// </summary>
public class RenderConformanceTests
{
    private static readonly UTF8Encoding utf8 = new(encoderShouldEmitUTF8Identifier: false, throwOnInvalidBytes: false);

    private static string CasesDirectory()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, "conformance", "cases");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            dir = dir.Parent;
        }

        throw new DirectoryNotFoundException("No conformance/cases above " + AppContext.BaseDirectory);
    }

    /// <summary>The plan's limit: the largest example parses and renders in under 50 ms.</summary>
    [Fact]
    public void The_largest_example_is_parsed_and_rendered_in_under_50_ms()
    {
        // Of the cases that are drawn: one nested too deeply is larger, and has no picture
        var largest = Directory.GetFiles(CasesDirectory(), "*.wire")
            .Where(f => File.Exists(Path.ChangeExtension(f, ".clean.svg")))
            .OrderByDescending(f => new FileInfo(f).Length)
            .First();
        var source = ReadRaw(largest);
        WireframeCompiler.Compile(source);

        // The middle of 21 runs: the other tests run beside this one.
        var times = new List<double>();
        for (var i = 0; i < 21; i++)
        {
            var watch = System.Diagnostics.Stopwatch.StartNew();
            Assert.NotEqual(0, WireframeCompiler.Compile(source).Svg.Length);
            times.Add(watch.Elapsed.TotalMilliseconds);
        }

        times.Sort();
        Assert.True(times[10] < 50, $"{Path.GetFileName(largest)}: the middle of 21 runs took {times[10]:0.0} ms");
        Console.WriteLine($"{Path.GetFileName(largest)}: middle {times[10]:0.00} ms, slowest {times[20]:0.00} ms");
    }

    private static string ReadRaw(string path) => utf8.GetString(File.ReadAllBytes(path));

    private static IEnumerable<string> CaseNames() =>
        Directory.GetFiles(CasesDirectory(), "*.wire")
            .OrderBy(f => f, StringComparer.Ordinal)
            .Select(f => Path.GetFileNameWithoutExtension(f)!);

    public static TheoryData<string> Cases()
    {
        var data = new TheoryData<string>();
        foreach (var name in CaseNames())
        {
            data.Add(name);
        }

        return data;
    }

    /// <summary>The script's normalizations: CRLF to LF, then exactly one line feed at the end.</summary>
    private static string Normalize(string svg)
    {
        var text = svg.Replace("\r\n", "\n");
        var end = text.Length;
        while (end > 0 && text[end - 1] == '\n')
        {
            end--;
        }

        return text.Substring(0, end) + "\n";
    }

    private static void Check(string name, string theme)
    {
        var dir = CasesDirectory();
        var expectedPath = Path.Combine(dir, $"{name}.{theme}.svg");
        var parsed = WireframeParser.Parse(ReadRaw(Path.Combine(dir, name + ".wire")));
        if (parsed.Document is null)
        {
            // The script writes no SVG for a source without a document
            Assert.False(File.Exists(expectedPath), $"{name}: no document, but {name}.{theme}.svg exists");
            return;
        }

        Assert.True(File.Exists(expectedPath), $"{name}.{theme}.svg is missing");
        var expected = ReadRaw(expectedPath);
        var actual = Normalize(WireframeRenderer.Render(parsed.Document, new RenderOptions { Theme = theme }));
        if (!string.Equals(expected, actual, StringComparison.Ordinal))
        {
            throw new XunitException($"{name}.{theme}.svg differs.\n{SvgDiff.Describe(expected, actual)}");
        }
    }

    [Theory]
    [MemberData(nameof(Cases))]
    public void Clean_svg_matches(string name) => Check(name, "clean");

    [Theory]
    [MemberData(nameof(Cases))]
    public void Sketch_svg_matches(string name) => Check(name, "sketch");

    [Theory]
    [MemberData(nameof(Cases))]
    public void Blueprint_svg_matches(string name) => Check(name, "blueprint");

    [Theory]
    [MemberData(nameof(Cases))]
    public void Realistic_svg_matches(string name) => Check(name, "realistic");

    [Fact]
    public void Every_case_has_its_four_svgs()
    {
        var dir = CasesDirectory();
        var count = 0;
        foreach (var name in CaseNames())
        {
            foreach (var theme in new[] { "clean", "sketch", "blueprint", "realistic" })
            {
                if (File.Exists(Path.Combine(dir, $"{name}.{theme}.svg")))
                {
                    count++;
                }
            }
        }

        Assert.Equal(1580, count);
    }
}
