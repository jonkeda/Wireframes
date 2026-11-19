using System.Runtime.CompilerServices;
using Wireframe.Syntax;

namespace Wireframe.Rendering;

/// <summary>A box: where an element is and how large.</summary>
internal sealed class BoundingBox
{
    public double X;
    public double Y;
    public double Width;
    public double Height;

    public BoundingBox(double x, double y, double width, double height)
    {
        X = x;
        Y = y;
        Width = width;
        Height = height;
    }

    public BoundingBox With(double x, double y) => new(x, y, Width, Height);
}

/// <summary>An element laid out: its box, its children laid out, and the node.</summary>
internal sealed class LayoutInfo
{
    public LayoutInfo(BoundingBox bounds, List<LayoutInfo> children, SyntaxNode node)
    {
        Bounds = bounds;
        Children = children;
        Node = node;
    }

    public BoundingBox Bounds { get; }
    public List<LayoutInfo> Children { get; }
    public SyntaxNode Node { get; }

    /// <summary>How deep a tree item lies under its tree; 0 for the top ones.</summary>
    public double? Level { get; init; }
}

/// <summary>The helpers the layout engine and the renderer share (<c>control-helpers.ts</c>).</summary>
internal static class ControlHelpers
{
    /// <summary>Height reserved above an input for its <c>label="..."</c> line.</summary>
    public const double InputLabelHeight = 20;

    /// <summary>Whether a control draws a label line above its box.</summary>
    public static bool HasInputLabel(ControlNode node) =>
        node.ControlType is "TextInput" or "NumberInput" or "DateInput" or "PasswordInput" or "TextArea" or "Dropdown"
        && !string.IsNullOrEmpty(node.Label);

    /// <summary>The text a control shows: its quoted string, or the placeholder.</summary>
    public static string? ControlText(ControlNode node) => node.Text ?? node.Placeholder;

    // ============ Components ============

    /// <summary>The room a title takes at the top of a dialog, an alert or a section.</summary>
    public const double ComponentTitleHeight = 28;

    /// <summary>The height of a row of a table, written out or drawn as a placeholder.</summary>
    public const double TableRowHeight = 36;

    /// <summary>The room a menu's title takes.</summary>
    public const double MenuTitleHeight = 28;

    /// <summary>The room above and below a menu's items.</summary>
    public const double MenuPadding = 4;

    /// <summary>The room of the "/" between two items of a breadcrumb.</summary>
    public const double BreadcrumbSeparatorWidth = 16;

    /// <summary>The room of the names under the circles of a stepper.</summary>
    public const double StepLabelHeight = 20;

    /// <summary>The room above and below the items of a tree.</summary>
    public const double TreePadding = 4;

    public const double ListItemHeight = 24;

    /// <summary>The header of an accordion section or an expander.</summary>
    public const double FoldHeaderHeight = 40;

    public const double HoverTipHeight = 28;
    public const double HoverTipGap = 4;
    public const double TabBarHeight = 40;
    public const double TreeItemHeight = 32;
    public const double StepperCircleY = 30;

    /// <summary>The title of a dialog or a section: its quoted string, else its <c>title="…"</c>.</summary>
    public static string? ComponentTitle(ElementNode node)
    {
        if (node is ComponentNode { Text.Length: > 0 } component)
        {
            return component.Text;
        }

        return node.Attributes.TryGetValue("title", out var title) && title.Kind == AttributeKind.String && title.Text.Length > 0
            ? title.Text
            : null;
    }

    /// <summary>The items of a breadcrumb written as one text, "Home, Products, Details".</summary>
    public static List<string> BreadcrumbTexts(string? text) => string.IsNullOrEmpty(text)
        ? new List<string> { "Home", "Section", "Page" }
        : text!.Split(',').Select(JsText.Trim).ToList();

