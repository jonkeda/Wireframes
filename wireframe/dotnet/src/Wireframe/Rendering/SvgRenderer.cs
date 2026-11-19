using System.Text;
using Wireframe.Syntax;

namespace Wireframe.Rendering;

/// <summary>Renders a document to SVG (<c>svg-renderer.ts</c>). Every template is copied as the TypeScript writes it.</summary>
internal sealed partial class SvgRenderer
{
    /// <summary>The theme with its colours escaped for attribute values.</summary>
    private Theme theme;

    /// <summary>The theme as given, for the &lt;style&gt; block.</summary>
    private Theme sourceTheme;

    private LayoutEngine layoutEngine;
    private bool accessible = true;

    public SvgRenderer(Theme theme)
    {
        sourceTheme = theme;
        this.theme = AttributeSafeTheme(theme);
        layoutEngine = new LayoutEngine(theme);
    }

    private static Theme AttributeSafeTheme(Theme theme) => theme with { Colors = theme.Colors.Map(SvgText.EscapeXml) };

    private static string N(double value) => Js.N(value);

    private static string E(string text) => SvgText.EscapeXml(text);

    private static string CssNumber(double value) => SvgText.CssSafe(Js.N(value));

    public string Render(DocumentNode document, RenderOptions options)
    {
        var width = options.Width is double w && Js.Truthy(w) ? w : 800;
        var height = options.Height is double h && Js.Truthy(h) ? h : 600;
        var padding = options.Padding ?? theme.Spacing.Padding;
        var isAccessible = options.Accessible != false;
        accessible = isAccessible;

        if (!string.IsNullOrEmpty(options.Theme))
        {
            sourceTheme = Themes.Get(options.Theme!);
            theme = AttributeSafeTheme(sourceTheme);
            layoutEngine = new LayoutEngine(sourceTheme);
        }

        var layout = layoutEngine.CalculateLayout(document, width - (padding * 2), height - (padding * 2));

        var content = RenderLayout(layout, padding, padding);

        // The shadow that cards, menus and toasts point at, when one of them is drawn
        var defs = content.Contains("url(#shadow)")
            ? "<defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"130%\"><feDropShadow dx=\"0\" dy=\"1\" stdDeviation=\"2\" flood-opacity=\"0.15\" /></filter></defs>"
            : "";

        var a11yAttrs = new List<string>();
        if (isAccessible)
        {
            a11yAttrs.Add("role=\"img\"");
            if (!string.IsNullOrEmpty(options.Lang))
            {
                a11yAttrs.Add($"xml:lang=\"{E(options.Lang!)}\"");
            }
        }

        var a11yElements = "";
        if (isAccessible)
        {
            var titleId = !string.IsNullOrEmpty(options.Title) ? "wireframe-title" : "";
            var descId = !string.IsNullOrEmpty(options.Description) ? "wireframe-desc" : "";
            var labelledBy = string.Join(" ", new[] { titleId, descId }.Where(s => s.Length > 0));

            if (labelledBy.Length > 0)
            {
                a11yAttrs.Add($"aria-labelledby=\"{labelledBy}\"");
            }

            if (!string.IsNullOrEmpty(options.Title))
            {
                a11yElements += $"\n  <title id=\"wireframe-title\">{E(options.Title!)}</title>";
            }

            if (!string.IsNullOrEmpty(options.Description))
            {
                a11yElements += $"\n  <desc id=\"wireframe-desc\">{E(options.Description!)}</desc>";
            }
        }

        var finalA11yAttrStr = a11yAttrs.Count > 0 ? " " + string.Join(" ", a11yAttrs) : "";

        var t = sourceTheme;
        var contentRight = RightmostEdge(layout.Children);
        var svgWidth = options.Width is null && contentRight > 0
            ? Js.Min(width, Math.Ceiling(contentRight + (padding * 2)))
            : width;
        var contentBottom = LowestEdge(layout.Children);
        var fitToContent = options.Height is null && contentBottom > 0;
        var svgHeight = fitToContent
            ? Math.Ceiling(contentBottom + (padding * 2))
            : Js.Max(height, layout.Bounds.Height + (padding * 2));

        var svg = new StringBuilder();
        svg.Append($"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{N(svgWidth)}\" height=\"{N(svgHeight)}\" viewBox=\"0 0 {N(svgWidth)} {N(svgHeight)}\"{finalA11yAttrStr}>{a11yElements}\n");
        svg.Append("  <style>\n");
        svg.Append($"    .wire-text {{ font-family: {SvgText.CssSafe(t.Typography.FontFamily)}; font-size: {CssNumber(t.Typography.FontSize)}px; fill: {SvgText.CssSafe(t.Colors.Text)}; }}\n");
        svg.Append($"    .wire-text-secondary {{ fill: {SvgText.CssSafe(t.Colors.TextSecondary)}; }}\n");
        svg.Append($"    .wire-text-disabled {{ fill: {SvgText.CssSafe(t.Colors.TextDisabled)}; }}\n");
        svg.Append($"    .wire-text-bold {{ font-weight: {CssNumber(t.Typography.FontWeightBold)}; }}\n");
        svg.Append($"    .wire-text-small {{ font-size: {CssNumber(t.Typography.FontSizeSmall)}px; }}\n");
        svg.Append($"    .wire-text-large {{ font-size: {CssNumber(t.Typography.FontSizeLarge)}px; }}\n");
        svg.Append("  </style>\n");
        svg.Append($"  {defs}\n");
        svg.Append($"  <rect width=\"100%\" height=\"100%\" fill=\"{theme.Colors.Background}\" />\n");
        svg.Append($"  {content}\n");
        svg.Append("</svg>");
        return SvgText.RoundSvgNumbers(svg.ToString());
    }

    /// <summary>
    /// No width asked for: the picture ends a padding right of its rightmost element. A layout, a conditional and
    /// a repeat take the whole width but draw nothing themselves.
    /// </summary>
    private static double RightmostEdge(List<LayoutInfo> items)
    {
        double right = 0;
        foreach (var item in items)
        {
            var type = item.Node.Type;
            var transparent = type is "Layout" or "Conditional" or "Repeat";
            var own = transparent ? 0 : item.Bounds.X + item.Bounds.Width;
            right = Js.Max(right, own, RightmostEdge(item.Children));
        }

        return right;
    }

    private static double LowestEdge(List<LayoutInfo> items)
    {
        double bottom = 0;
        foreach (var item in items)
        {
            bottom = Js.Max(bottom, item.Bounds.Y + item.Bounds.Height, LowestEdge(item.Children));
        }

        return bottom;
    }

    private string RenderLayout(LayoutInfo layout, double offsetX, double offsetY)
    {
        var bounds = layout.Bounds;
        var x = bounds.X + offsetX;
        var y = bounds.Y + offsetY;

        var svg = new StringBuilder();

        switch (layout.Node)
        {
            case ControlNode control:
                svg.Append(WithAria(control, RenderControl(control, bounds.With(x, y))));
                break;
            case SectionNode section:
                svg.Append(RenderSection(section, bounds.With(x, y)));
                break;
            case LayoutNode:
                // Layouts are transparent containers
                break;
            case ComponentNode component:
                svg.Append(RenderComponent(component, bounds.With(x, y), layout));
                break;
        }

        foreach (var child in layout.Children)
        {
            svg.Append(RenderLayout(child, offsetX, offsetY));
        }

        return svg.ToString();
    }

    private string WithAria(ControlNode node, string inner)
    {
        if (!accessible || inner.Length == 0)
        {
            return inner;
        }

        var m = node.Modifiers;
        var attrs = Accessibility.GetAriaAttributes(node.ControlType, new Accessibility.AriaProps
        {
            Label = ControlHelpers.WithoutBoldMarks(node.Label ?? ControlHelpers.ControlText(node)),
            Placeholder = node.Placeholder,
            Disabled = m.Disabled,
            Required = m.Required,
            Checked = m.Checked,
            Selected = m.Selected,
            Active = m.Selected || m.Active,
            Expanded = m.Expanded ? true : null,
            Value = JsValue.Attribute(node, "value"),
            Min = JsValue.Attribute(node, "min"),
            Max = JsValue.Attribute(node, "max"),
        });
        var aria = Accessibility.FormatAriaAttributes(attrs);
        return $"<g role=\"{E(Accessibility.GetAriaRole(node.ControlType))}\"{(aria.Length > 0 ? " " + aria : "")}>{inner}</g>";
    }

