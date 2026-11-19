using System.Globalization;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using Wireframe.Markdown;
using Wireframe.Mcp;
using Wireframe.Rendering;
using Wireframe.Syntax;

namespace Wireframe.Cli;

/// <summary>
/// The tool <c>wire</c>: a wireframe in, an SVG out. The same arguments and exit codes as the TypeScript tool
/// (<c>packages/cli</c>), and Markdown, <c>--json</c>, <c>--check</c>, <c>--stdin</c>, <c>--link</c> and
/// <c>components</c> besides (<c>.my/net/200-Cli.md</c>).
/// </summary>
public static class WireCli
{
    /// <summary>The tool's version, the same as the TypeScript tool it mirrors.</summary>
    public const string Version = "0.1.0";

    /// <summary>The output value meaning "write to standard output".</summary>
    public const string StdoutPath = "-";

    /// <summary>The help text.</summary>
    public static readonly string Help = """

Wireframe CLI - UI Mockup Compiler (.NET)

Usage:
  wire [options] <input-file> [input-file2 ...]
  wire [options] --stdin
  wire parse <input-file> [input-file2 ...]
  wire components [<name>] [--json]
  wire mcp [--root <folder>]
  wire hook after-write | before-stop
  wire --help
  wire --version

Commands:
  (default)             Compile each input to SVG. An input ending in .md or
                        .markdown is a Markdown document: each ```wireframe block
                        in it is rendered to <document>.<id>.svg when its fence
                        has an id (```wireframe id=login), else <document>.<n>.svg
                        with n the block's number in the document
  parse                 Print the parse tree (AST) and errors as JSON to stdout
  components            List the language's layouts, sections, controls,
                        components and modifiers (or one of them, by name)
  mcp                   Serve the tools as an MCP server over standard input and
                        output (JSON-RPC, one message per line). It reads and
                        writes only under the current folder, or --root <folder>
  hook                  For Claude Code's hooks; the hook's event is read as JSON
                        from standard input. after-write (PostToolUse of Write
                        and Edit) renders the wireframes of the file written and
                        hands their errors to the agent (exit 2). before-stop
                        (Stop) sends the agent back once when a file handled in
                        the session has an error or a stale or missing picture;
                        WIRE_HOOK_STOP=off switches it off

Options:
  -o, --output <path>   Output file, or "-" for stdout. With several inputs or a
                        Markdown input: a directory (created if missing).
                        Default: next to each input, with a .wire extension
                        replaced by .svg (any other name gets .svg appended:
                        spec.txt -> spec.txt.svg)
  --out-dir <folder>    Write the SVGs under this folder, in the inputs' folder
                        layout (relative to the current folder)
  -w, --width <n>       SVG width in pixels (default: fits the content, 800 at most)
  -h, --height <n>      Minimum SVG height in pixels (default: fits the content)
  -t, --theme <name>    Theme: clean, sketch, blueprint, realistic
                        (default: the document's own "wireframe <style>" header, else clean)
  --format <format>     svg, the default and for now the only one (PNG comes later)
  -v, --validate        Validate only, don't render
  -f, --force           Write the SVG even when the source has (recoverable) errors;
                        the errors are still reported and the exit code is still 1
  --check               Write nothing; exit 1 when an SVG is missing or is not what
                        its source renders to now with these options
  --stamp               Start the SVG of a .wire file with the stamp line (below)
  --link                Write or update an image line under each block of a
                        Markdown input, between <!-- wire:image --> markers
  --block <id|n>        With one Markdown input: only the block with this id
                        (```wireframe id=login) or number; nothing else is
                        written or deleted
  --stdin               Read one wireframe from standard input (output: -o, else stdout)
  --json                Diagnostics and results as JSON on stdout
  --watch               Watch for file changes and recompile
  -c, --config <file>   Load configuration from JSON file
  -q, --quiet           Suppress non-error output
  --help                Show this help message
  --version             Show version number

  Options taking a value also accept --name=value (e.g. --theme=sketch).
  Unknown options are an error. "--" ends the options.
  An input that is a folder is every .wire, .md and .markdown file under it; an
  input with * or ? in its file name is every file that fits (the tool reads the
  pattern itself, so it works in a shell that does not).

The stamp line:
  Every SVG written for a Markdown block starts with one comment line: the tool's
  version, the document and block, the source's SHA-256 and the options. A .wire
  file's SVG starts with it only with --stamp, so "wire x.wire -o -" prints
  exactly the renderer's SVG. --check compares the stamp line and never renders;
  for a .wire file whose SVG has no stamp it renders and compares the bytes.
  The tool deletes an SVG (of a block that is gone) only when it carries a stamp
  naming that document, and never overwrites a block's SVG that has none.

Errors are printed as <file>(<line>,<column>): error: <message>, with the
Markdown document's line and column for a block.
Exit code: 0 on success, 1 when any file has errors or cannot be read/written
(with --check: or an SVG is stale or missing), 2 on a usage error.

Examples:
  wire login.wire -o login.svg
  wire login.wire -o - > login.svg
  wire form.wire --theme sketch --width 1024
  wire --validate *.wire
  wire spec.md --link
  wire --check spec.md
  wire parse login.wire > login.ast.json
  wire --watch dashboard.wire -o dashboard.svg
  wire -c wireframe.config.json *.wire

Config file format (wireframe.config.json):
  {
    "width": 1024,
    "height": 768,
    "theme": "clean",
    "output": "./dist"
  }

""".ReplaceLineEndings("\n");

