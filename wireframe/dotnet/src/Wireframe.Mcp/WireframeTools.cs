using System.Globalization;
using System.Text;
using System.Text.Json;
using Wireframe.Markdown;
using Wireframe.Rendering;

namespace Wireframe.Mcp;

/// <summary>A tool's input that cannot be used: the call ends with a tool error that says why.</summary>
internal sealed class ToolInputException : Exception
{
    public ToolInputException(string message)
        : base(message)
    {
    }
}

/// <summary>
/// The six tools of the design: validate, render, render a document, check, components, examples. The work is the
/// tool's own command (<see cref="WireCommand"/>, with <c>--json</c>) and the library's compiler; the tools resolve
/// paths under the root, choose the command's arguments and put the result in words a model can use.
/// </summary>
public sealed partial class WireframeTools
{
    /// <summary>The tools' names, in the order they are listed.</summary>
    public static readonly IReadOnlyList<string> Names = new[]
    {
        "wireframe_validate", "wireframe_render", "wireframe_render_document", "wireframe_check", "wireframe_components", "wireframe_examples",
    };

    private static readonly string[] Themes = { "clean", "sketch", "blueprint", "realistic" };
    private static readonly UTF8Encoding Utf8 = new(encoderShouldEmitUTF8Identifier: false, throwOnInvalidBytes: false);

    private readonly RootFolder root;
    private readonly WireCommand command;
    private readonly object componentsLock = new();
    private ComponentTable? components;

    /// <summary>The tools for a root, with the tool's command.</summary>
    public WireframeTools(RootFolder root, WireCommand command)
    {
        this.root = root ?? throw new ArgumentNullException(nameof(root));
        this.command = command ?? throw new ArgumentNullException(nameof(command));
    }

    /// <summary>Whether there is a tool of that name.</summary>
    public bool Has(string name) => Names.Contains(name);

    /// <summary>Call a tool. Input that cannot be used gives a result with <see cref="ToolResult.IsError"/>.</summary>
    public ToolResult Call(string name, JsonElement? arguments, CancellationToken cancel = default)
    {
        var args = new ToolArgs(arguments);
        try
        {
            return name switch
            {
                "wireframe_validate" => Validate(args, cancel),
                "wireframe_render" => Render(args, cancel),
                "wireframe_render_document" => RenderDocument(args, cancel),
                "wireframe_check" => Check(args, cancel),
                "wireframe_components" => ComponentsTool(args, cancel),
                "wireframe_examples" => Examples(args),
                _ => ToolResult.Error($"Unknown tool: {name}"),
            };
        }
        catch (ToolInputException e)
        {
            return ToolResult.Error(e.Message);
        }
    }

    /// <summary>The text of a resource (<c>wireframe://reference</c>, <c>wireframe://components/&lt;name&gt;</c>); null when there is none.</summary>
    public string? ReadResource(string uri, CancellationToken cancel = default)
    {
        ArgumentNullException.ThrowIfNull(uri);
        if (uri == Library.ReferenceUri)
        {
            return Library.Reference;
        }

        if (uri.StartsWith(Library.ComponentUriPrefix, StringComparison.Ordinal))
        {
            var name = Uri.UnescapeDataString(uri.Substring(Library.ComponentUriPrefix.Length));
            var table = Components(cancel);
            var info = table.All.FirstOrDefault(c => c.Name == name);
            return info is null ? null : ComponentText(info, table);
        }

        return null;
    }

    // ============ wireframe_validate ============