    private (string Label, BoundingBox Box) RenderInputLabel(ControlNode node, BoundingBox bounds)
    {
        if (!ControlHelpers.HasInputLabel(node))
        {
            return ("", bounds);
        }

        var label = $"<text x=\"{N(bounds.X)}\" y=\"{N(bounds.Y + ControlHelpers.InputLabelHeight - 6)}\" class=\"wire-text wire-text-small\">{E(node.Label ?? "")}</text>";
        return (label, new BoundingBox(bounds.X, bounds.Y + ControlHelpers.InputLabelHeight, bounds.Width, bounds.Height - ControlHelpers.InputLabelHeight));
    }

    private string RenderControl(ControlNode node, BoundingBox bounds)
    {
        switch (node.ControlType)
        {
            case "Button": return RenderButton(node, bounds);
            case "IconButton": return RenderIconButton(node, bounds);
            case "TextInput":
            case "NumberInput":
            case "DateInput":
            case "PasswordInput":
                return RenderInput(node, bounds);
            case "TextArea": return RenderTextArea(node, bounds);
            case "Label": return RenderLabel(node, bounds);
            case "Checkbox": return RenderCheckbox(node, bounds);
            case "Radio": return RenderRadio(node, bounds);
            case "Dropdown": return RenderDropdown(node, bounds);
            case "Separator": return RenderSeparator(bounds);
            case "Spacer": return "";
            case "Icon": return RenderIcon(node, bounds);
            case "Image": return RenderImage(bounds);
            case "Avatar": return RenderAvatar(node, bounds);
            case "Progress": return RenderProgress(node, bounds);
            case "Slider": return RenderSlider(node, bounds);
            case "Switch": return RenderSwitch(node, bounds);
            case "Chip": return RenderChip(node, bounds);
            case "Badge": return RenderBadge(node, bounds);
            case "Tabs": return RenderTabs(bounds);
            case "Tab": return RenderTab(node, bounds);
            case "Menu": return RenderMenu(node, bounds);
            case "MenuItem": return RenderMenuItem(node, bounds);
            case "Breadcrumb": return RenderBreadcrumb(node, bounds);
            case "Pagination": return RenderPagination(node, bounds);
            case "Table": return RenderTable(node, bounds);
            case "Row": return RenderRow(node, bounds);
            case "Cell": return RenderCell(node, bounds);
            case "Tree": return RenderTree(bounds);
            case "TreeItem": return RenderTreeItem(node, bounds);
            case "Accordion": return RenderAccordion(bounds);
            case "AccordionSection": return RenderAccordionSection(node, bounds);
            case "DataGrid": return RenderDataGrid(node, bounds);
            case "Column":
            case "ColumnText":
            case "ColumnDate":
            case "ColumnNumber":
            case "ColumnCheckbox":
            case "ColumnImage":
            case "ColumnLink":
            case "ColumnButton":
                return RenderColumn(node, bounds);
            case "Heading": return RenderHeading(node, bounds);
            case "Link": return RenderLink(node, bounds);
            case "Toast": return RenderToast(node, bounds);
            case "Skeleton": return RenderSkeleton(node, bounds);
            case "Stepper": return RenderStepper(node, bounds);
            default: return RenderGenericControl(node, bounds);
        }
    }

    /// <summary><c>text || fallback</c> for an optional text.</summary>
    private static string Or(string? text, string fallback) => string.IsNullOrEmpty(text) ? fallback : text!;

    private string RenderButton(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var isPrimary = node.Modifiers.Primary;
        var isDisabled = node.Modifiers.Disabled;

        var bgColor = isPrimary ? theme.Colors.Primary : theme.Colors.ButtonBackground;
        var textColor = isPrimary ? theme.Colors.PrimaryText : theme.Colors.Text;
        var opacity = isDisabled ? 0.5 : 1;

        var rect = CreateRect(x, y, width, height, theme.Borders.Radius, bgColor, theme.Colors.Border, theme.Borders.Width);

        return $"<g opacity=\"{N(opacity)}\">\n"
            + $"      {rect}\n"
            + $"      <text x=\"{N(x + (width / 2))}\" y=\"{N(y + (height / 2) + 5)}\" text-anchor=\"middle\" class=\"wire-text\" style=\"fill: {textColor}\">{E(Or(ControlHelpers.ControlText(node), "Button"))}</text>\n"
            + "    </g>";
    }

    private string RenderIconButton(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var isPrimary = node.Modifiers.Primary;

        var bgColor = isPrimary ? theme.Colors.Primary : theme.Colors.ButtonBackground;
        var iconColor = isPrimary ? theme.Colors.PrimaryText : theme.Colors.Text;

        var svg = $"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" rx=\"{N(theme.Borders.Radius)}\" fill=\"{bgColor}\" stroke=\"{theme.Colors.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />";

        const double iconSize = 16;
        var hasText = !string.IsNullOrEmpty(node.Text);
        var iconX = hasText ? x + 12 : x + ((width - iconSize) / 2);
        var iconY = y + ((height - iconSize) / 2);
        svg += RenderIconPlaceholder(iconX, iconY, iconSize, iconColor, node.Icon);

        if (hasText)
        {
            var textX = iconX + iconSize + 8;
            svg += $"<text x=\"{N(textX)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text\" style=\"fill: {iconColor}\">{E(node.Text!)}</text>";
        }

        return $"<g>{svg}</g>";
    }

    private string RenderInput(ControlNode node, BoundingBox outer)
    {
        var (label, bounds) = RenderInputLabel(node, outer);
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var placeholder = node.Placeholder ?? "";

        var typeIndicator = node.ControlType switch
        {
            "PasswordInput" => "••••",
            "DateInput" => "\U0001F4C5",
            "NumberInput" => "123",
            _ => "",
        };

        var rect = CreateRect(x, y, width, height, theme.Borders.Radius, theme.Colors.InputBackground, theme.Colors.Border, theme.Borders.Width);

        var required = node.Modifiers.Required
            ? $"<text x=\"{N(x + width - 12)}\" y=\"{N(y + (height / 2) + 5)}\" text-anchor=\"end\" fill=\"{theme.Colors.Error}\">*</text>"
            : "";

        return $"<g>{label}\n"
            + $"      {rect}\n"
            + $"      <text x=\"{N(x + 12)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text wire-text-secondary\">{E(typeIndicator.Length > 0 ? typeIndicator : placeholder)}</text>\n"
            + $"      {required}\n"
            + "    </g>";
    }

    private string RenderTextArea(ControlNode node, BoundingBox outer)
    {
        var (label, bounds) = RenderInputLabel(node, outer);
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var placeholder = node.Placeholder ?? "";
        var c = theme.Colors;

        return $"<g>{label}\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" rx=\"{N(theme.Borders.Radius)}\" fill=\"{c.InputBackground}\" stroke=\"{c.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />\n"
            + $"      <text x=\"{N(x + 12)}\" y=\"{N(y + 20)}\" class=\"wire-text wire-text-secondary\">{E(placeholder)}</text>\n"
            + $"      <line x1=\"{N(x + width - 20)}\" y1=\"{N(y + height - 8)}\" x2=\"{N(x + width - 8)}\" y2=\"{N(y + height - 8)}\" stroke=\"{c.Border}\" stroke-width=\"2\" />\n"
            + $"      <line x1=\"{N(x + width - 14)}\" y1=\"{N(y + height - 14)}\" x2=\"{N(x + width - 8)}\" y2=\"{N(y + height - 8)}\" stroke=\"{c.Border}\" stroke-width=\"2\" />\n"
            + "    </g>";
    }

