using System.Text.Json;
using Wireframe.Cli;
using Wireframe.Rendering;

namespace Wireframe.Tests;

/// <summary>What the .NET tool does beyond the TypeScript one: Markdown, --check, --json, --stdin, --link, components.</summary>
public sealed class WireCliTests : IDisposable
{
    private const string Valid = WireCliPortedTests.Valid;

    private readonly CliFolder folder = new();

    public void Dispose() => folder.Dispose();

    private static string Block(string label, string? id = null) =>
        $"```wireframe{(id is null ? "" : " id=" + id)}\nwireframe\n    Button \"{label}\"\n/wireframe\n```\n";

    private static string Doc(params string[] blocks) => "# Spec\n\n" + string.Join("\nSome text.\n\n", blocks);

    private string[] Svgs() =>
        Directory.GetFiles(folder.Dir, "*.svg").Select(Path.GetFileName).OrderBy(n => n, StringComparer.Ordinal).ToArray()!;

    [Fact]
    public void Renders_three_numbered_blocks_beside_the_document()
    {
        folder.File("spec.md", Doc(Block("A"), Block("B"), Block("C")));
        var r = folder.Run("spec.md");
        Assert.Equal(0, r.Code);
        Assert.Equal(new[] { "spec.1.svg", "spec.2.svg", "spec.3.svg" }, Svgs());

        var svg = folder.Read("spec.2.svg");
        var firstLine = svg.Substring(0, svg.IndexOf('\n', StringComparison.Ordinal));
        Assert.StartsWith("<!-- wire v" + WireCli.Version + " doc=spec.md block=2 sha256=", firstLine, StringComparison.Ordinal);
        Assert.EndsWith(" -->", firstLine, StringComparison.Ordinal);
        Assert.Equal(WireframeCompiler.Compile("wireframe\n    Button \"B\"\n/wireframe\n").Svg, svg.Substring(firstLine.Length + 1));
        Assert.Equal(Doc(Block("A"), Block("B"), Block("C")), folder.Read("spec.md"));
    }

    [Fact]
    public void Renders_blocks_with_ids_by_their_id()
    {
        folder.File("spec.md", Doc(Block("A", "login"), Block("B"), Block("C", "signup")));
        Assert.Equal(0, folder.Run("spec.md").Code);
        Assert.Equal(new[] { "spec.2.svg", "spec.login.svg", "spec.signup.svg" }, Svgs());
    }

    [Fact]
    public void A_block_added_above_renames_the_numbered_ones_says_so_and_keeps_ids()
    {
        folder.File("spec.md", Doc(Block("A", "login"), Block("B"), Block("C")));
        Assert.Equal(0, folder.Run("spec.md").Code);
        var loginBefore = folder.Read("spec.login.svg");

        folder.File("spec.md", Doc(Block("New"), Block("A", "login"), Block("B"), Block("C")));
        var r = folder.Run("spec.md");
        Assert.Equal(0, r.Code);
        Assert.Contains("note: a block was added or removed above others", r.Err, StringComparison.Ordinal);
        Assert.Single(r.ErrLines);
        Assert.Equal(new[] { "spec.1.svg", "spec.3.svg", "spec.4.svg", "spec.login.svg" }, Svgs());
        Assert.Equal(loginBefore, folder.Read("spec.login.svg"));
        Assert.Contains("\"New\"", folder.Read("spec.1.svg"), StringComparison.Ordinal);
        Assert.Contains("\"C\"", folder.Read("spec.4.svg"), StringComparison.Ordinal);
    }

    [Fact]
    public void A_removed_block_has_its_svg_deleted_only_when_the_tool_wrote_it()
    {
        folder.File("spec.md", Doc(Block("A"), Block("B"), Block("C", "c")));
        Assert.Equal(0, folder.Run("spec.md").Code);

        // A picture drawn by hand and one of another document, with names the pattern matches
        folder.File("spec.drawn.svg", "<svg xmlns=\"http://www.w3.org/2000/svg\"/>");
        folder.File("spec.v2.md", Doc(Block("X")));
        Assert.Equal(0, folder.Run("spec.v2.md").Code);

        folder.File("spec.md", Doc(Block("A")));
        var r = folder.Run("spec.md");
        Assert.Equal(0, r.Code);
        Assert.Equal(new[] { "spec.1.svg", "spec.drawn.svg", "spec.v2.1.svg" }, Svgs());
        Assert.Contains("removed spec.2.svg", r.Out, StringComparison.Ordinal);
        Assert.Contains("removed spec.c.svg", r.Out, StringComparison.Ordinal);
    }

