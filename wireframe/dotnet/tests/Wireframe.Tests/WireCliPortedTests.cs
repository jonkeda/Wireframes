using System.Text.Json;
using System.Text.RegularExpressions;
using Wireframe.Cli;

namespace Wireframe.Tests;

/// <summary>The TypeScript tool's own tests (<c>packages/cli/src/cli.test.ts</c>), run against the .NET tool.</summary>
public sealed class WireCliPortedTests : IDisposable
{
    internal const string Valid = "wireframe\n    Button \"Go\"\n/wireframe\n";
    internal const string Sketch = "wireframe sketch\n    Button \"Go\"\n/wireframe\n";
    internal const string Invalid = "wireframe\n    Button \"Go\"\n    @@@\n/wireframe\n";

    private readonly CliFolder folder = new();

    public void Dispose() => folder.Dispose();

    private string File(string name, string? content = null) => folder.File(name, content);

    private CliRun Cli(params string[] args) => folder.Run(args);

    // parseArgs

    [Fact]
    public void Parses_flags_with_separate_values_and_flag_equals_value()
    {
        var o = CliOptions.Parse(new[] { "a.wire", "-o", "x.svg", "--theme=sketch", "--width", "1024", "--height=700", "-q", "-f" });
        Assert.Equal(CliCommand.Compile, o.Command);
        Assert.Equal(new[] { "a.wire" }, o.Inputs);
        Assert.Equal("x.svg", o.Output);
        Assert.Equal("sketch", o.Theme);
        Assert.Equal(1024, o.Width);
        Assert.Equal(700, o.Height);
        Assert.True(o.Quiet);
        Assert.True(o.Force);
        Assert.False(o.Validate);
    }

    [Fact]
    public void Rejects_unknown_flags()
    {
        Assert.Throws<UsageError>(() => CliOptions.Parse(new[] { "a.wire", "--bogus" }));
        Assert.Contains("Unknown option \"--colour\"", Assert.Throws<UsageError>(() => CliOptions.Parse(new[] { "a.wire", "--colour=red" })).Message);
        Assert.Throws<UsageError>(() => CliOptions.Parse(new[] { "-x" }));
    }

    [Fact]
    public void Rejects_missing_and_invalid_values()
    {
        Assert.Contains("expects a value", Assert.Throws<UsageError>(() => CliOptions.Parse(new[] { "a.wire", "-o" })).Message);
        Assert.Contains("positive whole number", Assert.Throws<UsageError>(() => CliOptions.Parse(new[] { "a.wire", "--width", "wide" })).Message);
        Assert.Contains("does not take a value", Assert.Throws<UsageError>(() => CliOptions.Parse(new[] { "a.wire", "--quiet=yes" })).Message);
    }

    [Fact]
    public void Recognises_the_parse_command_and_double_dash_before_inputs()
    {
        var parse = CliOptions.Parse(new[] { "parse", "a.wire" });
        Assert.Equal(CliCommand.Parse, parse.Command);
        Assert.Equal(new[] { "a.wire" }, parse.Inputs);
        Assert.Equal(new[] { "-odd.wire" }, CliOptions.Parse(new[] { "--", "-odd.wire" }).Inputs);
    }

    [Fact]
    public void Accepts_dash_o_dash_for_stdout() =>
        Assert.Equal(WireCli.StdoutPath, CliOptions.Parse(new[] { "a.wire", "-o", "-" }).Output);

    // output paths

    [Fact]
    public void Replaces_wire_and_appends_svg_to_anything_else()
    {
        Assert.Equal("/p/file.svg", WireCli.DefaultOutputName("/p/file.wire"));
        Assert.Equal("spec.txt.svg", WireCli.DefaultOutputName("spec.txt"));
        Assert.Equal("noext.svg", WireCli.DefaultOutputName("noext"));
        Assert.Equal("a.wire.bak.svg", WireCli.DefaultOutputName("a.wire.bak"));
    }

    [Fact]
    public void Never_equals_the_input()
    {
        foreach (var p in new[] { "a.wire", "a.txt", "a.svg", "a" })
        {
            Assert.NotEqual(p, WireCli.ResolveOutputPath(p, null, false));
        }
    }

    [Fact]
    public void Joins_a_directory_output_with_the_default_name()
    {
        Assert.Equal(Path.Combine("out", "a.svg"), WireCli.ResolveOutputPath("src/a.wire", "out", true));
        Assert.Equal(Path.Combine("out", "spec.txt.svg"), WireCli.ResolveOutputPath("src/spec.txt", "out", true));
        Assert.Equal("x.svg", WireCli.ResolveOutputPath("a.wire", "x.svg", false));
        Assert.Equal(WireCli.StdoutPath, WireCli.ResolveOutputPath("a.wire", "-", false));
    }