    private string RenderLabel(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, height = bounds.Height;
        var text = ControlHelpers.ControlText(node) ?? "";

        var textClass = "wire-text";
        var fontStyle = "";
        var displayText = text;

        if (text.Length >= 4 && text.StartsWith("**", StringComparison.Ordinal) && text.EndsWith("**", StringComparison.Ordinal))
        {
            textClass += " wire-text-bold";
            displayText = text.Substring(2, text.Length - 4);
        }
        else if (text.Length >= 2 && text.StartsWith("*", StringComparison.Ordinal) && text.EndsWith("*", StringComparison.Ordinal))
        {
            fontStyle = " font-style=\"italic\"";
            displayText = text.Substring(1, text.Length - 2);
        }

        return $"<text x=\"{N(x)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"{textClass}\"{fontStyle}>{E(displayText)}</text>";
    }

    private string RenderCheckbox(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, height = bounds.Height;
        var size = theme.Components.CheckboxSize;

        var svg = $"<rect x=\"{N(x)}\" y=\"{N(y + ((height - size) / 2))}\" width=\"{N(size)}\" height=\"{N(size)}\" rx=\"2\" fill=\"{theme.Colors.InputBackground}\" stroke=\"{theme.Colors.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />";

        if (node.Modifiers.Checked)
        {
            var cx = x + (size / 2);
            var cy = y + (height / 2);
            svg += $"<path d=\"M{N(x + 4)} {N(cy)} L{N(cx - 1)} {N(cy + 4)} L{N(x + size - 4)} {N(cy - 4)}\" stroke=\"{theme.Colors.Primary}\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" />";
        }

        svg += $"<text x=\"{N(x + size + 8)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text\">{E(node.Text ?? "")}</text>";

        return $"<g>{svg}</g>";
    }

    private string RenderRadio(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, height = bounds.Height;
        var size = theme.Components.RadioSize;

        var cx = x + (size / 2);
        var cy = y + (height / 2);

        var svg = $"<circle cx=\"{N(cx)}\" cy=\"{N(cy)}\" r=\"{N(size / 2)}\" fill=\"{theme.Colors.InputBackground}\" stroke=\"{theme.Colors.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />";

        if (node.Modifiers.Selected)
        {
            svg += $"<circle cx=\"{N(cx)}\" cy=\"{N(cy)}\" r=\"{N(size / 4)}\" fill=\"{theme.Colors.Primary}\" />";
        }

        svg += $"<text x=\"{N(x + size + 8)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text\">{E(node.Text ?? "")}</text>";

        return $"<g>{svg}</g>";
    }

    private string RenderDropdown(ControlNode node, BoundingBox outer)
    {
        var (label, bounds) = RenderInputLabel(node, outer);
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;

        var displayText = Or(node.Placeholder, "Select...");
        if (node.Children is { Count: > 0 } && node.Children[0] is ControlNode first)
        {
            displayText = Or(first.Text, displayText);
        }

        var c = theme.Colors;
        return $"<g>{label}\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" rx=\"{N(theme.Borders.Radius)}\" fill=\"{c.InputBackground}\" stroke=\"{c.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />\n"
            + $"      <text x=\"{N(x + 12)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text\">{E(displayText)}</text>\n"
            + $"      <path d=\"M{N(x + width - 20)} {N(y + (height / 2) - 2)} L{N(x + width - 14)} {N(y + (height / 2) + 4)} L{N(x + width - 8)} {N(y + (height / 2) - 2)}\" stroke=\"{c.Text}\" stroke-width=\"2\" fill=\"none\" />\n"
            + "    </g>";
    }

    private string RenderSeparator(BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width;
        return $"<line x1=\"{N(x)}\" y1=\"{N(y)}\" x2=\"{N(x + width)}\" y2=\"{N(y)}\" stroke=\"{theme.Colors.Border}\" stroke-width=\"1\" />";
    }

    private string RenderIcon(ControlNode node, BoundingBox bounds) =>
        RenderIconPlaceholder(bounds.X, bounds.Y, Js.Min(bounds.Width, bounds.Height), theme.Colors.Text, node.Icon);

    private static string? IconPath(string name, double x, double y, double size)
    {
        switch (name)
        {
            case "close":
                return $"M{N(x + 3)} {N(y + 3)} L{N(x + size - 3)} {N(y + size - 3)} M{N(x + size - 3)} {N(y + 3)} L{N(x + 3)} {N(y + size - 3)}";
            case "check":
                return $"M{N(x + 3)} {N(y + (size / 2))} L{N(x + (size / 2) - 1)} {N(y + size - 4)} L{N(x + size - 3)} {N(y + 4)}";
            case "add":
                return $"M{N(x + (size / 2))} {N(y + 3)} V{N(y + size - 3)} M{N(x + 3)} {N(y + (size / 2))} H{N(x + size - 3)}";
            case "menu":
                return $"M{N(x + 3)} {N(y + 5)} H{N(x + size - 3)} M{N(x + 3)} {N(y + (size / 2))} H{N(x + size - 3)} M{N(x + 3)} {N(y + size - 5)} H{N(x + size - 3)}";
            case "search":
                return $"M{N(x + (size / 2) - 2)} {N(y + (size / 2) - 2)} m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0 M{N(x + (size / 2) + 1)} {N(y + (size / 2) + 1)} L{N(x + size - 4)} {N(y + size - 4)}";
            case "settings":
                return $"M{N(x + (size / 2))} {N(y + (size / 2))} m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0";
            case "user":
                return $"M{N(x + (size / 2))} {N(y + 4)} a3,3 0 1,0 0,6 a3,3 0 1,0 0,-6 M{N(x + 3)} {N(y + size - 3)} Q{N(x + (size / 2))} {N(y + (size / 2) + 2)} {N(x + size - 3)} {N(y + size - 3)}";
            case "home":
                return $"M{N(x + (size / 2))} {N(y + 3)} L{N(x + 3)} {N(y + (size / 2))} H{N(x + 5)} V{N(y + size - 3)} H{N(x + size - 5)} V{N(y + (size / 2))} H{N(x + size - 3)} Z";
            case "save":
                return $"M{N(x + 4)} {N(y + 3)} H{N(x + size - 6)} L{N(x + size - 3)} {N(y + 6)} V{N(y + size - 3)} H{N(x + 4)} Z M{N(x + 6)} {N(y + 3)} V{N(y + 7)} H{N(x + size - 8)} V{N(y + 3)}";
            case "edit":
                return $"M{N(x + 3)} {N(y + size - 5)} L{N(x + size - 5)} {N(y + 3)} L{N(x + size - 3)} {N(y + 5)} L{N(x + 5)} {N(y + size - 3)} Z";
            case "delete":
                return $"M{N(x + 5)} {N(y + 4)} H{N(x + size - 5)} M{N(x + 6)} {N(y + 4)} V{N(y + size - 3)} H{N(x + size - 6)} V{N(y + 4)} M{N(x + (size / 2))} {N(y + 3)} V{N(y + 4)}";
            case "cart":
                return $"M{N(x + 3)} {N(y + 4)} H{N(x + 5)} L{N(x + 7)} {N(y + size - 6)} H{N(x + size - 5)} L{N(x + size - 3)} {N(y + 4)} M{N(x + 8)} {N(y + size - 3)} a1,1 0 1,0 0,0.1 M{N(x + size - 7)} {N(y + size - 3)} a1,1 0 1,0 0,0.1";
            default:
                return null;
        }
    }

    private static string RenderIconPlaceholder(double x, double y, double size, string color, string? iconName)
    {
        // iconName && icons[iconName.toLowerCase()]: an empty name is no icon
        var path = string.IsNullOrEmpty(iconName) ? null : IconPath(LowerForIconLookup(iconName!), x, y, size);
        if (path is not null)
        {
            return $"<path d=\"{path}\" stroke=\"{color}\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" />";
        }

        return $"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(size)}\" height=\"{N(size)}\" rx=\"2\" fill=\"none\" stroke=\"{color}\" stroke-width=\"1\" stroke-dasharray=\"2,2\" />";
    }

