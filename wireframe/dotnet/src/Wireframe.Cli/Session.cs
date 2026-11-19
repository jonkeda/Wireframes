using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Wireframe.Markdown;
using Wireframe.Rendering;

namespace Wireframe.Cli;

/// <summary>One diagnostic of a result, in the document's line and column (none for a file-level problem).</summary>
internal sealed record CliDiagnostic(string Message, int? Line, int? Column);

/// <summary>What happened to one source (a file, a Markdown block, standard input): for <c>--json</c>.</summary>
internal sealed class CliResult
{
    public CliResult(string source, string? block, int? blockNumber, string? svg)
    {
        Source = source;
        Block = block;
        BlockNumber = blockNumber;
        Svg = svg;
    }

    public string Source { get; }

    public string? Block { get; }

    public int? BlockNumber { get; }

    public string? Svg { get; }

    /// <summary>written, unchanged, failed, valid, invalid, up-to-date, stale, missing, deleted, unreadable.</summary>
    public string Status { get; set; } = "failed";

    public bool Written { get; set; }

    public List<CliDiagnostic> Diagnostics { get; } = new();
}

/// <summary>One source to render: a file, a block of a Markdown file, or standard input.</summary>
internal sealed class Unit
{
    public required string Display { get; init; }

    public required string Source { get; init; }

    /// <summary>A file path (as the user would see it), <see cref="WireCli.StdoutPath"/>, or null (validate).</summary>
    public string? Output { get; init; }

    public string? InputFull { get; init; }

    public required string StampDocument { get; init; }

    public WireframeBlock? Block { get; init; }

    public string? BlockKey { get; init; }

    public bool Stamped { get; init; }
}

/// <summary>One run of the compile command.</summary>
internal sealed partial class Session
{
    private readonly CliOptions options;
    private readonly TextReader stdin;
    private readonly TextWriter stdout;
    private readonly TextWriter stderr;
    private readonly string wd;
    private readonly List<CliResult> results = new();
    private readonly int? width;
    private readonly int? height;
    private readonly string? theme;
    private string? output;
    private bool outputIsDir;
    private bool quiet;

    private static readonly StringComparison PathComparison =
        OperatingSystem.IsWindows() || OperatingSystem.IsMacOS() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;

    public Session(CliOptions options, CliConfig config, TextReader stdin, TextWriter stdout, TextWriter stderr, string workingDirectory)
    {
        this.options = options;
        this.stdin = stdin;
        this.stdout = stdout;
        this.stderr = stderr;
        wd = workingDirectory;

        // Merge options with config (the command line takes precedence)
        width = options.Width ?? config.Width;
        height = options.Height ?? config.Height;
        theme = options.Theme ?? config.Theme;
        output = options.Output ?? (options.OutDir is null ? config.Output : null);
    }

    private string Full(string path) => Path.GetFullPath(path, wd);

    private void Out(string text)
    {
        if (!quiet)
        {
            WireCli.Line(stdout, text);
        }
    }

    private void Err(string text)
    {
        if (!options.Json)
        {
            WireCli.Line(stderr, text);
        }
    }