    /// <summary>A count of rows or columns: the attribute when it is a number above zero, else the default.</summary>
    public static double TableSize(ElementNode node, string name, double fallback) =>
        node.Attributes.TryGetValue(name, out var value) && value.Kind == AttributeKind.Number && value.Number > 0
            ? value.Number
            : fallback;

    /// <summary>An attribute that is a number, also when it was written as text (<c>page="2"</c>); else the default.</summary>
    public static double NumberAttribute(ElementNode node, string name, double fallback)
    {
        if (!node.Attributes.TryGetValue(name, out var value))
        {
            return fallback;
        }

        if (value.Kind == AttributeKind.Number)
        {
            return Js.Or(value.Number, fallback);
        }

        if (value.Kind == AttributeKind.String)
        {
            var parsed = Js.ParseFloat(value.Text);
            return double.IsNaN(parsed) ? fallback : Js.Or(parsed, fallback);
        }

        return fallback;
    }

    /// <summary>A text without the <c>**</c> that makes a part of it bold.</summary>
    public static string? WithoutBoldMarks(string? text) => text?.Replace("**", string.Empty);

    /// <summary>The lines a tree of <c>+ branch</c> and <c>- leaf</c> takes.</summary>
    public static double CountTreeItems(IReadOnlyList<TreeItemNode> items)
    {
        double count = 0;
        foreach (var item in items)
        {
            count += 1 + CountTreeItems(item.Children);
        }

        return count;
    }

    /// <summary>The width of the tip of a Hover.</summary>
    public static double HoverTipWidth(string? text) => ((string.IsNullOrEmpty(text) ? 3 : text!.Length) * 7) + 16;
}

/// <summary>Calculates positions and sizes for all elements of a document (<c>layout.ts</c>).</summary>
internal sealed partial class LayoutEngine
{
    private readonly struct Context
    {
        public Context(double x, double y, double availableWidth, double availableHeight, bool fill = false)
        {
            X = x;
            Y = y;
            AvailableWidth = availableWidth;
            AvailableHeight = availableHeight;
            Fill = fill;
        }

        /// <summary>Set by a Dock for its children: a section takes the whole of the region it is given.</summary>
        public bool Fill { get; }

        public double X { get; }
        public double Y { get; }
        public double AvailableWidth { get; }
        public double AvailableHeight { get; }
    }

    private readonly struct GridPosition
    {
        public GridPosition(double row, double col, double rowSpan, double colSpan)
        {
            Row = row;
            Col = col;
            RowSpan = rowSpan;
            ColSpan = colSpan;
        }

        public double Row { get; }
        public double Col { get; }
        public double RowSpan { get; }
        public double ColSpan { get; }
    }

    /// <summary>A Map keyed by node object, as the TypeScript's: by reference, not by the records' equality.</summary>
    private sealed class ByReference : IEqualityComparer<ElementNode>
    {
        public static readonly ByReference Instance = new();

        public bool Equals(ElementNode? x, ElementNode? y) => ReferenceEquals(x, y);

        public int GetHashCode(ElementNode obj) => RuntimeHelpers.GetHashCode(obj);
    }

    private readonly Theme theme;
    private string? documentShow;

    public LayoutEngine(Theme theme)
    {
        this.theme = theme;
    }

    /// <summary>Calculate the layout of a document.</summary>
    public LayoutInfo CalculateLayout(DocumentNode document, double width, double height)
    {
        var context = new Context(0, 0, width, height);

        documentShow = document.Attributes.TryGetValue("show", out var show) ? show : null;

        var children = LayoutChildren(document.Children, context, "Vertical", null, null);

        double totalHeight = 0;
        foreach (var child in children)
        {
            var bottom = child.Bounds.Y + child.Bounds.Height;
            if (bottom > totalHeight)
            {
                totalHeight = bottom;
            }
        }

        return new LayoutInfo(
            new BoundingBox(0, 0, width, Js.Max(height, totalHeight + theme.Spacing.Padding)),
            children,
            document);
    }

