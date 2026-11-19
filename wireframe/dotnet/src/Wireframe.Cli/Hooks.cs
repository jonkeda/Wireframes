using System.Text.Json;
using Wireframe.Markdown;

namespace Wireframe.Cli;

/// <summary>
/// The two commands Claude Code runs as hooks (<c>.my/net/500-Hooks.md</c>). Each reads the hook's event as JSON
/// from standard input and answers in the form Claude Code reads.
/// <list type="bullet">
/// <item><c>wire hook after-write</c>, for <c>PostToolUse</c> of Write and Edit: renders the wireframes of the file
/// that was written. Nothing to do or all fine: exit 0 and no output. Diagnostics: on standard error, exit 2, which
/// hands them to the agent.</item>
/// <item><c>wire hook before-stop</c>, for <c>Stop</c>: checks the files the first hook handled in this session.
/// Something stale, missing or wrong: a <c>{"decision":"block"}</c> answer, once (<c>stop_hook_active</c>).</item>
/// </list>
/// A failure of the hook itself is one line on standard error and exit 1, which Claude Code shows and does not act on.
/// </summary>
internal static class Hooks
{
    /// <summary>Set to <c>off</c>, the end hook does nothing (a plugin's single hook cannot be switched off).</summary>
    public const string StopSwitch = "WIRE_HOOK_STOP";

    private const string Usage = "hook expects \"after-write\" or \"before-stop\", with the hook's event as JSON on standard input";

    public static int Run(string[] args, TextReader stdin, TextWriter stdout, TextWriter stderr)
    {
        if (args.Length != 2 || (args[1] != "after-write" && args[1] != "before-stop"))
        {
            throw new UsageError(Usage);
        }

        try
        {
            using var document = JsonDocument.Parse(stdin.ReadToEnd());
            var input = document.RootElement;
            if (input.ValueKind != JsonValueKind.Object)
            {
                return 0;
            }

            return args[1] == "after-write" ? AfterWrite(input, stderr) : BeforeStop(input, stdout);
        }
        catch (Exception e) when (e is JsonException or IOException or UnauthorizedAccessException or ArgumentException or NotSupportedException)
        {
            WireCli.Line(stderr, $"wire hook {args[1]}: {e.Message}");
            return 1;
        }
    }

    private static int AfterWrite(JsonElement input, TextWriter stderr)
    {
        var file = Text(input, "tool_input", "file_path");
        if (file is null || !Path.IsPathFullyQualified(file) || !HoldsWireframes(file))
        {
            return 0;
        }

        var list = ListFile(input);
        var known = Known(list);
        var full = Path.GetFullPath(file);
        var seen = known.Contains(full);
        if (!File.Exists(full))
        {
            return 0;
        }

        // A Markdown file without a block is the common case: a read and a search for one word. A file handled before
        // is rendered all the same, so the picture of a block that went is removed.
        if (WireCli.IsMarkdown(full) && !seen)
        {
            var text = WireCli.ReadText(full);
            if (text is null || !text.Contains("wireframe", StringComparison.Ordinal) || WireframeBlocks.Find(text).Count == 0)
            {
                return 0;
            }
        }

        if (!seen && list is not null)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(list)!);
            File.AppendAllText(list, full + "\n", WireCli.Utf8);
        }

        var name = Path.GetFileName(full);
        var said = new StringWriter();
        var code = WireCli.Run(new[] { "--quiet", "--", name }, TextReader.Null, TextWriter.Null, said, Path.GetDirectoryName(full)!);
        if (code == 0)
        {
            return 0;
        }

        // "--force" is advice for a person at a terminal; an agent told to use it would write a picture of a broken block.
        stderr.Write(said.ToString().Replace(" (use --force to write it anyway)", "", StringComparison.Ordinal));
        WireCli.Line(stderr, $"In {full}. The picture of a block with an error was not written. Fix the block; the picture follows your edit.");
        return 2;
    }

    private static int BeforeStop(JsonElement input, TextWriter stdout)
    {
        if (string.Equals(Environment.GetEnvironmentVariable(StopSwitch), "off", StringComparison.OrdinalIgnoreCase)
            || (input.TryGetProperty("stop_hook_active", out var active) && active.ValueKind == JsonValueKind.True))
        {
            return 0;
        }

        var wrong = new StringWriter();
        foreach (var full in Known(ListFile(input)).Where(File.Exists).OrderBy(f => f, StringComparer.Ordinal))
        {
            var said = new StringWriter();
            var code = WireCli.Run(new[] { "--check", "--quiet", "--", Path.GetFileName(full) }, TextReader.Null, TextWriter.Null, said, Path.GetDirectoryName(full)!);
            if (code != 0)
            {
                wrong.Write($"In {Path.GetDirectoryName(full)}:\n{said}");
            }
        }

        if (wrong.GetStringBuilder().Length == 0)
        {
            return 0;
        }

        var reason = "Wireframes you changed in this session are not finished:\n" + wrong
            + "Fix each error in its block, run \"wire <file>\" for a picture that is stale or missing, then stop again.";
        using var stream = new MemoryStream();
        using (var json = new Utf8JsonWriter(stream))
        {
            json.WriteStartObject();
            json.WriteString("decision", "block");
            json.WriteString("reason", reason);
            json.WriteEndObject();
        }

        WireCli.Line(stdout, WireCli.Utf8.GetString(stream.ToArray()));
        return 0;
    }

    private static bool HoldsWireframes(string file) =>
        WireCli.IsMarkdown(file) || file.EndsWith(".wire", StringComparison.OrdinalIgnoreCase);

    /// <summary>Where the files handled in this session are kept: the session's scratch folder, else the temporary folder.</summary>
    private static string? ListFile(JsonElement input)
    {
        var session = Text(input, "session_id");
        var name = "wire-hook-" + (session is null ? "session" : string.Concat(session.Where(c => char.IsLetterOrDigit(c) || c == '-'))) + ".txt";
        var scratch = Text(input, "scratchpad_dir");
        if (scratch is not null && Path.IsPathFullyQualified(scratch))
        {
            return Path.Combine(scratch, name);
        }

        return session is null ? null : Path.Combine(Path.GetTempPath(), name);
    }

    private static HashSet<string> Known(string? list)
    {
        var comparer = OperatingSystem.IsWindows() ? StringComparer.OrdinalIgnoreCase : StringComparer.Ordinal;
        var known = new HashSet<string>(comparer);
        if (list is not null && File.Exists(list))
        {
            foreach (var line in File.ReadAllLines(list, WireCli.Utf8))
            {
                if (line.Length > 0)
                {
                    known.Add(line);
                }
            }
        }

        return known;
    }

    private static string? Text(JsonElement element, params string[] path)
    {
        foreach (var name in path)
        {
            if (element.ValueKind != JsonValueKind.Object || !element.TryGetProperty(name, out element))
            {
                return null;
            }
        }

        return element.ValueKind == JsonValueKind.String ? element.GetString() : null;
    }
}