    [Fact]
    public void Formats_errors_as_file_line_column_error_message() =>

        // Deliberately not the TypeScript form (a.wire:3:5): the form editors and build logs understand
        Assert.Equal("a.wire(3,5): error: Boom", WireCli.FormatError("a.wire", 3, 5, "Boom"));

    // run

    [Fact]
    public void Does_not_overwrite_a_non_wire_input()
    {
        var input = File("spec.txt", Valid);
        var r = Cli(input);
        Assert.Equal(0, r.Code);
        Assert.Equal(Valid, folder.Read("spec.txt"));
        Assert.Contains("<svg", folder.Read("spec.txt.svg"), StringComparison.Ordinal);
    }

    [Fact]
    public void Refuses_to_write_the_output_over_the_input()
    {
        var input = File("a.wire", Valid);
        var r = Cli(input, "-o", input);
        Assert.Equal(1, r.Code);
        Assert.Equal(Valid, folder.Read("a.wire"));
    }

    [Fact]
    public void Reports_errors_with_line_and_column_exits_1_and_writes_nothing()
    {
        var input = File("bad.wire", Invalid);
        var r = Cli(input);
        Assert.Equal(1, r.Code);
        Assert.Matches(new Regex("^" + Regex.Escape(input) + @"\(3,\d+\): error: "), r.ErrLines[0]);
        Assert.False(folder.Exists("bad.svg"));
    }

    [Fact]
    public void Force_writes_despite_recoverable_errors_but_still_exits_1()
    {
        var input = File("bad.wire", Invalid);
        var r = Cli(input, "--force");
        Assert.Equal(1, r.Code);
        Assert.Contains(r.ErrLines, l => l.Contains("(3,", StringComparison.Ordinal));
        Assert.Contains("<svg", folder.Read("bad.svg"), StringComparison.Ordinal);
    }

    [Fact]
    public void Validate_reports_file_line_column_and_exits_1()
    {
        var input = File("bad.wire", Invalid);
        var r = Cli("--validate", input);
        Assert.Equal(1, r.Code);
        Assert.Contains("(3,", r.ErrLines[0], StringComparison.Ordinal);
        Assert.Contains("): error: ", r.ErrLines[0], StringComparison.Ordinal);
        Assert.Equal(0, Cli("-v", File("ok.wire", Valid)).Code);
    }

    [Fact]
    public void Uses_the_documents_own_style_when_no_theme_is_given()
    {
        var input = File("s.wire", Sketch);
        var output = File("s.svg");
        Assert.Equal(0, Cli(input, "-o", output).Code);
        var viaHeader = folder.Read("s.svg");
        Assert.Equal(0, Cli(input, "-o", output, "--theme=clean").Code);
        var viaFlag = folder.Read("s.svg");
        Assert.Equal(0, Cli(input, "-o", output, "--theme", "sketch").Code);
        var sketchFlag = folder.Read("s.svg");
        Assert.Equal(viaHeader, sketchFlag);
        Assert.NotEqual(viaHeader, viaFlag);
    }

    [Fact]
    public void A_config_theme_is_used_when_no_theme_is_given()
    {
        var input = File("s.wire", Sketch);
        var cfg = File("c.json", "{\"theme\":\"clean\"}");
        var output = File("s.svg");
        Cli(input, "-o", output, "-c", cfg);
        var viaConfig = folder.Read("s.svg");
        Cli(input, "-o", output, "-t", "clean");
        Assert.Equal(viaConfig, folder.Read("s.svg"));
    }

    [Fact]
    public void Dash_o_dash_writes_the_svg_only_to_stdout()
    {
        var input = File("a.wire", Valid);
        var r = Cli(input, "-o", "-");
        Assert.Equal(0, r.Code);
        Assert.StartsWith("<svg", r.Out, StringComparison.Ordinal);
        Assert.Equal(WireframeCompiler.Compile(Valid).Svg + "\n", r.Out);
        Assert.False(folder.Exists("a.svg"));
    }

    [Fact]
    public void Dash_o_dash_with_several_inputs_is_a_usage_error() =>
        Assert.Equal(2, Cli(File("a.wire", Valid), File("b.wire", Valid), "-o", "-").Code);

    [Fact]
    public void The_help_text_matches_the_behaviour()
    {
        Assert.DoesNotContain("default: stdout", WireCli.Help, StringComparison.Ordinal);
        Assert.Contains("\"-\" for stdout", WireCli.Help, StringComparison.Ordinal);
        Assert.Contains("parse", WireCli.Help, StringComparison.Ordinal);
        Assert.Contains("--stamp", WireCli.Help, StringComparison.Ordinal);
        Assert.DoesNotContain("\r", WireCli.Help, StringComparison.Ordinal);
        Assert.Equal(WireCli.Help + "\n", Cli("--help").Out);
    }

