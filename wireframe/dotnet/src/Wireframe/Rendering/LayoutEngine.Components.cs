using Wireframe.Syntax;

namespace Wireframe.Rendering;

/// <summary>
/// The layout of the components (<c>layout.ts</c>, <c>layoutComponent</c> and what it calls). Each kind has its own
/// shape: a bar of tabs, a list of menu items, rows of cells. What is drawn for it is in
/// <c>SvgRenderer.RenderComponent</c>.
/// </summary>
internal sealed partial class LayoutEngine
{
    private LayoutInfo LayoutComponent(ComponentNode node, Context context) => node.ComponentType switch
    {
        "Tabs" => LayoutTabs(node, context),
        "Menu" => LayoutMenu(node, context),
        "Breadcrumb" => LayoutBreadcrumb(node, context),
        "Stepper" => LayoutStepper(node, context),
        "Table" => LayoutTable(node, context),
        "Row" => LayoutRow(node, context),
        "Tree" => LayoutTree(node, context),
        "TreeItem" => LayoutTreeItem(node, context, 0),
        "List" => LayoutList(node, context),
        "Accordion" => LayoutAccordion(node, context),
        "AccordionSection" or "Expander" => LayoutFold(node, context),
        "DataGrid" => LayoutDataGrid(node, context),
        "Hamburger" => LayoutHamburger(node, context),
        "Hover" => LayoutHover(node, context),
        "Tab" or "MenuItem" or "Cell" or "Step" or "BreadcrumbItem" or "Column" or "ColumnText" or "ColumnDate"
            or "ColumnNumber" or "ColumnCheckbox" or "ColumnImage" or "ColumnLink" or "ColumnButton" => LayoutPart(node, context),
        "Dialog" => LayoutComponentBox(
            node,
            context,
            ControlHelpers.ComponentTitle(node) is null ? 0 : ControlHelpers.ComponentTitleHeight,
            0),
        "Alert" => LayoutComponentBox(
            node,
            context,
            !string.IsNullOrEmpty(node.Text) && node.Children.Count > 0 ? ControlHelpers.ComponentTitleHeight : 0,
            !string.IsNullOrEmpty(node.Text) ? 48 : 0),
        _ => LayoutComponentBox(node, context, 0, 0),
    };

    private static bool Is(ElementNode node, string componentType) =>
        node is ComponentNode component && component.ComponentType == componentType;

    /// <summary><c>text?.length || fallback</c>.</summary>
    private static double LengthOr(string? text, double fallback) => string.IsNullOrEmpty(text) ? fallback : text!.Length;

    private static LayoutInfo Leaf(ElementNode node, double x, double y, double width, double height) =>
        new(new BoundingBox(x, y, width, height), new List<LayoutInfo>(), node);

    /// <summary>A component drawn as a box around its children, which start <paramref name="top"/> below its upper edge.</summary>
    private LayoutInfo LayoutComponentBox(ComponentNode node, Context context, double top, double least)
    {
        var padding = theme.Spacing.Md;
        var gap = theme.Spacing.Gap;

        var width = Js.Or(GetSizeAttribute(node, "w"), context.AvailableWidth);
        var minHeight = Js.Max(Js.Or(GetSizeAttribute(node, "h"), 0), least);

        var inner = new Context(
            context.X + padding,
            context.Y + padding + top,
            width - (padding * 2),
            context.AvailableHeight - (padding * 2) - top);

        var children = LayoutChildren(node.Children, inner, "Vertical", gap, null);

        var contentHeight = CalculateContentHeight(children);
        var height = Js.Max(minHeight, contentHeight + (padding * 2) + top);

        return new LayoutInfo(new BoundingBox(context.X, context.Y, width, height), children, node);
    }

    /// <summary>A part with a size of its own: a tab, a menu item, a cell, a column header.</summary>
    private LayoutInfo LayoutPart(ComponentNode node, Context context)
    {
        var size = GetPartSize(node, context);
        return Leaf(
            node,
            context.X,
            context.Y,
            Js.Or(GetSizeAttribute(node, "w"), size.Width),
            Js.Or(GetSizeAttribute(node, "h"), size.Height));
    }

