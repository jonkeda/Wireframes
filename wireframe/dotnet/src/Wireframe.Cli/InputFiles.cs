namespace Wireframe.Cli;

/// <summary>
/// The inputs of a call as files: a folder is every wireframe source under it, and a name with a wildcard is every
/// file it fits. A shell that expands wildcards itself (Bash) has done so already; one that does not (PowerShell,
/// cmd) hands the pattern over as it was typed, so the tool reads it.
/// </summary>
internal static class InputFiles
{
    private static readonly string[] Endings = [".wire", ".md", ".markdown"];
    private static readonly string[] SkippedFolders = ["node_modules", "bin", "obj"];

    /// <summary>
    /// The inputs with each folder and each pattern replaced by the files it stands for, in the order of their names.
    /// An input that is a plain file name stays as it is, whether the file is there or not: that it is missing is
    /// said where it is read. A pattern or a folder that gives no file stays too, for the same reason.
    /// </summary>
    public static List<string> Expand(IReadOnlyList<string> inputs, string workingDirectory)
    {
        var files = new List<string>();
        foreach (var input in inputs)
        {
            var found = Of(input, workingDirectory);
            if (found.Count == 0)
            {
                files.Add(input);
            }
            else
            {
                files.AddRange(found);
            }
        }

        return files;
    }

    private static List<string> Of(string input, string workingDirectory)
    {
        string full;
        try
        {
            full = Path.GetFullPath(input, workingDirectory);
        }
        catch (Exception e) when (e is ArgumentException or NotSupportedException or PathTooLongException)
        {
            return [];
        }

        if (Directory.Exists(full))
        {
            return [.. Under(full).Select(file => Shown(file, input, full))];
        }

        var name = Path.GetFileName(input);
        if (name.IndexOfAny(['*', '?']) < 0)
        {
            return [];
        }

        // A wildcard in the file's name only: "docs/*.md". One in a folder's name is not read.
        var folderPart = input[..^name.Length];
        if (folderPart.IndexOfAny(['*', '?']) >= 0)
        {
            return [];
        }

        var folder = Path.GetFullPath(folderPart.Length == 0 ? "." : folderPart, workingDirectory);
        if (!Directory.Exists(folder))
        {
            return [];
        }

        return [.. Directory.EnumerateFiles(folder, name, SearchOption.TopDirectoryOnly)
            .Where(file => Fits(name, Path.GetFileName(file)))
            .OrderBy(file => file, StringComparer.Ordinal)
            .Select(file => folderPart + Path.GetFileName(file))];
    }

    // Every wireframe source under a folder, by name; not in a hidden folder or in what a build makes.
    private static IEnumerable<string> Under(string folder)
    {
        foreach (var file in Directory.EnumerateFiles(folder).OrderBy(file => file, StringComparer.Ordinal))
        {
            if (Endings.Contains(Path.GetExtension(file), StringComparer.OrdinalIgnoreCase))
            {
                yield return file;
            }
        }

        foreach (var child in Directory.EnumerateDirectories(folder).OrderBy(child => child, StringComparer.Ordinal))
        {
            var name = Path.GetFileName(child);
            if (name.StartsWith('.') || SkippedFolders.Contains(name, StringComparer.OrdinalIgnoreCase)
                || (File.GetAttributes(child) & FileAttributes.ReparsePoint) != 0)
            {
                continue;
            }

            foreach (var file in Under(child))
            {
                yield return file;
            }
        }
    }

    // A file under a folder, written as the folder was written, with forward slashes after it.
    private static string Shown(string file, string input, string folder)
    {
        var rest = Path.GetRelativePath(folder, file).Replace('\\', '/');
        var head = input.TrimEnd('/', '\\');
        return head.Length == 0 || head == "." ? rest : head + "/" + rest;
    }

    // The system's own matching of "*.md" also takes "x.mdx" on Windows (a three-letter ending fits a longer one):
    // a name fits only when it fits the pattern as written.
    private static bool Fits(string pattern, string name)
    {
        return Match(pattern, 0, name, 0);

        static bool Match(string pattern, int p, string name, int n)
        {
            while (p < pattern.Length)
            {
                if (pattern[p] == '*')
                {
                    for (var skip = n; skip <= name.Length; skip++)
                    {
                        if (Match(pattern, p + 1, name, skip))
                        {
                            return true;
                        }
                    }

                    return false;
                }

                if (n >= name.Length || (pattern[p] != '?' && char.ToUpperInvariant(pattern[p]) != char.ToUpperInvariant(name[n])))
                {
                    return false;
                }

                p++;
                n++;
            }

            return n == name.Length;
        }
    }
}