    [Fact]
    public void A_blocks_svg_not_written_by_the_tool_is_not_overwritten()
    {
        folder.File("spec.md", Doc(Block("A", "a")));
        folder.File("spec.a.svg", "<svg/>");
        var r = folder.Run("spec.md");
        Assert.Equal(1, r.Code);
        Assert.Contains("was not written by wire", r.Err, StringComparison.Ordinal);
        Assert.Equal("<svg/>", folder.Read("spec.a.svg"));
    }

    [Fact]
    public void Link_run_twice_gives_the_same_document()
    {
        var doc = Doc(Block("A", "login"), Block("B")) + "\n- item\n\n  " + Block("C").Replace("\n", "\n  ", StringComparison.Ordinal).TrimEnd(' ');
        folder.File("spec.md", doc);
        Assert.Equal(0, folder.Run("spec.md", "--link").Code);
        var once = folder.Read("spec.md");
        Assert.Contains("```\n<!-- wire:image -->\n![login](spec.login.svg)\n<!-- /wire:image -->\n", once, StringComparison.Ordinal);
        Assert.Contains("![wireframe 2](spec.2.svg)", once, StringComparison.Ordinal);
        Assert.Contains("  ```\n  <!-- wire:image -->\n  ![wireframe 3](spec.3.svg)\n  <!-- /wire:image -->\n", once, StringComparison.Ordinal);

        Assert.Equal(0, folder.Run("spec.md", "--link").Code);
        Assert.Equal(once, folder.Read("spec.md"));

        // Only the image lines were added
        var withoutImages = System.Text.RegularExpressions.Regex.Replace(
            once, @"^ *(!\[[^\]]*\]\([^)]*\)|<!-- /?wire:image -->)\n", "", System.Text.RegularExpressions.RegexOptions.Multiline);
        Assert.Equal(doc, withoutImages);
    }

    [Fact]
    public void Link_keeps_crlf_and_a_document_without_a_final_line_end()
    {
        var doc = "# T\r\n\r\n```wireframe id=a\r\nwireframe\r\n/wireframe\r\n```";
        folder.File("spec.md", doc);
        Assert.Equal(0, folder.Run("spec.md", "--link").Code);
        var once = folder.Read("spec.md");
        Assert.Equal(doc + "\r\n<!-- wire:image -->\r\n![a](spec.a.svg)\r\n<!-- /wire:image -->", once);
        Assert.Equal(0, folder.Run("spec.md", "--link").Code);
        Assert.Equal(once, folder.Read("spec.md"));
    }

    [Fact]
    public void Check_is_clean_after_a_render_and_names_exactly_the_stale_block_after_an_edit()
    {
        folder.File("spec.md", Doc(Block("A", "a"), Block("B", "b"), Block("C")));
        Assert.Equal(0, folder.Run("spec.md", "-t", "sketch").Code);
        var clean = folder.Run("--check", "spec.md", "-t", "sketch");
        Assert.Equal(0, clean.Code);
        Assert.Equal("", clean.Err);

        var before = Directory.GetFiles(folder.Dir).ToDictionary(f => f, System.IO.File.ReadAllText);
        folder.File("spec.md", Doc(Block("A", "a"), Block("B changed", "b"), Block("C")));
        var stale = folder.Run("--check", "spec.md", "-t", "sketch");
        Assert.Equal(1, stale.Code);
        var line = Assert.Single(stale.ErrLines);
        Assert.Contains("spec.b.svg is stale", line, StringComparison.Ordinal);
        Assert.StartsWith("spec.md(11,1): error: ", line, StringComparison.Ordinal);

        // It wrote nothing
        foreach (var (file, content) in before.Where(p => p.Key.EndsWith(".svg", StringComparison.Ordinal)))
        {
            Assert.Equal(content, System.IO.File.ReadAllText(file));
        }

        // Other options are another picture
        Assert.Equal(1, folder.Run("--check", "spec.md").Code);
    }