    private static Size GetPartSize(ComponentNode node, Context context) => node.ComponentType switch
    {
        "Tab" => new Size(Js.Max(80, (LengthOr(node.Text, 3) * 8) + 32), 40),
        "MenuItem" => new Size(context.AvailableWidth, 36),
        "Cell" => new Size(120, ControlHelpers.TableRowHeight),
        "Step" => new Size(Js.Max(80, (LengthOr(node.Text, 4) * 8) + 16), 24),
        "BreadcrumbItem" => new Size(LengthOr(node.Text, 4) * 8, 24),
        _ => new Size(120, 40),
    };

    /// <summary>The tabs in a bar, and below it the content of the open tab.</summary>
    private LayoutInfo LayoutTabs(ComponentNode node, Context context)
    {
        var padding = theme.Spacing.Md;
        var width = Js.Or(GetSizeAttribute(node, "w"), context.AvailableWidth);
        const double barHeight = ControlHelpers.TabBarHeight;
        var tabs = node.Children.Where(c => Is(c, "Tab")).Cast<ComponentNode>().ToList();
        var others = node.Children.Where(c => !Is(c, "Tab")).ToList();

        var x = context.X;
        var children = new List<LayoutInfo>();
        foreach (var tab in tabs)
        {
            var tabWidth = Js.Or(GetSizeAttribute(tab, "w"), GetPartSize(tab, context).Width);
            children.Add(Leaf(tab, x, context.Y, tabWidth, barHeight));
            x += tabWidth;
        }

        // The open tab is the one marked active or selected, else the first
        var open = tabs.FirstOrDefault(tab => tab.Modifiers.Active || tab.Modifiers.Selected) ?? tabs.FirstOrDefault();
        var content = new List<ElementNode>();
        if (open is not null)
        {
            content.AddRange(open.Children);
        }

        content.AddRange(others);

        var inner = new Context(
            context.X + padding,
            context.Y + barHeight + padding,
            width - (padding * 2),
            context.AvailableHeight - barHeight - (padding * 2));
        var below = LayoutVertical(content, inner, theme.Spacing.Gap);
        var contentHeight = below.Count > 0 ? CalculateContentHeight(below) + (padding * 2) : 0;
        children.AddRange(below);

        return new LayoutInfo(
            new BoundingBox(context.X, context.Y, width, Js.Max(Js.Or(GetSizeAttribute(node, "h"), 0), barHeight + contentHeight)),
            children,
            node);
    }

    /// <summary>The items of a menu one under the other, under its title when it has one.</summary>
    private LayoutInfo LayoutMenu(ComponentNode node, Context context)
    {
        var width = Js.Or(GetSizeAttribute(node, "w"), Js.Min(context.AvailableWidth, 180));
        var top = string.IsNullOrEmpty(node.Text) ? ControlHelpers.MenuPadding : ControlHelpers.MenuTitleHeight;
        var inner = new Context(context.X, context.Y + top, width, context.AvailableHeight - top);
        var children = LayoutVertical(node.Children, inner, 0);
        var height = top + CalculateContentHeight(children) + ControlHelpers.MenuPadding;

        return new LayoutInfo(
            new BoundingBox(context.X, context.Y, width, Js.Max(Js.Or(GetSizeAttribute(node, "h"), 0), height)),
            children,
            node);
    }