    private ToolResult Validate(ToolArgs args, CancellationToken cancel)
    {
        args.Allow("source", "path", "block");
        var (source, path, block) = (args.String("source"), args.String("path"), args.String("block"));
        RequireOne(source, path);

        if (source is not null)
        {
            if (block is not null)
            {
                throw new ToolInputException("block is for a Markdown path: a source is one wireframe");
            }

            var run = CommandRun.Json(command, root.Full, source, cancel, "--stdin", "--validate");
            var diagnostics = Diagnostics(run, "source");
            return diagnostics.Count == 0
                ? ToolResult.Text("✓ source is valid")
                : ToolResult.Error(Lines(diagnostics, $"{Count(diagnostics.Count, "error")}: the wireframe is not valid"));
        }

        var file = ReadableFile(path!);
        var markdown = IsMarkdown(file.Relative);
        if (block is not null && !markdown)
        {
            throw new ToolInputException($"block is for a Markdown document; {file.Relative} is a wireframe file");
        }

        var argv = new List<string> { "--validate", file.Relative };
        if (block is not null)
        {
            argv.Add("--block");
            argv.Add(block);
        }

        var result = CommandRun.Json(command, root.Full, "", cancel, argv.ToArray());
        UsageProblem(result);
        var lines = Diagnostics(result, file.Relative);
        if (!markdown)
        {
            return lines.Count == 0
                ? ToolResult.Text($"✓ {file.Relative} is valid")
                : ToolResult.Error(Lines(lines, $"{Count(lines.Count, "error")}: {file.Relative} is not valid"));
        }

        var blocks = result.Files.Where(f => f.Status is "valid" or "invalid").ToList();
        if (result.Code == 0)
        {
            return ToolResult.Text(blocks.Count == 0
                ? $"{file.Relative}: no wireframe blocks"
                : $"✓ {file.Relative} is valid ({Count(blocks.Count, "block")})");
        }

        var invalid = blocks.Count(b => b.Status == "invalid");
        var summary = blocks.Count > 0
            ? $"{Count(lines.Count, "error")} in {Count(invalid, "block")} of {blocks.Count}"
            : Count(lines.Count, "error");
        return ToolResult.Error(Lines(lines, $"{summary}: {file.Relative} is not valid"));
    }

    // ============ wireframe_render ============

