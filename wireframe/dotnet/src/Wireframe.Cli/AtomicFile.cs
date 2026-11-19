using System.Diagnostics;

namespace Wireframe.Cli;

/// <summary>
/// Writes a file whole or not at all: to a temporary file in the same folder, then moved over the target. A target
/// held by another program is tried again for <see cref="RetryFor"/>, then reported; the temporary file is removed.
/// </summary>
public static class AtomicFile
{
    /// <summary>How long a target held by another program is tried again; about a second.</summary>
    public static TimeSpan RetryFor { get; set; } = TimeSpan.FromSeconds(1);

    /// <summary>Write the bytes to the path. Returns null when written, else what went wrong.</summary>
    public static string? Write(string path, byte[] bytes)
    {
        var full = Path.GetFullPath(path);
        var folder = Path.GetDirectoryName(full) ?? ".";
        var temp = Path.Combine(folder, "." + Path.GetFileName(full) + "." + Guid.NewGuid().ToString("N").Substring(0, 8) + ".tmp");
        try
        {
            File.WriteAllBytes(temp, bytes);
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            TryDelete(temp);
            return e.Message;
        }

        var watch = Stopwatch.StartNew();
        while (true)
        {
            try
            {
                File.Move(temp, full, overwrite: true);
                return null;
            }
            catch (Exception e) when (e is IOException or UnauthorizedAccessException)
            {
                if (watch.Elapsed >= RetryFor)
                {
                    TryDelete(temp);
                    return e.Message;
                }

                Thread.Sleep(50);
            }
        }
    }

    private static void TryDelete(string path)
    {
        try
        {
            File.Delete(path);
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            // Nothing more to do: it is a temporary file of ours
        }
    }
}