    /// <summary>A breadcrumb of BreadcrumbItems is drawn whole by the renderer; one of other elements has them side by side.</summary>
    private LayoutInfo LayoutBreadcrumb(ComponentNode node, Context context)
    {
        const double height = 24;
        var items = node.Children.Where(c => Is(c, "BreadcrumbItem")).Cast<ComponentNode>().ToList();

        if (items.Count > 0 || node.Children.Count == 0)
        {
            var texts = items.Count > 0
                ? items.Select(item => item.Text ?? string.Empty).ToList()
                : ControlHelpers.BreadcrumbTexts(node.Text);
            double width = 0;
            for (var i = 0; i < texts.Count; i++)
            {
                width = width + (texts[i].Length * 8) + 8 + (i < texts.Count - 1 ? ControlHelpers.BreadcrumbSeparatorWidth : 0);
            }

            return Leaf(node, context.X, context.Y, Js.Or(GetSizeAttribute(node, "w"), width), height);
        }

        var x = context.X;
        var children = new List<LayoutInfo>();
        foreach (var child in node.Children)
        {
            var childContext = new Context(
                x,
                context.Y,
                GetIntrinsicWidth(child) ?? Js.Max(0, context.AvailableWidth - (x - context.X)),
                context.AvailableHeight);
            var layout = LayoutElement(child, childContext);
            x = layout.Bounds.X + layout.Bounds.Width + 8 + ControlHelpers.BreadcrumbSeparatorWidth;
            children.Add(layout);
        }

        var last = children[children.Count - 1];
        return new LayoutInfo(
            new BoundingBox(
                context.X,
                context.Y,
                last.Bounds.X + last.Bounds.Width - context.X,
                Js.Max(height, CalculateContentHeight(children))),
            children,
            node);
    }

    /// <summary>A stepper is drawn whole by the renderer, from its Step children or from <c>steps=</c> and <c>current=</c>.</summary>
    private static LayoutInfo LayoutStepper(ComponentNode node, Context context)
    {
        var named = node.Children.Any(c => c is ComponentNode { ComponentType: "Step" } step && !string.IsNullOrEmpty(step.Text));
        return Leaf(
            node,
            context.X,
            context.Y,
            Js.Or(GetSizeAttribute(node, "w"), context.AvailableWidth),
            Js.Or(GetSizeAttribute(node, "h"), 60 + (named ? ControlHelpers.StepLabelHeight : 0)));
    }

    /// <summary>A table of Row elements has its rows one under the other; the other forms are drawn whole by the renderer.</summary>
    private LayoutInfo LayoutTable(ComponentNode node, Context context)
    {
        var width = Js.Or(GetSizeAttribute(node, "w"), context.AvailableWidth);

        if (node.Children.Count > 0)
        {
            var inner = new Context(context.X, context.Y, width, context.AvailableHeight, context.Fill);
            var children = LayoutVertical(node.Children, inner, 0);
            return new LayoutInfo(new BoundingBox(context.X, context.Y, width, CalculateContentHeight(children)), children, node);
        }

        double written = (node.TableRows ?? Array.Empty<TableRowData>()).Count(row => !row.IsSeparator);
        var rows = written > 0 ? written : ControlHelpers.TableSize(node, "rows", 4);
        return Leaf(node, context.X, context.Y, width, Js.Or(GetSizeAttribute(node, "h"), rows * ControlHelpers.TableRowHeight));
    }

    /// <summary>The cells of a row share its width evenly.</summary>
    private LayoutInfo LayoutRow(ComponentNode node, Context context)
    {
        var width = Js.Or(GetSizeAttribute(node, "w"), context.AvailableWidth);
        var cellWidth = width / Js.Max(1, node.Children.Count);
        const double rowHeight = ControlHelpers.TableRowHeight;

        var children = new List<LayoutInfo>();
        for (var i = 0; i < node.Children.Count; i++)
        {
            var child = node.Children[i];
            var x = context.X + (i * cellWidth);
            children.Add(Is(child, "Cell")
                ? Leaf(child, x, context.Y, cellWidth, rowHeight)

                // Anything else in a row (a button, a badge) sits in its cell
                : LayoutElement(child, new Context(x + 8, context.Y + 6, cellWidth - 16, rowHeight - 12)));
        }

        return new LayoutInfo(
            new BoundingBox(context.X, context.Y, width, Js.Max(rowHeight, CalculateContentHeight(children))),
            children,
            node);
    }

