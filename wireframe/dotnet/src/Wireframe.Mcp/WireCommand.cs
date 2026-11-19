using System.Globalization;
using System.Text.Json;

namespace Wireframe.Mcp;

/// <summary>
/// The tool <c>wire</c>, as the server calls it: <c>WireCli.Run</c>. The server does not render, check or write a
/// document itself; it runs the tool's own command in-process (with <c>--json</c>), so the command and the server
/// are one implementation and say the same words.
/// </summary>
/// <param name="args">The arguments.</param>
/// <param name="stdin">Standard input (for <c>--stdin</c>).</param>
/// <param name="stdout">Standard output.</param>
/// <param name="stderr">Standard error.</param>
/// <param name="workingDirectory">The folder relative paths are taken from.</param>
/// <param name="cancel">Cancels a long run.</param>
/// <returns>The exit code: 0 fine, 1 a source has errors (or an SVG is stale), 2 a usage error.</returns>
public delegate int WireCommand(string[] args, TextReader stdin, TextWriter stdout, TextWriter stderr, string workingDirectory, CancellationToken cancel);

/// <summary>The words the command and the server share.</summary>
public static class WireText
{
    /// <summary>One diagnostic in the form editors and build logs understand: <c>file(line,column): error: message</c>.</summary>
    public static string FormatError(string file, int line, int column, string message) =>
        $"{file}({line.ToString(CultureInfo.InvariantCulture)},{column.ToString(CultureInfo.InvariantCulture)}): error: {message}";

    /// <summary>A diagnostic without a place: <c>file: error: message</c>.</summary>
    public static string FormatError(string file, string message) => $"{file}: error: {message}";
}

/// <summary>One diagnostic of a run of the command (<c>--json</c>), in the document's line and column.</summary>
internal sealed record RunDiagnostic(string Message, int? Line, int? Column)
{
    public string Format(string file) =>
        Line is int line && Column is int column ? WireText.FormatError(file, line, column, Message) : WireText.FormatError(file, Message);
}

/// <summary>One file of a run of the command (<c>--json</c>'s <c>files</c>).</summary>
internal sealed record RunFile(string Source, string? Block, string? Svg, string Status, bool Written, IReadOnlyList<RunDiagnostic> Diagnostics);

/// <summary>What a run of the command gave.</summary>
internal sealed record CommandRun(int Code, string Stdout, string Stderr, IReadOnlyList<RunFile> Files)
{
    /// <summary>Run the command with <c>--json</c> and read its files.</summary>
    public static CommandRun Json(WireCommand command, string folder, string stdin, CancellationToken cancel, params string[] args)
    {
        // First, so a "--" among the arguments does not make it an input
        var all = new string[args.Length + 1];
        all[0] = "--json";
        args.CopyTo(all, 1);
        var output = new StringWriter();
        var error = new StringWriter();
        var code = command(all, new StringReader(stdin), output, error, folder, cancel);
        var text = output.ToString();
        return new CommandRun(code, text, error.ToString(), ReadFiles(text));
    }

    /// <summary>Run the command and keep what it printed.</summary>
    public static CommandRun Plain(WireCommand command, string folder, CancellationToken cancel, params string[] args)
    {
        var output = new StringWriter();
        var error = new StringWriter();
        var code = command(args, TextReader.Null, output, error, folder, cancel);
        return new CommandRun(code, output.ToString(), error.ToString(), Array.Empty<RunFile>());
    }

    private static List<RunFile> ReadFiles(string json)
    {
        var files = new List<RunFile>();
        if (string.IsNullOrWhiteSpace(json))
        {
            return files;
        }

        try
        {
            using var document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind != JsonValueKind.Object
                || !document.RootElement.TryGetProperty("files", out var list) || list.ValueKind != JsonValueKind.Array)
            {
                return files;
            }

            foreach (var file in list.EnumerateArray())
            {
                var diagnostics = new List<RunDiagnostic>();
                if (file.TryGetProperty("diagnostics", out var ds) && ds.ValueKind == JsonValueKind.Array)
                {
                    foreach (var d in ds.EnumerateArray())
                    {
                        diagnostics.Add(new RunDiagnostic(
                            Text(d, "message") ?? "",
                            d.TryGetProperty("line", out var l) && l.ValueKind == JsonValueKind.Number ? l.GetInt32() : null,
                            d.TryGetProperty("column", out var c) && c.ValueKind == JsonValueKind.Number ? c.GetInt32() : null));
                    }
                }

                string? block = null;
                if (file.TryGetProperty("block", out var b))
                {
                    block = b.ValueKind switch
                    {
                        JsonValueKind.String => b.GetString(),
                        JsonValueKind.Number => b.GetInt32().ToString(CultureInfo.InvariantCulture),
                        _ => null,
                    };
                }

                files.Add(new RunFile(
                    Text(file, "source") ?? "",
                    block,
                    Text(file, "svg"),
                    Text(file, "status") ?? "",
                    file.TryGetProperty("written", out var w) && w.ValueKind == JsonValueKind.True,
                    diagnostics));
            }
        }
        catch (JsonException)
        {
            // Not the command's JSON: no files
        }

        return files;
    }

    private static string? Text(JsonElement element, string name) =>
        element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
}