    public int Run(CancellationToken cancel)
    {
        var inputs = options.Inputs;
        var multiple = inputs.Count > 1;
        var anyMarkdown = inputs.Any(WireCli.IsMarkdown);
        var writes = !options.Validate && !options.Check;

        if (options.Stdin && inputs.Count > 0)
        {
            throw new UsageError("--stdin takes no input files");
        }

        if (!options.Stdin && inputs.Count == 0)
        {
            throw new UsageError("No input file(s) specified");
        }

        if (options.Validate && options.Check)
        {
            throw new UsageError("--validate and --check do not go together: --check validates too");
        }

        if (options.Output is not null && options.OutDir is not null)
        {
            throw new UsageError("-o and --out-dir do not go together");
        }

        if (multiple && output == WireCli.StdoutPath && !options.Validate)
        {
            throw new UsageError("-o - (stdout) takes a single input file");
        }

        if (output == WireCli.StdoutPath && anyMarkdown && !options.Validate)
        {
            throw new UsageError("-o - (stdout) takes a .wire file: a Markdown file gives an SVG per block");
        }

        if (output == WireCli.StdoutPath && options.Check)
        {
            throw new UsageError("--check compares files: -o - (stdout) has nothing to compare");
        }

        if (output == WireCli.StdoutPath && options.Json && !options.Validate)
        {
            throw new UsageError("--json and -o - (stdout) do not go together");
        }

        if (options.Stdin && options.Check && output is null)
        {
            throw new UsageError("--check with --stdin needs -o <file> to compare with");
        }

        if (options.Watch && (multiple || options.Stdin))
        {
            throw new UsageError("Watch mode only supports a single input file");
        }

        if (options.Watch && (options.Check || options.Json))
        {
            throw new UsageError("--watch does not go with --check or --json");
        }

        if (options.Link && (options.Validate || options.Check))
        {
            throw new UsageError("--link writes the document: it does not go with --validate or --check");
        }

        if (options.Link && !anyMarkdown)
        {
            throw new UsageError("--link is for Markdown inputs");
        }

        if (options.Block is not null && (multiple || options.Stdin || !anyMarkdown))
        {
            throw new UsageError("--block takes one Markdown input");
        }

        if (options.Block is not null && (options.Link || options.Watch))
        {
            throw new UsageError("--block does not go with --link or --watch: they are for the whole document");
        }

        // Is the output a directory?
        if (output is not null && output != WireCli.StdoutPath && !options.Validate && !options.Stdin)
        {
            outputIsDir = Directory.Exists(Full(output)) || output.EndsWith('/') || output.EndsWith('\\');
            if ((multiple || anyMarkdown) && !outputIsDir)
            {
                if (File.Exists(Full(output)))
                {
                    throw new UsageError(multiple
                        ? $"with several input files the output \"{output}\" must be a directory"
                        : $"with a Markdown input the output \"{output}\" must be a directory");
                }

                outputIsDir = true;
            }

            if (outputIsDir && writes && !Directory.Exists(Full(output)))
            {
                try
                {
                    Directory.CreateDirectory(Full(output));
                }
                catch (Exception e) when (e is IOException or UnauthorizedAccessException)
                {
                    WireCli.Line(stderr, $"Error: could not create output directory \"{output}\"");
                    return 1;
                }
            }
        }

        // Never mix status lines into SVG or JSON on stdout
        quiet = options.Quiet || options.Json || output == WireCli.StdoutPath || (options.Stdin && output is null && !options.Validate);

        if (options.Stdin)
        {
            var ok = ProcessStdin();
            WriteJson();
            return ok ? 0 : 1;
        }

        if (options.Watch)
        {
            return Watch(inputs[0], cancel);
        }

        var succeeded = 0;
        foreach (var input in inputs)
        {
            if (ProcessInput(input))
            {
                succeeded++;
            }
        }

        if (multiple)
        {
            Out($"\nProcessed {inputs.Count} file(s): {succeeded} succeeded, {inputs.Count - succeeded} failed");
        }

        WriteJson();
        return succeeded == inputs.Count ? 0 : 1;
    }

    private bool ProcessInput(string input) => WireCli.IsMarkdown(input) ? ProcessMarkdown(input) : ProcessWire(input);

    private int Watch(string input, CancellationToken cancel)
    {
        Out($"Watching {input} for changes...");
        ProcessInput(input);

        var full = Full(input);
        using var signal = new SemaphoreSlim(0);
        using var watcher = new FileSystemWatcher(Path.GetDirectoryName(full)!, Path.GetFileName(full))
        {
            NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.Size | NotifyFilters.FileName,
        };
        watcher.Changed += (_, _) => signal.Release();
        watcher.Created += (_, _) => signal.Release();
        watcher.Renamed += (_, _) => signal.Release();
        watcher.EnableRaisingEvents = true;

        while (true)
        {
            try
            {
                signal.Wait(cancel);

                // Let the editor finish writing, and take a burst of events as one
                Task.Delay(100, cancel).Wait(cancel);
            }
            catch (OperationCanceledException)
            {
                return 0;
            }

            while (signal.Wait(0))
            {
            }

            Out($"[{DateTime.Now.ToString("T", CultureInfo.InvariantCulture)}] File changed, recompiling...");
            results.Clear();
            ProcessInput(input);
        }
    }

    private bool ProcessStdin()
    {
        var source = stdin.ReadToEnd();
        var unit = new Unit
        {
            Display = "<stdin>",
            Source = source,
            Output = options.Validate ? null : output ?? WireCli.StdoutPath,
            StampDocument = "-",
            Stamped = options.Stamp,
        };
        return RunUnit(unit, new CliResult("<stdin>", null, null, unit.Output == WireCli.StdoutPath ? null : unit.Output));
    }