    internal static readonly UTF8Encoding Utf8 = new(encoderShouldEmitUTF8Identifier: false, throwOnInvalidBytes: false);

    /// <summary>Run the tool.</summary>
    /// <param name="args">The arguments.</param>
    /// <param name="stdin">Standard input (for <c>--stdin</c>).</param>
    /// <param name="stdout">Standard output.</param>
    /// <param name="stderr">Standard error.</param>
    /// <param name="workingDirectory">The folder relative paths are taken from.</param>
    /// <param name="cancel">Ends <c>--watch</c>.</param>
    /// <returns>The exit code: 0 fine, 1 a source has errors (or with --check an SVG is stale), 2 a usage error.</returns>
    public static int Run(string[] args, TextReader stdin, TextWriter stdout, TextWriter stderr, string workingDirectory, CancellationToken cancel = default)
    {
        ArgumentNullException.ThrowIfNull(args);
        ArgumentNullException.ThrowIfNull(stdin);
        ArgumentNullException.ThrowIfNull(stdout);
        ArgumentNullException.ThrowIfNull(stderr);
        ArgumentNullException.ThrowIfNull(workingDirectory);

        try
        {
            if (args.Length > 0 && args[0] == "mcp")
            {
                return RunMcp(args, stdin, stdout, stderr, workingDirectory, cancel);
            }

            if (args.Length > 0 && args[0] == "hook")
            {
                return Hooks.Run(args, stdin, stdout, stderr);
            }

            var options = CliOptions.Parse(args);
            if (options.Help)
            {
                Line(stdout, Help);
                return 0;
            }

            if (options.Version)
            {
                Line(stdout, $"wire v{Version}");
                return 0;
            }

            if (options.Format is not null && !string.Equals(options.Format, "svg", StringComparison.OrdinalIgnoreCase))
            {
                throw new UsageError(string.Equals(options.Format, "png", StringComparison.OrdinalIgnoreCase)
                    ? "--format png is not available yet: SVG only for now (PNG comes later)"
                    : $"Unknown format \"{options.Format}\": svg is the only format for now (PNG comes later)");
            }

            // A folder and a pattern stand for their files: PowerShell and cmd do not expand "docs/*.md" themselves.
            if (options.Command != CliCommand.Components)
            {
                var files = InputFiles.Expand(options.Inputs, workingDirectory);
                options.Inputs.Clear();
                options.Inputs.AddRange(files);
            }

            switch (options.Command)
            {
                case CliCommand.Components:
                    return RunComponents(options, stdout);
                case CliCommand.Parse:
                    if (options.Inputs.Count == 0)
                    {
                        throw new UsageError("No input file(s) specified");
                    }

                    return ParseFiles(options.Inputs, workingDirectory, stdout, stderr);
                default:
                    var config = options.Config is not null ? CliConfig.Load(options.Config, workingDirectory) : new CliConfig();
                    return new Session(options, config, stdin, stdout, stderr, workingDirectory).Run(cancel);
            }
        }
        catch (UsageError e)
        {
            Line(stderr, $"Error: {e.Message}");
            Line(stderr, "Run \"wire --help\" for usage information");
            return 2;
        }
    }

