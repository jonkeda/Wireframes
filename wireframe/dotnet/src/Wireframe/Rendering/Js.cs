using System.Globalization;
using System.Numerics;
using System.Text;
using Wireframe.Syntax;

// The JavaScript rules below are tested one by one, beside the conformance set
[assembly: System.Runtime.CompilerServices.InternalsVisibleTo("Wireframe.Tests")]

namespace Wireframe.Rendering;

/// <summary>
/// The JavaScript number and text operations the TypeScript renderer relies on, written out where .NET's own differ.
/// </summary>
internal static class Js
{
    /// <summary>A number as a template string writes it: <c>Number.prototype.toString</c>.</summary>
    public static string N(double value) => JsText.NumberToString(value);

    /// <summary>JavaScript's truthiness of a number: not 0 and not NaN.</summary>
    public static bool Truthy(double value) => value != 0 && !double.IsNaN(value);

    /// <summary><c>a || b</c> for an optional number.</summary>
    public static double Or(double? value, double fallback) => value is double v && Truthy(v) ? v : fallback;

    /// <summary><c>Math.max</c> of two numbers: NaN when either is NaN, and +0 above -0.</summary>
    public static double Max(double a, double b)
    {
        if (double.IsNaN(a) || double.IsNaN(b))
        {
            return double.NaN;
        }

        if (a == b)
        {
            // +0 and -0 compare equal; Math.max picks +0
            return IsNegativeZero(a) ? b : a;
        }

        return a > b ? a : b;
    }

    /// <summary><c>Math.min</c> of two numbers: NaN when either is NaN, and -0 below +0.</summary>
    public static double Min(double a, double b)
    {
        if (double.IsNaN(a) || double.IsNaN(b))
        {
            return double.NaN;
        }

        if (a == b)
        {
            return IsNegativeZero(a) ? a : b;
        }

        return a < b ? a : b;
    }

    /// <summary><c>Math.max(a, b, c)</c>.</summary>
    public static double Max(double a, double b, double c) => Max(Max(a, b), c);

    /// <summary><c>Math.min(a, b, c)</c>.</summary>
    public static double Min(double a, double b, double c) => Min(Min(a, b), c);

    private static bool IsNegativeZero(double value) => value == 0 && BitConverter.DoubleToInt64Bits(value) < 0;