    /// <summary>
    /// <c>iconName.toLowerCase()</c> compared with the icon names (ASCII letters): only A to Z and the Kelvin sign
    /// lower to an ASCII letter, so this is enough to find the same icon.
    /// </summary>
    private static string LowerForIconLookup(string name) => Js.ToLowerAscii(name);

    private string RenderImage(BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var c = theme.Colors;

        return "<g>\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" fill=\"{c.Surface}\" stroke=\"{c.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />\n"
            + $"      <line x1=\"{N(x)}\" y1=\"{N(y)}\" x2=\"{N(x + width)}\" y2=\"{N(y + height)}\" stroke=\"{c.Border}\" stroke-width=\"1\" />\n"
            + $"      <line x1=\"{N(x + width)}\" y1=\"{N(y)}\" x2=\"{N(x)}\" y2=\"{N(y + height)}\" stroke=\"{c.Border}\" stroke-width=\"1\" />\n"
            + $"      <text x=\"{N(x + (width / 2))}\" y=\"{N(y + (height / 2) + 5)}\" text-anchor=\"middle\" class=\"wire-text wire-text-secondary wire-text-small\">Image</text>\n"
            + "    </g>";
    }

    private string RenderAvatar(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y;

        var sizeAttr = JsValue.Attribute(node, "size").Or("md").ToString();
        double size = sizeAttr switch
        {
            "xs" => 24,
            "sm" => 32,
            "md" => 40,
            "lg" => 56,
            "xl" => 80,
            _ => 40,
        };
        var cx = x + (size / 2);
        var cy = y + (size / 2);

        // text.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase(): an empty word gives nothing
        var text = node.Text ?? "";
        var firsts = new StringBuilder();
        foreach (var word in text.Split(' '))
        {
            if (word.Length > 0)
            {
                firsts.Append(word[0]);
            }
        }

        var joined = firsts.ToString();
        var initials = Js.ToUpperCase(joined.Length > 2 ? joined.Substring(0, 2) : joined);

        var fontSize = Js.Max(10, size / 3);

        return "<g>\n"
            + $"      <circle cx=\"{N(cx)}\" cy=\"{N(cy)}\" r=\"{N(size / 2)}\" fill=\"{theme.Colors.Primary}\" />\n"
            + $"      <text x=\"{N(cx)}\" y=\"{N(cy + (fontSize / 3))}\" text-anchor=\"middle\" class=\"wire-text\" style=\"fill: {theme.Colors.PrimaryText}; font-size: {N(fontSize)}px\">{E(Or(initials, "?"))}</text>\n"
            + "    </g>";
    }

    private string RenderProgress(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var value = JsValue.Attribute(node, "value").Or(0).ToNumber();
        var progressWidth = width * Js.Min(100, Js.Max(0, value)) / 100;

        return "<g>\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" rx=\"{N(height / 2)}\" fill=\"{theme.Colors.Surface}\" />\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(progressWidth)}\" height=\"{N(height)}\" rx=\"{N(height / 2)}\" fill=\"{theme.Colors.Primary}\" />\n"
            + "    </g>";
    }

    private string RenderSlider(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var value = JsValue.Attribute(node, "value").Or(50).ToNumber();
        var position = x + (width * Js.Min(100, Js.Max(0, value)) / 100);
        var trackY = y + (height / 2);
        var c = theme.Colors;

        return "<g>\n"
            + $"      <line x1=\"{N(x)}\" y1=\"{N(trackY)}\" x2=\"{N(x + width)}\" y2=\"{N(trackY)}\" stroke=\"{c.Border}\" stroke-width=\"4\" stroke-linecap=\"round\" />\n"
            + $"      <line x1=\"{N(x)}\" y1=\"{N(trackY)}\" x2=\"{N(position)}\" y2=\"{N(trackY)}\" stroke=\"{c.Primary}\" stroke-width=\"4\" stroke-linecap=\"round\" />\n"
            + $"      <circle cx=\"{N(position)}\" cy=\"{N(trackY)}\" r=\"8\" fill=\"{c.Primary}\" stroke=\"{c.Background}\" stroke-width=\"2\" />\n"
            + "    </g>";
    }

    private string RenderSwitch(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y;
        var isChecked = node.Modifiers.Checked;
        const double trackWidth = 44;
        const double trackHeight = 24;
        const double knobSize = 20;

        var bgColor = isChecked ? theme.Colors.Primary : theme.Colors.Border;
        var knobX = isChecked ? x + trackWidth - knobSize - 2 : x + 2;

        var svg = $"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(trackWidth)}\" height=\"{N(trackHeight)}\" rx=\"{N(trackHeight / 2)}\" fill=\"{bgColor}\" />";
        svg += $"<circle cx=\"{N(knobX + (knobSize / 2))}\" cy=\"{N(y + (trackHeight / 2))}\" r=\"{N(knobSize / 2)}\" fill=\"{theme.Colors.Background}\" />";

        if (!string.IsNullOrEmpty(node.Text))
        {
            svg += $"<text x=\"{N(x + trackWidth + 8)}\" y=\"{N(y + (trackHeight / 2) + 5)}\" class=\"wire-text\">{E(node.Text!)}</text>";
        }

        return $"<g>{svg}</g>";
    }

    private string RenderChip(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var selected = node.Modifiers.Selected;

        var bgColor = selected ? theme.Colors.Primary : theme.Colors.Surface;
        var textColor = selected ? theme.Colors.PrimaryText : theme.Colors.Text;

        return "<g>\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" rx=\"{N(height / 2)}\" fill=\"{bgColor}\" stroke=\"{theme.Colors.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />\n"
            + $"      <text x=\"{N(x + (width / 2))}\" y=\"{N(y + (height / 2) + 4)}\" text-anchor=\"middle\" class=\"wire-text wire-text-small\" style=\"fill: {textColor}\">{E(node.Text ?? "")}</text>\n"
            + "    </g>";
    }

    private string RenderBadge(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var variant = JsValue.Attribute(node, "variant").Or("default").ToString();
        var c = theme.Colors;

        var (bg, text) = variant switch
        {
            "primary" => (c.Primary, c.PrimaryText),
            "secondary" => (c.Secondary, c.PrimaryText),
            "success" => (c.Success, "#ffffff"),
            "warning" => (c.Warning, "#000000"),
            "error" => (c.Error, "#ffffff"),
            "danger" => (c.Error, "#ffffff"),
            "info" => (c.Info, "#000000"),
            _ => (c.Secondary, c.PrimaryText),
        };

        return "<g>\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" rx=\"{N(height / 2)}\" fill=\"{bg}\" />\n"
            + $"      <text x=\"{N(x + (width / 2))}\" y=\"{N(y + (height / 2) + 4)}\" text-anchor=\"middle\" class=\"wire-text wire-text-small\" style=\"fill: {text}\">{E(node.Text ?? "")}</text>\n"
            + "    </g>";
    }

    private string RenderTabs(BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;

        return "<g>\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" fill=\"{theme.Colors.Surface}\" />\n"
            + $"      <line x1=\"{N(x)}\" y1=\"{N(y + height)}\" x2=\"{N(x + width)}\" y2=\"{N(y + height)}\" stroke=\"{theme.Colors.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />\n"
            + "    </g>";
    }

    private string RenderTab(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var isActive = node.Modifiers.Selected || node.Modifiers.Active;

        var bgColor = isActive ? theme.Colors.Background : "transparent";
        var textColor = isActive ? theme.Colors.Primary : theme.Colors.TextSecondary;
        var borderBottom = isActive
            ? $"<rect x=\"{N(x)}\" y=\"{N(y + height - 2)}\" width=\"{N(width)}\" height=\"2\" fill=\"{theme.Colors.Primary}\" />"
            : "";

        return "<g>\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" fill=\"{bgColor}\" />\n"
            + $"      <text x=\"{N(x + (width / 2))}\" y=\"{N(y + (height / 2) + 5)}\" text-anchor=\"middle\" class=\"wire-text\" style=\"fill: {textColor}\">{E(Or(node.Text, "Tab"))}</text>\n"
            + $"      {borderBottom}\n"
            + "    </g>";
    }