    /// <summary>The default output name: a trailing .wire replaced by .svg, anything else gets .svg appended.</summary>
    public static string DefaultOutputName(string inputPath)
    {
        ArgumentNullException.ThrowIfNull(inputPath);
        return (inputPath.EndsWith(".wire", StringComparison.OrdinalIgnoreCase) ? inputPath.Substring(0, inputPath.Length - 5) : inputPath) + ".svg";
    }

    /// <summary>Where to write the SVG for an input: a file path, or <see cref="StdoutPath"/>.</summary>
    public static string ResolveOutputPath(string inputPath, string? output, bool outputIsDir)
    {
        ArgumentNullException.ThrowIfNull(inputPath);
        if (string.IsNullOrEmpty(output))
        {
            return DefaultOutputName(inputPath);
        }

        if (output == StdoutPath)
        {
            return StdoutPath;
        }

        return outputIsDir ? Path.Combine(output, Path.GetFileName(DefaultOutputName(inputPath))) : output;
    }

    /// <summary>One diagnostic in the form editors and build logs understand: <c>file(line,column): error: message</c>.</summary>
    public static string FormatError(string file, int line, int column, string message) =>
        WireText.FormatError(file, line, column, message);

    /// <summary>Whether an input is a Markdown document.</summary>
    public static bool IsMarkdown(string path) =>
        path.EndsWith(".md", StringComparison.OrdinalIgnoreCase) || path.EndsWith(".markdown", StringComparison.OrdinalIgnoreCase);

    internal static void Line(TextWriter writer, string text) => writer.Write(text + "\n");

    internal static string? ReadText(string fullPath)
    {
        try
        {
            return Utf8.GetString(File.ReadAllBytes(fullPath));
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException or NotSupportedException or ArgumentException)
        {
            return null;
        }
    }

    internal static Utf8JsonWriter JsonWriter(Stream stream) => new(stream, new JsonWriterOptions
    {
        Indented = true,
        NewLine = "\n",
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    });

    /// <summary><c>wire mcp [--root &lt;folder&gt;]</c>: the MCP server, until standard input closes.</summary>
    private static int RunMcp(string[] args, TextReader stdin, TextWriter stdout, TextWriter stderr, string workingDirectory, CancellationToken cancel)
    {
        string? root = null;
        for (var i = 1; i < args.Length; i++)
        {
            var arg = args[i];
            if (arg == "--root" || arg.StartsWith("--root=", StringComparison.Ordinal))
            {
                string value;
                if (arg == "--root")
                {
                    if (i + 1 >= args.Length)
                    {
                        throw new UsageError("--root expects a value");
                    }

                    value = args[++i];
                }
                else
                {
                    value = arg.Substring("--root=".Length);
                }

                if (value.Length == 0)
                {
                    throw new UsageError("--root expects a value");
                }

                root = value;
                continue;
            }

            if (arg == "--help")
            {
                Line(stdout, Help);
                return 0;
            }

            throw new UsageError(arg.StartsWith('-') ? $"Unknown option \"{arg}\" for mcp: it takes --root <folder>" : $"mcp takes no input files (\"{arg}\")");
        }

        var folder = Path.GetFullPath(root ?? ".", workingDirectory);
        if (!Directory.Exists(folder))
        {
            throw new UsageError($"--root \"{root}\" is not a folder");
        }

        var server = new McpServer(new RootFolder(folder), Run, Version);
        return server.Run(stdin, stdout, stderr, cancel);
    }

