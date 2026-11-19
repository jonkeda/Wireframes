using System.Diagnostics;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Wireframe.Cli;

/// <summary>
/// <c>wire mcp-host</c>: the MCP server a session starts once. It runs the real server (<c>wire mcp</c>) as a child
/// from a snapshot of a build folder and starts it again when that folder gets a new build; the session keeps its
/// connection and is told the tools changed (<c>notifications/tools/list_changed</c>). Neither process holds the
/// build folder, so an update can always write it while sessions are open.
/// </summary>
public sealed class McpHost : IDisposable
{
    /// <summary>Written into the build folder after an update's last file: a new value is a new build.</summary>
    public const string StampFile = "mcp.stamp";

    /// <summary>The file of a build that the child is started from.</summary>
    public const string ServerFile = "wire.dll";

    private const string ReplayId = "\"wire-mcp-host-replay\"";

    private readonly string build;
    private readonly string runs;
    private readonly IReadOnlyList<string> serverArguments;
    private readonly string workingDirectory;
    private readonly TextWriter log;
    private readonly object gate = new();
    private readonly HashSet<string> pending = new(StringComparer.Ordinal);
    private TextWriter? client;
    private Process? child;
    private Task pump = Task.CompletedTask;
    private string? stamp;
    private string? snapshot;
    private string? initialize;
    private bool swapping;
    private bool stopped;

    /// <param name="build">The folder a build of the tool is copied into.</param>
    /// <param name="runs">Where each server's snapshot goes.</param>
    /// <param name="serverArguments">The child's arguments after <c>wire.dll</c>: <c>mcp --root ...</c>.</param>
    /// <param name="workingDirectory">The folder the child works in.</param>
    /// <param name="log">Where the host says what it did (standard error).</param>
    public McpHost(string build, string runs, IReadOnlyList<string> serverArguments, string workingDirectory, TextWriter log)
    {
        ArgumentNullException.ThrowIfNull(build);
        ArgumentNullException.ThrowIfNull(runs);
        this.build = Path.GetFullPath(build);
        this.runs = Path.GetFullPath(runs);
        this.serverArguments = serverArguments ?? throw new ArgumentNullException(nameof(serverArguments));
        this.workingDirectory = workingDirectory ?? throw new ArgumentNullException(nameof(workingDirectory));
        this.log = log ?? throw new ArgumentNullException(nameof(log));
    }

    /// <summary>How often the build folder's stamp is looked at.</summary>
    public TimeSpan Poll { get; init; } = TimeSpan.FromSeconds(2);

    /// <summary>How long a swap waits for the requests in flight before it goes ahead.</summary>
    public TimeSpan Drain { get; init; } = TimeSpan.FromMinutes(2);

