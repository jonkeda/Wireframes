using System.Globalization;
using System.Text;

namespace Wireframe.Syntax;

/// <summary>The few JavaScript text and number operations the TypeScript implementation relies on, written out.</summary>
internal static class JsText
{
    /// <summary>JavaScript's white space and line terminators, as <c>String.prototype.trim</c> removes them.</summary>
    public static bool IsJsWhitespace(char c) => (int)c switch
    {
        0x09 or 0x0A or 0x0B or 0x0C or 0x0D or 0x20 or 0xA0 or 0x1680 or 0x2028 or 0x2029 or 0x202F or 0x205F
            or 0x3000 or 0xFEFF => true,
        _ => c >= (char)0x2000 && c <= (char)0x200A,
    };


    /// <summary><c>String.prototype.trim</c>.</summary>
    public static string Trim(string text)
    {
        var start = 0;
        var end = text.Length;
        while (start < end && IsJsWhitespace(text[start]))
        {
            start++;
        }

        while (end > start && IsJsWhitespace(text[end - 1]))
        {
            end--;
        }

        return start == 0 && end == text.Length ? text : text.Substring(start, end - start);
    }

    /// <summary>
    /// <c>Number.prototype.toString()</c>: the shortest digits that read back as the same number, written plainly
    /// from 1e-7 up to 1e21 and with an exponent outside.
    /// </summary>
    public static string NumberToString(double value)
    {
        if (double.IsNaN(value))
        {
            return "NaN";
        }

        if (value == 0)
        {
            return "0"; // -0 too
        }

        if (double.IsInfinity(value))
        {
            return value > 0 ? "Infinity" : "-Infinity";
        }

        if (value < 0)
        {
            return "-" + NumberToString(-value);
        }

        // The shortest precision that reads back as the same number; "E" rounds to the nearest at that precision
        string scientific = "";
        for (var precision = 1; precision <= 17; precision++)
        {
            scientific = value.ToString("E" + (precision - 1).ToString(CultureInfo.InvariantCulture), CultureInfo.InvariantCulture);
            if (double.Parse(scientific, NumberStyles.Float, CultureInfo.InvariantCulture) == value)
            {
                break;
            }
        }

        var e = scientific.IndexOf('E');
        var digits = scientific.Substring(0, e).Replace(".", "").TrimEnd('0');
        if (digits.Length == 0)
        {
            digits = "0";
        }

        var exponent = int.Parse(scientific.Substring(e + 1), NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture);
        var k = digits.Length;
        var n = exponent + 1;

        var text = new StringBuilder();
        if (k <= n && n <= 21)
        {
            text.Append(digits).Append('0', n - k);
        }
        else if (0 < n && n <= 21)
        {
            text.Append(digits, 0, n).Append('.').Append(digits, n, k - n);
        }
        else if (-6 < n && n <= 0)
        {
            text.Append("0.").Append('0', -n).Append(digits);
        }
        else
        {
            text.Append(digits[0]);
            if (k > 1)
            {
                text.Append('.').Append(digits, 1, k - 1);
            }

            text.Append('e').Append(n - 1 >= 0 ? '+' : '-').Append(Math.Abs(n - 1).ToString(CultureInfo.InvariantCulture));
        }

        return text.ToString();
    }

    /// <summary>
    /// The number an attribute value stands for, when it is one: JavaScript's
    /// <c>!isNaN(parseFloat(v)) &amp;&amp; v === String(parseFloat(v))</c>, which holds exactly when the value is how
    /// JavaScript writes some number (so <c>1</c>, <c>1.5</c>, <c>1e+21</c> and <c>Infinity</c>, but not <c>1.0</c>
    /// or <c>-0</c>).
    /// </summary>
    public static bool TryCanonicalNumber(string text, out double value)
    {
        value = 0;
        if (text == "Infinity")
        {
            value = double.PositiveInfinity;
            return true;
        }

        if (text == "-Infinity")
        {
            value = double.NegativeInfinity;
            return true;
        }

        // A canonical number is digits, a point, 'e', a sign and '-': anything else is not one
        foreach (var c in text)
        {
            if (!((c >= '0' && c <= '9') || c == '.' || c == 'e' || c == '+' || c == '-'))
            {
                return false;
            }
        }

        if (!double.TryParse(text, NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed)
            || double.IsInfinity(parsed) || double.IsNaN(parsed))
        {
            return false;
        }

        if (NumberToString(parsed) != text)
        {
            return false;
        }

        value = parsed;
        return true;
    }

    /// <summary>
    /// <c>parseInt(text, 10)</c> for a number token (<c>-?\d+(\.\d+)?%?</c>): the leading integer.
    /// </summary>
    public static double ParseInt(string text)
    {
        var i = 0;
        var negative = false;
        if (i < text.Length && (text[i] == '-' || text[i] == '+'))
        {
            negative = text[i] == '-';
            i++;
        }

        var start = i;
        while (i < text.Length && text[i] >= '0' && text[i] <= '9')
        {
            i++;
        }

        if (i == start)
        {
            return double.NaN;
        }

        var magnitude = double.Parse(text.Substring(start, i - start), NumberStyles.None, CultureInfo.InvariantCulture);
        return negative ? -magnitude : magnitude;
    }
}