    private LayoutInfo LayoutElement(ElementNode node, Context context) => node switch
    {
        LayoutNode layout => LayoutLayout(layout, context),
        SectionNode section => LayoutSection(section, context),
        ControlNode control => LayoutControl(control, context),
        ComponentNode component => LayoutComponent(component, context),
        RepeatNode repeat => LayoutRepeat(repeat, context),
        ConditionalNode conditional => LayoutConditional(conditional, context),
        _ => new LayoutInfo(new BoundingBox(context.X, context.Y, 100, 20), new List<LayoutInfo>(), node),
    };

    private LayoutInfo LayoutLayout(LayoutNode node, Context context)
    {
        var gap = GetGap(node);
        var padding = GetPadding(node);

        var inner = new Context(
            context.X + padding,
            context.Y + padding,
            context.AvailableWidth - (padding * 2),
            context.AvailableHeight - (padding * 2));

        var children = LayoutChildren(node.Children, inner, node.LayoutType, gap, node);
        var bounds = CalculateBoundsFromChildren(children, context, padding);
        return new LayoutInfo(bounds, children, node);
    }

    private static string? DockText(SectionNode node) =>
        node.Dock is { Kind: AttributeKind.String } dock ? dock.Text : null;

    private LayoutInfo LayoutSection(SectionNode node, Context context)
    {
        var padding = theme.Spacing.Padding;

        // A section is as wide as it is given room and as high as what it holds, unless it says w= or h= itself.
        // In a Dock it takes the whole region it is given.
        var width = Js.Or(GetSizeAttribute(node, "w"), context.AvailableWidth);
        var height = Js.Or(GetSizeAttribute(node, "h"), context.Fill ? context.AvailableHeight : 0);
        var top = ControlHelpers.ComponentTitle(node) is null ? 0 : ControlHelpers.ComponentTitleHeight;

        var dock = DockText(node);
        if (dock == "top" || dock == "bottom")
        {
            width = context.AvailableWidth;
            height = Js.Or(
                GetSizeAttribute(node, "h"),
                dock == "bottom" ? theme.Components.FooterHeight : theme.Components.HeaderHeight);
        }
        else if (dock == "left" || dock == "right")
        {
            width = Js.Or(GetSizeAttribute(node, "w"), theme.Components.SidebarWidth);
            height = context.Fill ? context.AvailableHeight : height;
        }

        var inner = new Context(
            context.X + padding,
            context.Y + padding + top,
            width - (padding * 2),
            Js.Max(height, context.AvailableHeight) - (padding * 2) - top);

        var children = LayoutChildren(node.Children, inner, "Vertical", null, null);

        return new LayoutInfo(
            new BoundingBox(context.X, context.Y, width, Js.Max(height, CalculateContentHeight(children) + (padding * 2) + top)),
            children,
            node);
    }

    private LayoutInfo LayoutControl(ControlNode node, Context context)
    {
        var size = GetControlSize(node);
        var width = Js.Or(GetSizeAttribute(node, "w"), size.Width);
        var labelHeight = ControlHelpers.HasInputLabel(node) ? ControlHelpers.InputLabelHeight : 0;
        var height = Js.Or(GetSizeAttribute(node, "h"), size.Height) + labelHeight;

        var children = new List<LayoutInfo>();
        if (node.Children is { Count: > 0 })
        {
            var childContext = new Context(context.X, context.Y + height, width, context.AvailableHeight - height);
            children = LayoutChildren(node.Children, childContext, "Vertical", null, null);
        }

        return new LayoutInfo(new BoundingBox(context.X, context.Y, width, height), children, node);
    }