    private string RenderMenu(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var title = !string.IsNullOrEmpty(node.Text)
            ? $"<text x=\"{N(x + 12)}\" y=\"{N(y + 20)}\" class=\"wire-text wire-text-bold wire-text-small\">{E(node.Text!)}</text>"
            : "";

        return "<g>\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" rx=\"{N(theme.Borders.Radius)}\" fill=\"{theme.Colors.Background}\" stroke=\"{theme.Colors.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" filter=\"url(#shadow)\" />\n"
            + $"      {title}\n"
            + "    </g>";
    }

    private string RenderMenuItem(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var isDisabled = node.Modifiers.Disabled;
        var textColor = isDisabled ? theme.Colors.TextDisabled : theme.Colors.Text;

        var svg = $"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" fill=\"transparent\" />";

        var textX = x + 12;
        if (!string.IsNullOrEmpty(node.Icon))
        {
            svg += RenderIconPlaceholder(x + 12, y + ((height - 16) / 2), 16, textColor, node.Icon);
            textX = x + 36;
        }

        svg += $"<text x=\"{N(textX)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text\" style=\"fill: {textColor}\">{E(Or(node.Text, "Menu Item"))}</text>";

        return $"<g opacity=\"{(isDisabled ? "0.5" : "1")}\">{svg}</g>";
    }

    private string RenderBreadcrumb(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, height = bounds.Height;

        var items = !string.IsNullOrEmpty(node.Text)
            ? node.Text!.Split(',').Select(JsText.Trim).ToArray()
            : new[] { "Home", "Section", "Page" };
        var currentX = x;
        var svg = new StringBuilder();

        for (var index = 0; index < items.Length; index++)
        {
            var item = items[index];
            var isLast = index == items.Length - 1;
            var textColor = isLast ? theme.Colors.Text : theme.Colors.Primary;

            svg.Append($"<text x=\"{N(currentX)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text\" style=\"fill: {textColor}\">{E(item)}</text>");
            currentX += (item.Length * 8) + 8;

            if (!isLast)
            {
                svg.Append($"<text x=\"{N(currentX)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text\" style=\"fill: {theme.Colors.TextSecondary}\">/</text>");
                currentX += 16;
            }
        }

        return $"<g>{svg}</g>";
    }

    private string RenderPagination(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, height = bounds.Height;
        var currentPage = ControlHelpers.NumberAttribute(node, "page", 1);
        var totalPages = ControlHelpers.NumberAttribute(node, "total", 5);
        var c = theme.Colors;

        var svg = new StringBuilder();
        var currentX = x;
        const double buttonWidth = 32;
        var buttonHeight = height;

        svg.Append($"<rect x=\"{N(currentX)}\" y=\"{N(y)}\" width=\"{N(buttonWidth)}\" height=\"{N(buttonHeight)}\" rx=\"{N(theme.Borders.Radius)}\" fill=\"{c.ButtonBackground}\" stroke=\"{c.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />");
        svg.Append($"<path d=\"M{N(currentX + 13)} {N(y + (buttonHeight / 2) - 4)} L{N(currentX + 9)} {N(y + (buttonHeight / 2))} L{N(currentX + 13)} {N(y + (buttonHeight / 2) + 4)}\" stroke=\"{c.Text}\" stroke-width=\"2\" fill=\"none\" />");
        currentX += buttonWidth + 4;

        var startPage = Js.Max(1, currentPage - 2);
        var endPage = Js.Min(totalPages, startPage + 4);

        for (var i = startPage; i <= endPage; i++)
        {
            var isActive = i == currentPage;
            var bgColor = isActive ? c.Primary : c.ButtonBackground;
            var textColor = isActive ? c.PrimaryText : c.Text;

            svg.Append($"<rect x=\"{N(currentX)}\" y=\"{N(y)}\" width=\"{N(buttonWidth)}\" height=\"{N(buttonHeight)}\" rx=\"{N(theme.Borders.Radius)}\" fill=\"{bgColor}\" stroke=\"{c.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />");
            svg.Append($"<text x=\"{N(currentX + (buttonWidth / 2))}\" y=\"{N(y + (buttonHeight / 2) + 5)}\" text-anchor=\"middle\" class=\"wire-text\" style=\"fill: {textColor}\">{N(i)}</text>");
            currentX += buttonWidth + 4;
        }

        svg.Append($"<rect x=\"{N(currentX)}\" y=\"{N(y)}\" width=\"{N(buttonWidth)}\" height=\"{N(buttonHeight)}\" rx=\"{N(theme.Borders.Radius)}\" fill=\"{c.ButtonBackground}\" stroke=\"{c.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />");
        svg.Append($"<path d=\"M{N(currentX + 11)} {N(y + (buttonHeight / 2) - 4)} L{N(currentX + 15)} {N(y + (buttonHeight / 2))} L{N(currentX + 11)} {N(y + (buttonHeight / 2) + 4)}\" stroke=\"{c.Text}\" stroke-width=\"2\" fill=\"none\" />");

        return $"<g>{svg}</g>";
    }

    private string RenderTable(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var rows = JsValue.Attribute(node, "rows").Or(4).ToNumber();
        var cols = JsValue.Attribute(node, "cols").Or(3).ToNumber();
        const double headerHeight = 36;
        var rowHeight = (height - headerHeight) / (rows - 1);
        var colWidth = width / cols;
        var c = theme.Colors;

        var svg = new StringBuilder();
        svg.Append($"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" fill=\"{c.Background}\" stroke=\"{c.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />");
        svg.Append($"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(headerHeight)}\" fill=\"{c.Surface}\" />");
        svg.Append($"<line x1=\"{N(x)}\" y1=\"{N(y + headerHeight)}\" x2=\"{N(x + width)}\" y2=\"{N(y + headerHeight)}\" stroke=\"{c.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />");

        for (double col = 0; col < cols; col++)
        {
            var cellX = x + (col * colWidth);
            if (col > 0)
            {
                svg.Append($"<line x1=\"{N(cellX)}\" y1=\"{N(y)}\" x2=\"{N(cellX)}\" y2=\"{N(y + height)}\" stroke=\"{c.Border}\" stroke-width=\"1\" />");
            }

            svg.Append($"<text x=\"{N(cellX + 12)}\" y=\"{N(y + (headerHeight / 2) + 5)}\" class=\"wire-text wire-text-bold wire-text-small\">Column {N(col + 1)}</text>");
        }

        for (double r = 1; r < rows; r++)
        {
            var rowY = y + headerHeight + ((r - 1) * rowHeight);
            if (r > 1)
            {
                svg.Append($"<line x1=\"{N(x)}\" y1=\"{N(rowY)}\" x2=\"{N(x + width)}\" y2=\"{N(rowY)}\" stroke=\"{c.Border}\" stroke-width=\"1\" />");
            }

            for (double col = 0; col < cols; col++)
            {
                var cellX = x + (col * colWidth);
                svg.Append($"<text x=\"{N(cellX + 12)}\" y=\"{N(rowY + (rowHeight / 2) + 5)}\" class=\"wire-text wire-text-small wire-text-secondary\">Data</text>");
            }
        }

        return $"<g>{svg}</g>";
    }

    private string RenderTree(BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;

        return "<g>\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" fill=\"{theme.Colors.Background}\" stroke=\"{theme.Colors.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />\n"
            + "    </g>";
    }

    private string RenderTreeItem(ControlNode node, BoundingBox bounds) => RenderTreeRow(
        node.Text,
        JsValue.Attribute(node, "level").Or(0).ToNumber(),
        node.Modifiers.Expanded,
        node.Children is { Count: > 0 },
        bounds);