    private ToolResult Render(ToolArgs args, CancellationToken cancel)
    {
        args.Allow("source", "path", "block", "theme", "width", "height", "write", "output", "force", "image");
        var (source, path, block) = (args.String("source"), args.String("path"), args.String("block"));
        var theme = Theme(args);
        var width = args.PositiveInt("width");
        var height = args.PositiveInt("height");
        var write = args.Bool("write") ?? false;
        var force = args.Bool("force") ?? false;
        var image = args.Bool("image") ?? false;
        var output = args.String("output");
        RequireOne(source, path);

        var options = RenderArgs(theme, width, height);
        if (force)
        {
            options.Add("--force");
        }

        string label;
        string wireframe;
        CommandRun run;
        if (source is not null)
        {
            if (block is not null)
            {
                throw new ToolInputException("block is for a Markdown path: a source is one wireframe");
            }

            label = "source";
            wireframe = source;
            if (write)
            {
                if (output is null)
                {
                    throw new ToolInputException("write with a source needs output: the .svg file to write, under the folder the server works in");
                }

                var target = Writable(output);
                run = CommandRun.Json(command, root.Full, source, cancel, Concat(new[] { "--stdin", "-o", target.Relative }, options));
            }
            else
            {
                if (output is not null)
                {
                    throw new ToolInputException("output is only used with write: true");
                }

                run = CommandRun.Json(command, root.Full, source, cancel, "--stdin", "--validate");
            }
        }
        else
        {
            if (output is not null)
            {
                throw new ToolInputException("output is for a source; a file's SVG is written beside it (login.wire → login.svg, spec.md block login → spec.login.svg)");
            }

            var file = ReadableFile(path!);
            var text = ReadText(file);
            string[] select;
            string svgPath;
            if (IsMarkdown(file.Relative))
            {
                var chosen = ChooseBlock(file.Relative, text, block);
                var key = chosen.Id ?? chosen.Number.ToString(CultureInfo.InvariantCulture);
                wireframe = chosen.Source;
                label = $"{file.Relative}#{key}";
                select = new[] { file.Relative, "--block", key };
                svgPath = Sibling(file.Relative, $"{BaseName(file.Relative)}.{key}.svg");
            }
            else
            {
                if (block is not null)
                {
                    throw new ToolInputException($"block is for a Markdown document; {file.Relative} is a wireframe file");
                }

                wireframe = text;
                label = file.Relative;
                select = new[] { file.Relative };
                svgPath = (file.Relative.EndsWith(".wire", StringComparison.OrdinalIgnoreCase) ? file.Relative.Substring(0, file.Relative.Length - 5) : file.Relative) + ".svg";
            }

            if (write)
            {
                Writable(svgPath);
                run = CommandRun.Json(command, root.Full, "", cancel, Concat(select, options));
            }
            else
            {
                run = CommandRun.Json(command, root.Full, "", cancel, Concat(new[] { "--validate" }, select));
            }
        }

        UsageProblem(run);
        var lines = Diagnostics(run, label);
        var compiled = WireframeCompiler.Compile(wireframe, new RenderOptions { Theme = theme, Width = width, Height = height });

        // The wireframe's own errors (the run's diagnostics may also say a file could not be written)
        var errors = compiled.Diagnostics.Count;

        if (compiled.Svg.Length == 0)
        {
            return ToolResult.Error(Lines(lines, $"{label}: error: could not be parsed; no picture"));
        }

        if (errors > 0 && !force)
        {
            return ToolResult.Error(Lines(lines, $"{label}: {errors} error(s); no picture and nothing written (give force: true to draw it anyway)"));
        }

        var result = new ToolResult { IsError = run.Code != 0 };
        var report = new StringBuilder();
        if (lines.Count > 0)
        {
            report.Append(Join(lines)).Append('\n');
        }

        var written = false;
        if (write)
        {
            var done = run.Files.FirstOrDefault(f => f.Svg is not null);
            var svg = done?.Svg ?? "";
            switch (done?.Status)
            {
                case "written":
                    written = true;
                    report.Append($"✓ {label} → {svg}");
                    break;
                case "unchanged":
                    written = true;
                    report.Append($"✓ {label} → {svg} (unchanged)");
                    break;
                default:
                    result.IsError = true;
                    var why = string.Join("; ", run.Stderr.Split('\n', StringSplitOptions.RemoveEmptyEntries).Where(l => !lines.Contains(l)));
                    report.Append($"{label}: error: the SVG was not written" + (why.Length > 0 ? $" ({why})" : ""));
                    break;
            }
        }
        else
        {
            report.Append($"✓ {label} rendered: {Utf8.GetByteCount(compiled.Svg).ToString(CultureInfo.InvariantCulture)} bytes of SVG; nothing written (write is false)");
        }

        if (image)
        {
            report.Append("\nThe picture is the image item (image/svg+xml).");
        }

        result.AddText(report.ToString());

        // The SVG text is left out when the file was written and the picture is given: the model does not need it
        if (!(written && image))
        {
            result.AddText(compiled.Svg);
        }

        if (image)
        {
            result.AddImage(Utf8.GetBytes(compiled.Svg), "image/svg+xml");
        }

        return result;
    }

    // ============ wireframe_render_document ============