    private LayoutInfo LayoutRepeat(RepeatNode node, Context context)
    {
        var children = new List<LayoutInfo>();
        var y = context.Y;
        var gap = theme.Spacing.Gap;

        for (double i = 0; i < node.Count; i++)
        {
            var repeatContext = new Context(context.X, y, context.AvailableWidth, context.AvailableHeight - (y - context.Y));

            foreach (var child in node.Children)
            {
                var childLayout = LayoutElement(child, repeatContext);
                children.Add(childLayout);
                y = childLayout.Bounds.Y + childLayout.Bounds.Height + gap;
            }
        }

        var height = y - context.Y - (children.Count > 0 ? gap : 0);

        return new LayoutInfo(new BoundingBox(context.X, context.Y, context.AvailableWidth, height), children, node);
    }

    private LayoutInfo LayoutConditional(ConditionalNode node, Context context)
    {
        var show = node.Attributes.TryGetValue("show", out var nodeShow) ? nodeShow.ToString() : documentShow;
        var branch = show == "else"
            ? node.ElseChildren ?? Array.Empty<ElementNode>()
            : node.ThenChildren;

        var children = LayoutVertical(branch, context, theme.Spacing.Gap);

        return new LayoutInfo(
            new BoundingBox(context.X, context.Y, context.AvailableWidth, CalculateContentHeight(children)),
            children,
            node);
    }

    private List<LayoutInfo> LayoutChildren(
        IReadOnlyList<ElementNode> children,
        Context context,
        string layoutType,
        double? gap,
        ElementNode? parentNode)
    {
        var effectiveGap = gap ?? theme.Spacing.Gap;

        return layoutType switch
        {
            "Vertical" => LayoutVertical(children, context, effectiveGap),
            "Horizontal" => JustifyHorizontal(LayoutHorizontal(children, context, effectiveGap), context, parentNode),
            "Grid" => LayoutGrid(children, context, effectiveGap, parentNode),
            "Dock" => LayoutDock(children, context),
            "Canvas" => LayoutCanvas(children, context),
            _ => LayoutVertical(children, context, effectiveGap),
        };
    }

    private List<LayoutInfo> LayoutVertical(IReadOnlyList<ElementNode> children, Context context, double gap)
    {
        var layouts = new List<LayoutInfo>();
        var y = context.Y;

        foreach (var child in children)
        {
            var childContext = new Context(context.X, y, context.AvailableWidth, context.AvailableHeight - (y - context.Y));
            var layout = LayoutElement(child, childContext);
            layouts.Add(layout);
            y = layout.Bounds.Y + layout.Bounds.Height + gap;
        }

        return layouts;
    }

    private List<LayoutInfo> LayoutHorizontal(IReadOnlyList<ElementNode> children, Context context, double gap)
    {
        var layouts = new List<LayoutInfo>();
        var x = context.X;

        var intrinsic = children.Select(GetIntrinsicWidth).ToList();
        double fixedTotal = 0;
        foreach (var w in intrinsic)
        {
            fixedTotal += w ?? 0;
        }

        var flexCount = intrinsic.Count(w => w is null);
        var gaps = gap * Js.Max(0, children.Count - 1);
        var flexWidth = flexCount > 0
            ? Js.Max(0, (context.AvailableWidth - gaps - fixedTotal) / flexCount)
            : 0;

        for (var i = 0; i < children.Count; i++)
        {
            var childContext = new Context(x, context.Y, intrinsic[i] ?? flexWidth, context.AvailableHeight);
            var layout = LayoutElement(children[i], childContext);
            layouts.Add(layout);
            x = layout.Bounds.X + layout.Bounds.Width + gap;
        }

        return layouts;
    }

