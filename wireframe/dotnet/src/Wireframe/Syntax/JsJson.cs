using System.Globalization;
using System.Text;

namespace Wireframe.Syntax;

/// <summary>
/// A small JSON value and writer that give exactly what <c>JSON.stringify(sorted(value), null, 2)</c> gives:
/// keys in order (array-index keys first, by number, as a JavaScript object orders them; then the rest by UTF-16
/// code unit), two spaces of indentation, <c>[]</c> and <c>{}</c> for empty ones, numbers as JavaScript writes them
/// (not finite ones as <c>null</c>) and strings escaped as <c>JSON.stringify</c> does.
/// </summary>
internal static class JsJson
{
    /// <summary>A JSON object: its properties (a property whose value is <see cref="Undefined"/> is left out).</summary>
    public sealed class Obj
    {
        public readonly List<KeyValuePair<string, object?>> Properties = new();

        public Obj Add(string key, object? value)
        {
            Properties.Add(new KeyValuePair<string, object?>(key, value));
            return this;
        }
    }

    /// <summary>JavaScript's undefined: a property with it is left out.</summary>
    public static readonly object Undefined = new();

    public static string Write(object? value)
    {
        var text = new StringBuilder();
        WriteValue(text, value, "");
        return text.ToString();
    }

    private static void WriteValue(StringBuilder text, object? value, string indent)
    {
        switch (value)
        {
            case null:
                text.Append("null");
                break;
            case string s:
                WriteString(text, s);
                break;
            case bool b:
                text.Append(b ? "true" : "false");
                break;
            case int i:
                text.Append(i.ToString(CultureInfo.InvariantCulture));
                break;
            case double d:
                text.Append(double.IsNaN(d) || double.IsInfinity(d) ? "null" : JsText.NumberToString(d));
                break;
            case Obj obj:
                WriteObject(text, obj, indent);
                break;
            case System.Collections.IEnumerable list:
                WriteArray(text, list, indent);
                break;
            default:
                throw new InvalidOperationException("Not a JSON value: " + value.GetType());
        }
    }

    private static void WriteArray(StringBuilder text, System.Collections.IEnumerable list, string indent)
    {
        var inner = indent + "  ";
        var any = false;
        foreach (var item in list)
        {
            text.Append(any ? ",\n" : "[\n").Append(inner);
            // In an array, undefined is written as null
            WriteValue(text, ReferenceEquals(item, Undefined) ? null : item, inner);
            any = true;
        }

        text.Append(any ? "\n" + indent + "]" : "[]");
    }

    private static void WriteObject(StringBuilder text, Obj obj, string indent)
    {
        // The last value set for a key wins; the key keeps its place (which the sort makes moot)
        var values = new Dictionary<string, object?>(StringComparer.Ordinal);
        foreach (var property in obj.Properties)
        {
            values[property.Key] = property.Value;
        }

        var keys = values.Where(pair => !ReferenceEquals(pair.Value, Undefined)).Select(pair => pair.Key).ToList();
        keys.Sort(CompareKeys);

        if (keys.Count == 0)
        {
            text.Append("{}");
            return;
        }

        var inner = indent + "  ";
        text.Append("{\n");
        for (var i = 0; i < keys.Count; i++)
        {
            if (i > 0)
            {
                text.Append(",\n");
            }

            text.Append(inner);
            WriteString(text, keys[i]);
            text.Append(": ");
            WriteValue(text, values[keys[i]], inner);
        }

        text.Append('\n').Append(indent).Append('}');
    }

    /// <summary>The order of a JavaScript object's own keys after they were set in sorted order.</summary>
    private static int CompareKeys(string a, string b)
    {
        var aIndex = ArrayIndex(a);
        var bIndex = ArrayIndex(b);
        if (aIndex is not null && bIndex is not null)
        {
            return aIndex.Value.CompareTo(bIndex.Value);
        }

        if (aIndex is not null)
        {
            return -1;
        }

        if (bIndex is not null)
        {
            return 1;
        }

        return string.CompareOrdinal(a, b);
    }

    /// <summary>An array index: "0", or digits without a leading zero, below 2^32 - 1.</summary>
    private static uint? ArrayIndex(string key)
    {
        if (key.Length == 0 || key.Length > 10 || (key.Length > 1 && key[0] == '0'))
        {
            return null;
        }

        foreach (var c in key)
        {
            if (c < '0' || c > '9')
            {
                return null;
            }
        }

        var value = ulong.Parse(key, CultureInfo.InvariantCulture);
        return value < uint.MaxValue ? (uint)value : null;
    }

    private static void WriteString(StringBuilder text, string s)
    {
        text.Append('"');
        for (var i = 0; i < s.Length; i++)
        {
            var c = s[i];
            switch (c)
            {
                case '"':
                    text.Append("\\\"");
                    break;
                case '\\':
                    text.Append("\\\\");
                    break;
                case '\b':
                    text.Append("\\b");
                    break;
                case '\f':
                    text.Append("\\f");
                    break;
                case '\n':
                    text.Append("\\n");
                    break;
                case '\r':
                    text.Append("\\r");
                    break;
                case '\t':
                    text.Append("\\t");
                    break;
                default:
                    if (c < ' ')
                    {
                        AppendEscape(text, c);
                    }
                    else if (char.IsHighSurrogate(c))
                    {
                        if (i + 1 < s.Length && char.IsLowSurrogate(s[i + 1]))
                        {
                            text.Append(c).Append(s[i + 1]);
                            i++;
                        }
                        else
                        {
                            AppendEscape(text, c);
                        }
                    }
                    else if (char.IsLowSurrogate(c))
                    {
                        AppendEscape(text, c);
                    }
                    else
                    {
                        text.Append(c);
                    }

                    break;
            }
        }

        text.Append('"');
    }

    private static void AppendEscape(StringBuilder text, char c) =>
        text.Append("\\u").Append(((int)c).ToString("x4", CultureInfo.InvariantCulture));
}