    /// <summary>The build folder when none is given: <c>wire/mcp</c> under the user's local application data.</summary>
    public static string DefaultBuildFolder() =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "wire", "mcp");

    /// <summary>
    /// Fill the build folder from a folder holding the tool (the host's own), when the build folder has no server
    /// yet or an older one. Returns whether the build folder has a server afterwards.
    /// </summary>
    public static bool Seed(string from, string build)
    {
        ArgumentNullException.ThrowIfNull(from);
        ArgumentNullException.ThrowIfNull(build);
        var own = Path.Combine(from, ServerFile);
        var there = Path.Combine(build, ServerFile);
        if (!File.Exists(own))
        {
            return File.Exists(there);
        }

        if (File.Exists(there) && File.GetLastWriteTimeUtc(there) >= File.GetLastWriteTimeUtc(own))
        {
            return true;
        }

        try
        {
            CopyFolder(from, build);
            File.WriteAllText(Path.Combine(build, StampFile), DateTime.UtcNow.Ticks.ToString(CultureInfo.InvariantCulture));
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            // Another host is seeding it at this moment: what is there is used
        }

        return File.Exists(there);
    }

    /// <summary>Serves until the input ends: each line to the server, each of its lines back.</summary>
    public async Task RunAsync(TextReader input, TextWriter output, CancellationToken cancel = default)
    {
        ArgumentNullException.ThrowIfNull(input);
        client = output ?? throw new ArgumentNullException(nameof(output));
        CleanRuns();
        Start(replay: false);
        using var stop = CancellationTokenSource.CreateLinkedTokenSource(cancel);
        var watch = Task.Run(() => WatchAsync(stop.Token), CancellationToken.None);
        try
        {
            while (await input.ReadLineAsync(cancel).ConfigureAwait(false) is { } line)
            {
                if (line.Trim().Length == 0)
                {
                    continue;
                }

                await ToServerAsync(line).ConfigureAwait(false);
            }
        }
        catch (OperationCanceledException)
        {
            // Asked to end
        }
        finally
        {
            await stop.CancelAsync().ConfigureAwait(false);
            await watch.ConfigureAwait(false);
            await FinishAsync().ConfigureAwait(false);
        }
    }

    // The input ended: the server gets its end too, and what it still answers reaches the client.
    private async Task FinishAsync()
    {
        Process? last;
        Task answers;
        lock (gate)
        {
            stopped = true;
            last = child;
            answers = pump;
        }

        if (last is null)
        {
            return;
        }

        try
        {
            last.StandardInput.Close();
            await answers.WaitAsync(TimeSpan.FromSeconds(10)).ConfigureAwait(false);
        }
        catch (Exception e) when (e is TimeoutException or IOException or InvalidOperationException)
        {
            log.WriteLine($"wire mcp-host: the server did not end with the session: {e.Message}");
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        Process? last;
        lock (gate)
        {
            stopped = true;
            last = child;
            child = null;
        }

        Stop(last);
    }

    // A request is remembered until answered (a swap waits for it); the first initialize is kept to replay.
    private async Task ToServerAsync(string line)
    {
        while (true)
        {
            Process current;
            lock (gate)
            {
                if (swapping)
                {
                    Monitor.Wait(gate, TimeSpan.FromMilliseconds(100));
                    continue;
                }

                current = child!;
                if (Message(line) is { } message)
                {
                    if (Method(message) == "initialize")
                    {
                        initialize ??= line;
                    }

                    if (message["id"] is { } id && message["method"] is not null)
                    {
                        pending.Add(id.ToJsonString());
                    }
                }
            }

            await current.StandardInput.WriteLineAsync(line).ConfigureAwait(false);
            await current.StandardInput.FlushAsync().ConfigureAwait(false);
            return;
        }
    }

    // The server's lines to the client; the answer to the replayed initialize is not passed on.
    private void FromServer(Process from, string line, bool replaying)
    {
        var message = Message(line);
        lock (gate)
        {
            if (!ReferenceEquals(from, child))
            {
                return;
            }

            if (message?["id"] is { } id && message["method"] is null)
            {
                pending.Remove(id.ToJsonString());
                if (replaying && id.ToJsonString() == ReplayId)
                {
                    return;
                }
            }

            // The tools may change: say so, so the client listens for list_changed.
            if (message?["result"] is JsonObject result && result["capabilities"] is JsonObject capabilities && capabilities["tools"] is JsonObject tools)
            {
                tools["listChanged"] = true;
                line = message.ToJsonString();
            }

            client!.WriteLine(line);
            client.Flush();
            Monitor.PulseAll(gate);
        }
    }

    private void Start(bool replay)
    {
        stamp = Stamp();
        var name = string.Create(CultureInfo.InvariantCulture, $"{DateTime.UtcNow:yyyyMMddHHmmss}-{Environment.ProcessId}-{Guid.NewGuid():N}");
        var folder = Path.Combine(runs, name.Substring(0, 48));
        CopyFolder(build, folder);
        snapshot = folder;
        var utf8 = new System.Text.UTF8Encoding(encoderShouldEmitUTF8Identifier: false);
        var info = new ProcessStartInfo("dotnet")
        {
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            StandardInputEncoding = utf8,
            StandardOutputEncoding = utf8,
            UseShellExecute = false,
            CreateNoWindow = true,
            WorkingDirectory = workingDirectory,
        };
        info.ArgumentList.Add("exec");
        info.ArgumentList.Add(Path.Combine(folder, ServerFile));
        foreach (var argument in serverArguments)
        {
            info.ArgumentList.Add(argument);
        }

        var started = Process.Start(info) ?? throw new InvalidOperationException("The MCP server did not start.");
        started.StandardInput.NewLine = "\n";
        lock (gate)
        {
            child = started;
            pending.Clear();
        }

        pump = Task.Run(async () =>
        {
            while (await started.StandardOutput.ReadLineAsync().ConfigureAwait(false) is { } line)
            {
                FromServer(started, line, replay);
            }

            lock (gate)
            {
                if (ReferenceEquals(started, child) && !stopped)
                {
                    log.WriteLine("wire mcp-host: the server ended by itself.");
                }
            }
        });

        // A new server learns the session as the first did: the client's initialize again, its answer kept back.
        if (replay && initialize is { } first && Message(first) is { } message)
        {
            message["id"] = JsonNode.Parse(ReplayId);
            started.StandardInput.WriteLine(message.ToJsonString());
            started.StandardInput.WriteLine("""{"jsonrpc":"2.0","method":"notifications/initialized"}""");
            started.StandardInput.Flush();
        }
    }

    private async Task WatchAsync(CancellationToken cancel)
    {
        while (!cancel.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(Poll, cancel).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }

            if (Stamp() is { } now && now != stamp)
            {
                try
                {
                    Swap(now);
                }
                catch (Exception e) when (e is IOException or UnauthorizedAccessException or InvalidOperationException or System.ComponentModel.Win32Exception)
                {
                    // The old server stays; the next look tries again
                    log.WriteLine($"wire mcp-host: the new build ({now}) could not be started: {e.Message}");
                    stamp = null;
                }
            }
        }
    }

    // Waits for the requests in flight, then the new server takes over.
    private void Swap(string now)
    {
        Process? old;
        var waited = Stopwatch.StartNew();
        lock (gate)
        {
            swapping = true;
            while (pending.Count > 0 && waited.Elapsed < Drain)
            {
                Monitor.Wait(gate, TimeSpan.FromMilliseconds(200));
            }

            old = child;
        }

        var started = false;
        try
        {
            Start(replay: true);
            started = true;
        }
        finally
        {
            lock (gate)
            {
                swapping = false;
                Monitor.PulseAll(gate);
                if (started)
                {
                    client!.WriteLine("""{"jsonrpc":"2.0","method":"notifications/tools/list_changed"}""");
                    client.Flush();
                }
            }
        }

        Stop(old);
        CleanRuns();
        log.WriteLine($"wire mcp-host: a new build ({now}), the server started again.");
    }

    private string? Stamp()
    {
        var path = Path.Combine(build, StampFile);
        try
        {
            return File.Exists(path)
                ? File.ReadAllText(path).Trim()
                : File.GetLastWriteTimeUtc(Path.Combine(build, ServerFile)).Ticks.ToString(CultureInfo.InvariantCulture);
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            // The update is writing it: the next look
            return stamp;
        }
    }

    private void Stop(Process? old)
    {
        if (old is null)
        {
            return;
        }

        try
        {
            old.StandardInput.Close();
            if (!old.WaitForExit(TimeSpan.FromSeconds(5)))
            {
                old.Kill(entireProcessTree: true);
            }
        }
        catch (Exception e) when (e is InvalidOperationException or IOException or System.ComponentModel.Win32Exception)
        {
            log.WriteLine($"wire mcp-host: the old server did not stop cleanly: {e.Message}");
        }
        finally
        {
            old.Dispose();
        }
    }

    // Snapshots no server holds any more; never the one running now. One another host runs from stays: it is in use.
    private void CleanRuns()
    {
        if (!Directory.Exists(runs))
        {
            return;
        }

        foreach (var folder in Directory.EnumerateDirectories(runs))
        {
            // A fresh one may be another host's, copied and not started yet
            if (string.Equals(folder, snapshot, StringComparison.OrdinalIgnoreCase)
                || DateTime.UtcNow - Directory.GetCreationTimeUtc(folder) < TimeSpan.FromMinutes(1))
            {
                continue;
            }

            try
            {
                // The server's file first: while a server runs from the folder it cannot go, and nothing else is touched
                var server = Path.Combine(folder, ServerFile);
                if (File.Exists(server))
                {
                    File.Delete(server);
                }

                Directory.Delete(folder, recursive: true);
            }
            catch (Exception e) when (e is IOException or UnauthorizedAccessException)
            {
                // Still in use: kept
            }
        }
    }

    private static void CopyFolder(string from, string to)
    {
        foreach (var file in Directory.EnumerateFiles(from, "*", SearchOption.AllDirectories))
        {
            var target = Path.Combine(to, Path.GetRelativePath(from, file));
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            File.Copy(file, target, overwrite: true);
        }
    }

    private static string? Method(JsonObject message) =>
        message["method"] is JsonValue value && value.GetValueKind() == JsonValueKind.String ? value.ToString() : null;

    private static JsonObject? Message(string line)
    {
        try
        {
            return JsonNode.Parse(line) as JsonObject;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