    private string RenderTreeRow(string? text, double level, bool expanded, bool hasChildren, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var indent = level * 20;

        var svg = $"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" fill=\"transparent\" />";

        var iconX = x + indent + 4;
        var iconY = y + (height / 2);
        if (hasChildren)
        {
            svg += expanded
                ? $"<path d=\"M{N(iconX)} {N(iconY - 4)} L{N(iconX + 8)} {N(iconY - 4)} L{N(iconX + 4)} {N(iconY + 4)} Z\" fill=\"{theme.Colors.TextSecondary}\" />"
                : $"<path d=\"M{N(iconX)} {N(iconY - 4)} L{N(iconX + 8)} {N(iconY)} L{N(iconX)} {N(iconY + 4)} Z\" fill=\"{theme.Colors.TextSecondary}\" />";
        }

        var textX = hasChildren ? x + indent + 24 : x + indent + 8;
        svg += $"<text x=\"{N(textX)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text\">{E(Or(text, "Tree Item"))}</text>";

        return $"<g>{svg}</g>";
    }

    private string RenderAccordion(BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;

        return "<g>\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" fill=\"{theme.Colors.Background}\" stroke=\"{theme.Colors.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />\n"
            + "    </g>";
    }

    private string RenderAccordionSection(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var expanded = node.Modifiers.Expanded;
        const double headerHeight = 40;
        var c = theme.Colors;

        var svg = $"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(expanded ? height : headerHeight)}\" fill=\"{c.Background}\" stroke=\"{c.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />";
        svg += $"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(headerHeight)}\" fill=\"{c.Surface}\" />";
        svg += $"<text x=\"{N(x + 16)}\" y=\"{N(y + (headerHeight / 2) + 5)}\" class=\"wire-text wire-text-bold\">{E(Or(node.Text, "Section"))}</text>";

        var iconX = x + width - 24;
        var iconY = y + (headerHeight / 2);
        svg += expanded
            ? $"<path d=\"M{N(iconX - 4)} {N(iconY - 2)} L{N(iconX)} {N(iconY + 4)} L{N(iconX + 4)} {N(iconY - 2)}\" stroke=\"{c.Text}\" stroke-width=\"2\" fill=\"none\" />"
            : $"<path d=\"M{N(iconX - 4)} {N(iconY + 2)} L{N(iconX)} {N(iconY - 4)} L{N(iconX + 4)} {N(iconY + 2)}\" stroke=\"{c.Text}\" stroke-width=\"2\" fill=\"none\" />";

        return $"<g>{svg}</g>";
    }

    private string RenderDataGrid(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var rows = JsValue.Attribute(node, "rows").Or(5).ToNumber();
        const double headerHeight = 40;
        var showSelection = node.Modifiers.Selected;
        var c = theme.Colors;

        var columnChildren = (node.Children ?? Array.Empty<ElementNode>())
            .Select(col => col is ComponentNode component ? Part(component) : col as ControlNode)
            .Where(col => col is not null && col.ControlType.StartsWith("Column", StringComparison.Ordinal))
            .Select(col => col!)
            .ToList();
        var cols = columnChildren.Count > 0 ? columnChildren.Count : JsValue.Attribute(node, "cols").Or(4).ToNumber();

        double selectionColWidth = showSelection ? 40 : 0;
        var availableWidth = width - selectionColWidth;
        var colWidth = availableWidth / cols;
        var rowHeight = Js.Min(36, (height - headerHeight) / (rows - 1));

        var svg = new StringBuilder();
        svg.Append($"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" fill=\"{c.Background}\" stroke=\"{c.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />");
        svg.Append($"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(headerHeight)}\" fill=\"{c.Surface}\" />");

        if (showSelection)
        {
            var checkX = x + ((selectionColWidth - 14) / 2);
            var checkY = y + ((headerHeight - 14) / 2);
            svg.Append($"<rect x=\"{N(checkX)}\" y=\"{N(checkY)}\" width=\"14\" height=\"14\" rx=\"2\" fill=\"{c.InputBackground}\" stroke=\"{c.Border}\" stroke-width=\"1\" />");
            svg.Append($"<line x1=\"{N(x + selectionColWidth)}\" y1=\"{N(y)}\" x2=\"{N(x + selectionColWidth)}\" y2=\"{N(y + height)}\" stroke=\"{c.Border}\" stroke-width=\"1\" />");
        }

        for (double col = 0; col < cols; col++)
        {
            var cellX = x + selectionColWidth + (col * colWidth);
            if (col > 0)
            {
                svg.Append($"<line x1=\"{N(cellX)}\" y1=\"{N(y)}\" x2=\"{N(cellX)}\" y2=\"{N(y + height)}\" stroke=\"{c.Border}\" stroke-width=\"1\" />");
            }

            var colDef = col < columnChildren.Count ? columnChildren[(int)col] : null;
            var colName = Or(colDef?.Text, $"Column {N(col + 1)}");
            var colType = Or(colDef?.ControlType, "ColumnText");

            svg.Append($"<text x=\"{N(cellX + 12)}\" y=\"{N(y + (headerHeight / 2) + 5)}\" class=\"wire-text wire-text-bold wire-text-small\">{E(colName)}</text>");
            svg.Append($"<path d=\"M{N(cellX + colWidth - 20)} {N(y + (headerHeight / 2) - 2)} L{N(cellX + colWidth - 16)} {N(y + (headerHeight / 2) - 6)} L{N(cellX + colWidth - 12)} {N(y + (headerHeight / 2) - 2)}\" stroke=\"{c.TextSecondary}\" stroke-width=\"1\" fill=\"none\" />");
            svg.Append(RenderColumnTypeIcon(colType, cellX + colWidth - 36, y + (headerHeight / 2)));
        }

        for (double r = 1; r < rows; r++)
        {
            var rowY = y + headerHeight + ((r - 1) * rowHeight);
            if (r % 2 == 0)
            {
                svg.Append($"<rect x=\"{N(x)}\" y=\"{N(rowY)}\" width=\"{N(width)}\" height=\"{N(rowHeight)}\" fill=\"{c.Surface}40\" />");
            }

            svg.Append($"<line x1=\"{N(x)}\" y1=\"{N(rowY)}\" x2=\"{N(x + width)}\" y2=\"{N(rowY)}\" stroke=\"{c.Border}\" stroke-width=\"1\" />");

            if (showSelection)
            {
                var checkX = x + ((selectionColWidth - 14) / 2);
                var checkY = rowY + ((rowHeight - 14) / 2);
                svg.Append($"<rect x=\"{N(checkX)}\" y=\"{N(checkY)}\" width=\"14\" height=\"14\" rx=\"2\" fill=\"{c.InputBackground}\" stroke=\"{c.Border}\" stroke-width=\"1\" />");
            }

            for (double col = 0; col < cols; col++)
            {
                var cellX = x + selectionColWidth + (col * colWidth);
                var colDef = col < columnChildren.Count ? columnChildren[(int)col] : null;
                var colType = Or(colDef?.ControlType, "ColumnText");
                svg.Append(RenderSampleData(colType, cellX, rowY, colWidth, rowHeight, r));
            }
        }

        return $"<g>{svg}</g>";
    }

    private string RenderColumnTypeIcon(string colType, double x, double y)
    {
        var secondary = theme.Colors.TextSecondary;
        return colType switch
        {
            "ColumnDate" => $"<text x=\"{N(x)}\" y=\"{N(y + 4)}\" class=\"wire-text wire-text-small wire-text-secondary\">\U0001F4C5</text>",
            "ColumnNumber" => $"<text x=\"{N(x)}\" y=\"{N(y + 4)}\" class=\"wire-text wire-text-small wire-text-secondary\" font-family=\"monospace\">#</text>",
            "ColumnCheckbox" => $"<rect x=\"{N(x)}\" y=\"{N(y - 5)}\" width=\"10\" height=\"10\" rx=\"2\" fill=\"none\" stroke=\"{secondary}\" stroke-width=\"1\" />",
            "ColumnImage" => $"<rect x=\"{N(x)}\" y=\"{N(y - 5)}\" width=\"10\" height=\"10\" rx=\"1\" fill=\"none\" stroke=\"{secondary}\" stroke-width=\"1\" /><line x1=\"{N(x + 2)}\" y1=\"{N(y + 3)}\" x2=\"{N(x + 8)}\" y2=\"{N(y - 3)}\" stroke=\"{secondary}\" stroke-width=\"1\" />",
            "ColumnLink" => $"<text x=\"{N(x)}\" y=\"{N(y + 4)}\" class=\"wire-text wire-text-small\" style=\"fill: {theme.Colors.Primary}\">\U0001F517</text>",
            "ColumnButton" => $"<rect x=\"{N(x)}\" y=\"{N(y - 4)}\" width=\"12\" height=\"8\" rx=\"2\" fill=\"none\" stroke=\"{secondary}\" stroke-width=\"1\" />",
            _ => "",
        };
    }