    [Fact]
    public void Check_says_missing_and_names_a_gone_blocks_svg()
    {
        folder.File("spec.md", Doc(Block("A"), Block("B")));
        var missing = folder.Run("--check", "spec.md");
        Assert.Equal(1, missing.Code);
        Assert.Equal(2, missing.ErrLines.Length);
        Assert.All(missing.ErrLines, l => Assert.Contains("is missing", l, StringComparison.Ordinal));

        Assert.Equal(0, folder.Run("spec.md").Code);
        folder.File("spec.md", Doc(Block("A")));
        var gone = folder.Run("--check", "spec.md");
        Assert.Equal(1, gone.Code);
        Assert.Contains("spec.2.svg belongs to a block that is gone", Assert.Single(gone.ErrLines), StringComparison.Ordinal);
        Assert.True(folder.Exists("spec.2.svg"));
    }

    [Fact]
    public void Check_on_a_wire_file_renders_and_compares_when_the_svg_has_no_stamp()
    {
        folder.File("a.wire", Valid);
        Assert.Equal(1, folder.Run("--check", "a.wire").Code);
        Assert.Equal(0, folder.Run("a.wire").Code);
        Assert.Equal(WireframeCompiler.Compile(Valid).Svg, folder.Read("a.svg"));
        Assert.Equal(0, folder.Run("--check", "a.wire").Code);
        Assert.Equal(1, folder.Run("--check", "a.wire", "-w", "500").Code);

        // With --stamp the SVG starts with the stamp line, and --check reads it
        Assert.Equal(0, folder.Run("a.wire", "--stamp").Code);
        Assert.StartsWith("<!-- wire v", folder.Read("a.svg"), StringComparison.Ordinal);
        Assert.Equal(0, folder.Run("--check", "a.wire").Code);
        folder.File("a.wire", Valid.Replace("Go", "Stop", StringComparison.Ordinal));
        var stale = folder.Run("--check", "a.wire");
        Assert.Equal(1, stale.Code);
        Assert.Contains("a.svg is stale", stale.Err, StringComparison.Ordinal);
    }

    [Fact]
    public void Diagnostics_in_a_block_are_given_in_the_documents_line_and_column()
    {
        folder.File("spec.md", "# T\n\n- item\n\n  ```wireframe id=x\n  wireframe\n      Button \"Go\"\n      @@@\n  /wireframe\n  ```\n");
        var r = folder.Run("spec.md");
        Assert.Equal(1, r.Code);
        var expected = WireframeParser.Parse("wireframe\n    Button \"Go\"\n    @@@\n/wireframe\n").Diagnostics[0];
        Assert.Equal(3, expected.Line);
        Assert.StartsWith($"spec.md(8,{expected.Column + 2}): error: {expected.Message}", r.ErrLines[0], StringComparison.Ordinal);
        Assert.False(folder.Exists("spec.x.svg"));
    }

    [Fact]
    public void Json_gives_files_with_diagnostics_on_stdout()
    {
        folder.File("spec.md", Doc(Block("A", "login"), "```wireframe\nwireframe\n    @@@\n/wireframe\n```\n"));
        folder.File("a.wire", Valid);
        var r = folder.Run("spec.md", "a.wire", "--json");
        Assert.Equal(1, r.Code);
        Assert.Equal("", r.Err);
        using var json = JsonDocument.Parse(r.Out);
        var files = json.RootElement.GetProperty("files").EnumerateArray().ToList();
        Assert.Equal(3, files.Count);

        Assert.Equal("spec.md", files[0].GetProperty("source").GetString());
        Assert.Equal("login", files[0].GetProperty("block").GetString());
        Assert.Equal("spec.login.svg", files[0].GetProperty("svg").GetString());
        Assert.True(files[0].GetProperty("written").GetBoolean());
        Assert.Equal("written", files[0].GetProperty("status").GetString());
        Assert.Equal(0, files[0].GetProperty("diagnostics").GetArrayLength());

        Assert.Equal(2, files[1].GetProperty("block").GetInt32());
        Assert.False(files[1].GetProperty("written").GetBoolean());
        var d = files[1].GetProperty("diagnostics")[0];
        Assert.Equal("error", d.GetProperty("severity").GetString());
        Assert.Equal(13, d.GetProperty("line").GetInt32());
        Assert.Equal(JsonValueKind.Number, d.GetProperty("column").ValueKind);
        Assert.Equal(JsonValueKind.String, d.GetProperty("message").ValueKind);
        Assert.False(d.TryGetProperty("code", out _));

        Assert.Equal("a.wire", files[2].GetProperty("source").GetString());
        Assert.Equal(JsonValueKind.Null, files[2].GetProperty("block").ValueKind);
        Assert.Equal("a.svg", files[2].GetProperty("svg").GetString());
    }