    private static int RunComponents(CliOptions options, TextWriter stdout)
    {
        if (options.Inputs.Count > 1)
        {
            throw new UsageError("components takes at most one name");
        }

        var all = Components.All();
        var modifiers = Components.Modifiers();
        var name = options.Inputs.Count == 1 ? options.Inputs[0] : null;
        ComponentInfo? one = null;
        if (name is not null)
        {
            one = all.FirstOrDefault(c => c.Name == name);
            if (one is null)
            {
                var near = all.FirstOrDefault(c => string.Equals(c.Name, name, StringComparison.OrdinalIgnoreCase));
                throw new UsageError($"\"{name}\" is not a control or component" + (near is not null ? $". Did you mean \"{near.Name}\"?" : ""));
            }
        }

        if (options.Json)
        {
            using var buffer = new MemoryStream();
            using (var json = JsonWriter(buffer))
            {
                if (one is not null)
                {
                    WriteComponent(json, one);
                }
                else
                {
                    json.WriteStartObject();
                    json.WriteStartArray("components");
                    foreach (var c in all)
                    {
                        WriteComponent(json, c);
                    }

                    json.WriteEndArray();
                    json.WriteStartArray("modifiers");
                    foreach (var m in modifiers)
                    {
                        json.WriteStringValue(m);
                    }

                    json.WriteEndArray();
                    json.WriteStartArray("themes");
                    foreach (var t in Components.Themes)
                    {
                        json.WriteStringValue(t);
                    }

                    json.WriteEndArray();
                    json.WriteEndObject();
                }
            }

            Line(stdout, Utf8.GetString(buffer.ToArray()));
            return 0;
        }

        if (one is not null)
        {
            Line(stdout, $"{one.Name}: {one.Kind}" + (one.Closes ? $"; holds children, ends with /{one.Name}" : "; no closing keyword"));
            Line(stdout, "Modifiers of the language: " + string.Join(", ", modifiers));
            return 0;
        }

        var titles = new Dictionary<string, string>
        {
            ["layout"] = "Layouts",
            ["section"] = "Sections",
            ["control"] = "Controls",
            ["component"] = "Components",
            ["part"] = "Parts",
            ["flow"] = "Flow",
            ["data"] = "Data sections",
        };
        foreach (var kind in Components.Kinds)
        {
            var names = all.Where(c => c.Kind == kind).Select(c => c.Name).ToList();
            if (names.Count > 0)
            {
                Line(stdout, $"{titles[kind]}: {string.Join(", ", names)}");
            }
        }

        Line(stdout, "Modifiers: " + string.Join(", ", modifiers));
        Line(stdout, "Themes: " + string.Join(", ", Components.Themes));
        return 0;
    }

    private static void WriteComponent(Utf8JsonWriter json, ComponentInfo c)
    {
        json.WriteStartObject();
        json.WriteString("name", c.Name);
        json.WriteString("kind", c.Kind);
        json.WriteBoolean("closes", c.Closes);
        json.WriteEndObject();
    }

    /// <summary>The <c>parse</c> command: <c>{ document, errors }</c> as JSON (an array of <c>{ file, document, errors }</c>
    /// for several inputs).</summary>
    private static int ParseFiles(List<string> inputs, string workingDirectory, TextWriter stdout, TextWriter stderr)
    {
        var failed = false;
        var results = new List<(string File, ParseResult Result)>();
        foreach (var file in inputs)
        {
            var source = ReadText(Path.GetFullPath(file, workingDirectory));
            if (source is null)
            {
                Line(stderr, $"{file}: error: could not read file");
                failed = true;
                continue;
            }

            var result = WireframeParser.Parse(source);
            foreach (var d in result.Diagnostics)
            {
                Line(stderr, FormatError(file, d.Line, d.Column, d.Message));
            }

            failed |= result.Diagnostics.Count > 0;
            results.Add((file, result));
        }

        using var buffer = new MemoryStream();
        using (var json = JsonWriter(buffer))
        {
            if (inputs.Count == 1)
            {
                WriteParse(json, null, results.Count > 0 ? results[0].Result : null);
            }
            else
            {
                json.WriteStartArray();
                foreach (var (file, result) in results)
                {
                    WriteParse(json, file, result);
                }

                json.WriteEndArray();
            }
        }

        Line(stdout, Utf8.GetString(buffer.ToArray()));
        return failed ? 1 : 0;
    }

    private static void WriteParse(Utf8JsonWriter json, string? file, ParseResult? result)
    {
        json.WriteStartObject();
        if (file is not null)
        {
            json.WriteString("file", file);
        }

        json.WritePropertyName("document");
        using (var document = JsonDocument.Parse(SyntaxJson.Write(result?.Document)))
        {
            document.RootElement.WriteTo(json);
        }

        json.WriteStartArray("errors");
        foreach (var d in result?.Diagnostics ?? Array.Empty<Diagnostic>())
        {
            json.WriteStartObject();
            json.WriteString("message", d.Message);
            json.WriteNumber("line", d.Line);
            json.WriteNumber("column", d.Column);
            json.WriteEndObject();
        }

        json.WriteEndArray();
        json.WriteEndObject();
    }
}