    private string RenderSampleData(string colType, double x, double y, double width, double height, double rowIndex)
    {
        var textY = y + (height / 2) + 4;
        var textX = x + 12;
        var c = theme.Colors;

        switch (colType)
        {
            case "ColumnDate":
            {
                var month = ((rowIndex * 3) % 12) + 1;
                var day = ((rowIndex * 7) % 28) + 1;
                return $"<text x=\"{N(textX)}\" y=\"{N(textY)}\" class=\"wire-text wire-text-small wire-text-secondary\">{N(month).PadLeft(2, '0')}/{N(day).PadLeft(2, '0')}/2024</text>";
            }

            case "ColumnNumber":
            {
                var num = N((rowIndex * 123) + 42);
                return $"<text x=\"{N(textX)}\" y=\"{N(textY)}\" class=\"wire-text wire-text-small wire-text-secondary\" font-family=\"monospace\">{num}</text>";
            }

            case "ColumnCheckbox":
            {
                var isChecked = rowIndex % 3 == 0;
                var checkX = x + ((width - 14) / 2);
                var checkY = y + ((height - 14) / 2);
                var svg = $"<rect x=\"{N(checkX)}\" y=\"{N(checkY)}\" width=\"14\" height=\"14\" rx=\"2\" fill=\"{c.InputBackground}\" stroke=\"{c.Border}\" stroke-width=\"1\" />";
                if (isChecked)
                {
                    svg += $"<path d=\"M{N(checkX + 3)} {N(checkY + 7)} L{N(checkX + 6)} {N(checkY + 10)} L{N(checkX + 11)} {N(checkY + 4)}\" stroke=\"{c.Primary}\" stroke-width=\"2\" fill=\"none\" />";
                }

                return svg;
            }

            case "ColumnImage":
            {
                var imgSize = Js.Min(height - 8, 28);
                var imgX = x + 8;
                var imgY = y + ((height - imgSize) / 2);
                return $"<rect x=\"{N(imgX)}\" y=\"{N(imgY)}\" width=\"{N(imgSize)}\" height=\"{N(imgSize)}\" rx=\"4\" fill=\"{c.Surface}\" stroke=\"{c.Border}\" stroke-width=\"1\" />";
            }

            case "ColumnLink":
                return $"<text x=\"{N(textX)}\" y=\"{N(textY)}\" class=\"wire-text wire-text-small\" style=\"fill: {c.Primary}; text-decoration: underline\">Link {N(rowIndex)}</text>";

            case "ColumnButton":
            {
                var btnWidth = width - 24;
                var btnHeight = height - 12;
                var btnX = x + 12;
                var btnY = y + 6;
                return $"<rect x=\"{N(btnX)}\" y=\"{N(btnY)}\" width=\"{N(btnWidth)}\" height=\"{N(btnHeight)}\" rx=\"4\" fill=\"{c.ButtonBackground}\" stroke=\"{c.Border}\" stroke-width=\"1\" /><text x=\"{N(btnX + (btnWidth / 2))}\" y=\"{N(btnY + (btnHeight / 2) + 4)}\" text-anchor=\"middle\" class=\"wire-text wire-text-small\">Action</text>";
            }

            default:
                return $"<text x=\"{N(textX)}\" y=\"{N(textY)}\" class=\"wire-text wire-text-small wire-text-secondary\">Data {N(rowIndex)}</text>";
        }
    }

    private string RenderRow(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var bgColor = node.Modifiers.Selected ? theme.Colors.Surface : "transparent";

        var svg = $"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" fill=\"{bgColor}\" />";
        svg += $"<line x1=\"{N(x)}\" y1=\"{N(y + height)}\" x2=\"{N(x + width)}\" y2=\"{N(y + height)}\" stroke=\"{theme.Colors.Border}\" stroke-width=\"1\" />";

        return $"<g>{svg}</g>";
    }

    private string RenderCell(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var align = JsValue.Attribute(node, "align").Or("left");

        var textAnchor = "start";
        var textX = x + 8;
        if (align.IsString && align.StringValue == "center")
        {
            textAnchor = "middle";
            textX = x + (width / 2);
        }
        else if (align.IsString && align.StringValue == "right")
        {
            textAnchor = "end";
            textX = x + width - 8;
        }

        var svg = $"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" fill=\"transparent\" />";
        svg += $"<line x1=\"{N(x + width)}\" y1=\"{N(y)}\" x2=\"{N(x + width)}\" y2=\"{N(y + height)}\" stroke=\"{theme.Colors.Border}\" stroke-width=\"1\" />";
        svg += $"<text x=\"{N(textX)}\" y=\"{N(y + (height / 2) + 5)}\" text-anchor=\"{textAnchor}\" class=\"wire-text wire-text-small\">{E(node.Text ?? "")}</text>";

        return $"<g>{svg}</g>";
    }

    private string RenderColumn(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var sortable = node.Modifiers.Selected;
        var secondary = theme.Colors.TextSecondary;

        var iconY = y + (height / 2);
        var iconX = x + width - 20;

        var typeIcon = node.ControlType switch
        {
            "ColumnDate" => $"<text x=\"{N(iconX)}\" y=\"{N(iconY + 4)}\" class=\"wire-text wire-text-small wire-text-secondary\">\U0001F4C5</text>",
            "ColumnNumber" => $"<text x=\"{N(iconX)}\" y=\"{N(iconY + 4)}\" class=\"wire-text wire-text-small wire-text-secondary\">#</text>",
            "ColumnCheckbox" => $"<rect x=\"{N(iconX)}\" y=\"{N(iconY - 6)}\" width=\"12\" height=\"12\" rx=\"2\" fill=\"none\" stroke=\"{secondary}\" stroke-width=\"1\" />",
            "ColumnImage" => $"<rect x=\"{N(iconX)}\" y=\"{N(iconY - 6)}\" width=\"12\" height=\"12\" rx=\"1\" fill=\"none\" stroke=\"{secondary}\" stroke-width=\"1\" />",
            "ColumnLink" => $"<text x=\"{N(iconX)}\" y=\"{N(iconY + 4)}\" class=\"wire-text wire-text-small\" style=\"fill: {theme.Colors.Primary}\">\U0001F517</text>",
            "ColumnButton" => $"<rect x=\"{N(iconX - 2)}\" y=\"{N(iconY - 5)}\" width=\"16\" height=\"10\" rx=\"2\" fill=\"none\" stroke=\"{secondary}\" stroke-width=\"1\" />",
            _ => "",
        };

        var svg = $"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" fill=\"{theme.Colors.Surface}\" />";
        svg += $"<line x1=\"{N(x + width)}\" y1=\"{N(y)}\" x2=\"{N(x + width)}\" y2=\"{N(y + height)}\" stroke=\"{theme.Colors.Border}\" stroke-width=\"1\" />";
        svg += $"<text x=\"{N(x + 8)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text wire-text-bold wire-text-small\">{E(Or(node.Text, "Column"))}</text>";

        if (sortable)
        {
            svg += $"<path d=\"M{N(x + width - 32)} {N(y + (height / 2) - 2)} L{N(x + width - 28)} {N(y + (height / 2) - 6)} L{N(x + width - 24)} {N(y + (height / 2) - 2)}\" stroke=\"{secondary}\" stroke-width=\"1\" fill=\"none\" />";
        }

        svg += typeIcon;

        return $"<g>{svg}</g>";
    }

