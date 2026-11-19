using System.Text;
using System.Text.RegularExpressions;

namespace Wireframe.Rendering;

/// <summary>Escaping and number rounding of SVG text (<c>control-helpers.ts</c>).</summary>
internal static class SvgText
{
    /// <summary>
    /// <c>escapeXml</c>: &amp;, &lt;, &gt;, the double and the single quote, in that order (the same as
    /// <c>accessibility.ts</c>'s <c>escapeAttribute</c>).
    /// </summary>
    public static string EscapeXml(string text)
    {
        var result = new StringBuilder(text.Length);
        foreach (var c in text)
        {
            switch (c)
            {
                case '&': result.Append("&amp;"); break;
                case '<': result.Append("&lt;"); break;
                case '>': result.Append("&gt;"); break;
                case '"': result.Append("&quot;"); break;
                case '\'': result.Append("&apos;"); break;
                default: result.Append(c); break;
            }
        }

        return result.ToString();
    }

    /// <summary><c>cssSafe</c>: takes out &lt;, &gt;, &amp;, { and }.</summary>
    public static string CssSafe(string text)
    {
        var result = new StringBuilder(text.Length);
        foreach (var c in text)
        {
            if (c != '<' && c != '>' && c != '&' && c != '{' && c != '}')
            {
                result.Append(c);
            }
        }

        return result.ToString();
    }

    // JavaScript's \s and \w (ASCII only), written out: .NET's own classes are wider
    private const string JsSpace = "[\\t\\n\\u000B\\f\\r \\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000\\uFEFF]";
    private const string JsWord = "[A-Za-z0-9_]";

    private static readonly Regex Tag = new("<[^>]+>", RegexOptions.CultureInvariant);

    private static readonly Regex Attribute = new(
        "(" + JsSpace + ")((?:" + JsWord + "|[:-])+)=\"([^\"]*)\"",
        RegexOptions.CultureInvariant);

    private static readonly Regex Number = new(
        "-?[0-9]*\\.[0-9]{3,}([eE][-+]?[0-9]+)?",
        RegexOptions.CultureInvariant);

    /// <summary>
    /// <c>roundSvgNumbers</c>: every number with three or more decimals in an attribute value rounded to two
    /// (<c>Math.round(n * 100) / 100</c>); text and the aria-*, role, class, id and xml:lang attributes left alone.
    /// </summary>
    public static string RoundSvgNumbers(string svg) =>
        Tag.Replace(svg, tag => Attribute.Replace(tag.Value, RoundAttribute));

    private static string RoundAttribute(Match match)
    {
        var name = match.Groups[2].Value;
        if (name.StartsWith("aria-", StringComparison.Ordinal) || name == "role" || name == "class" || name == "id"
            || name == "xml:lang")
        {
            return match.Value;
        }

        var rounded = Number.Replace(match.Groups[3].Value, number =>
        {
            var r = Js.Round(Js.ParseFloat(number.Value) * 100) / 100;
            return Js.N(r);
        });
        return match.Groups[1].Value + name + "=\"" + rounded + "\"";
    }
}