    private bool ProcessWire(string input)
    {
        var full = Full(input);
        var source = WireCli.ReadText(full);
        if (source is null)
        {
            Unreadable(input);
            return false;
        }

        string? outputPath = null;
        if (!options.Validate)
        {
            outputPath = options.OutDir is not null
                ? Path.Combine(OutputFolderFor(input), Path.GetFileName(WireCli.DefaultOutputName(input)))
                : WireCli.ResolveOutputPath(input, output, outputIsDir);
        }

        var unit = new Unit
        {
            Display = input,
            Source = source,
            Output = outputPath,
            InputFull = full,
            StampDocument = Path.GetFileName(input),
            Stamped = options.Stamp,
        };
        return RunUnit(unit, new CliResult(input, null, null, outputPath == WireCli.StdoutPath ? null : outputPath));
    }

    private void Unreadable(string input)
    {
        WireCli.Line(stderr, $"{input}: error: could not read file");
        var result = new CliResult(input, null, null, null) { Status = "unreadable" };
        result.Diagnostics.Add(new CliDiagnostic("could not read file", null, null));
        results.Add(result);
    }

    /// <summary>The folder a document's SVGs go to (as the user would write it; empty: the current folder).</summary>
    private string OutputFolderFor(string input)
    {
        if (output is not null && output != WireCli.StdoutPath && outputIsDir)
        {
            return output;
        }

        if (options.OutDir is not null)
        {
            var rel = Path.GetRelativePath(wd, Path.GetDirectoryName(Full(input))!);
            if (rel == "." || Path.IsPathRooted(rel) || rel == ".." || rel.StartsWith(".." + Path.DirectorySeparatorChar, StringComparison.Ordinal)
                || rel.StartsWith("../", StringComparison.Ordinal))
            {
                rel = "";
            }

            return rel.Length == 0 ? options.OutDir : Path.Combine(options.OutDir, rel);
        }

        return Path.GetDirectoryName(input) ?? "";
    }

    [GeneratedRegex("^[A-Za-z_][A-Za-z0-9_-]*$", RegexOptions.CultureInvariant)]
    private static partial Regex IdPattern();

