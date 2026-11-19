using System.Text.Json;

namespace Wireframe.Mcp;

/// <summary>
/// What a tool gives: its content (text, and an image) and whether it failed. A tool that fails because of its
/// input (a file that is not there, a path outside the root, a wireframe with errors) says so here, with
/// <see cref="IsError"/>; it is not a protocol error.
/// </summary>
public sealed class ToolResult
{
    private readonly List<(string Type, string Value, string? MimeType)> content = new();

    /// <summary>Whether the call failed (the tool's command would have ended with a non-zero exit code).</summary>
    public bool IsError { get; set; }

    /// <summary>The content items: <c>("text", text, null)</c> or <c>("image", base64, mimeType)</c>.</summary>
    public IReadOnlyList<(string Type, string Value, string? MimeType)> Content => content;

    /// <summary>The first text item, or an empty text.</summary>
    public string FirstText => content.FirstOrDefault(c => c.Type == "text").Value ?? "";

    /// <summary>A failed call that says why.</summary>
    public static ToolResult Error(string text)
    {
        var result = new ToolResult { IsError = true };
        result.AddText(text);
        return result;
    }

    /// <summary>A call that went well, with one text.</summary>
    public static ToolResult Text(string text)
    {
        var result = new ToolResult();
        result.AddText(text);
        return result;
    }

    /// <summary>Add a text item.</summary>
    public void AddText(string text) => content.Add(("text", text, null));

    /// <summary>Add an image item.</summary>
    public void AddImage(byte[] data, string mimeType) => content.Add(("image", Convert.ToBase64String(data), mimeType));

    /// <summary>Write the result as MCP's <c>CallToolResult</c>.</summary>
    public void Write(Utf8JsonWriter json)
    {
        ArgumentNullException.ThrowIfNull(json);
        json.WriteStartObject();
        json.WriteStartArray("content");
        foreach (var (type, value, mimeType) in content)
        {
            json.WriteStartObject();
            json.WriteString("type", type);
            if (type == "image")
            {
                json.WriteString("data", value);
                json.WriteString("mimeType", mimeType);
            }
            else
            {
                json.WriteString("text", value);
            }

            json.WriteEndObject();
        }

        json.WriteEndArray();
        json.WriteBoolean("isError", IsError);
        json.WriteEndObject();
    }
}