    private ToolResult RenderDocument(ToolArgs args, CancellationToken cancel)
    {
        args.Allow("path", "theme", "width", "link");
        var path = args.String("path") ?? throw new ToolInputException("path is needed: the Markdown document to render");
        var theme = Theme(args);
        var width = args.PositiveInt("width");
        var link = args.Bool("link") ?? false;

        var file = ReadableFile(path);
        if (!IsMarkdown(file.Relative))
        {
            throw new ToolInputException($"{file.Relative} is not a Markdown document (.md, .markdown); for a .wire file use wireframe_render with write: true");
        }

        // The SVGs it will write must stay under the root too (a link beside the document could lead out)
        var text = ReadText(file);
        foreach (var b in WireframeBlocks.Find(text))
        {
            Writable(Sibling(file.Relative, $"{BaseName(file.Relative)}.{b.Id ?? b.Number.ToString(CultureInfo.InvariantCulture)}.svg"));
        }

        var argv = new List<string> { file.Relative };
        argv.AddRange(RenderArgs(theme, width, null));
        if (link)
        {
            argv.Add("--link");
        }

        var run = CommandRun.Json(command, root.Full, "", cancel, argv.ToArray());
        UsageProblem(run);
        var lines = Diagnostics(run, file.Relative);
        var report = new StringBuilder();
        if (lines.Count > 0)
        {
            report.Append(Join(lines)).Append('\n');
        }

        foreach (var f in run.Files)
        {
            var name = f.Block is null ? "" : $"#{f.Block} ";
            var svg = f.Svg ?? "(no SVG)";
            var status = f.Status switch
            {
                "written" => "written",
                "unchanged" => "unchanged",
                "deleted" => "deleted (its block is gone)",
                "invalid" => "not written: the block's id is wrong",
                _ when f.Diagnostics.Count > 0 => "not written: the block has errors",
                _ => "not written",
            };
            report.Append($"{name}{svg}: {status}\n");
        }

        if (run.Files.Count == 0)
        {
            report.Append($"{file.Relative}: no wireframe blocks\n");
        }

        if (link)
        {
            report.Append(ReadText(file) == text ? "The image links were already up to date.\n" : $"✓ {file.Relative}: image links updated\n");
        }

        var counts = run.Files.GroupBy(f => f.Status).Select(g => $"{g.Count().ToString(CultureInfo.InvariantCulture)} {g.Key}");
        report.Append(run.Code == 0 ? "✓ " : "").Append($"{file.Relative}: ").Append(string.Join(", ", counts));
        var result = ToolResult.Text(report.ToString().TrimEnd('\n'));
        result.IsError = run.Code != 0;
        return result;
    }

    // ============ wireframe_check ============

    private ToolResult Check(ToolArgs args, CancellationToken cancel)
    {
        args.Allow("path", "theme", "width");
        var path = args.String("path") ?? ".";
        var theme = Theme(args);
        var width = args.PositiveInt("width");

        var target = root.Resolve(path, out var error) ?? throw new ToolInputException(error!);
        List<string> files;
        if (Directory.Exists(target.Full))
        {
            files = WireframeFiles(target.Full).Select(f => Path.GetRelativePath(root.Full, f).Replace('\\', '/')).ToList();
            if (files.Count == 0)
            {
                return ToolResult.Text($"{target.Relative}: no .wire or Markdown files under it; nothing to check");
            }
        }
        else if (File.Exists(target.Full))
        {
            files = new List<string> { target.Relative };
        }
        else
        {
            throw new ToolInputException($"{target.Relative}: error: could not read file (there is no file or folder by that name)");
        }

        var argv = new List<string> { "--check" };
        argv.AddRange(RenderArgs(theme, width, null));
        argv.Add("--");
        argv.AddRange(files);
        var run = CommandRun.Json(command, root.Full, "", cancel, argv.ToArray());
        UsageProblem(run);

        var report = new StringBuilder();
        var problems = run.Files.Where(f => f.Status != "up-to-date" || f.Diagnostics.Count > 0).ToList();
        foreach (var f in problems)
        {
            foreach (var d in f.Diagnostics)
            {
                report.Append(d.Format(f.Source)).Append('\n');
            }

            if (f.Diagnostics.Count == 0)
            {
                report.Append($"{f.Source}: {f.Status}\n");
            }
        }

        var svgs = run.Files.Count(f => f.Status != "orphan");
        var bad = run.Files.Count(f => f.Status is "stale" or "missing" or "orphan");
        if (run.Code == 0)
        {
            report.Append($"✓ {Count(svgs, "SVG")} up to date ({Count(files.Count, "file")} checked)");
        }
        else
        {
            report.Append($"{bad.ToString(CultureInfo.InvariantCulture)} of {Count(svgs, "SVG")} missing or stale ({Count(files.Count, "file")} checked); "
                + "wireframe_render_document (or wireframe_render with write: true) writes them");
        }

        var result = ToolResult.Text(report.ToString());
        result.IsError = run.Code != 0;
        return result;
    }

