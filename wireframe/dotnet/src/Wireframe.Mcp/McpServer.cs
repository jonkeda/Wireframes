using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;

namespace Wireframe.Mcp;

/// <summary>
/// The MCP server <c>wire mcp</c> (<c>.my/net/300-McpServer.md</c>): JSON-RPC 2.0 over standard input and output,
/// one JSON message per line. Hand-written on <see cref="JsonDocument"/> and <see cref="Utf8JsonWriter"/>, so it
/// needs no package and no reflection. It answers the requests of the initialization-based protocol versions
/// (<see cref="ProtocolVersions"/>): <c>initialize</c>, <c>ping</c>, <c>tools/list</c>, <c>tools/call</c>,
/// <c>resources/list</c>, <c>resources/read</c> and <c>resources/templates/list</c>.
/// </summary>
public sealed class McpServer
{
    /// <summary>The protocol versions the server speaks, the latest first.</summary>
    public static readonly IReadOnlyList<string> ProtocolVersions = new[] { "2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05" };

    /// <summary>JSON-RPC: the message is not JSON.</summary>
    public const int ParseError = -32700;

    /// <summary>JSON-RPC: the message is not a request.</summary>
    public const int InvalidRequest = -32600;

    /// <summary>JSON-RPC: no such method.</summary>
    public const int MethodNotFound = -32601;

    /// <summary>JSON-RPC: the parameters are wrong.</summary>
    public const int InvalidParams = -32602;

    /// <summary>JSON-RPC: the server failed.</summary>
    public const int InternalError = -32603;

    /// <summary>MCP: no resource with that URI.</summary>
    public const int ResourceNotFound = -32002;