    [Fact]
    public void Writes_several_inputs_into_the_output_directory()
    {
        var a = File("a.wire", Valid);
        var b = File("b.txt", Valid);
        var output = Path.Combine(folder.Dir, "out");
        Directory.CreateDirectory(output);
        var r = Cli(a, b, "-o", output);
        Assert.Equal(0, r.Code);
        Assert.True(folder.Exists("out/a.svg"));
        Assert.True(folder.Exists("out/b.txt.svg"));
    }

    [Fact]
    public void Writes_several_inputs_into_the_config_output_directory_created_if_missing()
    {
        var a = File("a.wire", Valid);
        var b = File("b.wire", Valid);
        var output = Path.Combine(folder.Dir, "dist");
        var cfg = File("c.json", JsonSerializer.Serialize(new Dictionary<string, string> { ["output"] = output }));
        var r = Cli("-c", cfg, a, b);
        Assert.Equal(0, r.Code);
        Assert.True(folder.Exists("dist/a.svg"));
        Assert.True(folder.Exists("dist/b.svg"));
    }

    [Fact]
    public void Several_inputs_with_an_existing_output_file_is_an_error()
    {
        var existing = File("x.svg", "");
        Assert.Equal(2, Cli(File("a.wire", Valid), File("b.wire", Valid), "-o", existing).Code);
    }

    [Fact]
    public void Counts_successes_correctly()
    {
        var r = Cli(File("a.wire", Valid), File("b.wire", Invalid), File("c.wire", Invalid), Path.Combine(folder.Dir, "missing.wire"));
        Assert.Equal(1, r.Code);
        Assert.Contains("Processed 4 file(s): 1 succeeded, 3 failed", r.Out, StringComparison.Ordinal);
        var ok = Cli(File("d.wire", Valid), File("e.wire", Valid));
        Assert.Contains("2 succeeded, 0 failed", ok.Out, StringComparison.Ordinal);
    }

    [Fact]
    public void Unknown_flags_are_an_error_with_exit_code_2()
    {
        var r = Cli(File("a.wire", Valid), "--colour=red");
        Assert.Equal(2, r.Code);
        Assert.Contains("Unknown option \"--colour\"", r.ErrLines[0], StringComparison.Ordinal);
        Assert.False(folder.Exists("a.svg"));
    }

    [Fact]
    public void Flag_equals_value_works_end_to_end()
    {
        var input = File("a.wire", Valid);
        var output = File("wide.svg");
        Assert.Equal(0, Cli(input, $"--output={output}", "--width=1234").Code);
        Assert.Contains("width=\"1234\"", folder.Read("wide.svg"), StringComparison.Ordinal);
    }

    [Fact]
    public void No_inputs_is_a_usage_error() => Assert.Equal(2, Cli().Code);

    [Fact]
    public void A_missing_input_file_fails_with_exit_1()
    {
        var r = Cli(Path.Combine(folder.Dir, "nope.wire"));
        Assert.Equal(1, r.Code);
        Assert.Contains("could not read file", r.ErrLines[0], StringComparison.Ordinal);
    }

    // parse command

    [Fact]
    public void Parse_prints_the_ast_and_errors_as_json()
    {
        var r = Cli("parse", File("a.wire", Valid));
        Assert.Equal(0, r.Code);
        using var json = JsonDocument.Parse(r.Out);
        Assert.Equal(0, json.RootElement.GetProperty("errors").GetArrayLength());
        Assert.Equal(JsonValueKind.String, json.RootElement.GetProperty("document").GetProperty("type").ValueKind);
        Assert.Contains("Go", json.RootElement.GetProperty("document").GetRawText(), StringComparison.Ordinal);
    }

    [Fact]
    public void Parse_exits_1_and_includes_the_errors()
    {
        var input = File("bad.wire", Invalid);
        var r = Cli("parse", input);
        Assert.Equal(1, r.Code);
        using var json = JsonDocument.Parse(r.Out);
        var errors = json.RootElement.GetProperty("errors");
        Assert.True(errors.GetArrayLength() > 0);
        Assert.Equal(3, errors[0].GetProperty("line").GetInt32());
        Assert.Equal(JsonValueKind.Number, errors[0].GetProperty("column").ValueKind);
        Assert.Contains($"{input}(3,", r.ErrLines[0], StringComparison.Ordinal);
    }

    [Fact]
    public void Parse_prints_an_array_for_several_inputs()
    {
        var a = File("a.wire", Valid);
        var b = File("b.wire", Valid);
        using var json = JsonDocument.Parse(Cli("parse", a, b).Out);
        Assert.Equal(new[] { a, b }, json.RootElement.EnumerateArray().Select(x => x.GetProperty("file").GetString()));
    }
}