    /// <summary>The .wire and Markdown files under a folder, in a fixed order; hidden folders, node_modules, bin, obj
    /// and links to folders are skipped.</summary>
    private static List<string> WireframeFiles(string folder)
    {
        var found = new List<string>();
        var pending = new Stack<string>();
        pending.Push(folder);
        while (pending.Count > 0)
        {
            var dir = pending.Pop();
            try
            {
                foreach (var file in Directory.EnumerateFiles(dir))
                {
                    var name = Path.GetFileName(file);
                    if (name.EndsWith(".wire", StringComparison.OrdinalIgnoreCase) || IsMarkdown(name))
                    {
                        found.Add(file);
                    }
                }

                foreach (var sub in Directory.EnumerateDirectories(dir))
                {
                    var name = Path.GetFileName(sub);
                    if (name.StartsWith('.') || name is "node_modules" or "bin" or "obj"
                        || new DirectoryInfo(sub).Attributes.HasFlag(FileAttributes.ReparsePoint))
                    {
                        continue;
                    }

                    pending.Push(sub);
                }
            }
            catch (Exception e) when (e is IOException or UnauthorizedAccessException)
            {
                // A folder that cannot be read is not checked
            }
        }

        found.Sort(StringComparer.Ordinal);
        return found;
    }

    // ============ wireframe_components ============

    private ToolResult ComponentsTool(ToolArgs args, CancellationToken cancel)
    {
        args.Allow("name");
        var name = args.String("name");
        var table = Components(cancel);
        if (name is null)
        {
            return ToolResult.Text(table.ListText.TrimEnd('\n')
                + "\nAsk with a name (wireframe_components name=Card) for how one is written, what it holds and an example; "
                + "the whole language is the resource wireframe://reference.");
        }

        var info = table.All.FirstOrDefault(c => c.Name == name);
        if (info is null)
        {
            // The command's words
            var run = CommandRun.Plain(command, root.Full, cancel, "components", name);
            var message = UsageMessage(run.Stderr) ?? $"\"{name}\" is not a control or component";
            return ToolResult.Error(message + ". Call wireframe_components without a name for the list.");
        }

        return ToolResult.Text(ComponentText(info, table));
    }

    private sealed record ComponentInfo(string Name, string Kind, bool Closes);

    private sealed record ComponentTable(IReadOnlyList<ComponentInfo> All, IReadOnlyList<string> Modifiers, string ListText);

    /// <summary>The language's keywords, from <c>wire components</c> (once).</summary>
    private ComponentTable Components(CancellationToken cancel)
    {
        lock (componentsLock)
        {
            if (components is not null)
            {
                return components;
            }

            var json = CommandRun.Plain(command, root.Full, cancel, "components", "--json");
            var list = CommandRun.Plain(command, root.Full, cancel, "components");
            var all = new List<ComponentInfo>();
            var modifiers = new List<string>();
            using (var document = JsonDocument.Parse(json.Stdout))
            {
                foreach (var c in document.RootElement.GetProperty("components").EnumerateArray())
                {
                    all.Add(new ComponentInfo(c.GetProperty("name").GetString()!, c.GetProperty("kind").GetString()!, c.GetProperty("closes").GetBoolean()));
                }

                foreach (var m in document.RootElement.GetProperty("modifiers").EnumerateArray())
                {
                    modifiers.Add(m.GetString()!);
                }
            }

            components = new ComponentTable(all, modifiers, list.Stdout);
            return components;
        }
    }