    private string RenderHeading(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, height = bounds.Height;
        // fontSizes[level]: a property lookup, by the level's text
        var level = JsValue.Attribute(node, "level").Or(1).ToString();
        double fontSize = level switch
        {
            "1" => 24,
            "2" => 20,
            "3" => 18,
            "4" => 16,
            "5" => 14,
            "6" => 12,
            _ => 18,
        };

        return $"<text x=\"{N(x)}\" y=\"{N(y + (height / 2) + (fontSize / 3))}\" class=\"wire-text wire-text-bold\" style=\"font-size: {N(fontSize)}px\">{E(Or(ControlHelpers.ControlText(node), "Heading"))}</text>";
    }

    private string RenderLink(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, height = bounds.Height;

        return "<g>\n"
            + $"      <text x=\"{N(x)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text\" style=\"fill: {theme.Colors.Primary}; text-decoration: underline\">{E(Or(ControlHelpers.ControlText(node), "Link"))}</text>\n"
            + "    </g>";
    }

    private string RenderToast(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var variant = JsValue.Attribute(node, "variant").Or("info").ToString();
        var c = theme.Colors;

        var accentColor = variant switch
        {
            "success" => c.Success,
            "warning" => c.Warning,
            "error" => c.Error,
            _ => c.Info,
        };

        return "<g>\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" rx=\"{N(theme.Borders.Radius)}\" fill=\"{c.Background}\" stroke=\"{c.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" filter=\"url(#shadow)\" />\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"4\" height=\"{N(height)}\" rx=\"{N(theme.Borders.Radius)} 0 0 {N(theme.Borders.Radius)}\" fill=\"{accentColor}\" />\n"
            + $"      <text x=\"{N(x + 16)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text\">{E(Or(node.Text, "Notification"))}</text>\n"
            + $"      {RenderIconPlaceholder(x + width - 28, y + ((height - 16) / 2), 16, c.TextSecondary, "close")}\n"
            + "    </g>";
    }

    private string RenderSkeleton(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var variant = JsValue.Attribute(node, "variant").Or("text");

        if (variant.IsString && variant.StringValue == "circular")
        {
            var size = Js.Min(width, height);
            return $"<circle cx=\"{N(x + (size / 2))}\" cy=\"{N(y + (size / 2))}\" r=\"{N(size / 2)}\" fill=\"{theme.Colors.Surface}\">\n"
                + "        <animate attributeName=\"opacity\" values=\"0.6;1;0.6\" dur=\"1.5s\" repeatCount=\"indefinite\" />\n"
                + "      </circle>";
        }

        var radius = variant.IsString && variant.StringValue == "rectangular" ? 0 : theme.Borders.Radius;
        return $"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" rx=\"{N(radius)}\" fill=\"{theme.Colors.Surface}\">\n"
            + "      <animate attributeName=\"opacity\" values=\"0.6;1;0.6\" dur=\"1.5s\" repeatCount=\"indefinite\" />\n"
            + "    </rect>";
    }

    private string RenderStepper(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var steps = ControlHelpers.NumberAttribute(node, "steps", 4);
        var currentNumber = ControlHelpers.NumberAttribute(node, "current", 1);
        var stepWidth = width / steps;
        const double circleRadius = 14;
        var c = theme.Colors;

        var svg = new StringBuilder();

        for (double i = 1; i <= steps; i++)
        {
            var stepX = x + ((i - 0.5) * stepWidth);
            var stepY = y + (height / 2);
            var isCompleted = i < currentNumber;
            var isCurrent = i == currentNumber;

            if (i > 1)
            {
                var prevX = x + ((i - 1.5) * stepWidth);
                var lineColor = isCompleted ? c.Primary : c.Border;
                svg.Append($"<line x1=\"{N(prevX + circleRadius)}\" y1=\"{N(stepY)}\" x2=\"{N(stepX - circleRadius)}\" y2=\"{N(stepY)}\" stroke=\"{lineColor}\" stroke-width=\"2\" />");
            }

            var bgColor = isCompleted ? c.Primary : isCurrent ? c.Background : c.Surface;
            var borderColor = isCompleted || isCurrent ? c.Primary : c.Border;
            var textColor = isCompleted ? c.PrimaryText : isCurrent ? c.Primary : c.TextSecondary;

            svg.Append($"<circle cx=\"{N(stepX)}\" cy=\"{N(stepY)}\" r=\"{N(circleRadius)}\" fill=\"{bgColor}\" stroke=\"{borderColor}\" stroke-width=\"2\" />");

            if (isCompleted)
            {
                svg.Append($"<path d=\"M{N(stepX - 5)} {N(stepY)} L{N(stepX - 1)} {N(stepY + 4)} L{N(stepX + 5)} {N(stepY - 4)}\" stroke=\"{textColor}\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" />");
            }
            else
            {
                svg.Append($"<text x=\"{N(stepX)}\" y=\"{N(stepY + 5)}\" text-anchor=\"middle\" class=\"wire-text wire-text-small\" style=\"fill: {textColor}\">{N(i)}</text>");
            }
        }

        return $"<g>{svg}</g>";
    }

    private string RenderGenericControl(ControlNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;

        return "<g>\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" fill=\"{theme.Colors.Surface}\" stroke=\"{theme.Colors.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" stroke-dasharray=\"4,2\" />\n"
            + $"      <text x=\"{N(x + (width / 2))}\" y=\"{N(y + (height / 2) + 5)}\" text-anchor=\"middle\" class=\"wire-text wire-text-secondary wire-text-small\">{E(node.ControlType)}</text>\n"
            + "    </g>";
    }

    private string RenderSection(SectionNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var strokeColor = theme.Colors.Border;

        if (node.SectionType == "Card")
        {
            var cardRect = CreateRect(x, y, width, height, theme.Borders.RadiusLarge, theme.Colors.Background, strokeColor, theme.Borders.Width);
            // String.prototype.replace with a string: the first " />" only
            var at = cardRect.IndexOf(" />", StringComparison.Ordinal);
            var withShadow = at < 0 ? cardRect : cardRect.Substring(0, at) + " filter=\"url(#shadow)\" />" + cardRect.Substring(at + 3);
            return withShadow + RenderSectionTitle(node, bounds);
        }

        return CreateRect(x, y, width, height, 0, theme.Colors.Surface, strokeColor, theme.Borders.Width) + RenderSectionTitle(node, bounds);
    }

    /// <summary>The <c>title="…"</c> of a section, as its first line.</summary>
    private string RenderSectionTitle(SectionNode node, BoundingBox bounds)
    {
        var title = ControlHelpers.ComponentTitle(node);
        return title is null
            ? ""
            : $"<text x=\"{N(bounds.X + 16)}\" y=\"{N(bounds.Y + 24)}\" class=\"wire-text wire-text-bold\">{E(title)}</text>";
    }

    /// <summary>A rectangle: drawn by hand in the sketch theme.</summary>
    private string CreateRect(double x, double y, double width, double height, double rx, string fill, string stroke, double strokeWidth)
    {
        if (theme.Name == "sketch")
        {
            var path = rx > 0
                ? Sketch.RoundedRect(x, y, width, height, rx, 1)
                : Sketch.Rect(x, y, width, height, 1);
            return $"<path d=\"{path}\" fill=\"{fill}\" stroke=\"{stroke}\" stroke-width=\"{N(strokeWidth)}\" />";
        }

        return rx > 0
            ? $"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" rx=\"{N(rx)}\" fill=\"{fill}\" stroke=\"{stroke}\" stroke-width=\"{N(strokeWidth)}\" />"
            : $"<rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"{N(width)}\" height=\"{N(height)}\" fill=\"{fill}\" stroke=\"{stroke}\" stroke-width=\"{N(strokeWidth)}\" />";
    }
}