    private List<LayoutInfo> LayoutGrid(IReadOnlyList<ElementNode> children, Context context, double gap, ElementNode? parentNode)
    {
        var layouts = new List<LayoutInfo>();

        var parentAttrs = parentNode is LayoutNode or SectionNode ? parentNode.Attributes : null;
        var cols = ToPositiveInt(parentAttrs, "cols") ?? 2;
        var rows = ToPositiveInt(parentAttrs, "rows");

        var cellWidth = (context.AvailableWidth - (gap * (cols - 1))) / cols;
        double? cellHeight = rows is double r0 && Js.Truthy(r0)
            ? (context.AvailableHeight - (gap * (r0 - 1))) / r0
            : null;

        var occupied = new HashSet<string>(StringComparer.Ordinal);
        var positioned = new Dictionary<ElementNode, GridPosition>(ByReference.Instance);
        double autoRow = 0;
        double autoCol = 0;
        string Key(double row, double col) => Js.N(row) + "," + Js.N(col);

        foreach (var child in children)
        {
            var pos = ParseGridPosition(child.Attributes.TryGetValue("grid", out var grid) ? grid : null, cols);
            if (pos is GridPosition p)
            {
                positioned[child] = p;
                for (var r = p.Row; r < p.Row + p.RowSpan; r++)
                {
                    for (var c = p.Col; c < p.Col + p.ColSpan; c++)
                    {
                        occupied.Add(Key(r, c));
                    }
                }
            }
        }

        foreach (var child in children)
        {
            if (!positioned.ContainsKey(child))
            {
                while (occupied.Contains(Key(autoRow, autoCol)))
                {
                    autoCol++;
                    if (autoCol >= cols)
                    {
                        autoCol = 0;
                        autoRow++;
                    }
                }

                positioned[child] = new GridPosition(autoRow, autoCol, 1, 1);
                occupied.Add(Key(autoRow, autoCol));
                autoCol++;
                if (autoCol >= cols)
                {
                    autoCol = 0;
                    autoRow++;
                }
            }
        }

        var measured = new List<(LayoutInfo Layout, GridPosition Pos)>();
        foreach (var child in children)
        {
            var pos = positioned[child];
            var x = context.X + (pos.Col * (cellWidth + gap));
            var spanWidth = (cellWidth * pos.ColSpan) + (gap * (pos.ColSpan - 1));
            double? spanHeight = cellHeight is double ch && Js.Truthy(ch)
                ? (ch * pos.RowSpan) + (gap * (pos.RowSpan - 1))
                : null;

            var layout = LayoutElement(child, new Context(x, context.Y, spanWidth, Js.Or(spanHeight, context.AvailableHeight)));

            if (layout.Bounds.Width > spanWidth)
            {
                layout.Bounds.Width = spanWidth;
            }

            measured.Add((layout, pos));
        }

        double rowCount = rows ?? 0;
        foreach (var m in measured)
        {
            rowCount = Js.Max(rowCount, m.Pos.Row + m.Pos.RowSpan);
        }

        var rowHeights = new double[(int)rowCount];
        for (var r = 0; r < rowHeights.Length; r++)
        {
            rowHeights[r] = cellHeight ?? 0;
        }

        foreach (var (layout, pos) in measured)
        {
            if (pos.RowSpan == 1)
            {
                var row = (int)pos.Row;
                rowHeights[row] = Js.Max(rowHeights[row], layout.Bounds.Height);
            }
        }

        foreach (var (layout, pos) in measured)
        {
            if (pos.RowSpan > 1)
            {
                var last = (int)(pos.Row + pos.RowSpan - 1);
                var spanned = gap * (pos.RowSpan - 1);
                for (var r = (int)pos.Row; r <= last; r++)
                {
                    spanned += rowHeights[r];
                }

                if (layout.Bounds.Height > spanned)
                {
                    rowHeights[last] += layout.Bounds.Height - spanned;
                }
            }
        }

        var rowTops = new List<double>();
        var top = context.Y;
        for (var r = 0; r < rowHeights.Length; r++)
        {
            rowTops.Add(top);
            top += rowHeights[r] + gap;
        }

        foreach (var (layout, pos) in measured)
        {
            Translate(layout, 0, rowTops[(int)pos.Row] - context.Y);
            layouts.Add(layout);
        }

        return layouts;
    }

