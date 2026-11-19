using System.Globalization;

namespace Wireframe.Cli;

/// <summary>A usage error: reported to standard error, exit code 2.</summary>
public sealed class UsageError : Exception
{
    /// <summary>A usage error with its message.</summary>
    public UsageError(string message)
        : base(message)
    {
    }
}

/// <summary>What the tool is asked to do.</summary>
public enum CliCommand
{
    /// <summary>Render (or validate, or check) each input.</summary>
    Compile,

    /// <summary>Print the syntax tree and errors as JSON.</summary>
    Parse,

    /// <summary>List the language's controls and components.</summary>
    Components,
}

/// <summary>The parsed command line, as the TypeScript <c>CLIOptions</c> plus the new options.</summary>
public sealed class CliOptions
{
    /// <summary>The command.</summary>
    public CliCommand Command { get; set; } = CliCommand.Compile;

    /// <summary>The input files (for <c>components</c>: the name asked for).</summary>
    public List<string> Inputs { get; } = new();

    /// <summary><c>-o</c>: a file, a folder, or <c>-</c>.</summary>
    public string? Output { get; set; }

    /// <summary><c>--out-dir</c>: where the SVGs go, in the inputs' folder layout.</summary>
    public string? OutDir { get; set; }

    /// <summary><c>-w</c>.</summary>
    public int? Width { get; set; }

    /// <summary><c>-h</c>.</summary>
    public int? Height { get; set; }

    /// <summary><c>-t</c>.</summary>
    public string? Theme { get; set; }

    /// <summary><c>-c</c>.</summary>
    public string? Config { get; set; }

    /// <summary><c>--format</c>: only svg for now.</summary>
    public string? Format { get; set; }

    /// <summary><c>-v</c>.</summary>
    public bool Validate { get; set; }

    /// <summary><c>--watch</c>.</summary>
    public bool Watch { get; set; }

    /// <summary><c>-f</c>.</summary>
    public bool Force { get; set; }

    /// <summary><c>-q</c>.</summary>
    public bool Quiet { get; set; }

    /// <summary><c>--help</c>.</summary>
    public bool Help { get; set; }

    /// <summary><c>--version</c>.</summary>
    public bool Version { get; set; }

    /// <summary><c>--json</c>.</summary>
    public bool Json { get; set; }

    /// <summary><c>--check</c>.</summary>
    public bool Check { get; set; }

    /// <summary><c>--stdin</c>.</summary>
    public bool Stdin { get; set; }

    /// <summary><c>--link</c>.</summary>
    public bool Link { get; set; }

    /// <summary><c>--stamp</c>.</summary>
    public bool Stamp { get; set; }

    /// <summary><c>--block</c>: with a Markdown input, only the block with this id or number.</summary>
    public string? Block { get; set; }

    private static readonly Dictionary<string, string> valueFlags = new(StringComparer.Ordinal)
    {
        ["-o"] = "output",
        ["--output"] = "output",
        ["-w"] = "width",
        ["--width"] = "width",
        ["-h"] = "height",
        ["--height"] = "height",
        ["-t"] = "theme",
        ["--theme"] = "theme",
        ["-c"] = "config",
        ["--config"] = "config",
        ["--out-dir"] = "out-dir",
        ["--format"] = "format",
        ["--block"] = "block",
    };

    private static readonly Dictionary<string, string> booleanFlags = new(StringComparer.Ordinal)
    {
        ["-v"] = "validate",
        ["--validate"] = "validate",
        ["--watch"] = "watch",
        ["-f"] = "force",
        ["--force"] = "force",
        ["-q"] = "quiet",
        ["--quiet"] = "quiet",
        ["--help"] = "help",
        ["--version"] = "version",
        ["--json"] = "json",
        ["--check"] = "check",
        ["--stdin"] = "stdin",
        ["--link"] = "link",
        ["--stamp"] = "stamp",
    };

    /// <summary>Parse the arguments, as the TypeScript <c>parseArgs</c>: throws <see cref="UsageError"/> for an
    /// unknown option or a missing or wrong value.</summary>
    public static CliOptions Parse(IReadOnlyList<string> args)
    {
        var options = new CliOptions();
        var i = 0;
        if (args.Count > 0 && args[0] == "parse")
        {
            options.Command = CliCommand.Parse;
            i = 1;
        }
        else if (args.Count > 0 && args[0] == "components")
        {
            options.Command = CliCommand.Components;
            i = 1;
        }

        var onlyInputs = false;
        for (; i < args.Count; i++)
        {
            var arg = args[i];
            if (onlyInputs || !arg.StartsWith('-'))
            {
                options.Inputs.Add(arg);
                continue;
            }

            if (arg == "--")
            {
                onlyInputs = true;
                continue;
            }

            var eq = arg.StartsWith("--", StringComparison.Ordinal) ? arg.IndexOf('=', StringComparison.Ordinal) : -1;
            var flag = eq >= 0 ? arg.Substring(0, eq) : arg;

            if (valueFlags.TryGetValue(flag, out var valueKey))
            {
                string value;
                if (eq >= 0)
                {
                    value = arg.Substring(eq + 1);
                }
                else
                {
                    if (i + 1 >= args.Count)
                    {
                        throw new UsageError($"{flag} expects a value");
                    }

                    value = args[++i];
                }

                if (valueKey is "width" or "height")
                {
                    var n = ParsePositiveInt(flag, value);
                    if (valueKey == "width")
                    {
                        options.Width = n;
                    }
                    else
                    {
                        options.Height = n;
                    }

                    continue;
                }

                if (value.Length == 0)
                {
                    throw new UsageError($"{flag} expects a value");
                }

                switch (valueKey)
                {
                    case "output": options.Output = value; break;
                    case "theme": options.Theme = value; break;
                    case "config": options.Config = value; break;
                    case "out-dir": options.OutDir = value; break;
                    case "block": options.Block = value; break;
                    default: options.Format = value; break;
                }

                continue;
            }

            if (booleanFlags.TryGetValue(flag, out var boolKey) && eq < 0)
            {
                switch (boolKey)
                {
                    case "validate": options.Validate = true; break;
                    case "watch": options.Watch = true; break;
                    case "force": options.Force = true; break;
                    case "quiet": options.Quiet = true; break;
                    case "help": options.Help = true; break;
                    case "version": options.Version = true; break;
                    case "json": options.Json = true; break;
                    case "check": options.Check = true; break;
                    case "stdin": options.Stdin = true; break;
                    case "link": options.Link = true; break;
                    default: options.Stamp = true; break;
                }

                continue;
            }

            throw new UsageError(booleanFlags.ContainsKey(flag) ? $"{flag} does not take a value" : $"Unknown option \"{flag}\"");
        }

        return options;
    }

    private static int ParsePositiveInt(string flag, string value)
    {
        var digits = value.Length > 0 && value.All(c => c >= '0' && c <= '9');
        if (!digits || !int.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out var n) || n <= 0)
        {
            throw new UsageError($"{flag} expects a positive whole number, got \"{value}\"");
        }

        return n;
    }
}