    private bool ProcessMarkdown(string input)
    {
        var full = Full(input);
        var text = WireCli.ReadText(full);
        if (text is null)
        {
            Unreadable(input);
            return false;
        }

        var blocks = WireframeBlocks.Find(text);
        var documentName = Path.GetFileName(input);
        var documentBase = Path.GetFileNameWithoutExtension(input);
        var folder = OutputFolderFor(input);
        var folderFull = Full(folder.Length == 0 ? "." : folder);
        var ok = true;

        // The blocks with a good name, and the SVG each goes to
        var units = new List<(WireframeBlock Block, string Key, string Svg)>();
        var ids = new HashSet<string>(StringComparer.Ordinal);
        foreach (var block in blocks)
        {
            if (options.Block is not null && !IsBlock(block, options.Block))
            {
                continue;
            }

            if (block.Id is not null)
            {
                string? problem = null;
                if (!IdPattern().IsMatch(block.Id))
                {
                    problem = $"'{block.Id}' is not a block id: use letters, digits, '-' and '_', starting with a letter";
                }
                else if (!ids.Add(block.Id))
                {
                    problem = $"the block id '{block.Id}' is used twice in this document";
                }

                if (problem is not null)
                {
                    ok = false;
                    var column = block.FenceIndent + 1;
                    Err(WireCli.FormatError(input, block.FenceLine, column, problem));
                    var bad = new CliResult(input, block.Id, block.Number, null) { Status = "invalid" };
                    bad.Diagnostics.Add(new CliDiagnostic(problem, block.FenceLine, column));
                    results.Add(bad);
                    continue;
                }
            }

            var key = block.Id ?? block.Number.ToString(CultureInfo.InvariantCulture);
            units.Add((block, key, Path.Combine(folder, $"{documentBase}.{key}.svg")));
        }

        if (options.Block is not null && units.Count == 0 && ok)
        {
            var message = blocks.Count == 0
                ? $"no wireframe block '{options.Block}': the document has no wireframe blocks"
                : $"no wireframe block '{options.Block}': the blocks are " + string.Join(", ", blocks.Select(b => b.Id is null
                    ? b.Number.ToString(CultureInfo.InvariantCulture)
                    : $"{b.Id} ({b.Number.ToString(CultureInfo.InvariantCulture)})"));
            Err($"{input}: error: {message}");
            var missing = new CliResult(input, options.Block, null, null) { Status = "failed" };
            missing.Diagnostics.Add(new CliDiagnostic(message, null, null));
            results.Add(missing);
            return false;
        }

        if (!options.Validate && !options.Check && options.Block is null)
        {
            NoteMovedBlocks(input, documentName, units);
        }

        foreach (var (block, key, svg) in units)
        {
            var unit = new Unit
            {
                Display = input,
                Source = block.Source,
                Output = options.Validate ? null : svg,
                InputFull = full,
                StampDocument = documentName,
                Block = block,
                BlockKey = key,
                Stamped = true,
            };
            ok &= RunUnit(unit, new CliResult(input, block.Id, block.Number, options.Validate ? null : svg));
        }

        // The SVGs of blocks that are gone: only those the tool wrote for this document
        if (!options.Validate && options.Block is null && Directory.Exists(folderFull))
        {
            var expected = new HashSet<string>(units.Select(u => Full(u.Svg)), StringComparer.FromComparison(PathComparison));
            foreach (var file in Directory.EnumerateFiles(folderFull, documentBase + ".*.svg").Order(StringComparer.Ordinal))
            {
                if (expected.Contains(file))
                {
                    continue;
                }

                var stamp = Stamp.TryParse(Stamp.ReadFirstLine(file));
                if (stamp is null || stamp.Document != documentName)
                {
                    continue;
                }

                var shown = Path.Combine(folder, Path.GetFileName(file));
                var gone = new CliResult(input, stamp.Block, null, shown);
                results.Add(gone);
                if (options.Check)
                {
                    ok = false;
                    gone.Status = "orphan";
                    var message = $"{shown} belongs to a block that is gone; a render deletes it";
                    gone.Diagnostics.Add(new CliDiagnostic(message, null, null));
                    Err($"{input}: error: {message}");
                    continue;
                }

                try
                {
                    File.Delete(file);
                    gone.Status = "deleted";
                    Out($"✓ {input}: removed {shown} (its block is gone)");
                }
                catch (Exception e) when (e is IOException or UnauthorizedAccessException)
                {
                    gone.Status = "failed";
                    gone.Diagnostics.Add(new CliDiagnostic($"could not delete {shown}", null, null));
                    Err($"{input}: warning: could not delete {shown} (its block is gone): {e.Message}");
                }
            }
        }

        if (options.Link)
        {
            ok &= Link(input, full, text, units);
        }

        if (blocks.Count == 0)
        {
            Out($"{input}: no wireframe blocks");
        }
        else if (options.Validate && ok)
        {
            var count = units.Count;
            Out($"✓ {input} is valid ({count} block{(count == 1 ? "" : "s")})");
        }
        else if (options.Check && ok)
        {
            Out($"✓ {input}: {units.Count} SVG{(units.Count == 1 ? "" : "s")} up to date");
        }

        return ok;
    }

    /// <summary>Whether a block is the one <c>--block</c> names: by its id, or by its number.</summary>
    private static bool IsBlock(WireframeBlock block, string name) =>
        block.Id == name || block.Number.ToString(CultureInfo.InvariantCulture) == name;

    /// <summary>Says once when numbered blocks changed places, so their SVGs changed names.</summary>
    private void NoteMovedBlocks(string input, string documentName, List<(WireframeBlock Block, string Key, string Svg)> units)
    {
        var numbered = units.Where(u => u.Block.Id is null).ToList();
        var byHash = new Dictionary<string, int>(StringComparer.Ordinal);
        foreach (var u in numbered)
        {
            byHash.TryAdd(Stamp.HashOf(u.Block.Source), u.Block.Number);
        }

        foreach (var u in numbered)
        {
            var stamp = Stamp.TryParse(Stamp.ReadFirstLine(Full(u.Svg)));
            if (stamp is not null && stamp.Document == documentName && stamp.Hash != Stamp.HashOf(u.Block.Source)
                && byHash.TryGetValue(stamp.Hash, out var number) && number != u.Block.Number)
            {
                if (!quiet)
                {
                    WireCli.Line(stderr, $"{input}: note: a block was added or removed above others, so numbered SVGs changed names; "
                        + "give the blocks an id (```wireframe id=name) to keep their files");
                }

                return;
            }
        }
    }