    private List<LayoutInfo> LayoutCanvas(IReadOnlyList<ElementNode> children, Context context)
    {
        var layouts = new List<LayoutInfo>();

        foreach (var child in children)
        {
            double childX = 0;
            double childY = 0;

            if (child is ControlNode or ComponentNode)
            {
                var canvas = child.Attributes.TryGetValue("canvas", out var c) ? c : null;
                if (canvas is not null && !(canvas.Kind == AttributeKind.String && canvas.Text.Length == 0)
                    && canvas.Kind != AttributeKind.Boolean)
                {
                    var parts = canvas.ToString().Split(',').Select(p => Js.ParseFloat(JsText.Trim(p))).ToList();
                    childX = Js.Or(parts[0], 0);
                    childY = Js.Or(parts.Count > 1 ? parts[1] : null, 0);
                }
                else
                {
                    childX = GetSizeAttribute(child, "x") ?? 0;
                    childY = GetSizeAttribute(child, "y") ?? 0;
                }
            }

            var childContext = new Context(context.X + childX, context.Y + childY, context.AvailableWidth, context.AvailableHeight);
            layouts.Add(LayoutElement(child, childContext));
        }

        return layouts;
    }

    private List<LayoutInfo> LayoutDock(IReadOnlyList<ElementNode> children, Context context)
    {
        var layouts = new List<LayoutInfo>();
        var top = context.Y;
        var bottom = context.Y + context.AvailableHeight;
        var left = context.X;
        var right = context.X + context.AvailableWidth;

        foreach (var element in children)
        {
            if (element is not SectionNode child)
            {
                continue;
            }

            // child.dock || 'fill', then a switch on it: a dock that is not one of the words is a fill
            switch (DockText(child))
            {
                case "top":
                {
                    var height = Js.Or(GetSizeAttribute(child, "h"), theme.Components.HeaderHeight);
                    var layout = LayoutElement(child, new Context(left, top, right - left, height, true));
                    layouts.Add(layout);
                    top += layout.Bounds.Height;
                    break;
                }

                case "bottom":
                {
                    var height = Js.Or(GetSizeAttribute(child, "h"), theme.Components.FooterHeight);
                    var layout = LayoutElement(child, new Context(left, bottom - height, right - left, height, true));
                    layouts.Add(layout);
                    bottom -= layout.Bounds.Height;
                    break;
                }

                case "left":
                {
                    var width = Js.Or(GetSizeAttribute(child, "w"), theme.Components.SidebarWidth);
                    var layout = LayoutElement(child, new Context(left, top, width, bottom - top, true));
                    layouts.Add(layout);
                    left += layout.Bounds.Width;
                    break;
                }

                case "right":
                {
                    var width = Js.Or(GetSizeAttribute(child, "w"), theme.Components.SidebarWidth);
                    var layout = LayoutElement(child, new Context(right - width, top, width, bottom - top, true));
                    layouts.Add(layout);
                    right -= layout.Bounds.Width;
                    break;
                }

                default:
                {
                    var layout = LayoutElement(child, new Context(left, top, right - left, bottom - top, true));
                    layouts.Add(layout);
                    break;
                }
            }
        }

        return layouts;
    }

    // ============ Helper Methods ============

    private readonly struct Size
    {
        public Size(double width, double height)
        {
            Width = width;
            Height = height;
        }

        public double Width { get; }
        public double Height { get; }
    }

    private static int TextLength(string? text) => text?.Length ?? 0;

