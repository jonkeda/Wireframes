namespace Wireframe.Rendering;

/// <summary>Hand-drawn lines for the sketch theme (<c>sketch.ts</c>).</summary>
internal static class Sketch
{
    /// <summary>
    /// The seeded generator: <c>(seed * 1103515245 + 12345) &amp; 0x7fffffff</c> in JavaScript numbers. The product
    /// is a double, so its low bits are already lost before the AND, which applies ToInt32.
    /// </summary>
    private sealed class SeededRandom
    {
        private double seed;

        public SeededRandom(double seed) => this.seed = seed;

        public double Next()
        {
            var product = (seed * 1103515245.0) + 12345.0;
            seed = Js.ToInt32(product) & 0x7fffffff;
            return seed / 2147483647.0;
        }

        public double Offset() => (Next() * 2) - 1;
    }

    /// <summary><c>sketchyLine</c> with a seed given, as every caller in the renderer gives one.</summary>
    public static string Line(double x1, double y1, double x2, double y2, double roughness, double bowing, double seed)
    {
        var rng = new SeededRandom(seed);

        var dx = x2 - x1;
        var dy = y2 - y1;
        var length = Math.Sqrt((dx * dx) + (dy * dy));

        if (length < 4)
        {
            return $"M{Js.N(x1)} {Js.N(y1)} L{Js.N(x2)} {Js.N(y2)}";
        }

        var perpX = -dy / length;
        var perpY = dx / length;

        var midX = (x1 + x2) / 2;
        var midY = (y1 + y2) / 2;
        var bowOffset = bowing * rng.Offset() * Js.Min(length / 10, 8);
        var bowX = midX + (perpX * bowOffset);
        var bowY = midY + (perpY * bowOffset);

        var offset1 = roughness * rng.Offset() * 1.5;
        var offset2 = roughness * rng.Offset() * 1.5;
        var offsetMid = roughness * rng.Offset() * 2;

        var startX = x1 + (perpX * offset1);
        var startY = y1 + (perpY * offset1);
        var endX = x2 + (perpX * offset2);
        var endY = y2 + (perpY * offset2);
        var ctrlX = bowX + (perpX * offsetMid);
        var ctrlY = bowY + (perpY * offsetMid);

        return $"M{F(startX)} {F(startY)} Q{F(ctrlX)} {F(ctrlY)} {F(endX)} {F(endY)}";
    }

    /// <summary><c>sketchyRect</c>: four sides, each from its own seed.</summary>
    public static string Rect(double x, double y, double width, double height, double roughness)
    {
        var seed = Math.Floor(x + (y * 1000) + width + height);
        return string.Join(" ", new[]
        {
            Line(x, y, x + width, y, roughness, 1, seed),
            Line(x + width, y, x + width, y + height, roughness, 1, seed + 1),
            Line(x + width, y + height, x, y + height, roughness, 1, seed + 2),
            Line(x, y + height, x, y, roughness, 1, seed + 3),
        });
    }

    /// <summary><c>sketchyRoundedRect</c>: numbers written as they are, with no rounding.</summary>
    public static string RoundedRect(double x, double y, double width, double height, double radius, double roughness)
    {
        var seed = Math.Floor(x + (y * 1000) + width + height);
        var r = Js.Min(radius, width / 2, height / 2);

        if (r < 2)
        {
            return Rect(x, y, width, height, roughness);
        }

        var rng = new SeededRandom(seed);
        double O() => rng.Offset() * roughness;

        var topLeft = $"M{Js.N(x + r)} {Js.N(y + O())}";
        var topRight = $"L{Js.N(x + width - r + O())} {Js.N(y + O())} Q{Js.N(x + width + O())} {Js.N(y + O())} {Js.N(x + width + O())} {Js.N(y + r)}";
        var bottomRight = $"L{Js.N(x + width + O())} {Js.N(y + height - r + O())} Q{Js.N(x + width + O())} {Js.N(y + height + O())} {Js.N(x + width - r)} {Js.N(y + height + O())}";
        var bottomLeft = $"L{Js.N(x + r + O())} {Js.N(y + height + O())} Q{Js.N(x + O())} {Js.N(y + height + O())} {Js.N(x + O())} {Js.N(y + height - r)}";
        var close = $"L{Js.N(x + O())} {Js.N(y + r + O())} Q{Js.N(x + O())} {Js.N(y + O())} {Js.N(x + r)} {Js.N(y + O())}";

        return $"{topLeft} {topRight} {bottomRight} {bottomLeft} {close}";
    }

    private static string F(double value) => Js.ToFixed(value, 1);
}