    private bool Link(string input, string full, string text, List<(WireframeBlock Block, string Key, string Svg)> units)
    {
        var folder = Path.GetDirectoryName(full)!;
        var images = new Dictionary<WireframeBlock, (string Alt, string Path)>();
        foreach (var (block, key, svg) in units)
        {
            var rel = Path.GetRelativePath(folder, Full(svg)).Replace('\\', '/');
            images[block] = (block.Id ?? $"wireframe {key}", rel);
        }

        var linked = MarkdownLinks.Apply(text, images);
        if (linked == text)
        {
            return true;
        }

        var error = AtomicFile.Write(full, WireCli.Utf8.GetBytes(linked));
        if (error is not null)
        {
            Err($"{input}: error: could not write to \"{input}\" ({error})");
            return false;
        }

        Out($"✓ {input}: image links updated");
        return true;
    }

    /// <summary>Validate, check or render one source; adds its result. Returns whether it went without errors.</summary>
    private bool RunUnit(Unit unit, CliResult result)
    {
        results.Add(result);
        var label = unit.BlockKey is null ? unit.Display : $"{unit.Display}#{unit.BlockKey}";

        if (options.Validate)
        {
            var parsed = WireframeParser.Parse(unit.Source);
            Report(unit, result, parsed.Diagnostics);
            var valid = parsed.Diagnostics.Count == 0;
            result.Status = valid ? "valid" : "invalid";
            if (valid && unit.Block is null)
            {
                Out($"✓ {unit.Display} is valid");
            }

            return valid;
        }

        var renderOptions = new RenderOptions { Theme = theme, Width = width, Height = height };
        var stamp = Stamp.For(unit.StampDocument, unit.BlockKey, unit.Source, theme, width, height);

        if (options.Check)
        {
            var parsed = WireframeParser.Parse(unit.Source);
            Report(unit, result, parsed.Diagnostics);
            result.Status = CheckOutput(unit, stamp, renderOptions);
            if (result.Status != "up-to-date")
            {
                var message = result.Status == "missing"
                    ? $"{unit.Output} is missing; run wire on {unit.Display}"
                    : $"{unit.Output} is stale: its source or the options changed; run wire on {unit.Display}";
                var (line, column) = unit.Block is null ? ((int?)null, (int?)null) : (unit.Block.FenceLine, unit.Block.FenceIndent + 1);
                result.Diagnostics.Add(new CliDiagnostic(message, line, column));
                Err(line is null ? $"{unit.Display}: error: {message}" : WireCli.FormatError(unit.Display, line.Value, column!.Value, message));
            }

            return parsed.Diagnostics.Count == 0 && result.Status == "up-to-date";
        }

        var compiled = WireframeCompiler.Compile(unit.Source, renderOptions);
        Report(unit, result, compiled.Diagnostics);
        var errors = compiled.Diagnostics.Count;

        if (compiled.Svg.Length == 0)
        {
            Err($"{label}: error: could not be parsed; no output written");
            return false;
        }

        if (errors > 0 && !options.Force)
        {
            Err($"{label}: {errors} error(s); no output written (use --force to write it anyway)");
            return false;
        }

        var content = unit.Stamped ? stamp + "\n" + compiled.Svg : compiled.Svg;
        if (unit.Output == WireCli.StdoutPath)
        {
            stdout.Write(content + "\n");
            result.Status = "written";
            result.Written = true;
            return errors == 0;
        }

        var outputPath = unit.Output!;
        var outFull = Full(outputPath);
        if (unit.InputFull is not null && string.Equals(outFull, unit.InputFull, PathComparison))
        {
            Err($"{label}: error: output path is the input file; not overwriting it");
            result.Diagnostics.Add(new CliDiagnostic("output path is the input file; not overwriting it", null, null));
            return false;
        }

        var bytes = WireCli.Utf8.GetBytes(content);
        if (File.Exists(outFull))
        {
            if (unit.Block is not null && Stamp.TryParse(Stamp.ReadFirstLine(outFull)) is null)
            {
                Err($"{label}: error: {outputPath} exists and was not written by wire; not overwriting it");
                result.Diagnostics.Add(new CliDiagnostic($"{outputPath} exists and was not written by wire; not overwriting it", null, null));
                return false;
            }

            if (SameBytes(outFull, bytes))
            {
                result.Status = "unchanged";
                Out($"✓ {label} → {outputPath} (unchanged)");
                return errors == 0;
            }
        }

        if (options.OutDir is not null)
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(outFull)!);
            }
            catch (Exception e) when (e is IOException or UnauthorizedAccessException)
            {
                Err($"{label}: error: could not create the folder of \"{outputPath}\"");
                result.Diagnostics.Add(new CliDiagnostic($"could not create the folder of \"{outputPath}\"", null, null));
                return false;
            }
        }

        var error = AtomicFile.Write(outFull, bytes);
        if (error is not null)
        {
            Err($"{label}: error: could not write to \"{outputPath}\" ({error})");
            result.Diagnostics.Add(new CliDiagnostic($"could not write to \"{outputPath}\"", null, null));
            return false;
        }

        result.Status = "written";
        result.Written = true;
        Out($"✓ {label} → {outputPath}");
        return errors == 0;
    }

    private static bool SameBytes(string path, byte[] bytes)
    {
        try
        {
            var info = new FileInfo(path);
            return info.Length == bytes.Length && File.ReadAllBytes(path).AsSpan().SequenceEqual(bytes);
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            return false;
        }
    }

    /// <summary>up-to-date, stale or missing: by the stamp line when the SVG has one, else (a .wire file's SVG
    /// written without --stamp) by rendering and comparing.</summary>
    private string CheckOutput(Unit unit, Stamp stamp, RenderOptions renderOptions)
    {
        var outFull = Full(unit.Output!);
        if (!File.Exists(outFull))
        {
            return "missing";
        }

        var first = Stamp.ReadFirstLine(outFull);
        if (Stamp.TryParse(first) is not null)
        {
            return first == stamp.ToString() ? "up-to-date" : "stale";
        }

        if (unit.Block is not null)
        {
            return "stale";
        }

        var svg = WireframeCompiler.Compile(unit.Source, renderOptions).Svg;
        return svg.Length > 0 && SameBytes(outFull, WireCli.Utf8.GetBytes(svg)) ? "up-to-date" : "stale";
    }

    private void Report(Unit unit, CliResult result, IReadOnlyList<Wireframe.Syntax.Diagnostic> diagnostics)
    {
        foreach (var d in diagnostics)
        {
            var (line, column) = unit.Block is null ? (d.Line, d.Column) : unit.Block.ToDocument(d.Line, d.Column);
            result.Diagnostics.Add(new CliDiagnostic(d.Message, line, column));
            Err(WireCli.FormatError(unit.Display, line, column, d.Message));
        }
    }

    private void WriteJson()
    {
        if (!options.Json)
        {
            return;
        }

        using var buffer = new MemoryStream();
        using (var json = WireCli.JsonWriter(buffer))
        {
            json.WriteStartObject();
            json.WriteStartArray("files");
            foreach (var r in results)
            {
                json.WriteStartObject();
                json.WriteString("source", r.Source);
                if (r.Block is not null)
                {
                    json.WriteString("block", r.Block);
                }
                else if (r.BlockNumber is int n)
                {
                    json.WriteNumber("block", n);
                }
                else
                {
                    json.WriteNull("block");
                }

                if (r.Svg is null)
                {
                    json.WriteNull("svg");
                }
                else
                {
                    json.WriteString("svg", r.Svg.Replace('\\', '/'));
                }

                json.WriteString("status", r.Status);
                json.WriteBoolean("written", r.Written);
                json.WriteStartArray("diagnostics");
                foreach (var d in r.Diagnostics)
                {
                    json.WriteStartObject();
                    json.WriteString("severity", "error");
                    if (d.Line is int line)
                    {
                        json.WriteNumber("line", line);
                    }

                    if (d.Column is int column)
                    {
                        json.WriteNumber("column", column);
                    }

                    json.WriteString("message", d.Message);
                    json.WriteEndObject();
                }

                json.WriteEndArray();
                json.WriteEndObject();
            }

            json.WriteEndArray();
            json.WriteEndObject();
        }

        WireCli.Line(stdout, Encoding.UTF8.GetString(buffer.ToArray()));
    }
}