    private static Size GetControlSize(ControlNode node)
    {
        switch (node.ControlType)
        {
            case "Button":
            {
                var length = TextLength(node.Text);
                var textWidth = ((length != 0 ? length : 6) * 8) + 32;
                return new Size(Js.Max(100, textWidth), 36);
            }

            case "IconButton":
                return !string.IsNullOrEmpty(node.Text)
                    ? new Size((node.Text!.Length * 8) + 48, 36)
                    : new Size(36, 36);
            case "TextInput":
            case "NumberInput":
            case "DateInput":
            case "PasswordInput":
                return new Size(200, 36);
            case "TextArea":
                return new Size(300, 100);
            case "Label":
            {
                var length = TextLength(node.Text);
                var labelWidth = (length != 0 ? length : 10) * 8;
                return new Size(Js.Max(50, labelWidth), 20);
            }

            case "Checkbox":
                return new Size(150, 24);
            case "Radio":
                return new Size(150, 24);
            case "Dropdown":
                return new Size(200, 36);
            case "Separator":
                return new Size(200, 1);
            case "Spacer":
                return new Size(16, 16);
            case "Icon":
                return new Size(24, 24);
            case "Image":
                return new Size(150, 100);
            case "Avatar":
            {
                var key = JsValue.Attribute(node, "size").Or("md").ToString();
                var avatarSize = key switch
                {
                    "xs" => 24,
                    "sm" => 32,
                    "md" => 40,
                    "lg" => 56,
                    "xl" => 80,
                    _ => 40,
                };
                return new Size(avatarSize, avatarSize);
            }

            case "Badge":
                return new Size(24, 24);
            case "Progress":
                return new Size(200, 8);
            case "Slider":
                return new Size(200, 24);
            case "Switch":
                return new Size(48, 24);
            case "Chip":
                return new Size(80, 28);
            case "Tabs":
                return new Size(300, 40);
            case "Tab":
            {
                var length = TextLength(node.Text);
                var tabWidth = ((length != 0 ? length : 6) * 8) + 24;
                return new Size(Js.Max(100, tabWidth), 40);
            }

            case "Menu":
                return new Size(180, 200);
            case "MenuItem":
                return new Size(180, 36);
            case "Breadcrumb":
                return new Size(300, 24);
            case "Pagination":
                return new Size(300, 36);
            case "Table":
                return new Size(400, 200);
            case "Row":
                return new Size(400, 36);
            case "Cell":
                return new Size(120, 36);
            case "Tree":
                return new Size(250, 200);
            case "TreeItem":
                return new Size(250, 32);
            case "Accordion":
                return new Size(300, 200);
            case "AccordionSection":
                return new Size(300, 48);
            case "DataGrid":
                return new Size(500, 300);
            case "Column":
            case "ColumnText":
            case "ColumnDate":
            case "ColumnNumber":
            case "ColumnCheckbox":
            case "ColumnImage":
            case "ColumnLink":
            case "ColumnButton":
                return new Size(120, 40);
            case "Heading":
            {
                var length = TextLength(ControlHelpers.ControlText(node));
                var headingWidth = (length != 0 ? length : 10) * 12;
                return new Size(Js.Max(100, headingWidth), 32);
            }

            case "Link":
            {
                var length = TextLength(ControlHelpers.ControlText(node));
                var linkWidth = (length != 0 ? length : 6) * 8;
                return new Size(Js.Max(40, linkWidth), 20);
            }

            case "Toast":
                return new Size(320, 56);
            case "Skeleton":
                return new Size(200, 20);
            case "Stepper":
                return new Size(400, 60);
            default:
                return new Size(100, 30);
        }
    }

    /// <summary>The width a Horizontal child takes when it has one of its own; null means it shares the rest.</summary>
    private static double? GetIntrinsicWidth(ElementNode child)
    {
        var explicitWidth = GetSizeAttribute(child, "w");
        if (explicitWidth is double w && Js.Truthy(w))
        {
            return w;
        }

        if (child is ControlNode control)
        {
            return GetControlSize(control).Width;
        }

        return null;
    }