    /// <summary>A tree of <c>+ branch</c> and <c>- leaf</c> lines is drawn whole by the renderer; one of TreeItems has them stacked.</summary>
    private LayoutInfo LayoutTree(ComponentNode node, Context context)
    {
        var width = Js.Or(GetSizeAttribute(node, "w"), Js.Min(context.AvailableWidth, 250));
        const double padding = ControlHelpers.TreePadding;

        if (node.TreeItems is { Count: > 0 } lines)
        {
            var height = (ControlHelpers.CountTreeItems(lines) * ControlHelpers.TreeItemHeight) + (padding * 2);
            return Leaf(node, context.X, context.Y, width, Js.Max(Js.Or(GetSizeAttribute(node, "h"), 0), height));
        }

        var children = LayoutTreeItems(node.Children, context.X, context.Y + padding, width, 0);
        var bottom = context.Y + padding;
        foreach (var child in children)
        {
            bottom = Js.Max(bottom, LowestEdge(child));
        }

        return new LayoutInfo(
            new BoundingBox(
                context.X,
                context.Y,
                width,
                Js.Max(Js.Or(GetSizeAttribute(node, "h"), 0), bottom - context.Y + padding)),
            children,
            node);
    }

    /// <summary>Tree items one under the other; an expanded item's own items come between it and the next.</summary>
    private List<LayoutInfo> LayoutTreeItems(IReadOnlyList<ElementNode> items, double x, double top, double width, double level)
    {
        var y = top;
        var layouts = new List<LayoutInfo>();
        foreach (var item in items)
        {
            var itemContext = new Context(x, y, width, 0);
            var layout = item is ComponentNode { ComponentType: "TreeItem" } treeItem
                ? LayoutTreeItem(treeItem, itemContext, level)
                : LayoutElement(item, itemContext);
            y = LowestEdge(layout);
            layouts.Add(layout);
        }

        return layouts;
    }

    /// <summary>One line of a tree. Its bounds are the line alone; the items under it are its children.</summary>
    private LayoutInfo LayoutTreeItem(ComponentNode node, Context context, double level)
    {
        const double rowHeight = ControlHelpers.TreeItemHeight;
        var children = node.Modifiers.Expanded
            ? LayoutTreeItems(node.Children, context.X, context.Y + rowHeight, context.AvailableWidth, level + 1)
            : new List<LayoutInfo>();

        return new LayoutInfo(new BoundingBox(context.X, context.Y, context.AvailableWidth, rowHeight), children, node)
        {
            Level = level,
        };
    }

    /// <summary>The lower edge of an element and everything under it.</summary>
    private static double LowestEdge(LayoutInfo layout)
    {
        var bottom = layout.Bounds.Y + layout.Bounds.Height;
        foreach (var child in layout.Children)
        {
            bottom = Js.Max(bottom, LowestEdge(child));
        }

        return bottom;
    }

    /// <summary>A list is drawn whole by the renderer: a line per item.</summary>
    private static LayoutInfo LayoutList(ComponentNode node, Context context) => Leaf(
        node,
        context.X,
        context.Y,
        Js.Or(GetSizeAttribute(node, "w"), context.AvailableWidth),
        Js.Max(Js.Or(GetSizeAttribute(node, "h"), 0), (node.ListItems?.Count ?? 0) * ControlHelpers.ListItemHeight));

    /// <summary>The sections of an accordion one under the other, with nothing between.</summary>
    private LayoutInfo LayoutAccordion(ComponentNode node, Context context)
    {
        var width = Js.Or(GetSizeAttribute(node, "w"), context.AvailableWidth);
        var children = LayoutVertical(node.Children, new Context(context.X, context.Y, width, context.AvailableHeight, context.Fill), 0);

        return new LayoutInfo(
            new BoundingBox(context.X, context.Y, width, Js.Max(Js.Or(GetSizeAttribute(node, "h"), 0), CalculateContentHeight(children))),
            children,
            node);
    }

