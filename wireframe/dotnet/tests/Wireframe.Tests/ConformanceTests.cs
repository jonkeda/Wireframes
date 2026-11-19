using System.Text;
using Wireframe.Syntax;

namespace Wireframe.Tests;

/// <summary>Every case of the conformance set: the tree and the diagnostics, as JSON, exactly as the files hold them.</summary>
public class ConformanceTests
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

    // The raw text: no byte order mark taken off, no line end changed (GetString keeps both as they are)
    private static string ReadRaw(string path) => utf8.GetString(File.ReadAllBytes(path));

    public static TheoryData<string> Cases()
    {
        var data = new TheoryData<string>();
        foreach (var file in Directory.GetFiles(CasesDirectory(), "*.wire").OrderBy(f => f, StringComparer.Ordinal))
        {
            data.Add(Path.GetFileNameWithoutExtension(file));
        }

        return data;
    }

    [Fact]
    public void The_set_has_every_case()
    {
        Assert.Equal(396, Directory.GetFiles(CasesDirectory(), "*.wire").Length);
    }

    [Theory]
    [MemberData(nameof(Cases))]
    public void Tree_matches(string name)
    {
        var dir = CasesDirectory();
        var result = WireframeParser.Parse(ReadRaw(Path.Combine(dir, name + ".wire")));
        Assert.Equal(ReadRaw(Path.Combine(dir, name + ".ast.json")), SyntaxJson.Write(result.Document));
    }

    [Theory]
    [MemberData(nameof(Cases))]
    public void Diagnostics_match(string name)
    {
        var dir = CasesDirectory();
        var result = WireframeParser.Parse(ReadRaw(Path.Combine(dir, name + ".wire")));
        Assert.Equal(ReadRaw(Path.Combine(dir, name + ".diagnostics.json")), SyntaxJson.Write(result.Diagnostics));
    }
}