    /// <summary><c>Math.round</c>: halves round toward positive infinity (<c>Math.round(-2.5)</c> is -2).</summary>
    public static double Round(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value) || value == 0)
        {
            return value;
        }

        var floor = Math.Floor(value);
        var result = value - floor >= 0.5 ? floor + 1 : floor;
        // Math.round keeps the sign of a number that rounds to zero from below
        return result == 0 && value < 0 ? -0.0 : result;
    }

    /// <summary>
    /// <c>Number.prototype.toFixed(digits)</c>: rounds the double's exact decimal value, a tie toward the larger
    /// magnitude, and keeps a minus sign for a negative number that rounds to zero.
    /// </summary>
    public static string ToFixed(double value, int digits)
    {
        if (double.IsNaN(value))
        {
            return "NaN";
        }

        if (Math.Abs(value) >= 1e21 || double.IsInfinity(value))
        {
            return N(value);
        }

        var negative = value < 0;
        var x = Math.Abs(value);

        // x = mantissa * 2^exponent, exactly
        var bits = BitConverter.DoubleToInt64Bits(x);
        var rawExponent = (int)((bits >> 52) & 0x7FF);
        var mantissa = bits & 0xFFFFFFFFFFFFFL;
        int exponent;
        if (rawExponent == 0)
        {
            exponent = -1074;
        }
        else
        {
            mantissa |= 1L << 52;
            exponent = rawExponent - 1075;
        }

        // n = round-half-up(x * 10^digits)
        var scaled = new BigInteger(mantissa) * BigInteger.Pow(10, digits);
        BigInteger n;
        if (exponent >= 0)
        {
            n = scaled << exponent;
        }
        else
        {
            var divisor = BigInteger.One << -exponent;
            n = (scaled + (divisor >> 1)) / divisor;
        }

        var text = n.ToString(CultureInfo.InvariantCulture);
        if (digits > 0)
        {
            if (text.Length <= digits)
            {
                text = new string('0', digits - text.Length + 1) + text;
            }

            text = text.Substring(0, text.Length - digits) + "." + text.Substring(text.Length - digits);
        }

        return negative ? "-" + text : text;
    }

    /// <summary>JavaScript's ToInt32: NaN and the infinities are 0, otherwise truncated and taken modulo 2^32.</summary>
    public static int ToInt32(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return 0;
        }

        var t = Math.Truncate(value);
        const double two32 = 4294967296.0;
        var m = t - (Math.Floor(t / two32) * two32);
        return unchecked((int)(uint)m);
    }

    /// <summary>
    /// <c>parseFloat</c>: white space at the start skipped, then the longest prefix that is a decimal number
    /// (or <c>Infinity</c>); NaN when there is none.
    /// </summary>
    public static double ParseFloat(string text)
    {
        var i = 0;
        while (i < text.Length && JsText.IsJsWhitespace(text[i]))
        {
            i++;
        }

        var start = i;
        if (i < text.Length && (text[i] == '+' || text[i] == '-'))
        {
            i++;
        }

        if (text.Length - i >= 8 && string.CompareOrdinal(text, i, "Infinity", 0, 8) == 0)
        {
            return text[start] == '-' ? double.NegativeInfinity : double.PositiveInfinity;
        }

        var digits = 0;
        while (i < text.Length && IsDigit(text[i]))
        {
            i++;
            digits++;
        }

        if (i < text.Length && text[i] == '.')
        {
            var afterPoint = i + 1;
            var j = afterPoint;
            while (j < text.Length && IsDigit(text[j]))
            {
                j++;
            }

            if (digits > 0 || j > afterPoint)
            {
                digits += j - afterPoint;
                i = j;
            }
        }

        if (digits == 0)
        {
            return double.NaN;
        }

        if (i < text.Length && (text[i] == 'e' || text[i] == 'E'))
        {
            var j = i + 1;
            if (j < text.Length && (text[j] == '+' || text[j] == '-'))
            {
                j++;
            }

            var expStart = j;
            while (j < text.Length && IsDigit(text[j]))
            {
                j++;
            }

            if (j > expStart)
            {
                i = j;
            }
        }

        return ParseDecimal(text.Substring(start, i - start));
    }

    /// <summary><c>Number(text)</c> for a string: JavaScript's StringToNumber.</summary>
    public static double StringToNumber(string text)
    {
        var s = JsText.Trim(text);
        if (s.Length == 0)
        {
            return 0;
        }

        if (s.Length > 2 && s[0] == '0')
        {
            var radix = s[1] switch
            {
                'x' or 'X' => 16,
                'o' or 'O' => 8,
                'b' or 'B' => 2,
                _ => 0,
            };
            if (radix != 0)
            {
                double result = 0;
                for (var k = 2; k < s.Length; k++)
                {
                    var d = DigitValue(s[k]);
                    if (d < 0 || d >= radix)
                    {
                        return double.NaN;
                    }

                    result = (result * radix) + d;
                }

                return result;
            }
        }

        var i = 0;
        if (s[0] == '+' || s[0] == '-')
        {
            i++;
        }

        if (string.Equals(s.Substring(i), "Infinity", StringComparison.Ordinal))
        {
            return s[0] == '-' ? double.NegativeInfinity : double.PositiveInfinity;
        }

        var digits = 0;
        while (i < s.Length && IsDigit(s[i]))
        {
            i++;
            digits++;
        }

        if (i < s.Length && s[i] == '.')
        {
            i++;
            while (i < s.Length && IsDigit(s[i]))
            {
                i++;
                digits++;
            }
        }

        if (digits == 0)
        {
            return double.NaN;
        }

        if (i < s.Length && (s[i] == 'e' || s[i] == 'E'))
        {
            i++;
            if (i < s.Length && (s[i] == '+' || s[i] == '-'))
            {
                i++;
            }

            var expStart = i;
            while (i < s.Length && IsDigit(s[i]))
            {
                i++;
            }

            if (i == expStart)
            {
                return double.NaN;
            }
        }

        return i == s.Length ? ParseDecimal(s) : double.NaN;
    }

    /// <summary><c>parseInt(text, 10)</c>.</summary>
    public static double ParseInt(string text)
    {
        var i = 0;
        while (i < text.Length && JsText.IsJsWhitespace(text[i]))
        {
            i++;
        }

        var negative = false;
        if (i < text.Length && (text[i] == '+' || text[i] == '-'))
        {
            negative = text[i] == '-';
            i++;
        }

        var start = i;
        while (i < text.Length && IsDigit(text[i]))
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

    private static double ParseDecimal(string literal)
    {
        // A literal such as "5." or "-.5": .NET reads both; "-0" stays negative zero
        var value = double.Parse(literal, NumberStyles.Float, CultureInfo.InvariantCulture);
        if (value == 0 && literal.StartsWith("-", StringComparison.Ordinal))
        {
            return -0.0;
        }

        return value;
    }

    private static bool IsDigit(char c) => c >= '0' && c <= '9';

    private static int DigitValue(char c) => c switch
    {
        >= '0' and <= '9' => c - '0',
        >= 'a' and <= 'z' => c - 'a' + 10,
        >= 'A' and <= 'Z' => c - 'A' + 10,
        _ => -1,
    };

    /// <summary>
    /// <c>String.prototype.toUpperCase</c>: .NET's simple mapping, plus the letters that become more than one
    /// (ß to SS and the like), which .NET leaves as they are.
    /// </summary>
    public static string ToUpperCase(string text)
    {
        var result = new StringBuilder(text.Length);
        foreach (var c in text)
        {
            switch (c)
            {
                case 'ß': result.Append("SS"); break;
                case 'ŉ': result.Append("ʼN"); break;
                case 'ﬀ': result.Append("FF"); break;
                case 'ﬁ': result.Append("FI"); break;
                case 'ﬂ': result.Append("FL"); break;
                case 'ﬃ': result.Append("FFI"); break;
                case 'ﬄ': result.Append("FFL"); break;
                case 'ﬅ': result.Append("ST"); break;
                case 'ﬆ': result.Append("ST"); break;
                default: result.Append(char.ToUpperInvariant(c)); break;
            }
        }

        return result.ToString();
    }

    /// <summary>
    /// <c>String.prototype.toLowerCase</c>, as far as it matters for comparing with a name in ASCII letters:
    /// A to Z, and the Kelvin sign, which JavaScript lowers to k.
    /// </summary>
    public static string ToLowerAscii(string text)
    {
        var result = new StringBuilder(text.Length);
        foreach (var c in text)
        {
            if (c >= 'A' && c <= 'Z')
            {
                result.Append((char)(c + 32));
            }
            else if (c == 'K')
            {
                result.Append('k');
            }
            else
            {
                result.Append(c);
            }
        }

        return result.ToString();
    }
}