    /// <summary>grid=row,col,rowSpan,colSpan; null when unreadable, so the child is placed automatically.</summary>
    private static GridPosition? ParseGridPosition(AttributeValue? value, double cols)
    {
        if (value is null || value.Kind == AttributeKind.Boolean || (value.Kind == AttributeKind.String && value.Text.Length == 0))
        {
            return null;
        }

        var nums = value.ToString().Split(',')
            .Select(p => JsText.Trim(p).Length == 0 ? (double?)null : Js.StringToNumber(JsText.Trim(p)))
            .ToList();
        if (nums.Any(n => n is double d && (double.IsNaN(d) || double.IsInfinity(d) || d < 0)))
        {
            return null;
        }

        double? At(int i) => i < nums.Count ? nums[i] : null;

        var row = Math.Floor(At(0) ?? 0);
        var col = Math.Floor(At(1) ?? 0);
        if (col >= cols)
        {
            return null;
        }

        var rowSpan = Js.Max(1, Math.Floor(Js.Or(At(2), 1)));
        var colSpan = Js.Min(cols - col, Js.Max(1, Math.Floor(Js.Or(At(3), 1))));
        return new GridPosition(row, col, rowSpan, colSpan);
    }

    private static double? ToPositiveInt(IReadOnlyDictionary<string, AttributeValue>? attributes, string name)
    {
        double num = double.NaN;
        if (attributes is not null && attributes.TryGetValue(name, out var value))
        {
            if (value.Kind == AttributeKind.Number)
            {
                num = value.Number;
            }
            else if (value.Kind == AttributeKind.String)
            {
                num = Js.ParseInt(value.Text);
            }
        }

        return !double.IsNaN(num) && !double.IsInfinity(num) && num >= 1 ? Math.Floor(num) : null;
    }

    private static void Translate(LayoutInfo layout, double dx, double dy)
    {
        if (dx == 0 && dy == 0)
        {
            return;
        }

        layout.Bounds.X += dx;
        layout.Bounds.Y += dy;
        foreach (var child in layout.Children)
        {
            Translate(child, dx, dy);
        }
    }

    private double GetGap(LayoutNode node) =>
        node.Attributes.TryGetValue("gap", out var gap) && gap.Kind == AttributeKind.Number ? gap.Number : theme.Spacing.Gap;

    private static double GetPadding(LayoutNode node) =>
        node.Attributes.TryGetValue("padding", out var padding) && padding.Kind == AttributeKind.Number ? padding.Number : 0;

    private static double? GetSizeAttribute(ElementNode node, string name)
    {
        // width= and height= say the same as w= and h=
        var longName = name == "w" ? "width" : name == "h" ? "height" : name;
        if (!node.Attributes.TryGetValue(name, out var value) && !node.Attributes.TryGetValue(longName, out value))
        {
            return null;
        }

        if (value.Kind == AttributeKind.Number)
        {
            return value.Number;
        }

        if (value.Kind == AttributeKind.String)
        {
            var num = Js.ParseFloat(value.Text);
            if (!double.IsNaN(num))
            {
                return num;
            }
        }

        return null;
    }

    private static BoundingBox CalculateBoundsFromChildren(List<LayoutInfo> children, Context context, double padding)
    {
        if (children.Count == 0)
        {
            return new BoundingBox(context.X, context.Y, context.AvailableWidth, padding * 2);
        }

        var maxX = context.X;
        var maxY = context.Y;

        foreach (var child in children)
        {
            var right = child.Bounds.X + child.Bounds.Width;
            var bottom = child.Bounds.Y + child.Bounds.Height;
            if (right > maxX)
            {
                maxX = right;
            }

            if (bottom > maxY)
            {
                maxY = bottom;
            }
        }

        return new BoundingBox(
            context.X,
            context.Y,
            Js.Max(context.AvailableWidth, maxX - context.X + padding),
            maxY - context.Y + padding);
    }

    private static double CalculateContentHeight(List<LayoutInfo> children)
    {
        if (children.Count == 0)
        {
            return 0;
        }

        double maxY = 0;
        var minY = Js.Or(children[0].Bounds.Y, 0);

        foreach (var child in children)
        {
            var bottom = child.Bounds.Y + child.Bounds.Height;
            if (bottom > maxY)
            {
                maxY = bottom;
            }
        }

        return maxY - minY;
    }
}
