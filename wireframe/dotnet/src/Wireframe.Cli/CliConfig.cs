using System.Text.Json;

namespace Wireframe.Cli;

/// <summary>The config file (<c>-c</c>): <c>{ "width", "height", "theme", "output" }</c>, all optional.</summary>
public sealed class CliConfig
{
    /// <summary>The width.</summary>
    public int? Width { get; private set; }

    /// <summary>The minimum height.</summary>
    public int? Height { get; private set; }

    /// <summary>The theme.</summary>
    public string? Theme { get; private set; }

    /// <summary>The output.</summary>
    public string? Output { get; private set; }

    /// <summary>Read a config file; a usage error when it cannot be read or is not valid JSON.</summary>
    public static CliConfig Load(string path, string workingDirectory)
    {
        var text = WireCli.ReadText(Path.GetFullPath(path, workingDirectory))
            ?? throw new UsageError($"Could not load config file \"{path}\"");
        try
        {
            using var document = JsonDocument.Parse(text, new JsonDocumentOptions { CommentHandling = JsonCommentHandling.Skip, AllowTrailingCommas = true });
            var config = new CliConfig();
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                return config;
            }

            foreach (var property in document.RootElement.EnumerateObject())
            {
                switch (property.Name)
                {
                    case "width":
                        config.Width = Size(path, property);
                        break;
                    case "height":
                        config.Height = Size(path, property);
                        break;
                    case "theme":
                        config.Theme = property.Value.ValueKind == JsonValueKind.String ? property.Value.GetString() : null;
                        break;
                    case "output":
                        config.Output = property.Value.ValueKind == JsonValueKind.String ? property.Value.GetString() : null;
                        break;
                }
            }

            return config;
        }
        catch (JsonException e)
        {
            throw new UsageError($"Config file \"{path}\" is not valid JSON: {e.Message}");
        }
    }

    private static int? Size(string path, JsonProperty property)
    {
        if (property.Value.ValueKind == JsonValueKind.Null)
        {
            return null;
        }

        if (property.Value.ValueKind != JsonValueKind.Number || !property.Value.TryGetInt32(out var n) || n < 0)
        {
            throw new UsageError($"Config file \"{path}\": \"{property.Name}\" expects a positive whole number");
        }

        return n == 0 ? null : n;
    }
}