    /// <summary>One element: what it is, how it is written, what it holds, its attributes in the examples, an example.</summary>
    private static string ComponentText(ComponentInfo c, ComponentTable table)
    {
        var text = new StringBuilder();
        text.Append($"# {c.Name}\n\n");
        text.Append($"{c.Name}: {c.Kind}" + (c.Closes ? $"; holds children, ends with /{c.Name}" : "; no closing keyword") + "\n\n");

        var holds = c.Name switch
        {
            "Table" => "Holds rows written as a Markdown table, indented under it: `| Name | Email |`, then `|---|---|`, then a line per row; the rows above the `|---|` line are the header. Or Row elements, each holding Cell \"text\" lines and ending with /Row (a Row marked `selected` is drawn as a header). With neither, `rows=` and `cols=` draw a placeholder. Ends with /Table.",
            "Tree" => "Holds tree lines indented under it: `+ Folder` for a branch (its children indented under it), `- File` for a leaf. Ends with /Tree.",
            "List" => "Holds `- item` lines indented under it. Ends with /List.",
            "Dropdown" => "Its options: strings after the placeholder (`Dropdown \"Choose\" \"Red\" \"Green\"`), or Option lines indented under it, ending with /Dropdown.",
            "Repeat" => "`Repeat 3` and the element(s) to repeat, indented under it; ends with /Repeat.",
            "if" => "`if <condition>`, the elements shown, optionally `else` and others, then /if. The document attribute `%show: else` draws the else branch.",
            "else" => "The second branch of an if.",
            _ => c.Kind switch
            {
                "layout" or "section" => $"Holds other elements, indented under it; ends with /{c.Name}.",
                "component" when c.Closes => $"Holds other elements, indented under it; ends with /{c.Name}.",
                "data" => $"A data section at the top level of the document: rows of a Markdown table indented under it, ending with /{c.Name}."
                    + (c.Name == "component" ? " `component Name params` with elements under it defines a component." : ""),
                "part" => $"The parser does not read {c.Name} as an element: a line that starts with it is an error (Unexpected token).",
                _ => c.Closes ? $"Holds other elements, indented under it; ends with /{c.Name}." : "Holds nothing: one line.",
            },
        };
        text.Append(holds).Append("\n\n");

        if (c.Kind is "control" or "component" or "layout" or "section")
        {
            var placeholder = c.Name is "TextInput" or "NumberInput" or "DateInput" or "PasswordInput" or "TextArea" or "Dropdown";
            var first = c.Name switch
            {
                "Icon" => " $name",
                "IconButton" => " $name [\"text\"]",
                _ when placeholder => " [\"placeholder\"]",
                _ when c.Kind is "control" or "component" => " [\"text\"]",
                _ => "",
            };
            text.Append($"Written: `{c.Name}{first} [:id] [modifiers] [name=value ...] [@Target] [$icon]`\n\n");
        }

        var lines = Library.Examples.SelectMany(e => e.Source.Split('\n')).ToList();
        var attributes = new SortedSet<string>(StringComparer.Ordinal);
        foreach (var line in lines)
        {
            var trimmed = line.TrimStart();
            if (StartsWithWord(trimmed, c.Name))
            {
                foreach (System.Text.RegularExpressions.Match m in AttributeName().Matches(WithoutStrings(trimmed)))
                {
                    attributes.Add(m.Groups[1].Value);
                }
            }
        }

        if (attributes.Count > 0)
        {
            text.Append("Attributes the documentation's examples give it: ").Append(string.Join(", ", attributes)).Append('\n');
        }

        text.Append("Modifiers any element may carry: ").Append(string.Join(", ", table.Modifiers)).Append("\n\n");

        var example = ExampleOf(c, lines);
        if (example is not null)
        {
            text.Append("Example:\n\n```wireframe\n").Append(example).Append("\n```\n");
        }

        return text.ToString().TrimEnd('\n') + "\n";
    }

    /// <summary>Up to three lines from the examples: the element with its first child and its end, or three uses of it.</summary>
    private static string? ExampleOf(ComponentInfo c, List<string> lines)
    {
        static int Indent(string s) => s.Length - s.TrimStart().Length;

        if (c.Closes && c.Kind != "control")
        {
            string? best = null;
            var bestLength = int.MaxValue;
            for (var i = 0; i < lines.Count; i++)
            {
                var trimmed = lines[i].TrimStart();
                if (!StartsWithWord(trimmed, c.Name))
                {
                    continue;
                }

                var indent = Indent(lines[i]);
                var close = -1;
                for (var k = i + 1; k < lines.Count; k++)
                {
                    if (lines[k].Trim().Length == 0)
                    {
                        continue;
                    }

                    if (Indent(lines[k]) <= indent)
                    {
                        close = lines[k].Trim() == "/" + c.Name ? k : -1;
                        break;
                    }
                }

                var child = lines.Skip(i + 1).FirstOrDefault(l => l.Trim().Length > 0);
                if (close < 0 || child is null || Indent(child) <= indent || close - i >= bestLength)
                {
                    continue;
                }

                bestLength = close - i;
                best = string.Join("\n", trimmed, new string(' ', Math.Max(0, Indent(child) - indent)) + child.TrimStart(), "/" + c.Name);
            }

            return best;
        }

        var uses = lines.Select(l => l.Trim()).Where(l => StartsWithWord(l, c.Name)).Distinct(StringComparer.Ordinal)
            .OrderBy(l => l.Length).Take(3).ToList();
        return uses.Count == 0 ? null : string.Join("\n", uses);
    }