/// <summary>A JavaScript value as the renderer reads an attribute: undefined, a number, text or a boolean.</summary>
internal readonly struct JsValue
{
    private enum ValueKind
    {
        Undefined,
        Number,
        String,
        Boolean,
    }

    private readonly ValueKind kind;
    private readonly double number;
    private readonly string text;
    private readonly bool boolean;

    private JsValue(ValueKind kind, double number, string text, bool boolean)
    {
        this.kind = kind;
        this.number = number;
        this.text = text;
        this.boolean = boolean;
    }

    public static JsValue Undefined => default;

    public static JsValue Number(double value) => new(ValueKind.Number, value, "", false);

    public static JsValue String(string value) => new(ValueKind.String, 0, value, false);

    /// <summary>An attribute's value, or undefined when it is not written.</summary>
    public static JsValue From(AttributeValue? value) => value is null
        ? Undefined
        : value.Kind switch
        {
            AttributeKind.Number => Number(value.Number),
            AttributeKind.String => String(value.Text),
            _ => new JsValue(ValueKind.Boolean, 0, "", value.Boolean),
        };

    /// <summary>An attribute of a node, or undefined.</summary>
    public static JsValue Attribute(ElementNode node, string name) =>
        node.Attributes.TryGetValue(name, out var value) ? From(value) : Undefined;

    public bool IsUndefined => kind == ValueKind.Undefined;

    /// <summary><c>typeof value === 'number'</c></summary>
    public bool IsNumber => kind == ValueKind.Number;

    public bool IsString => kind == ValueKind.String;

    public bool IsBoolean => kind == ValueKind.Boolean;

    /// <summary>The number of a number value.</summary>
    public double NumberValue => number;

    /// <summary>The text of a string value.</summary>
    public string StringValue => text ?? "";

    /// <summary>JavaScript's truthiness.</summary>
    public bool Truthy => kind switch
    {
        ValueKind.Number => Js.Truthy(number),
        ValueKind.String => text.Length > 0,
        ValueKind.Boolean => boolean,
        _ => false,
    };

    /// <summary><c>this || fallback</c></summary>
    public JsValue Or(JsValue fallback) => Truthy ? this : fallback;

    /// <summary><c>this || fallback</c> with a number fallback.</summary>
    public JsValue Or(double fallback) => Truthy ? this : Number(fallback);

    /// <summary><c>this || fallback</c> with a text fallback.</summary>
    public JsValue Or(string fallback) => Truthy ? this : String(fallback);

    /// <summary>JavaScript's ToNumber, as arithmetic and comparisons apply it.</summary>
    public double ToNumber() => kind switch
    {
        ValueKind.Number => number,
        ValueKind.String => Js.StringToNumber(text),
        ValueKind.Boolean => boolean ? 1 : 0,
        _ => double.NaN,
    };

    /// <summary><c>value === n</c> for a number n: only a number value can be equal.</summary>
    public bool StrictEquals(double n) => kind == ValueKind.Number && number == n;

    /// <summary><c>String(value)</c>, which is also the key a property lookup uses.</summary>
    public override string ToString() => kind switch
    {
        ValueKind.Number => Js.N(number),
        ValueKind.String => text,
        ValueKind.Boolean => boolean ? "true" : "false",
        _ => "undefined",
    };
}