    /// <summary>A header that folds: an accordion section or an expander. Its content shows when it is expanded.</summary>
    private LayoutInfo LayoutFold(ComponentNode node, Context context)
    {
        var padding = theme.Spacing.Md;
        var width = Js.Or(GetSizeAttribute(node, "w"), context.AvailableWidth);
        var children = new List<LayoutInfo>();
        double height = ControlHelpers.FoldHeaderHeight;

        if (node.Modifiers.Expanded && node.Children.Count > 0)
        {
            var inner = new Context(
                context.X + padding,
                context.Y + ControlHelpers.FoldHeaderHeight + padding,
                width - (padding * 2),
                context.AvailableHeight - ControlHelpers.FoldHeaderHeight - (padding * 2));
            children = LayoutVertical(node.Children, inner, theme.Spacing.Gap);
            height += CalculateContentHeight(children) + (padding * 2);
        }

        return new LayoutInfo(
            new BoundingBox(context.X, context.Y, width, Js.Max(Js.Or(GetSizeAttribute(node, "h"), 0), height)),
            children,
            node);
    }

    /// <summary>A data grid is drawn whole by the renderer, from its Column children or from <c>cols=</c>.</summary>
    private static LayoutInfo LayoutDataGrid(ComponentNode node, Context context)
    {
        var rows = ControlHelpers.TableSize(node, "rows", 5);
        return Leaf(
            node,
            context.X,
            context.Y,
            Js.Or(GetSizeAttribute(node, "w"), context.AvailableWidth),
            Js.Or(GetSizeAttribute(node, "h"), 40 + ((rows - 1) * ControlHelpers.TableRowHeight)));
    }

    /// <summary>The three-line button, and under it what it opens when it is expanded.</summary>
    private LayoutInfo LayoutHamburger(ComponentNode node, Context context)
    {
        const double size = 24;
        var children = new List<LayoutInfo>();
        var width = size;
        var height = size;

        if (node.Modifiers.Expanded && node.Children.Count > 0)
        {
            var gap = theme.Spacing.Gap;
            var inner = new Context(context.X, context.Y + size + gap, context.AvailableWidth, context.AvailableHeight - size - gap);
            children = LayoutVertical(node.Children, inner, gap);
            var right = context.X + size;
            foreach (var child in children)
            {
                right = Js.Max(right, child.Bounds.X + child.Bounds.Width);
            }

            width = right - context.X;
            height = size + gap + CalculateContentHeight(children);
        }

        return new LayoutInfo(new BoundingBox(context.X, context.Y, width, height), children, node);
    }

    /// <summary>What is hovered over, and under it the tip that shows.</summary>
    private LayoutInfo LayoutHover(ComponentNode node, Context context)
    {
        var tipWidth = ControlHelpers.HoverTipWidth(node.Text);
        var children = LayoutVertical(node.Children, context, theme.Spacing.Gap);
        var contentHeight = CalculateContentHeight(children);
        var right = context.X;
        foreach (var child in children)
        {
            right = Js.Max(right, child.Bounds.X + child.Bounds.Width);
        }

        return new LayoutInfo(
            new BoundingBox(
                context.X,
                context.Y,
                Js.Max(tipWidth, right - context.X),
                contentHeight + (children.Count > 0 ? ControlHelpers.HoverTipGap : 0) + ControlHelpers.HoverTipHeight),
            children,
            node);
    }

    /// <summary><c>justify=</c> on a Horizontal: where its children stand when they do not fill the row.</summary>
    private static List<LayoutInfo> JustifyHorizontal(List<LayoutInfo> layouts, Context context, ElementNode? parentNode)
    {
        if (parentNode is null
            || !parentNode.Attributes.TryGetValue("justify", out var value)
            || value.Kind != AttributeKind.String
            || layouts.Count == 0)
        {
            return layouts;
        }

        var justify = value.Text;
        var last = layouts[layouts.Count - 1];
        var free = context.X + context.AvailableWidth - (last.Bounds.X + last.Bounds.Width);
        if (free <= 0)
        {
            return layouts;
        }

        for (var i = 0; i < layouts.Count; i++)
        {
            double dx = 0;
            if (justify == "end" || justify == "right")
            {
                dx = free;
            }
            else if (justify == "center")
            {
                dx = free / 2;
            }
            else if ((justify == "between" || justify == "space-between") && layouts.Count > 1)
            {
                dx = (free * i) / (layouts.Count - 1);
            }

            Translate(layouts[i], dx, 0);
        }

        return layouts;
    }
}
