using System.Text;
using Wireframe.Cli;

namespace Wireframe.Tests;

/// <summary>
/// The tool, not only the library, gives the conformance set's SVGs: <c>wire case.wire -t theme -o -</c> prints
/// exactly the bytes of <c>case.theme.svg</c>.
/// </summary>
public class WireCliConformanceTests
{
    private static readonly UTF8Encoding Utf8 = new(encoderShouldEmitUTF8Identifier: false, throwOnInvalidBytes: false);

    private static readonly string[] Themes = { "clean", "sketch", "blueprint", "realistic" };

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

    /// <summary>Ten cases spread over the set (those with a picture and no errors, which the tool writes without
    /// --force), in each of the four themes.</summary>
    public static TheoryData<string, string> Cases()
    {
        var dir = CasesDirectory();
        var names = Directory.GetFiles(dir, "*.wire")
            .Select(f => Path.GetFileNameWithoutExtension(f)!)
            .Where(n => File.Exists(Path.Combine(dir, n + ".clean.svg"))
                && File.ReadAllText(Path.Combine(dir, n + ".diagnostics.json")).Trim() == "[]")
            .OrderBy(n => n, StringComparer.Ordinal)
            .ToList();
        var data = new TheoryData<string, string>();
        for (var k = 0; k < 10; k++)
        {
            var name = names[k * names.Count / 10];
            foreach (var theme in Themes)
            {
                data.Add(name, theme);
            }
        }

        return data;
    }

    [Theory]
    [MemberData(nameof(Cases))]
    public void The_tool_prints_the_reference_svg(string name, string theme)
    {
        var dir = CasesDirectory();
        var output = new MemoryStream();
        var writer = new StreamWriter(output, Utf8);
        var error = new StringWriter();
        var code = WireCli.Run(new[] { name + ".wire", "-t", theme, "-o", "-" }, TextReader.Null, writer, error, dir);
        writer.Flush();

        Assert.Equal("", error.ToString());
        Assert.Equal(0, code);
        var expected = File.ReadAllBytes(Path.Combine(dir, $"{name}.{theme}.svg"));
        Assert.Equal(expected, output.ToArray());
    }
}
