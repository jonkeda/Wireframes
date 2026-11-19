using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using Wireframe.Cli;

namespace Wireframe.Tests;

/// <summary>
/// <c>wire mcp-host</c>: the real server as a child process from a snapshot of a build folder, started again on a
/// new stamp, with the session kept. The build folder here is a copy of the tool as the tests were built with it.
/// </summary>
public sealed class McpHostTests : IDisposable
{
    private static readonly TimeSpan Wait = TimeSpan.FromSeconds(60);

    private readonly string folder = Path.Combine(Path.GetTempPath(), "wire-host-" + Guid.NewGuid().ToString("N"));
    private readonly string build;
    private readonly string runs;
    private readonly string root;

    public McpHostTests()
    {
        build = Path.Combine(folder, "mcp");
        runs = Path.Combine(folder, "run");
        root = Path.Combine(folder, "root");
        Directory.CreateDirectory(root);
    }

    public void Dispose()
    {
        try
        {
            Directory.Delete(folder, recursive: true);
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            // A server that has not let go yet: the temp folder is cleaned another time
        }
    }

    [Fact]
    public void Seed_fills_an_empty_build_folder_and_leaves_a_newer_one()
    {
        Assert.True(McpHost.Seed(AppContext.BaseDirectory, build));
        Assert.True(File.Exists(Path.Combine(build, McpHost.ServerFile)));
        var stamp = File.ReadAllText(Path.Combine(build, McpHost.StampFile));

        Assert.True(McpHost.Seed(AppContext.BaseDirectory, build));
        Assert.Equal(stamp, File.ReadAllText(Path.Combine(build, McpHost.StampFile)));
    }

    [Fact]
    public void Seed_without_a_server_on_either_side_says_no()
    {
        var empty = Path.Combine(folder, "empty");
        Directory.CreateDirectory(empty);
        Assert.False(McpHost.Seed(empty, build));
    }

    [Fact]
    public async Task The_session_goes_on_over_a_new_build_and_nothing_holds_the_build_folder()
    {
        CopyTool(build);
        File.WriteAllText(Path.Combine(build, McpHost.StampFile), "one");
        var input = new BlockingCollection<string>();
        var output = new BlockingCollection<string>();
        var log = new StringWriter();
        using var host = new McpHost(build, runs, new[] { "mcp", "--root", root }, root, TextWriter.Synchronized(log))
        {
            Poll = TimeSpan.FromMilliseconds(100),
        };
        var running = Task.Run(() => host.RunAsync(new LineReader(input), new LineWriter(output)));

        input.Add("""{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}""");
        var initialized = Next(output, log);
        Assert.Equal(1, initialized.GetProperty("id").GetInt32());
        // The host says the tools may change, whatever the server said
        Assert.True(initialized.GetProperty("result").GetProperty("capabilities").GetProperty("tools").GetProperty("listChanged").GetBoolean());
        input.Add("""{"jsonrpc":"2.0","method":"notifications/initialized"}""");

        input.Add("""{"jsonrpc":"2.0","id":2,"method":"tools/list"}""");
        Assert.Equal(2, Next(output, log).GetProperty("id").GetInt32());

        // The build folder is free while a server runs: every file can be written again
        CopyTool(build);
        File.WriteAllText(Path.Combine(build, McpHost.StampFile), "two");

        var changed = Next(output, log);
        Assert.Equal("notifications/tools/list_changed", changed.GetProperty("method").GetString());

        // The new server knows the session: no second initialize from the client, and its answer was kept back
        input.Add("""{"jsonrpc":"2.0","id":3,"method":"tools/list"}""");
        var listed = Next(output, log);
        Assert.Equal(3, listed.GetProperty("id").GetInt32());
        Assert.True(listed.GetProperty("result").GetProperty("tools").GetArrayLength() > 0);

        // A request just before the input ends is still answered
        input.Add("""{"jsonrpc":"2.0","id":4,"method":"tools/list"}""");
        input.CompleteAdding();
        Assert.Equal(4, Next(output, log).GetProperty("id").GetInt32());
        await running.WaitAsync(Wait);
        Assert.Contains("a new build (two)", log.ToString(), StringComparison.Ordinal);
    }

    private static JsonElement Next(BlockingCollection<string> output, StringWriter log)
    {
        if (!output.TryTake(out var line, Wait))
        {
            throw new TimeoutException($"No line from the host; it said: {log}");
        }

        using var document = JsonDocument.Parse(line);
        return document.RootElement.Clone();
    }

    // The tool's files among the test's own: what `dotnet exec wire.dll` needs
    private static void CopyTool(string to)
    {
        Directory.CreateDirectory(to);
        foreach (var file in Directory.EnumerateFiles(AppContext.BaseDirectory))
        {
            var name = Path.GetFileName(file);
            if (name.StartsWith("wire.", StringComparison.OrdinalIgnoreCase) || name.StartsWith("Wireframe", StringComparison.OrdinalIgnoreCase))
            {
                File.Copy(file, Path.Combine(to, name), overwrite: true);
            }
        }
    }

    private sealed class LineReader(BlockingCollection<string> lines) : TextReader
    {
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

        public override ValueTask<string?> ReadLineAsync(CancellationToken cancellationToken) =>
            new(Task.Run(ReadLine, cancellationToken));
    }

    private sealed class LineWriter(BlockingCollection<string> lines) : TextWriter
    {
        private readonly StringBuilder pending = new();

        public override Encoding Encoding => Encoding.UTF8;

        public override void Write(char value)
        {
            if (value == '\n')
            {
                lines.Add(pending.ToString().TrimEnd('\r'));
                pending.Clear();
            }
            else
            {
                pending.Append(value);
            }
        }
    }
}
