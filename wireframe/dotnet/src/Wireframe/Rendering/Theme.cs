namespace Wireframe.Rendering;

/// <summary>A theme: the colours, type, spacing and borders a picture is drawn with (<c>theme.ts</c>).</summary>
internal sealed record Theme
{
    public string Name { get; init; } = "";
    public ThemeColors Colors { get; init; } = new();
    public ThemeTypography Typography { get; init; } = new();
    public ThemeSpacing Spacing { get; init; } = new();
    public ThemeBorders Borders { get; init; } = new();
    public ThemeShadows Shadows { get; init; } = new();
    public ThemeComponents Components { get; init; } = new();
}

internal sealed record ThemeColors
{
    public string Background { get; init; } = "";
    public string Surface { get; init; } = "";
    public string Text { get; init; } = "";
    public string TextSecondary { get; init; } = "";
    public string TextDisabled { get; init; } = "";
    public string Primary { get; init; } = "";
    public string PrimaryText { get; init; } = "";
    public string Secondary { get; init; } = "";
    public string SecondaryText { get; init; } = "";
    public string Success { get; init; } = "";
    public string Warning { get; init; } = "";
    public string Error { get; init; } = "";
    public string Info { get; init; } = "";
    public string Border { get; init; } = "";
    public string BorderFocus { get; init; } = "";
    public string InputBackground { get; init; } = "";
    public string ButtonBackground { get; init; } = "";
    public string ButtonHover { get; init; } = "";

    /// <summary>Every colour passed through <paramref name="map"/>.</summary>
    public ThemeColors Map(Func<string, string> map) => new()
    {
        Background = map(Background),
        Surface = map(Surface),
        Text = map(Text),
        TextSecondary = map(TextSecondary),
        TextDisabled = map(TextDisabled),
        Primary = map(Primary),
        PrimaryText = map(PrimaryText),
        Secondary = map(Secondary),
        SecondaryText = map(SecondaryText),
        Success = map(Success),
        Warning = map(Warning),
        Error = map(Error),
        Info = map(Info),
        Border = map(Border),
        BorderFocus = map(BorderFocus),
        InputBackground = map(InputBackground),
        ButtonBackground = map(ButtonBackground),
        ButtonHover = map(ButtonHover),
    };
}

internal sealed record ThemeTypography
{
    public string FontFamily { get; init; } = "";
    public double FontSize { get; init; }
    public double FontSizeLarge { get; init; }
    public double FontSizeSmall { get; init; }
    public double FontWeight { get; init; }
    public double FontWeightBold { get; init; }
    public double LineHeight { get; init; }
}

internal sealed record ThemeSpacing
{
    public double Unit { get; init; }
    public double Xs { get; init; }
    public double Sm { get; init; }
    public double Md { get; init; }
    public double Lg { get; init; }
    public double Xl { get; init; }
    public double Padding { get; init; }
    public double Gap { get; init; }
}

internal sealed record ThemeBorders
{
    public double Radius { get; init; }
    public double RadiusLarge { get; init; }
    public double Width { get; init; }
}

internal sealed record ThemeShadows
{
    public string Sm { get; init; } = "";
    public string Md { get; init; } = "";
    public string Lg { get; init; } = "";
}

internal sealed record ThemeComponents
{
    public double CheckboxSize { get; init; }
    public double RadioSize { get; init; }
    public double HeaderHeight { get; init; }
    public double FooterHeight { get; init; }
    public double SidebarWidth { get; init; }
}

/// <summary>The four built-in themes and the lookup by name.</summary>
internal static class Themes
{
    public static Theme Clean { get; } = new()
    {
        Name = "clean",
        Colors = new ThemeColors
        {
            Background = "#ffffff",
            Surface = "#f8f9fa",
            Text = "#212529",
            TextSecondary = "#6c757d",
            TextDisabled = "#adb5bd",
            Primary = "#0d6efd",
            PrimaryText = "#ffffff",
            Secondary = "#6c757d",
            SecondaryText = "#ffffff",
            Success = "#198754",
            Warning = "#ffc107",
            Error = "#dc3545",
            Info = "#0dcaf0",
            Border = "#dee2e6",
            BorderFocus = "#86b7fe",
            InputBackground = "#ffffff",
            ButtonBackground = "#e9ecef",
            ButtonHover = "#dee2e6",
        },
        Typography = new ThemeTypography
        {
            FontFamily = "system-ui, -apple-system, sans-serif",
            FontSize = 14,
            FontSizeLarge = 18,
            FontSizeSmall = 12,
            FontWeight = 400,
            FontWeightBold = 600,
            LineHeight = 1.5,
        },
        Spacing = new ThemeSpacing { Unit = 4, Xs = 4, Sm = 8, Md = 16, Lg = 24, Xl = 32, Padding = 16, Gap = 8 },
        Borders = new ThemeBorders { Radius = 4, RadiusLarge = 8, Width = 1 },
        Shadows = new ThemeShadows
        {
            Sm = "0 1px 2px rgba(0,0,0,0.05)",
            Md = "0 4px 6px rgba(0,0,0,0.1)",
            Lg = "0 10px 15px rgba(0,0,0,0.1)",
        },
        Components = new ThemeComponents
        {
            CheckboxSize = 18,
            RadioSize = 18,
            HeaderHeight = 56,
            FooterHeight = 48,
            SidebarWidth = 240,
        },
    };

    public static Theme Sketch { get; } = Clean with
    {
        Name = "sketch",
        Colors = Clean.Colors with
        {
            Background = "#fefefe",
            Surface = "#f5f5f5",
            Text = "#333333",
            Border = "#888888",
            Primary = "#4a90d9",
            ButtonBackground = "#f0f0f0",
        },
        Typography = Clean.Typography with { FontFamily = "\"Comic Sans MS\", cursive, sans-serif" },
        Borders = new ThemeBorders { Radius = 0, RadiusLarge = 0, Width = 2 },
    };

    public static Theme Blueprint { get; } = Clean with
    {
        Name = "blueprint",
        Colors = Clean.Colors with
        {
            Background = "#1e3a5f",
            Surface = "#2a4a6f",
            Text = "#ffffff",
            TextSecondary = "#a0c4e8",
            Border = "#4a7ab0",
            BorderFocus = "#6aa0d8",
            Primary = "#ffffff",
            PrimaryText = "#1e3a5f",
            InputBackground = "#2a4a6f",
            ButtonBackground = "#2a4a6f",
            ButtonHover = "#3a5a7f",
        },
        Typography = Clean.Typography with { FontFamily = "\"Courier New\", monospace" },
    };

    public static Theme Realistic { get; } = Clean with
    {
        Name = "realistic",
        Shadows = new ThemeShadows
        {
            Sm = "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
            Md = "0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)",
            Lg = "0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)",
        },
        Borders = new ThemeBorders { Radius = 6, RadiusLarge = 12, Width = 1 },
    };

    /// <summary><c>getTheme(name)</c>: a built-in theme by name, any case; anything else is the clean theme.</summary>
    public static Theme Get(string name) => Js.ToLowerAscii(name) switch
    {
        "sketch" => Sketch,
        "blueprint" => Blueprint,
        "realistic" => Realistic,
        _ => Clean,
    };
}