    private static bool StartsWithWord(string line, string word) =>
        line.StartsWith(word, StringComparison.Ordinal) && (line.Length == word.Length || !char.IsLetterOrDigit(line[word.Length]));

    private static string WithoutStrings(string line) => QuotedText().Replace(line, "\"\"");

    [System.Text.RegularExpressions.GeneratedRegex(@"(?<![\w$@:?])([a-zA-Z][a-zA-Z0-9]*)=", System.Text.RegularExpressions.RegexOptions.CultureInvariant)]
    private static partial System.Text.RegularExpressions.Regex AttributeName();

    [System.Text.RegularExpressions.GeneratedRegex("\"[^\"]*\"", System.Text.RegularExpressions.RegexOptions.CultureInvariant)]
    private static partial System.Text.RegularExpressions.Regex QuotedText();

    // ============ wireframe_examples ============

    private static ToolResult Examples(ToolArgs args)
    {
        args.Allow("about");
        var about = args.String("about");
        if (about is null || about.Trim().Length == 0)
        {
            return ToolResult.Text("The examples (ask with about=<word> for up to three that fit):\n"
                + string.Join("\n", Library.Examples.Select(e => $"- {e.Title} ({e.Origin})")));
        }

        var found = Library.Find(about);
        if (found.Count == 0)
        {
            return ToolResult.Text($"No example fits \"{about}\". Try a word such as form, table, dialog, login, dashboard, sidebar, tabs, card or menu; "
                + "or call wireframe_examples without about for the list.");
        }

        var text = new StringBuilder();
        foreach (var e in found)
        {
            text.Append($"## {e.Title}\n\nFrom {e.Origin}.\n\n```wireframe\n{e.Source}\n```\n\n");
        }

        return ToolResult.Text(text.ToString().TrimEnd('\n'));
    }

    // ============ What the tools share ============

    private static void RequireOne(string? source, string? path)
    {
        if (source is null && path is null)
        {
            throw new ToolInputException("give source (the wireframe's text) or path (a .wire or Markdown file under the folder the server works in)");
        }

        if (source is not null && path is not null)
        {
            throw new ToolInputException("give source or path, not both");
        }
    }

    private static string? Theme(ToolArgs args)
    {
        var theme = args.String("theme");
        if (theme is not null && !Themes.Contains(theme))
        {
            throw new ToolInputException($"theme \"{theme}\" is not one of {string.Join(", ", Themes)}");
        }

        return theme;
    }

    private static List<string> RenderArgs(string? theme, int? width, int? height)
    {
        var list = new List<string>();
        if (theme is not null)
        {
            list.Add("-t");
            list.Add(theme);
        }

        if (width is int w)
        {
            list.Add("-w");
            list.Add(w.ToString(CultureInfo.InvariantCulture));
        }

        if (height is int h)
        {
            list.Add("-h");
            list.Add(h.ToString(CultureInfo.InvariantCulture));
        }

        return list;
    }

    private static string[] Concat(IEnumerable<string> first, IEnumerable<string> second) => first.Concat(second).ToArray();

    /// <summary>A file under the root that is there.</summary>
    private RootPath ReadableFile(string path)
    {
        var file = root.Resolve(path, out var error) ?? throw new ToolInputException(error!);
        if (Directory.Exists(file.Full))
        {
            throw new ToolInputException($"{file.Relative} is a folder: give a .wire or Markdown file");
        }

        if (!File.Exists(file.Full))
        {
            throw new ToolInputException($"{file.Relative}: error: could not read file (there is no file by that name under {root.Full})");
        }

        return file;
    }

