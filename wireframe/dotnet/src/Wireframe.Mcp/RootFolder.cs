namespace Wireframe.Mcp;

/// <summary>A path a tool may use: its full path, and the path relative to the root as the results show it.</summary>
/// <param name="Full">The full path.</param>
/// <param name="Relative">Relative to the root, with forward slashes (<c>.</c> for the root itself).</param>
public sealed record RootPath(string Full, string Relative);

/// <summary>
/// The folder the server works in. Every path a tool reads or writes is resolved against it, and a path that ends
/// up outside it is refused: after <c>..</c> and absolute paths are normalized, and when a symbolic link or a
/// junction on the way points out of it.
/// </summary>
public sealed class RootFolder
{
    private static readonly StringComparison PathComparison =
        OperatingSystem.IsWindows() || OperatingSystem.IsMacOS() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;

    private readonly string real;

    /// <summary>The root, a folder that exists.</summary>
    public RootFolder(string folder)
    {
        ArgumentException.ThrowIfNullOrEmpty(folder);
        Full = Path.TrimEndingDirectorySeparator(Path.GetFullPath(folder));
        real = Full;
        try
        {
            var info = new DirectoryInfo(Full);
            if (info.LinkTarget is not null && info.ResolveLinkTarget(returnFinalTarget: true) is { } target)
            {
                real = Path.TrimEndingDirectorySeparator(target.FullName);
            }
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            // The root as given, then
        }
    }

    /// <summary>The root's full path.</summary>
    public string Full { get; }

    /// <summary>Resolve a path a tool was given. Returns null and says why when it may not be used.</summary>
    public RootPath? Resolve(string? path, out string? error)
    {
        error = null;
        if (string.IsNullOrWhiteSpace(path))
        {
            error = "the path is empty";
            return null;
        }

        string full;
        try
        {
            full = Path.GetFullPath(path, Full);
        }
        catch (Exception e) when (e is ArgumentException or NotSupportedException or PathTooLongException)
        {
            error = $"\"{path}\" is not a path: {e.Message}";
            return null;
        }

        if (!IsUnder(full, Full))
        {
            error = $"\"{path}\" is outside the folder this server works in ({Full}); only paths under it can be used";
            return null;
        }

        // A link or junction on the way that leads out of the root
        var relative = Path.GetRelativePath(Full, full);
        if (relative != ".")
        {
            var at = Full;
            foreach (var part in relative.Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar))
            {
                at = Path.Combine(at, part);
                var target = LinkTargetOf(at);
                if (target is not null && !IsUnder(target, Full) && !IsUnder(target, real))
                {
                    error = $"\"{path}\" leads outside the folder this server works in ({Full}) through a link; only paths under it can be used";
                    return null;
                }
            }
        }

        return new RootPath(full, relative.Replace('\\', '/'));
    }

    /// <summary>Whether a full path is the folder or under it.</summary>
    public static bool IsUnder(string full, string folder)
    {
        ArgumentNullException.ThrowIfNull(full);
        ArgumentNullException.ThrowIfNull(folder);
        var f = Path.TrimEndingDirectorySeparator(folder);
        var p = Path.TrimEndingDirectorySeparator(full);
        if (string.Equals(p, f, PathComparison))
        {
            return true;
        }

        return p.StartsWith(f + Path.DirectorySeparatorChar, PathComparison)
            || p.StartsWith(f + Path.AltDirectorySeparatorChar, PathComparison);
    }

    /// <summary>Where a link (a symbolic link or a junction) finally points; null when the path is not one.</summary>
    private static string? LinkTargetOf(string path)
    {
        try
        {
            FileSystemInfo info = Directory.Exists(path) ? new DirectoryInfo(path) : new FileInfo(path);
            if (info.LinkTarget is null)
            {
                return null;
            }

            var target = info.ResolveLinkTarget(returnFinalTarget: true);
            return target is null ? null : Path.GetFullPath(target.FullName);
        }
        catch (FileNotFoundException)
        {
            return null;
        }
        catch (DirectoryNotFoundException)
        {
            return null;
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            // A link that cannot be followed is treated as leading out
            return Path.GetPathRoot(path) + "?";
        }
    }
}