    private static readonly JsonWriterOptions WriterOptions = new()
    {
        Indented = false,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    private const string Instructions =
        "Wireframe is a small text language for UI mockups (screens, forms, dialogs), drawn as SVG. "
        + "Before writing one, read the resource wireframe://reference (the language in one page) or call wireframe_examples; "
        + "call wireframe_components for the list of elements, or with a name for one of them. "
        + "Check what you wrote with wireframe_validate, and see it with wireframe_render. "
        + "For the ```wireframe blocks of a Markdown document: wireframe_render_document writes each block's SVG beside it, "
        + "wireframe_check tells which SVGs are missing or stale. Errors read file(line,column): error: message, "
        + "with the document's line and column for a block. Paths are relative to the folder the server was started in; "
        + "nothing outside it is read or written, and only .svg files (and, with link, the named document) are written.";

    private readonly WireframeTools tools;
    private readonly string version;

    /// <summary>A server for a root folder, running the tool's command for the work.</summary>
    /// <param name="root">The folder every path is resolved against.</param>
    /// <param name="command">The tool's command (<c>WireCli.Run</c>).</param>
    /// <param name="version">The tool's version, for <c>serverInfo</c>.</param>
    public McpServer(RootFolder root, WireCommand command, string version)
    {
        ArgumentNullException.ThrowIfNull(root);
        ArgumentNullException.ThrowIfNull(command);
        ArgumentNullException.ThrowIfNull(version);
        tools = new WireframeTools(root, command);
        this.version = version;
    }

    /// <summary>Serve until the input ends (or the token is cancelled between messages). Returns the exit code, 0.</summary>
    /// <param name="input">The client's messages, one per line.</param>
    /// <param name="output">The answers, one per line. Nothing else is ever written to it.</param>
    /// <param name="log">Where the server says what went wrong (standard error).</param>
    /// <param name="cancel">Ends the loop before the next message.</param>
    public int Run(TextReader input, TextWriter output, TextWriter log, CancellationToken cancel = default)
    {
        ArgumentNullException.ThrowIfNull(input);
        ArgumentNullException.ThrowIfNull(output);
        ArgumentNullException.ThrowIfNull(log);

        while (!cancel.IsCancellationRequested)
        {
            string? line;
            try
            {
                line = input.ReadLine();
            }
            catch (IOException)
            {
                break;
            }
            catch (ObjectDisposedException)
            {
                break;
            }

            if (line is null)
            {
                break;
            }

            if (line.Length == 0 || string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var answer = Handle(line, log, cancel);
            if (answer is not null)
            {
                output.Write(answer + "\n");
                output.Flush();
            }
        }

        return 0;
    }

    /// <summary>Handle one message; the answer (one line of JSON), or null for a notification or a response.</summary>
    public string? Handle(string message, TextWriter log, CancellationToken cancel = default)
    {
        ArgumentNullException.ThrowIfNull(message);
        ArgumentNullException.ThrowIfNull(log);

        JsonDocument document;
        try
        {
            document = JsonDocument.Parse(message);
        }
        catch (JsonException e)
        {
            Log(log, "a message that is not JSON: " + e.Message);
            return Error(null, ParseError, "Parse error: the message is not JSON (" + e.Message + ")");
        }

        using (document)
        {
            var root = document.RootElement;
            if (root.ValueKind == JsonValueKind.Array)
            {
                return Error(null, InvalidRequest, "Invalid Request: batches are not supported; send one message per line");
            }

            if (root.ValueKind != JsonValueKind.Object)
            {
                return Error(null, InvalidRequest, "Invalid Request: a message is a JSON object");
            }

            JsonElement? id = null;
            if (root.TryGetProperty("id", out var idElement))
            {
                if (idElement.ValueKind is not (JsonValueKind.String or JsonValueKind.Number))
                {
                    return Error(null, InvalidRequest, "Invalid Request: the id must be a string or a number");
                }

                id = idElement;
            }

            if (!root.TryGetProperty("method", out var methodElement) || methodElement.ValueKind != JsonValueKind.String)
            {
                // A response to a request of ours: the server sends none, so there is nothing to do with it
                if (root.TryGetProperty("result", out _) || root.TryGetProperty("error", out _))
                {
                    return null;
                }

                return Error(id, InvalidRequest, "Invalid Request: no method");
            }

            var method = methodElement.GetString()!;
            JsonElement? parameters = null;
            if (root.TryGetProperty("params", out var p))
            {
                if (p.ValueKind != JsonValueKind.Object && p.ValueKind != JsonValueKind.Null)
                {
                    return id is null ? null : Error(id, InvalidParams, "Invalid params: params must be an object");
                }

                if (p.ValueKind == JsonValueKind.Object)
                {
                    parameters = p;
                }
            }

            // A notification gets no answer, whatever it is
            if (id is null)
            {
                return null;
            }

            try
            {
                return Dispatch(id.Value, method, parameters, log, cancel);
            }
            catch (OperationCanceledException)
            {
                return Error(id, InternalError, "The request was cancelled");
            }
            catch (Exception e) when (e is not OutOfMemoryException)
            {
                Log(log, $"{method} failed: {e}");
                return Error(id, InternalError, $"Internal error: {e.Message}");
            }
        }
    }

    private string Dispatch(JsonElement id, string method, JsonElement? parameters, TextWriter log, CancellationToken cancel)
    {
        switch (method)
        {
            case "initialize":
                return Result(id, json => Initialize(json, parameters));
            case "ping":
                return Result(id, json =>
                {
                    json.WriteStartObject();
                    json.WriteEndObject();
                });
            case "tools/list":
                return Result(id, tools.WriteList);
            case "tools/call":
            {
                if (parameters is not { } call || !call.TryGetProperty("name", out var name) || name.ValueKind != JsonValueKind.String)
                {
                    return Error(id, InvalidParams, "Invalid params: tools/call needs the tool's name");
                }

                JsonElement? arguments = null;
                if (call.TryGetProperty("arguments", out var a) && a.ValueKind != JsonValueKind.Null)
                {
                    if (a.ValueKind != JsonValueKind.Object)
                    {
                        return Error(id, InvalidParams, "Invalid params: the arguments must be an object");
                    }

                    arguments = a;
                }

                var toolName = name.GetString()!;
                if (!tools.Has(toolName))
                {
                    return Error(id, InvalidParams, $"Unknown tool: {toolName}. The tools are {string.Join(", ", WireframeTools.Names)}");
                }

                var result = tools.Call(toolName, arguments, cancel);
                if (result.IsError)
                {
                    Log(log, $"{toolName}: {result.FirstText}");
                }

                return Result(id, result.Write);
            }

            case "resources/list":
                return Result(id, WriteResourceList);
            case "resources/templates/list":
                return Result(id, WriteTemplateList);
            case "resources/read":
            {
                if (parameters is not { } read || !read.TryGetProperty("uri", out var uriElement) || uriElement.ValueKind != JsonValueKind.String)
                {
                    return Error(id, InvalidParams, "Invalid params: resources/read needs a uri");
                }

                var uri = uriElement.GetString()!;
                var text = tools.ReadResource(uri, cancel);
                if (text is null)
                {
                    return Error(id, ResourceNotFound, $"Resource not found: {uri}", json => json.WriteString("uri", uri));
                }

                return Result(id, json =>
                {
                    json.WriteStartObject();
                    json.WriteStartArray("contents");
                    json.WriteStartObject();
                    json.WriteString("uri", uri);
                    json.WriteString("mimeType", "text/markdown");
                    json.WriteString("text", text);
                    json.WriteEndObject();
                    json.WriteEndArray();
                    json.WriteEndObject();
                });
            }

            default:
                return Error(id, MethodNotFound, $"Method not found: {method}");
        }
    }

    private void Initialize(Utf8JsonWriter json, JsonElement? parameters)
    {
        var asked = parameters is { } p && p.TryGetProperty("protocolVersion", out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;
        var answer = asked is not null && ProtocolVersions.Contains(asked) ? asked : ProtocolVersions[0];

        json.WriteStartObject();
        json.WriteString("protocolVersion", answer);
        json.WriteStartObject("capabilities");
        json.WriteStartObject("tools");
        json.WriteBoolean("listChanged", false);
        json.WriteEndObject();
        json.WriteStartObject("resources");
        json.WriteBoolean("subscribe", false);
        json.WriteBoolean("listChanged", false);
        json.WriteEndObject();
        json.WriteEndObject();
        json.WriteStartObject("serverInfo");
        json.WriteString("name", "wireframe");
        json.WriteString("title", "Wireframe");
        json.WriteString("version", version);
        json.WriteEndObject();
        json.WriteString("instructions", Instructions);
        json.WriteEndObject();
    }

    private static void WriteResourceList(Utf8JsonWriter json)
    {
        json.WriteStartObject();
        json.WriteStartArray("resources");
        json.WriteStartObject();
        json.WriteString("uri", Library.ReferenceUri);
        json.WriteString("name", "reference");
        json.WriteString("title", "The Wireframe language in one page");
        json.WriteString("description", "What the parser reads: the document, elements, ids, modifiers, attributes, tables, trees, data sections, layout and themes, with examples.");
        json.WriteString("mimeType", "text/markdown");
        json.WriteEndObject();
        json.WriteEndArray();
        json.WriteEndObject();
    }

    private static void WriteTemplateList(Utf8JsonWriter json)
    {
        json.WriteStartObject();
        json.WriteStartArray("resourceTemplates");
        json.WriteStartObject();
        json.WriteString("uriTemplate", Library.ComponentUriPrefix + "{name}");
        json.WriteString("name", "component");
        json.WriteString("title", "One element of the language");
        json.WriteString("description", "One layout, section, control or component by its keyword (Button, Card, Grid, Table): what it is, how it is written, what it holds, and an example. The same text as wireframe_components with a name.");
        json.WriteString("mimeType", "text/markdown");
        json.WriteEndObject();
        json.WriteEndArray();
        json.WriteEndObject();
    }

    private static string Result(JsonElement id, Action<Utf8JsonWriter> writeResult) => Message(json =>
    {
        json.WritePropertyName("id");
        id.WriteTo(json);
        json.WritePropertyName("result");
        writeResult(json);
    });

    private static string Error(JsonElement? id, int code, string message, Action<Utf8JsonWriter>? data = null) => Message(json =>
    {
        json.WritePropertyName("id");
        if (id is { } value)
        {
            value.WriteTo(json);
        }
        else
        {
            json.WriteNullValue();
        }

        json.WriteStartObject("error");
        json.WriteNumber("code", code);
        json.WriteString("message", message);
        if (data is not null)
        {
            json.WriteStartObject("data");
            data(json);
            json.WriteEndObject();
        }

        json.WriteEndObject();
    });

    private static string Message(Action<Utf8JsonWriter> body)
    {
        using var buffer = new MemoryStream();
        using (var json = new Utf8JsonWriter(buffer, WriterOptions))
        {
            json.WriteStartObject();
            json.WriteString("jsonrpc", "2.0");
            body(json);
            json.WriteEndObject();
        }

        return Encoding.UTF8.GetString(buffer.GetBuffer(), 0, (int)buffer.Length);
    }

    private static void Log(TextWriter log, string text)
    {
        try
        {
            log.Write("wire mcp: " + text.Replace("\r", "", StringComparison.Ordinal).Replace("\n", " ", StringComparison.Ordinal) + "\n");
            log.Flush();
        }
        catch (Exception e) when (e is IOException or ObjectDisposedException)
        {
            // Nowhere to say it
        }
    }
}
