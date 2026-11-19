using System.Globalization;
using Wireframe.Rendering;

namespace Wireframe.Tests;

/// <summary>
/// The JavaScript number rules the renderer copies, each against what Node gives (values taken from Node once).
/// The conformance set reaches only some of these edges; these keep the rest from drifting.
/// </summary>
public class RenderingJsTests
{
    [Theory]
    [InlineData(0.25, "0.3")]
    [InlineData(-0.25, "-0.3")]
    [InlineData(1.45, "1.4")]
    [InlineData(1.35, "1.4")]
    [InlineData(0.15, "0.1")]
    [InlineData(0.35, "0.3")]
    [InlineData(-0.04, "-0.0")]
    [InlineData(0.05, "0.1")]
    [InlineData(-2.5, "-2.5")]
    [InlineData(123.456, "123.5")]
    [InlineData(99.95, "100.0")]
    [InlineData(1e21, "1e+21")]
    [InlineData(-0.0, "0.0")]
    public void ToFixed_rounds_the_exact_value_as_JavaScript(double value, string expected) =>
        Assert.Equal(expected, Js.ToFixed(value, 1));

    [Theory]
    [InlineData(-2.5, -2)]
    [InlineData(2.5, 3)]
    [InlineData(-3.5, -3)]
    [InlineData(0.49999999999999994, 0)]
    [InlineData(100.49999999999999, 100)]
    public void Round_takes_halves_toward_positive_infinity(double value, double expected) =>
        Assert.Equal(expected, Js.Round(value));

    [Fact]
    public void Round_keeps_negative_zero()
    {
        Assert.True(double.IsNegative(Js.Round(-0.5)));
    }

    [Theory]
    [InlineData(12345, "1406932606,654583808,1358247936,2138638336,1459132416")]
    [InlineData(-987654321.5, "547260288,2110316928,742208512")]
    public void The_sketch_generator_loses_the_low_bits_as_JavaScript_does(double seed, string expected)
    {
        var values = new List<string>();
        var s = seed;
        foreach (var _ in expected.Split(','))
        {
            s = Js.ToInt32((s * 1103515245.0) + 12345.0) & 0x7fffffff;
            values.Add(s.ToString(CultureInfo.InvariantCulture));
        }

        Assert.Equal(expected, string.Join(",", values));
    }

    [Theory]
    [InlineData(" 12px", 12)]
    [InlineData("-.5e-3abc", -0.0005)]
    [InlineData("Infinityx", double.PositiveInfinity)]
    [InlineData("+.e1", double.NaN)]
    [InlineData("1e", 1)]
    [InlineData("0x10", 0)]
    [InlineData("abc", double.NaN)]
    public void ParseFloat_reads_the_longest_number_at_the_start(string text, double expected) =>
        Assert.Equal(expected, Js.ParseFloat(text));

    [Theory]
    [InlineData(" 12 ", 12)]
    [InlineData("0x10", 16)]
    [InlineData("0b101", 5)]
    [InlineData("1e2", 100)]
    [InlineData("5.", 5)]
    [InlineData("+5", 5)]
    [InlineData("1_0", double.NaN)]
    [InlineData("", 0)]
    [InlineData(".", double.NaN)]
    [InlineData("Infinity", double.PositiveInfinity)]
    [InlineData("-Infinity", double.NegativeInfinity)]
    public void StringToNumber_reads_as_Number_does(string text, double expected) =>
        Assert.Equal(expected, Js.StringToNumber(text));

    [Fact]
    public void Max_and_min_propagate_NaN()
    {
        Assert.True(double.IsNaN(Js.Max(double.NaN, 1)));
        Assert.True(double.IsNaN(Js.Min(1, double.NaN)));
        Assert.False(double.IsNegative(Js.Max(-0.0, 0.0)));
        Assert.True(double.IsNegative(Js.Min(0.0, -0.0)));
    }

    [Fact]
    public void RoundSvgNumbers_rounds_attribute_values_only()
    {
        var svg = "<text x=\"1.23456\" aria-label=\"1.23456\" style=\"font-size: 13.333333px\">1.23456</text>";
        Assert.Equal(
            "<text x=\"1.23\" aria-label=\"1.23456\" style=\"font-size: 13.33px\">1.23456</text>",
            SvgText.RoundSvgNumbers(svg));
    }

    [Fact]
    public void Compile_parses_then_renders_with_the_documents_style()
    {
        var result = WireframeCompiler.Compile("wireframe sketch\n    Button \"Go\"\n/wireframe\n");
        Assert.Empty(result.Diagnostics);
        Assert.Contains("font-family: \"Comic Sans MS\"", result.Svg, StringComparison.Ordinal);

        var clean = WireframeCompiler.Compile("wireframe sketch\n    Button \"Go\"\n/wireframe\n", new RenderOptions { Theme = "clean" });
        Assert.Contains("font-family: system-ui", clean.Svg, StringComparison.Ordinal);
    }

    [Fact]
    public void Title_description_and_language_are_written()
    {
        var parsed = WireframeParser.Parse("wireframe\n    Button \"Go\"\n/wireframe\n");
        var svg = WireframeRenderer.Render(parsed.Document!, new RenderOptions { Title = "A & B", Description = "D", Lang = "nl" });
        Assert.StartsWith(
            "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"132\" height=\"68\" viewBox=\"0 0 132 68\" role=\"img\" xml:lang=\"nl\" aria-labelledby=\"wireframe-title wireframe-desc\">\n  <title id=\"wireframe-title\">A &amp; B</title>\n  <desc id=\"wireframe-desc\">D</desc>\n",
            svg,
            StringComparison.Ordinal);
    }
}
