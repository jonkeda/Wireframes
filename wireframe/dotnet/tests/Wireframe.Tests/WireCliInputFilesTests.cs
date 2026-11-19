namespace Wireframe.Tests;

/// <summary>A folder and a name with a wildcard as an input: the files they stand for.</summary>
public sealed class WireCliInputFilesTests : IDisposable
{
    private const string Valid = "wireframe clean\n    Label \"Hello\"\n/wireframe\n";

    private readonly CliFolder folder = new();

    public void Dispose() => folder.Dispose();

    [Fact]
    public void A_pattern_is_the_files_whose_name_fits_it_and_no_other()
    {
        folder.File("screens/a.wire", Valid);
        folder.File("screens/b.wire", Valid);
        folder.File("screens/b.wires", Valid);
        folder.File("screens/notes.txt", "not a wireframe");

        var r = folder.Run("screens/*.wire", "--validate");

        Assert.Equal(0, r.Code);
        Assert.Contains("screens/a.wire is valid", r.Err + r.Out, StringComparison.Ordinal);
        Assert.Contains("screens/b.wire is valid", r.Err + r.Out, StringComparison.Ordinal);
        // "*.wire" is not "*.wires", though the system's own matching of three-letter endings would take it.
        Assert.DoesNotContain("b.wires", r.Err + r.Out, StringComparison.Ordinal);
        Assert.DoesNotContain("notes.txt", r.Err + r.Out, StringComparison.Ordinal);
    }

    [Fact]
    public void A_folder_is_every_wireframe_source_under_it_but_not_in_what_a_build_makes()
    {
        folder.File("docs/spec.md", "# Spec\n\n```wireframe id=one\n" + Valid + "```\n");
        folder.File("docs/screens/login.wire", Valid);
        folder.File("docs/node_modules/x/readme.md", "```wireframe\nwireframe clean\n    Nope \"x\"\n/wireframe\n```\n");
        folder.File("docs/.hidden/y.wire", "wireframe clean\n    Nope \"x\"\n/wireframe\n");
        folder.File("docs/picture.png", "no");

        var r = folder.Run("docs", "--validate");

        Assert.Equal(0, r.Code);
        Assert.Contains("docs/screens/login.wire", r.Err + r.Out, StringComparison.Ordinal);
        Assert.Contains("docs/spec.md", r.Err + r.Out, StringComparison.Ordinal);
        Assert.DoesNotContain("node_modules", r.Err + r.Out, StringComparison.Ordinal);
        Assert.DoesNotContain(".hidden", r.Err + r.Out, StringComparison.Ordinal);
    }

    [Fact]
    public void A_pattern_that_fits_nothing_is_said_as_a_file_that_could_not_be_read()
    {
        var r = folder.Run("nothing/*.md", "--validate");

        Assert.Equal(1, r.Code);
        Assert.Contains("nothing/*.md", r.Err, StringComparison.Ordinal);
    }

    [Fact]
    public void A_plain_file_name_is_not_changed()
    {
        folder.File("a.wire", Valid);

        var r = folder.Run("a.wire", "-o", "-");

        Assert.Equal(0, r.Code);
        Assert.Equal(WireframeCompiler.Compile(Valid).Svg + "\n", r.Out);
    }
}
