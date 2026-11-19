using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace Wireframe.Cli;

/// <summary>
/// The first line the tool writes into an SVG for a Markdown block (and for a <c>.wire</c> file with
/// <c>--stamp</c>): an XML comment with the tool's version, the document and block it came from, the source's hash
/// and the options. <c>--check</c> compares this line, so it never renders; and the tool deletes only SVGs that
/// carry it.
/// </summary>
/// <example><c>&lt;!-- wire v0.0.9 doc=spec.md block=login sha256=… theme=- width=- height=- --&gt;</c></example>
public sealed record Stamp(string Version, string Document, string Block, string Hash, string Theme, string Width, string Height)
{
    private const string Prefix = "<!-- wire v";
    private const string Suffix = " -->";

    /// <summary>The stamp for a source rendered with these options.</summary>
    public static Stamp For(string document, string? block, string source, string? theme, int? width, int? height) =>
        new(
            WireCli.Version,
            document,
            block ?? "-",
            HashOf(source),
            string.IsNullOrEmpty(theme) ? "-" : theme!,
            width?.ToString(CultureInfo.InvariantCulture) ?? "-",
            height?.ToString(CultureInfo.InvariantCulture) ?? "-");

    /// <summary>The SHA-256 of the source's UTF-8 bytes, lowercase hexadecimal.</summary>
    public static string HashOf(string source)
    {
        var bytes = SHA256.HashData(new UTF8Encoding(false).GetBytes(source));
        return Convert.ToHexStringLower(bytes);
    }

    /// <summary>The comment line, without a line end.</summary>
    public override string ToString() =>
        $"{Prefix}{Version} doc={Encode(Document)} block={Encode(Block)} sha256={Hash} theme={Encode(Theme)} width={Width} height={Height}{Suffix}";

    /// <summary>Read a stamp line; null when the line is not one.</summary>
    public static Stamp? TryParse(string? line)
    {
        if (line is null || !line.StartsWith(Prefix, StringComparison.Ordinal) || !line.EndsWith(Suffix, StringComparison.Ordinal))
        {
            return null;
        }

        var body = line.Substring(Prefix.Length, line.Length - Prefix.Length - Suffix.Length);
        var parts = body.Split(' ');
        if (parts.Length != 7)
        {
            return null;
        }

        var values = new Dictionary<string, string>(StringComparer.Ordinal);
        for (var k = 1; k < parts.Length; k++)
        {
            var eq = parts[k].IndexOf('=', StringComparison.Ordinal);
            if (eq <= 0)
            {
                return null;
            }

            values[parts[k].Substring(0, eq)] = Uri.UnescapeDataString(parts[k].Substring(eq + 1));
        }

        string Get(string key) => values.TryGetValue(key, out var v) ? v : "";
        return new Stamp(parts[0], Get("doc"), Get("block"), Get("sha256"), Get("theme"), Get("width"), Get("height"));
    }

    /// <summary>The first line of a file (without its line end), reading at most 4 KB; null when the file cannot be read.</summary>
    public static string? ReadFirstLine(string path)
    {
        try
        {
            using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
            var buffer = new byte[4096];
            var read = stream.Read(buffer, 0, buffer.Length);
            var end = Array.IndexOf(buffer, (byte)'\n', 0, read);
            var length = end >= 0 ? end : read;
            if (length > 0 && buffer[length - 1] == '\r')
            {
                length--;
            }

            return Encoding.UTF8.GetString(buffer, 0, length);
        }
        catch (IOException)
        {
            return null;
        }
        catch (UnauthorizedAccessException)
        {
            return null;
        }
    }

    // Spaces, '=' and '-' (an XML comment may not hold "--") are escaped, so the line splits on spaces.
    private static string Encode(string value) => value == "-" ? value : Uri.EscapeDataString(value).Replace("-", "%2D", StringComparison.Ordinal);
}