    /// <summary>A path a tool may write: under the root, and an SVG.</summary>
    private RootPath Writable(string path)
    {
        var file = root.Resolve(path, out var error) ?? throw new ToolInputException(error!);
        if (!file.Relative.EndsWith(".svg", StringComparison.OrdinalIgnoreCase))
        {
            throw new ToolInputException($"{file.Relative}: the server writes only .svg files");
        }

        if (Directory.Exists(file.Full))
        {
            throw new ToolInputException($"{file.Relative} is a folder");
        }

        return file;
    }

    private static string ReadText(RootPath file)
    {
        try
        {
            return Utf8.GetString(File.ReadAllBytes(file.Full));
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            throw new ToolInputException($"{file.Relative}: error: could not read file ({e.Message})");
        }
    }

    private static WireframeBlock ChooseBlock(string document, string text, string? block)
    {
        var blocks = WireframeBlocks.Find(text);
        if (blocks.Count == 0)
        {
            throw new ToolInputException($"{document}: no wireframe blocks (a block is a fenced code block whose info string is wireframe)");
        }

        string List() => string.Join(", ", blocks.Select(b => b.Id is null
            ? $"{b.Number.ToString(CultureInfo.InvariantCulture)} (line {b.FenceLine.ToString(CultureInfo.InvariantCulture)})"
            : $"{b.Id} (block {b.Number.ToString(CultureInfo.InvariantCulture)}, line {b.FenceLine.ToString(CultureInfo.InvariantCulture)})"));

        if (block is null)
        {
            if (blocks.Count == 1)
            {
                return blocks[0];
            }

            throw new ToolInputException($"{document} has {blocks.Count.ToString(CultureInfo.InvariantCulture)} wireframe blocks: give block, one of {List()}; "
                + "or render them all with wireframe_render_document");
        }

        return blocks.FirstOrDefault(b => b.Id == block)
            ?? blocks.FirstOrDefault(b => b.Number.ToString(CultureInfo.InvariantCulture) == block)
            ?? throw new ToolInputException($"{document}: no wireframe block '{block}': the blocks are {List()}");
    }

    private static string Sibling(string relative, string name)
    {
        var slash = relative.LastIndexOf('/');
        return slash < 0 ? name : relative.Substring(0, slash + 1) + name;
    }

    private static string BaseName(string relative) => Path.GetFileNameWithoutExtension(relative.Substring(relative.LastIndexOf('/') + 1));

    private static bool IsMarkdown(string path) =>
        path.EndsWith(".md", StringComparison.OrdinalIgnoreCase) || path.EndsWith(".markdown", StringComparison.OrdinalIgnoreCase);

    /// <summary>The diagnostics of a run, one line each, in the command's words; <c>&lt;stdin&gt;</c> is shown as the label.</summary>
    private static List<string> Diagnostics(CommandRun run, string label) =>
        run.Files.SelectMany(f => f.Diagnostics.Select(d => d.Format(f.Source == "<stdin>" ? label : f.Source))).ToList();

    /// <summary>A usage error of the command (exit code 2) is the tool's input that cannot be used.</summary>
    private static void UsageProblem(CommandRun run)
    {
        if (run.Code == 2)
        {
            throw new ToolInputException(UsageMessage(run.Stderr) ?? "the call could not be made");
        }
    }

    private static string? UsageMessage(string stderr)
    {
        var first = stderr.Split('\n', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return first is null ? null : first.StartsWith("Error: ", StringComparison.Ordinal) ? first.Substring(7) : first;
    }

    private static string Join(List<string> lines) => string.Join("\n", lines);

    /// <summary>The diagnostics, then a last line.</summary>
    private static string Lines(List<string> lines, string last) => lines.Count == 0 ? last : Join(lines) + "\n" + last;

    private static string Count(int n, string what) => $"{n.ToString(CultureInfo.InvariantCulture)} {what}{(n == 1 ? "" : "s")}";
}