    [Fact]
    public void Stdin_reads_one_wireframe_and_writes_its_svg_to_stdout()
    {
        var r = folder.RunWithInput(WireCliPortedTests.Sketch, "--stdin");
        Assert.Equal(0, r.Code);
        Assert.Equal(WireframeCompiler.Compile(WireCliPortedTests.Sketch).Svg + "\n", r.Out);

        var toFile = folder.RunWithInput(Valid, "--stdin", "-o", "out.svg", "-t", "blueprint");
        Assert.Equal(0, toFile.Code);
        Assert.Equal(WireframeCompiler.Compile(Valid, new RenderOptions { Theme = "blueprint" }).Svg, folder.Read("out.svg"));

        var bad = folder.RunWithInput(WireCliPortedTests.Invalid, "--stdin", "-v");
        Assert.Equal(1, bad.Code);
        Assert.StartsWith("<stdin>(3,", bad.Err, StringComparison.Ordinal);
    }

    [Fact]
    public void Out_dir_keeps_the_folder_layout()
    {
        folder.File("docs/spec.md", Doc(Block("A", "a")));
        folder.File("docs/sub/b.wire", Valid);
        Assert.Equal(0, folder.Run("docs/spec.md", "docs/sub/b.wire", "--out-dir", "out").Code);
        Assert.True(folder.Exists("out/docs/spec.a.svg"));
        Assert.True(folder.Exists("out/docs/sub/b.svg"));
        Assert.False(folder.Exists("docs/spec.a.svg"));
        Assert.Equal(0, folder.Run("--check", "docs/spec.md", "--out-dir", "out").Code);
    }

    [Fact]
    public void Validate_on_markdown_writes_nothing()
    {
        folder.File("spec.md", Doc(Block("A"), Block("B")));
        var r = folder.Run("-v", "spec.md");
        Assert.Equal(0, r.Code);
        Assert.Contains("spec.md is valid (2 blocks)", r.Out, StringComparison.Ordinal);
        Assert.Empty(Svgs());
    }

    [Fact]
    public void Bad_block_ids_are_errors_at_the_fence()
    {
        folder.File("spec.md", Doc(Block("A", "a"), Block("B", "a"), Block("C", "1")));
        var r = folder.Run("spec.md");
        Assert.Equal(1, r.Code);
        Assert.Contains(r.ErrLines, l => l.StartsWith("spec.md(11,1): error: the block id 'a' is used twice", StringComparison.Ordinal));
        Assert.Contains(r.ErrLines, l => l.StartsWith("spec.md(19,1): error: '1' is not a block id", StringComparison.Ordinal));
        Assert.Equal(new[] { "spec.a.svg" }, Svgs());
    }

    [Fact]
    public void An_svg_held_by_another_program_is_reported_and_never_half_written()
    {
        folder.File("a.wire", Valid);
        folder.File("a.svg", "old");
        CliRun r;
        using (new FileStream(folder.File("a.svg"), FileMode.Open, FileAccess.ReadWrite, FileShare.None))
        {
            r = folder.Run("a.wire");
        }

        Assert.Equal(1, r.Code);
        Assert.Contains("could not write to \"a.svg\"", r.Err, StringComparison.Ordinal);
        Assert.Equal("old", folder.Read("a.svg"));
        Assert.Equal(new[] { "a.svg", "a.wire" }, Directory.GetFiles(folder.Dir).Select(Path.GetFileName).Order(StringComparer.Ordinal));

        Assert.Equal(0, folder.Run("a.wire").Code);
        Assert.Equal(WireframeCompiler.Compile(Valid).Svg, folder.Read("a.svg"));
    }

