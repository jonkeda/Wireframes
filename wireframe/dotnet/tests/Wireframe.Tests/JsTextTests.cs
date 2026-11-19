using Wireframe.Syntax;

namespace Wireframe.Tests;

/// <summary>The JavaScript number and text rules the tree's JSON depends on.</summary>
public class JsTextTests
{
    [Theory]
    [InlineData("1", true)]
    [InlineData("1.5", true)]
    [InlineData("0.1", true)]
    [InlineData("-3", true)]
    [InlineData("1e+21", true)]
    [InlineData("1e-7", true)]
    [InlineData("0.000001", true)]
    [InlineData("Infinity", true)]
    [InlineData("1.0", false)]
    [InlineData("-0", false)]
    [InlineData("01", false)]
    [InlineData("1e21", false)]
    [InlineData("50%", false)]
    [InlineData("NaN", false)]
    [InlineData("", false)]
    public void An_attribute_value_is_a_number_when_JavaScript_writes_it_so(string text, bool isNumber)
    {
        var result = WireframeParser.Parse("wireframe\n    Button x=" + text + "\n/wireframe\n");
        var control = Assert.IsType<ControlNode>(Assert.Single(result.Document!.Children));
        if (text.Length == 0)
        {
            Assert.Equal(AttributeKind.String, control.Attributes["x"].Kind);
            return;
        }

        Assert.Equal(isNumber ? AttributeKind.Number : AttributeKind.String, control.Attributes["x"].Kind);
        Assert.Equal(text, control.Attributes["x"].ToString());
    }

    [Theory]
    [InlineData(1e21, "1e+21")]
    [InlineData(1e20, "100000000000000000000")]
    [InlineData(1.5e-7, "1.5e-7")]
    [InlineData(0.1 + 0.2, "0.30000000000000004")]
    [InlineData(-0.0, "0")]
    [InlineData(123.456, "123.456")]
    public void Numbers_are_written_as_JavaScript_writes_them(double value, string expected)
    {
        var tree = new DocumentNode { Children = new ElementNode[] { new RepeatNode { Count = value } } };
        Assert.Contains("\"count\": " + expected + ",", SyntaxJson.Write(tree), StringComparison.Ordinal);
    }

    [Fact]
    public void Strings_are_escaped_as_JSON_stringify_escapes_them()
    {
        var tree = new DocumentNode { Style = "<&>'é\u0001\"\\\ud800" };
        Assert.Contains("\"style\": \"<&>'é\\u0001\\\"\\\\\\ud800\"", SyntaxJson.Write(tree), StringComparison.Ordinal);
    }

    [Fact]
    public void A_backslash_at_the_very_end_reads_undefined_as_JavaScript_does()
    {
        var result = WireframeParser.Parse("Button \"a\\");
        var control = Assert.IsType<ControlNode>(Assert.Single(result.Document!.Children));
        Assert.Equal("aundefined", control.Text);
    }

    [Fact]
    public void Array_index_keys_come_first_in_numeric_order()
    {
        var result = WireframeParser.Parse("data\n  | b | 10 | 9 |\n  |---|---|---|\n  | x | y | z |\n");
        var json = SyntaxJson.Write(result.Document);
        Assert.Contains("\"9\": \"z\",\n          \"10\": \"y\",\n          \"b\": \"x\"", json, StringComparison.Ordinal);
    }
}
