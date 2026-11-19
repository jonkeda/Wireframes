using System.Collections.Concurrent;
using System.Globalization;
using System.Text;
using System.Text.Json;
using Wireframe.Cli;
using Wireframe.Mcp;

namespace Wireframe.Tests;

/// <summary>
/// A client for the MCP server, in-process: it writes requests to the server's input and reads its output, line by
/// line, while the server runs its loop on a thread of its own, as <c>wire mcp</c> does in a process.
/// </summary>
public sealed class McpTestClient : IDisposable
{
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(30);

    private readonly BlockingCollection<string> input = new();
    private readonly BlockingCollection<string> output = new();
    private readonly StringWriter log = new();
    private readonly Thread thread;
    private int nextId;
    private int exitCode = -1;
    private bool closed;

    public McpTestClient(string root)
    {
        var server = new McpServer(new RootFolder(root), WireCli.Run, WireCli.Version);
        var reader = new LineReader(input);
        var writer = new LineWriter(output);
        thread = new Thread(() => exitCode = server.Run(reader, writer, TextWriter.Synchronized(log))) { IsBackground = true, Name = "mcp-test-server" };
        thread.Start();
    }

    /// <summary>What the server wrote to standard error.</summary>
    public string Log => log.ToString();

    /// <summary>Send one line as it is.</summary>
    public void Send(string line) => input.Add(line);

    /// <summary>The server's next line; null when none came in time.</summary>
    public string? NextLine(TimeSpan? wait = null) => output.TryTake(out var line, wait ?? Timeout) ? line : null;

    /// <summary>Send a request and read its answer (the whole JSON-RPC message).</summary>
    public JsonElement Request(string method, string? paramsJson = null)
    {
        var id = Interlocked.Increment(ref nextId);
        Send("{\"jsonrpc\":\"2.0\",\"id\":" + id.ToString(CultureInfo.InvariantCulture) + ",\"method\":\"" + method + "\""
            + (paramsJson is null ? "" : ",\"params\":" + paramsJson) + "}");
        var line = NextLine() ?? throw new TimeoutException($"No answer to {method}; the server said: {Log}");
        var message = Parse(line);
        Assert.Equal(id, message.GetProperty("id").GetInt32());
        return message;
    }

    /// <summary>Send a notification.</summary>
    public void Notify(string method) => Send("{\"jsonrpc\":\"2.0\",\"method\":\"" + method + "\"}");

    /// <summary>Initialize, as a client does first.</summary>
    public JsonElement Initialize(string version = "2025-06-18")
    {
        var answer = Request("initialize", "{\"protocolVersion\":\"" + version + "\",\"capabilities\":{},\"clientInfo\":{\"name\":\"test\",\"version\":\"1\"}}");
        Notify("notifications/initialized");
        return answer;
    }

    /// <summary>Call a tool and give its result (the <c>result</c> of the answer).</summary>
    public JsonElement Call(string tool, string argumentsJson = "{}")
    {
        var answer = Request("tools/call", "{\"name\":\"" + tool + "\",\"arguments\":" + argumentsJson + "}");
        Assert.True(answer.TryGetProperty("result", out var result), "A tool call is answered with a result: " + answer);
        return result;
    }

    /// <summary>Close the server's input and wait for it to end; its exit code.</summary>
    public int Close()
    {
        if (!closed)
        {
            closed = true;
            input.CompleteAdding();
            Assert.True(thread.Join(Timeout), "The server ends when its input closes");
        }

        return exitCode;
    }

    public void Dispose()
    {
        Close();
        input.Dispose();
        output.Dispose();
        log.Dispose();
    }

    public static JsonElement Parse(string line)
    {
        using var document = JsonDocument.Parse(line);
        return document.RootElement.Clone();
    }

    /// <summary>The text items of a tool result, joined.</summary>
    public static string Text(JsonElement result) =>
        string.Join("\n", result.GetProperty("content").EnumerateArray()
            .Where(c => c.GetProperty("type").GetString() == "text")
            .Select(c => c.GetProperty("text").GetString()));

    /// <summary>The content items of a tool result.</summary>
    public static List<JsonElement> Content(JsonElement result) => result.GetProperty("content").EnumerateArray().ToList();

    public static bool IsError(JsonElement result) => result.GetProperty("isError").GetBoolean();

    /// <summary>The server's input: a line at a time, until the client closes it.</summary>
    private sealed class LineReader : TextReader
    {
        private readonly BlockingCollection<string> lines;

        public LineReader(BlockingCollection<string> lines) => this.lines = lines;

        public override string? ReadLine()
        {
            try
            {
                return lines.Take();
            }
            catch (InvalidOperationException)
            {
                return null;
            }
        }
    }

    /// <summary>The server's output, cut into lines.</summary>
    private sealed class LineWriter : TextWriter
    {
        private readonly BlockingCollection<string> lines;
        private readonly StringBuilder pending = new();

        public LineWriter(BlockingCollection<string> lines) => this.lines = lines;

        public override Encoding Encoding => Encoding.UTF8;

        public override void Write(char value)
        {
            if (value == '\n')
            {
                lines.Add(pending.ToString());
                pending.Clear();
            }
            else
            {
                pending.Append(value);
            }
        }

        public override void Write(string? value)
        {
            foreach (var c in value ?? "")
            {
                Write(c);
            }
        }
    }
}