    [Fact]
    public void Components_lists_the_languages_keywords()
    {
        var r = folder.Run("components");
        Assert.Equal(0, r.Code);
        Assert.Contains("Controls: ", r.Out, StringComparison.Ordinal);
        Assert.Contains("Button", r.Out, StringComparison.Ordinal);
        Assert.Contains("Modifiers: ", r.Out, StringComparison.Ordinal);
        Assert.Contains("primary", r.Out, StringComparison.Ordinal);

        using var all = JsonDocument.Parse(folder.Run("components", "--json").Out);
        var names = all.RootElement.GetProperty("components").EnumerateArray().Select(c => c.GetProperty("name").GetString()).ToList();
        Assert.Contains("Card", names);
        Assert.Contains("DataGrid", names);
        Assert.Contains("data", names);
        Assert.DoesNotContain("primary", names);

        using var card = JsonDocument.Parse(folder.Run("components", "Card", "--json").Out);
        Assert.Equal("section", card.RootElement.GetProperty("kind").GetString());
        Assert.True(card.RootElement.GetProperty("closes").GetBoolean());

        var unknown = folder.Run("components", "button");
        Assert.Equal(2, unknown.Code);
        Assert.Contains("Did you mean \"Button\"?", unknown.Err, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("a.wire", "--format", "png")]
    [InlineData("a.wire", "--format=jpeg")]
    [InlineData("a.wire", "--stdin")]
    [InlineData("spec.md", "-o", "-")]
    [InlineData("a.wire", "-o", "x.svg", "--out-dir", "out")]
    [InlineData("a.wire", "--link")]
    [InlineData("a.wire", "--check", "-o", "-")]
    [InlineData("a.wire", "--check", "--validate")]
    [InlineData("components", "a", "b")]
    [InlineData("a.wire", "--json=yes")]
    public void Bad_usage_exits_2(params string[] args)
    {
        folder.File("a.wire", Valid);
        folder.File("spec.md", Doc(Block("A")));
        var r = folder.Run(args);
        Assert.Equal(2, r.Code);
        Assert.StartsWith("Error: ", r.Err, StringComparison.Ordinal);
        Assert.Equal(new[] { "a.wire", "spec.md" }, Directory.GetFiles(folder.Dir).Select(Path.GetFileName).Order(StringComparer.Ordinal));
    }

    [Fact]
    public void Format_png_says_png_comes_later()
    {
        var r = folder.Run("a.wire", "--format", "png");
        Assert.Contains("PNG comes later", r.Err, StringComparison.Ordinal);
        Assert.Equal(0, folder.RunWithInput(Valid, "--stdin", "--format", "svg").Code);
    }

    [Fact]
    public void Version_prints_the_version() => Assert.Equal($"wire v{WireCli.Version}\n", folder.Run("--version").Out);

    [Fact]
    public async Task Watch_renders_again_when_the_file_changes()
    {
        var input = folder.File("a.wire", Valid);
        using var cancel = new CancellationTokenSource();
        var output = new StringWriter();
        var run = Task.Run(() => WireCli.Run(new[] { "a.wire", "--watch", "-q" }, TextReader.Null, TextWriter.Synchronized(output), TextWriter.Null, folder.Dir, cancel.Token));
        try
        {
            var deadline = DateTime.UtcNow.AddSeconds(10);
            while (!folder.Exists("a.svg") && DateTime.UtcNow < deadline)
            {
                await Task.Delay(20);
            }

            // The watcher starts right after the first render
            await Task.Delay(500);
            Assert.DoesNotContain("Stop", folder.Read("a.svg"), StringComparison.Ordinal);
            System.IO.File.WriteAllText(input, Valid.Replace("Go", "Stop", StringComparison.Ordinal));
            while (!ReadShared(folder.File("a.svg")).Contains("Stop", StringComparison.Ordinal) && DateTime.UtcNow < deadline)
            {
                await Task.Delay(50);
            }

            Assert.Contains("Stop", ReadShared(folder.File("a.svg")), StringComparison.Ordinal);
        }
        finally
        {
            cancel.Cancel();
        }

        Assert.Equal(0, await run.WaitAsync(TimeSpan.FromSeconds(10)));
    }

    private static string ReadShared(string path)
    {
        try
        {
            using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }
        catch (IOException)
        {
            return "";
        }
    }
}
