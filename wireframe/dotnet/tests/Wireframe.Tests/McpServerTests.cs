using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Wireframe.Cli;
using Wireframe.Markdown;
using Wireframe.Mcp;

namespace Wireframe.Tests;

/// <summary>The MCP server <c>wire mcp</c> (<c>.my/net/300-McpServer.md</c>), through an in-process client.</summary>
public class McpServerTests
{
    private static readonly UTF8Encoding Utf8 = new(false);

    private const string GoodWire = "wireframe clean\n    Vertical gap=8\n        Label \"Hello\"\n        Button \"OK\" primary\n    /Vertical\n/wireframe\n";
    private const string BadWire = "wireframe clean\n    Step \"one\"\n/wireframe\n";

    private static string Json(string text) => JsonSerializer.Serialize(text, McpTestJson.Default.String);

    private static string Spec(string loginBody = "    Button \"Sign in\" primary") =>
        "# Spec\n\nThe login screen:\n\n```wireframe id=login\nwireframe clean\n" + loginBody + "\n/wireframe\n```\n\nAnd a second one:\n\n```wireframe\nwireframe clean\n    Label \"Second\"\n/wireframe\n```\n";

    // ============ The protocol ============

    [Fact]
    public void Initialize_answers_the_asked_version_the_capabilities_and_the_server()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);

        var result = client.Initialize("2025-06-18").GetProperty("result");
        Assert.Equal("2025-06-18", result.GetProperty("protocolVersion").GetString());
        Assert.True(result.GetProperty("capabilities").TryGetProperty("tools", out _));
        Assert.True(result.GetProperty("capabilities").TryGetProperty("resources", out _));
        Assert.Equal("wireframe", result.GetProperty("serverInfo").GetProperty("name").GetString());
        Assert.Equal(WireCli.Version, result.GetProperty("serverInfo").GetProperty("version").GetString());

        var other = client.Request("initialize", "{\"protocolVersion\":\"1999-01-01\",\"capabilities\":{},\"clientInfo\":{\"name\":\"t\",\"version\":\"1\"}}");
        Assert.Equal(McpServer.ProtocolVersions[0], other.GetProperty("result").GetProperty("protocolVersion").GetString());
        Assert.Equal(0, client.Close());
    }

    [Fact]
    public void Ping_is_answered_with_an_empty_result()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);
        var answer = client.Request("ping");
        Assert.Equal("2.0", answer.GetProperty("jsonrpc").GetString());
        Assert.Equal(JsonValueKind.Object, answer.GetProperty("result").ValueKind);
        Assert.Empty(answer.GetProperty("result").EnumerateObject());
    }

    [Fact]
    public void Tools_list_gives_the_six_tools_with_object_schemas()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);
        var tools = client.Request("tools/list").GetProperty("result").GetProperty("tools").EnumerateArray().ToList();

        Assert.Equal(WireframeTools.Names, tools.Select(t => t.GetProperty("name").GetString()!).ToArray());
        foreach (var tool in tools)
        {
            Assert.False(string.IsNullOrWhiteSpace(tool.GetProperty("description").GetString()));
            var schema = tool.GetProperty("inputSchema");
            Assert.Equal("object", schema.GetProperty("type").GetString());
            Assert.Equal(JsonValueKind.Object, schema.GetProperty("properties").ValueKind);
        }

        var render = tools.Single(t => t.GetProperty("name").GetString() == "wireframe_render").GetProperty("inputSchema").GetProperty("properties");
        Assert.Equal(new[] { "clean", "sketch", "blueprint", "realistic" },
            render.GetProperty("theme").GetProperty("enum").EnumerateArray().Select(e => e.GetString()).ToArray());
        Assert.Equal("integer", render.GetProperty("width").GetProperty("type").GetString());
    }

    [Fact]
    public void Malformed_json_is_a_parse_error_with_a_null_id()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);
        client.Send("{ this is not json");
        var answer = McpTestClient.Parse(client.NextLine()!);
        Assert.Equal(JsonValueKind.Null, answer.GetProperty("id").ValueKind);
        Assert.Equal(-32700, answer.GetProperty("error").GetProperty("code").GetInt32());

        // The server goes on
        Assert.True(client.Request("ping").TryGetProperty("result", out _));
    }

    [Fact]
    public void An_unknown_method_is_method_not_found()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);
        var answer = client.Request("prompts/list");
        Assert.Equal(-32601, answer.GetProperty("error").GetProperty("code").GetInt32());
    }

    [Fact]
    public void A_notification_gets_no_answer()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);
        client.Notify("notifications/initialized");
        client.Notify("notifications/cancelled");
        client.Notify("no/such/method");
        client.Send("{\"jsonrpc\":\"2.0\",\"id\":99,\"result\":{}}");

        // The next line is the ping's answer: nothing came for the notifications or the response
        var answer = client.Request("ping");
        Assert.True(answer.TryGetProperty("result", out _));
        Assert.Null(client.NextLine(TimeSpan.FromMilliseconds(200)));
    }

    [Fact]
    public void Wrong_params_are_invalid_params()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);
        Assert.Equal(-32602, client.Request("tools/call", "{}").GetProperty("error").GetProperty("code").GetInt32());
        Assert.Equal(-32602, client.Request("tools/call", "{\"name\":\"no_such_tool\"}").GetProperty("error").GetProperty("code").GetInt32());
        Assert.Equal(-32602, client.Request("tools/call", "{\"name\":\"wireframe_validate\",\"arguments\":[1]}").GetProperty("error").GetProperty("code").GetInt32());
        Assert.Equal(-32602, client.Request("resources/read", "{}").GetProperty("error").GetProperty("code").GetInt32());
        Assert.Equal(-32602, client.Request("ping", "[1,2]").GetProperty("error").GetProperty("code").GetInt32());

        client.Send("[{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"ping\"}]");
        Assert.Equal(-32600, McpTestClient.Parse(client.NextLine()!).GetProperty("error").GetProperty("code").GetInt32());
    }

    [Fact]
    public void The_output_is_one_json_message_per_line()
    {
        using var folder = new CliFolder();
        var server = new McpServer(new RootFolder(folder.Dir), WireCli.Run, WireCli.Version);
        var input = string.Join("\n",
            "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-11-25\",\"capabilities\":{},\"clientInfo\":{\"name\":\"t\",\"version\":\"1\"}}}",
            "{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}",
            "",
            "{\"jsonrpc\":\"2.0\",\"id\":\"two\",\"method\":\"tools/call\",\"params\":{\"name\":\"wireframe_render\",\"arguments\":{\"source\":" + Json(GoodWire) + "}}}") + "\r\n";
        var output = new StringWriter();
        var error = new StringWriter();

        Assert.Equal(0, server.Run(new StringReader(input), output, error));
        var lines = output.ToString().Split('\n');
        Assert.Equal(3, lines.Length);
        Assert.Equal("", lines[2]);
        Assert.Equal(1, McpTestClient.Parse(lines[0]).GetProperty("id").GetInt32());
        Assert.Equal("two", McpTestClient.Parse(lines[1]).GetProperty("id").GetString());
        Assert.DoesNotContain('\r', output.ToString());
        Assert.Empty(Directory.GetFileSystemEntries(folder.Dir));
    }

    // ============ wireframe_validate ============

    [Fact]
    public void Validate_a_good_source()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);
        var result = client.Call("wireframe_validate", "{\"source\":" + Json(GoodWire) + "}");
        Assert.False(McpTestClient.IsError(result));
        Assert.Equal("✓ source is valid", McpTestClient.Text(result));
    }

    [Fact]
    public void Validate_a_bad_source_gives_the_errors_first_as_an_error_result()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);
        var result = client.Call("wireframe_validate", "{\"source\":" + Json(BadWire) + "}");
        Assert.True(McpTestClient.IsError(result));
        var lines = McpTestClient.Text(result).Split('\n');
        Assert.Equal("source(2,5): error: Unexpected token: Step", lines[0]);
        Assert.Equal("source(2,10): error: Unexpected token: one", lines[1]);
        Assert.Equal("2 errors: the wireframe is not valid", lines[2]);
    }

    [Fact]
    public void Validate_a_markdown_block_gives_the_documents_line_and_column()
    {
        using var folder = new CliFolder();
        folder.File("docs/spec.md", Spec("    Step \"x\""));
        using var client = new McpTestClient(folder.Dir);

        var result = client.Call("wireframe_validate", "{\"path\":\"docs/spec.md\",\"block\":\"login\"}");
        Assert.True(McpTestClient.IsError(result));
        Assert.StartsWith("docs/spec.md(7,5): error: Unexpected token: Step\n", McpTestClient.Text(result), StringComparison.Ordinal);

        var second = client.Call("wireframe_validate", "{\"path\":\"docs/spec.md\",\"block\":\"2\"}");
        Assert.False(McpTestClient.IsError(second));
        Assert.Equal("✓ docs/spec.md is valid (1 block)", McpTestClient.Text(second));

        var whole = client.Call("wireframe_validate", "{\"path\":\"docs/spec.md\"}");
        Assert.True(McpTestClient.IsError(whole));
        Assert.EndsWith("2 errors in 1 block of 2: docs/spec.md is not valid", McpTestClient.Text(whole), StringComparison.Ordinal);
    }

    [Fact]
    public void Validate_a_wire_file_and_a_file_that_is_not_there()
    {
        using var folder = new CliFolder();
        folder.File("login.wire", GoodWire);
        using var client = new McpTestClient(folder.Dir);

        Assert.Equal("✓ login.wire is valid", McpTestClient.Text(client.Call("wireframe_validate", "{\"path\":\"login.wire\"}")));

        var missing = client.Call("wireframe_validate", "{\"path\":\"nope.wire\"}");
        Assert.True(McpTestClient.IsError(missing));
        Assert.StartsWith("nope.wire: error: could not read file", McpTestClient.Text(missing), StringComparison.Ordinal);

        var both = client.Call("wireframe_validate", "{\"path\":\"login.wire\",\"source\":\"x\"}");
        Assert.True(McpTestClient.IsError(both));
        Assert.Contains("not both", McpTestClient.Text(both), StringComparison.Ordinal);

        var unknown = client.Call("wireframe_validate", "{\"file\":\"login.wire\"}");
        Assert.True(McpTestClient.IsError(unknown));
        Assert.Contains("unknown argument \"file\"", McpTestClient.Text(unknown), StringComparison.Ordinal);
    }

    // ============ wireframe_render ============

    [Fact]
    public void Render_a_source_gives_the_svg_as_text_and_as_an_image_and_writes_nothing()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);
        // Without "image" there is no image item: a model takes no SVG image, and a request that carries one may fail.
        var plain = client.Call("wireframe_render", "{\"source\":" + Json(GoodWire) + "}");
        Assert.Equal(new[] { "text", "text" }, McpTestClient.Content(plain).Select(c => c.GetProperty("type").GetString()).ToArray());
        Assert.DoesNotContain("image item", McpTestClient.Text(plain), StringComparison.Ordinal);

        var result = client.Call("wireframe_render", "{\"source\":" + Json(GoodWire) + ",\"theme\":\"sketch\",\"width\":400,\"image\":true}");

        Assert.False(McpTestClient.IsError(result));
        var content = McpTestClient.Content(result);
        Assert.Equal(new[] { "text", "text", "image" }, content.Select(c => c.GetProperty("type").GetString()).ToArray());
        Assert.Contains("nothing written", content[0].GetProperty("text").GetString(), StringComparison.Ordinal);

        var expected = WireframeCompiler.Compile(GoodWire, new Wireframe.Rendering.RenderOptions { Theme = "sketch", Width = 400 }).Svg;
        Assert.Equal(expected, content[1].GetProperty("text").GetString());
        Assert.Equal("image/svg+xml", content[2].GetProperty("mimeType").GetString());
        Assert.Equal(expected, Utf8.GetString(Convert.FromBase64String(content[2].GetProperty("data").GetString()!)));
        Assert.Empty(Directory.GetFileSystemEntries(folder.Dir));
    }

    [Fact]
    public void Render_with_errors_gives_no_picture_unless_forced()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);
        var bad = "wireframe clean\n    Label \"Hello\"\n    Step \"one\"\n/wireframe\n";

        var refused = client.Call("wireframe_render", "{\"source\":" + Json(bad) + "}");
        Assert.True(McpTestClient.IsError(refused));
        Assert.Single(McpTestClient.Content(refused));
        var text = McpTestClient.Text(refused);
        Assert.StartsWith("source(3,5): error: Unexpected token: Step\n", text, StringComparison.Ordinal);
        Assert.Contains("force", text, StringComparison.Ordinal);

        var forced = client.Call("wireframe_render", "{\"source\":" + Json(bad) + ",\"force\":true,\"image\":true}");
        Assert.True(McpTestClient.IsError(forced));
        Assert.StartsWith("source(3,5): error:", McpTestClient.Text(forced), StringComparison.Ordinal);
        Assert.Contains(McpTestClient.Content(forced), c => c.GetProperty("type").GetString() == "image");
    }

    [Fact]
    public void Render_a_wire_file_with_write_writes_the_svg_beside_it_and_leaves_the_text_out()
    {
        using var folder = new CliFolder();
        folder.File("screens/login.wire", GoodWire);
        using var client = new McpTestClient(folder.Dir);

        var result = client.Call("wireframe_render", "{\"path\":\"screens/login.wire\",\"write\":true,\"image\":true}");
        Assert.False(McpTestClient.IsError(result));
        Assert.True(folder.Exists("screens/login.svg"));
        Assert.Equal(WireframeCompiler.Compile(GoodWire).Svg, folder.Read("screens/login.svg"));

        var content = McpTestClient.Content(result);
        Assert.Equal(new[] { "text", "image" }, content.Select(c => c.GetProperty("type").GetString()).ToArray());
        Assert.StartsWith("✓ screens/login.wire → screens/login.svg", content[0].GetProperty("text").GetString(), StringComparison.Ordinal);

        var again = client.Call("wireframe_render", "{\"path\":\"screens/login.wire\",\"write\":true,\"image\":false}");
        Assert.Contains("(unchanged)", McpTestClient.Text(again), StringComparison.Ordinal);
        Assert.Equal(new[] { "text", "text" }, McpTestClient.Content(again).Select(c => c.GetProperty("type").GetString()).ToArray());
    }

    [Fact]
    public void Render_a_markdown_block_with_write_follows_the_stamp_rules()
    {
        using var folder = new CliFolder();
        folder.File("spec.md", Spec());
        using var client = new McpTestClient(folder.Dir);

        var several = client.Call("wireframe_render", "{\"path\":\"spec.md\"}");
        Assert.True(McpTestClient.IsError(several));
        Assert.Contains("login (block 1, line 5)", McpTestClient.Text(several), StringComparison.Ordinal);

        var result = client.Call("wireframe_render", "{\"path\":\"spec.md\",\"block\":\"login\",\"write\":true}");
        Assert.False(McpTestClient.IsError(result));
        Assert.StartsWith("✓ spec.md#login → spec.login.svg", McpTestClient.Text(result), StringComparison.Ordinal);
        Assert.StartsWith("<!-- wire v" + WireCli.Version + " doc=spec.md block=login ", folder.Read("spec.login.svg"), StringComparison.Ordinal);
        Assert.False(folder.Exists("spec.2.svg"));

        // A block's SVG that wire did not write is not overwritten
        folder.File("spec.2.svg", "<svg/>");
        var refused = client.Call("wireframe_render", "{\"path\":\"spec.md\",\"block\":2,\"write\":true}");
        Assert.True(McpTestClient.IsError(refused));
        Assert.Contains("not written by wire", McpTestClient.Text(refused), StringComparison.Ordinal);
        Assert.Equal("<svg/>", folder.Read("spec.2.svg"));
    }

    [Fact]
    public void Render_a_source_to_an_output_file()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);
        var result = client.Call("wireframe_render", "{\"source\":" + Json(GoodWire) + ",\"write\":true,\"output\":\"out/pic.svg\"}");
        Assert.True(McpTestClient.IsError(result), "The folder out is not there");

        Directory.CreateDirectory(Path.Combine(folder.Dir, "out"));
        result = client.Call("wireframe_render", "{\"source\":" + Json(GoodWire) + ",\"write\":true,\"output\":\"out/pic.svg\"}");
        Assert.False(McpTestClient.IsError(result));
        Assert.Equal(WireframeCompiler.Compile(GoodWire).Svg, folder.Read("out/pic.svg"));

        var notSvg = client.Call("wireframe_render", "{\"source\":" + Json(GoodWire) + ",\"write\":true,\"output\":\"out/pic.txt\"}");
        Assert.True(McpTestClient.IsError(notSvg));
        Assert.Contains("only .svg files", McpTestClient.Text(notSvg), StringComparison.Ordinal);
        Assert.False(folder.Exists("out/pic.txt"));
    }

    public static TheoryData<string, string> ConformanceCases()
    {
        var dir = ConformanceDir();
        var names = Directory.GetFiles(dir, "*.wire")
            .Select(f => Path.GetFileNameWithoutExtension(f)!)
            .Where(n => File.Exists(Path.Combine(dir, n + ".clean.svg"))
                && File.ReadAllText(Path.Combine(dir, n + ".diagnostics.json")).Trim() == "[]")
            .OrderBy(n => n, StringComparer.Ordinal)
            .ToList();
        var themes = new[] { "clean", "sketch", "blueprint", "realistic" };
        var data = new TheoryData<string, string>();
        for (var k = 0; k < 10; k++)
        {
            data.Add(names[(k * names.Count / 10) + 1], themes[k % 4]);
        }

        return data;
    }

    [Theory]
    [MemberData(nameof(ConformanceCases))]
    public void Render_of_a_conformance_case_gives_the_cases_svg(string name, string theme)
    {
        var dir = ConformanceDir();
        using var client = new McpTestClient(dir);
        var result = client.Call("wireframe_render", "{\"path\":\"" + name + ".wire\",\"theme\":\"" + theme + "\",\"image\":false}");

        Assert.False(McpTestClient.IsError(result), McpTestClient.Text(result));
        var svg = McpTestClient.Content(result)[1].GetProperty("text").GetString()!;
        var expected = Utf8.GetString(File.ReadAllBytes(Path.Combine(dir, $"{name}.{theme}.svg")));
        Assert.Equal(expected, svg + "\n");
    }

    // ============ wireframe_render_document and wireframe_check ============

    [Fact]
    public void Render_document_writes_each_blocks_svg_and_links_them()
    {
        using var folder = new CliFolder();
        folder.File("spec.md", Spec());
        using var client = new McpTestClient(folder.Dir);

        var result = client.Call("wireframe_render_document", "{\"path\":\"spec.md\",\"link\":true}");
        Assert.False(McpTestClient.IsError(result), McpTestClient.Text(result));
        var text = McpTestClient.Text(result);
        Assert.Contains("#login spec.login.svg: written", text, StringComparison.Ordinal);
        Assert.Contains("#2 spec.2.svg: written", text, StringComparison.Ordinal);
        Assert.Contains("image links updated", text, StringComparison.Ordinal);
        Assert.True(folder.Exists("spec.login.svg"));
        Assert.True(folder.Exists("spec.2.svg"));
        Assert.Contains("wire:image", folder.Read("spec.md"), StringComparison.Ordinal);

        var again = McpTestClient.Text(client.Call("wireframe_render_document", "{\"path\":\"spec.md\"}"));
        Assert.Contains("spec.login.svg: unchanged", again, StringComparison.Ordinal);

        var wire = client.Call("wireframe_render_document", "{\"path\":\"spec.login.svg\"}");
        Assert.True(McpTestClient.IsError(wire));
    }

    [Fact]
    public void Render_document_with_a_bad_block_says_where_in_the_document()
    {
        using var folder = new CliFolder();
        folder.File("spec.md", Spec("    Step \"x\""));
        using var client = new McpTestClient(folder.Dir);
        var result = client.Call("wireframe_render_document", "{\"path\":\"spec.md\"}");
        Assert.True(McpTestClient.IsError(result));
        Assert.StartsWith("spec.md(7,5): error: Unexpected token: Step\n", McpTestClient.Text(result), StringComparison.Ordinal);
        Assert.Contains("spec.2.svg: written", McpTestClient.Text(result), StringComparison.Ordinal);
    }

    [Fact]
    public void Check_finds_missing_and_stale_svgs_and_writes_nothing()
    {
        using var folder = new CliFolder();
        folder.File("docs/spec.md", Spec());
        folder.File("docs/screen.wire", GoodWire);
        using var client = new McpTestClient(folder.Dir);

        var missing = client.Call("wireframe_check", "{\"path\":\"docs\"}");
        Assert.True(McpTestClient.IsError(missing));
        Assert.Contains("3 of 3 SVGs missing or stale (2 files checked)", McpTestClient.Text(missing), StringComparison.Ordinal);
        Assert.Equal(2, Directory.GetFiles(Path.Combine(folder.Dir, "docs")).Length);

        client.Call("wireframe_render_document", "{\"path\":\"docs/spec.md\"}");
        client.Call("wireframe_render", "{\"path\":\"docs/screen.wire\",\"write\":true}");
        var fine = client.Call("wireframe_check", "{}");
        Assert.False(McpTestClient.IsError(fine), McpTestClient.Text(fine));
        Assert.Equal("✓ 3 SVGs up to date (2 files checked)", McpTestClient.Text(fine).TrimEnd());

        folder.File("docs/spec.md", Spec("    Button \"Log in\" primary"));
        var stale = client.Call("wireframe_check", "{\"path\":\"docs/spec.md\"}");
        Assert.True(McpTestClient.IsError(stale));
        // The command's words, with the system's path separator in the SVG's path
        Assert.StartsWith("docs/spec.md(5,1): error: docs/spec.login.svg is stale", McpTestClient.Text(stale).Replace('\\', '/'), StringComparison.Ordinal);

        var other = client.Call("wireframe_check", "{\"path\":\"docs/spec.md\",\"theme\":\"sketch\"}");
        Assert.True(McpTestClient.IsError(other), "The stamp holds the theme: another theme is stale");
    }

    // ============ wireframe_components and wireframe_examples ============

    [Fact]
    public void Components_without_a_name_is_a_list()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);
        var result = client.Call("wireframe_components");
        Assert.False(McpTestClient.IsError(result));
        var text = McpTestClient.Text(result);
        Assert.StartsWith("Layouts: Canvas, Dock, Grid, Horizontal, Scroll, Vertical\n", text, StringComparison.Ordinal);
        Assert.Contains("\nControls: ", text, StringComparison.Ordinal);
        Assert.Contains("\nModifiers: primary, ", text, StringComparison.Ordinal);
        Assert.True(text.Split('\n').Length < 15, "A list, not the manual");
    }

    [Fact]
    public void Components_with_a_name_says_how_it_is_written_with_an_example()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);

        var card = McpTestClient.Text(client.Call("wireframe_components", "{\"name\":\"Card\"}"));
        Assert.Contains("Card: section; holds children, ends with /Card", card, StringComparison.Ordinal);
        Assert.Contains("```wireframe\nCard", card, StringComparison.Ordinal);
        AssertExampleParses(card);

        var button = McpTestClient.Text(client.Call("wireframe_components", "{\"name\":\"Button\"}"));
        Assert.Contains("Button: control; no closing keyword", button, StringComparison.Ordinal);
        AssertExampleParses(button);

        var step = McpTestClient.Text(client.Call("wireframe_components", "{\"name\":\"Step\"}"));
        Assert.Contains("does not read Step as an element", step, StringComparison.Ordinal);

        var wrong = client.Call("wireframe_components", "{\"name\":\"button\"}");
        Assert.True(McpTestClient.IsError(wrong));
        Assert.StartsWith("\"button\" is not a control or component. Did you mean \"Button\"?", McpTestClient.Text(wrong), StringComparison.Ordinal);
    }

    private static void AssertExampleParses(string text)
    {
        var blocks = WireframeBlocks.Find(text);
        Assert.Single(blocks);
        Assert.Empty(WireframeParser.Parse(blocks[0].Source).Diagnostics);
    }

    [Fact]
    public void Examples_gives_up_to_three_that_parse()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);
        foreach (var about in new[] { "form", "table", "dialog" })
        {
            var result = client.Call("wireframe_examples", "{\"about\":\"" + about + "\"}");
            Assert.False(McpTestClient.IsError(result));
            var blocks = WireframeBlocks.Find(McpTestClient.Text(result));
            Assert.InRange(blocks.Count, 1, 3);
            Assert.All(blocks, b => Assert.Empty(WireframeParser.Parse(b.Source).Diagnostics));
        }

        var list = McpTestClient.Text(client.Call("wireframe_examples"));
        Assert.Contains("(docs/examples/button.wire)", list, StringComparison.Ordinal);
        Assert.False(McpTestClient.IsError(client.Call("wireframe_examples", "{\"about\":\"zzzz\"}")));
    }

    [Fact]
    public void The_embedded_examples_all_parse_and_the_broken_ones_are_left_out()
    {
        Assert.NotEmpty(Library.Examples);
        Assert.All(Library.Examples, e => Assert.Empty(WireframeParser.Parse(e.Source).Diagnostics));
        Assert.Contains(Library.Examples, e => e.Origin == "docs/EXAMPLES.md" && e.Title == "Login Form");
        Assert.DoesNotContain(Library.Examples, e => e.Title == "Breadcrumb Navigation");
        Assert.Equal(34, Library.Examples.Count(e => e.Origin.StartsWith("docs/examples/", StringComparison.Ordinal)));
    }

    // ============ Resources ============

    [Fact]
    public void Resources_list_read_and_templates()
    {
        using var folder = new CliFolder();
        using var client = new McpTestClient(folder.Dir);

        var resources = client.Request("resources/list").GetProperty("result").GetProperty("resources").EnumerateArray().ToList();
        Assert.Contains(resources, r => r.GetProperty("uri").GetString() == "wireframe://reference");

        var templates = client.Request("resources/templates/list").GetProperty("result").GetProperty("resourceTemplates").EnumerateArray().ToList();
        Assert.Equal("wireframe://components/{name}", Assert.Single(templates).GetProperty("uriTemplate").GetString());

        var reference = client.Request("resources/read", "{\"uri\":\"wireframe://reference\"}").GetProperty("result").GetProperty("contents")[0];
        Assert.Equal("wireframe://reference", reference.GetProperty("uri").GetString());
        Assert.Equal("text/markdown", reference.GetProperty("mimeType").GetString());
        Assert.StartsWith("# The Wireframe language in one page", reference.GetProperty("text").GetString(), StringComparison.Ordinal);

        var card = client.Request("resources/read", "{\"uri\":\"wireframe://components/Card\"}").GetProperty("result").GetProperty("contents")[0];
        Assert.Equal(McpTestClient.Text(client.Call("wireframe_components", "{\"name\":\"Card\"}")), card.GetProperty("text").GetString());

        var none = client.Request("resources/read", "{\"uri\":\"wireframe://components/Nope\"}");
        Assert.Equal(-32002, none.GetProperty("error").GetProperty("code").GetInt32());
    }

    [Fact]
    public void The_reference_is_one_page_and_its_examples_parse()
    {
        var reference = Library.Reference;
        Assert.InRange(reference.Split('\n').Length, 100, 200);
        var blocks = WireframeBlocks.Find(reference);
        Assert.True(blocks.Count >= 4);
        Assert.All(blocks, b => Assert.Empty(WireframeParser.Parse(b.Source).Diagnostics));

        // Every keyword the parser reads as an element is named in it
        foreach (var c in Components.All().Where(c => c.Kind != "part"))
        {
            Assert.Contains("`" + c.Name + "`", reference, StringComparison.Ordinal);
        }
    }

    // ============ The root ============

    [Fact]
    public void A_path_outside_the_root_is_refused_by_a_reading_tool()
    {
        using var outer = new CliFolder();
        outer.File("secret.wire", GoodWire);
        outer.File("root/inside.wire", GoodWire);
        using var client = new McpTestClient(Path.Combine(outer.Dir, "root"));

        foreach (var path in new[] { "../secret.wire", Path.Combine(outer.Dir, "secret.wire"), "sub/../../secret.wire" })
        {
            var result = client.Call("wireframe_validate", "{\"path\":" + Json(path) + "}");
            Assert.True(McpTestClient.IsError(result));
            Assert.Contains("outside the folder this server works in", McpTestClient.Text(result), StringComparison.Ordinal);
        }

        Assert.True(McpTestClient.IsError(client.Call("wireframe_check", "{\"path\":\"..\"}")));
        Assert.True(McpTestClient.IsError(client.Call("wireframe_render", "{\"path\":\"../secret.wire\"}")));
        Assert.False(McpTestClient.IsError(client.Call("wireframe_validate", "{\"path\":" + Json(Path.Combine(outer.Dir, "root", "inside.wire")) + "}")));
    }

    [Fact]
    public void A_path_outside_the_root_is_refused_by_a_writing_tool()
    {
        using var outer = new CliFolder();
        outer.File("doc.md", Spec());
        outer.File("root/keep.txt", "x");
        using var client = new McpTestClient(Path.Combine(outer.Dir, "root"));

        var output = client.Call("wireframe_render", "{\"source\":" + Json(GoodWire) + ",\"write\":true,\"output\":\"../evil.svg\"}");
        Assert.True(McpTestClient.IsError(output));
        Assert.Contains("outside the folder this server works in", McpTestClient.Text(output), StringComparison.Ordinal);

        var document = client.Call("wireframe_render_document", "{\"path\":\"../doc.md\",\"link\":true}");
        Assert.True(McpTestClient.IsError(document));
        Assert.Contains("outside the folder this server works in", McpTestClient.Text(document), StringComparison.Ordinal);

        Assert.Equal(new[] { "doc.md", "root" }, Directory.GetFileSystemEntries(outer.Dir).Select(Path.GetFileName).Order(StringComparer.Ordinal).ToArray());
        Assert.Equal(Spec(), outer.Read("doc.md"));
    }

    [Fact]
    public void A_link_that_leads_outside_the_root_is_refused_where_links_can_be_made()
    {
        using var outer = new CliFolder();
        outer.File("outside/secret.wire", GoodWire);
        Directory.CreateDirectory(Path.Combine(outer.Dir, "root"));
        var link = Path.Combine(outer.Dir, "root", "linked");
        if (!TryMakeDirectoryLink(link, Path.Combine(outer.Dir, "outside")))
        {
            return; // No symbolic links or junctions on this machine: nothing to show
        }

        using var client = new McpTestClient(Path.Combine(outer.Dir, "root"));
        var result = client.Call("wireframe_validate", "{\"path\":\"linked/secret.wire\"}");
        Assert.True(McpTestClient.IsError(result));
        Assert.Contains("through a link", McpTestClient.Text(result), StringComparison.Ordinal);

        var write = client.Call("wireframe_render", "{\"source\":" + Json(GoodWire) + ",\"write\":true,\"output\":\"linked/x.svg\"}");
        Assert.True(McpTestClient.IsError(write));
        Assert.False(File.Exists(Path.Combine(outer.Dir, "outside", "x.svg")));
        Directory.Delete(link);
    }

    private static bool TryMakeDirectoryLink(string link, string target)
    {
        try
        {
            Directory.CreateSymbolicLink(link, target);
            return true;
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            // Symbolic links need a privilege on Windows; a junction does not
        }

        if (!OperatingSystem.IsWindows())
        {
            return false;
        }

        try
        {
            using var process = Process.Start(new ProcessStartInfo("cmd.exe", $"/c mklink /J \"{link}\" \"{target}\"")
            {
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
            })!;
            process.StandardOutput.ReadToEnd();
            process.StandardError.ReadToEnd();
            process.WaitForExit();
            return process.ExitCode == 0 && Directory.Exists(link);
        }
        catch (System.ComponentModel.Win32Exception)
        {
            return false;
        }
    }

    // ============ Started and stopped ============

    [Fact]
    public void Started_and_stopped_a_hundred_times_leaves_no_thread_and_no_file()
    {
        using var folder = new CliFolder();
        folder.File("login.wire", GoodWire);
        var threadsBefore = Process.GetCurrentProcess().Threads.Count;

        for (var i = 0; i < 100; i++)
        {
            using var client = new McpTestClient(folder.Dir);
            client.Initialize();
            Assert.False(McpTestClient.IsError(client.Call("wireframe_validate", "{\"path\":\"login.wire\"}")));
            Assert.Equal(0, client.Close());
        }

        Assert.Equal(new[] { "login.wire" }, Directory.GetFileSystemEntries(folder.Dir).Select(Path.GetFileName).ToArray());
        var threadsAfter = Process.GetCurrentProcess().Threads.Count;
        Assert.True(threadsAfter - threadsBefore < 20, $"Threads before {threadsBefore}, after {threadsAfter}");
    }

    [Fact]
    public async Task The_built_wire_mcp_answers_in_json_lines_and_exits_when_input_closes()
    {
        var dll = Path.Combine(AppContext.BaseDirectory, "wire.dll");
        Assert.True(File.Exists(dll), "The tool is built beside the tests");
        using var folder = new CliFolder();

        var start = new ProcessStartInfo(Environment.GetEnvironmentVariable("DOTNET_HOST_PATH") ?? "dotnet")
        {
            UseShellExecute = false,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            StandardInputEncoding = Utf8,
            StandardOutputEncoding = Utf8,
            CreateNoWindow = true,
            WorkingDirectory = folder.Dir,
        };
        start.ArgumentList.Add(dll);
        start.ArgumentList.Add("mcp");

        using var process = Process.Start(start)!;
        var stdout = process.StandardOutput.BaseStream;
        var outputTask = Task.Run(() =>
        {
            using var bytes = new MemoryStream();
            stdout.CopyTo(bytes);
            return bytes.ToArray();
        });
        var errorTask = process.StandardError.ReadToEndAsync();

        var input = process.StandardInput;
        input.Write("{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-06-18\",\"capabilities\":{},\"clientInfo\":{\"name\":\"t\",\"version\":\"1\"}}}\n");
        input.Write("{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}\n");
        input.Write("{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\"}\n");
        input.Write("{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"wireframe_render\",\"arguments\":{\"source\":" + Json(GoodWire) + "}}}\n");
        input.Close();

        Assert.True(process.WaitForExit(60_000), "wire mcp ends when its input closes");
        var output = await outputTask;
        Assert.Equal(0, process.ExitCode);
        Assert.False(output.Length >= 3 && output[0] == 0xEF && output[1] == 0xBB && output[2] == 0xBF, "No byte order mark");

        var lines = Utf8.GetString(output).Split('\n');
        Assert.Equal("", lines[^1]);
        Assert.Equal(3, lines.Length - 1);
        for (var i = 0; i < 3; i++)
        {
            var message = McpTestClient.Parse(lines[i]);
            Assert.Equal(i + 1, message.GetProperty("id").GetInt32());
            Assert.True(message.TryGetProperty("result", out _));
        }

        Assert.Equal("", await errorTask);
        Assert.Empty(Directory.GetFileSystemEntries(folder.Dir));
    }

    // ============ The command's side ============

    [Fact]
    public void Wire_block_renders_one_block_and_leaves_the_others()
    {
        using var folder = new CliFolder();
        folder.File("spec.md", Spec());

        var run = folder.Run("spec.md", "--block", "2");
        Assert.Equal(0, run.Code);
        Assert.True(folder.Exists("spec.2.svg"));
        Assert.False(folder.Exists("spec.login.svg"));

        Assert.Equal(0, folder.Run("spec.md", "--block", "login").Code);
        Assert.True(folder.Exists("spec.login.svg"));

        var missing = folder.Run("spec.md", "--block", "nope");
        Assert.Equal(1, missing.Code);
        Assert.Contains("no wireframe block 'nope': the blocks are login (1), 2", missing.Err, StringComparison.Ordinal);

        folder.File("x.wire", GoodWire);
        Assert.Equal(2, folder.Run("x.wire", "--block", "1").Code);
        Assert.Equal(2, folder.Run("spec.md", "--block", "1", "--link").Code);
    }

    [Fact]
    public void Wire_mcp_takes_only_root()
    {
        using var folder = new CliFolder();
        var bad = folder.Run("mcp", "--bogus");
        Assert.Equal(2, bad.Code);
        Assert.Contains("--root", bad.Err, StringComparison.Ordinal);
        Assert.Equal(2, folder.Run("mcp", "--root", "missing-folder").Code);
        Assert.Equal(2, folder.Run("mcp", "file.wire").Code);
        Assert.Equal(0, folder.Run("mcp", "--root=.").Code);
    }

    private static string ConformanceDir()
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
}

/// <summary>Source-generated JSON for the tests' strings.</summary>
[System.Text.Json.Serialization.JsonSerializable(typeof(string))]
internal sealed partial class McpTestJson : System.Text.Json.Serialization.JsonSerializerContext
{
}
