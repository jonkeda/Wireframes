using System.Text;
using Wireframe.Syntax;

namespace Wireframe.Rendering;

/// <summary>
/// The drawing of the components (<c>svg-renderer.ts</c>, <c>renderComponent</c> and what it calls). The layout gave
/// each its shape (<c>LayoutEngine.LayoutComponent</c>).
/// </summary>
internal sealed partial class SvgRenderer
{
    /// <summary>The drawing functions of the parts were written for controls: a component is handed to them as one.</summary>
    private static ControlNode Part(ComponentNode node, double? level = null)
    {
        var attributes = node.Attributes;
        if (level is double depth)
        {
            var copy = new Dictionary<string, AttributeValue>(StringComparer.Ordinal);
            foreach (var pair in node.Attributes)
            {
                copy[pair.Key] = pair.Value;
            }

            copy["level"] = AttributeValue.FromNumber(depth);
            attributes = copy;
        }

        return new ControlNode
        {
            ControlType = node.ComponentType,
            Text = node.Text,
            Icon = node.Icon,
            Id = node.Id,
            Binding = node.Binding,
            Navigation = node.Navigation,
            Attributes = attributes,
            Modifiers = node.Modifiers,
            Children = node.Children,
        };
    }

    private static bool IsComponent(ElementNode node, string componentType) =>
        node is ComponentNode component && component.ComponentType == componentType;

    private string RenderComponent(ComponentNode node, BoundingBox bounds, LayoutInfo layout)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height;
        var c = theme.Colors;

        switch (node.ComponentType)
        {
            case "Card":
                return CreateRect(x, y, width, height, theme.Borders.RadiusLarge, c.Background, c.Border, theme.Borders.Width);

            case "Dialog":
            {
                var title = ControlHelpers.ComponentTitle(node);
                var dialogRect = CreateRect(x, y, width, height, theme.Borders.RadiusLarge, c.Background, c.Border, theme.Borders.Width);
                var titleText = title is not null
                    ? $"<text x=\"{N(x + 16)}\" y=\"{N(y + 24)}\" class=\"wire-text wire-text-bold\">{E(title)}</text>"
                    : "";
                return "<g>\n"
                    + $"          {dialogRect}\n"
                    + $"          {titleText}\n"
                    + "        </g>";
            }

            case "Alert":
            {
                var alertType = JsValue.Attribute(node, "type").Or("info").ToString();
                var alertColor = alertType switch
                {
                    "success" => c.Success,
                    "warning" => c.Warning,
                    "error" => c.Error,
                    _ => c.Info,
                };
                var alertRect = CreateRect(x, y, width, height, theme.Borders.Radius, alertColor + "20", alertColor, theme.Borders.Width);

                // Alone, the text stands in the middle; above content, it is the first line
                var textY = node.Children.Count > 0 ? y + 24 : y + (height / 2) + 5;
                var text = !string.IsNullOrEmpty(node.Text)
                    ? $"<text x=\"{N(x + 16)}\" y=\"{N(textY)}\" class=\"wire-text\">{E(node.Text!)}</text>"
                    : "";

                return "<g>\n"
                    + $"          {alertRect}\n"
                    + $"          <rect x=\"{N(x)}\" y=\"{N(y)}\" width=\"4\" height=\"{N(height)}\" fill=\"{alertColor}\" />\n"
                    + $"          {text}\n"
                    + "        </g>";
            }

            case "Tabs":
                return CreateRect(x, y, width, height, 0, "none", c.Border, theme.Borders.Width)
                    + RenderTabs(new BoundingBox(x, y, width, Js.Min(height, ControlHelpers.TabBarHeight)));

            case "Tab":
                return RenderTab(Part(node), bounds);

            case "Menu":
                return RenderMenu(Part(node), bounds);

            case "MenuItem":
                return RenderMenuItem(Part(node), bounds);

            case "Breadcrumb":
                return RenderBreadcrumbOf(node, bounds, layout);

            case "BreadcrumbItem":
                return $"<text x=\"{N(x)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text\" style=\"fill: {c.Primary}\">{E(Or(node.Text, "Item"))}</text>";

            case "Stepper":
            {
                var steps = node.Children.Where(child => IsComponent(child, "Step")).Cast<ComponentNode>().ToList();
                return steps.Count > 0 ? RenderSteps(steps, bounds) : RenderStepper(Part(node), bounds);
            }

            case "Step":
                return $"<text x=\"{N(x)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text\">{E(Or(node.Text, "Step"))}</text>";

            case "Table":
                if (node.Children.Count > 0)
                {
                    return RenderTableFrame(bounds);
                }

                if (node.TableRows is { } tableRows && tableRows.Any(row => !row.IsSeparator))
                {
                    return RenderTableRows(tableRows, bounds);
                }

                return RenderTable(Part(node), bounds);

            case "Row":
                return RenderRow(Part(node), bounds);

            case "Cell":
                return RenderCell(Part(node), bounds);

            case "Tree":
                return RenderTree(bounds) + RenderTreeLines(node.TreeItems ?? Array.Empty<TreeItemNode>(), bounds);

            case "TreeItem":
                return RenderTreeItem(Part(node, layout.Level), bounds);

            case "List":
                return RenderList(node.ListItems ?? Array.Empty<string>(), bounds);

            case "Accordion":
                return RenderAccordion(bounds);

            case "AccordionSection":
            case "Expander":
                return RenderAccordionSection(Part(node), bounds);

            case "DataGrid":
                return RenderDataGrid(Part(node), bounds);

            case "Column":
            case "ColumnText":
            case "ColumnDate":
            case "ColumnNumber":
            case "ColumnCheckbox":
            case "ColumnImage":
            case "ColumnLink":
            case "ColumnButton":
                return RenderColumn(Part(node), bounds);

            case "Hamburger":
                return RenderHamburger(bounds);

            case "Hover":
                return RenderHoverTip(node, bounds);

            default:
                return "";
        }
    }

    /// <summary>The items of a breadcrumb: its BreadcrumbItems or its one text, else the "/" between its elements.</summary>
    private string RenderBreadcrumbOf(ComponentNode node, BoundingBox bounds, LayoutInfo layout)
    {
        var items = node.Children.Where(child => IsComponent(child, "BreadcrumbItem")).Cast<ComponentNode>().ToList();
        if (items.Count > 0)
        {
            return RenderBreadcrumbTexts(items.Select(item => item.Text ?? string.Empty).ToList(), bounds);
        }

        if (node.Children.Count == 0)
        {
            return RenderBreadcrumbTexts(ControlHelpers.BreadcrumbTexts(node.Text), bounds);
        }

        // The children draw themselves; what is theirs to the layout is moved as this component was
        var dx = bounds.X - layout.Bounds.X;
        var svg = new StringBuilder();
        for (var i = 0; i < layout.Children.Count - 1; i++)
        {
            var child = layout.Children[i];
            var separatorX = child.Bounds.X + child.Bounds.Width + 8 + dx;
            svg.Append($"<text x=\"{N(separatorX)}\" y=\"{N(bounds.Y + (bounds.Height / 2) + 5)}\" class=\"wire-text wire-text-secondary\">/</text>");
        }

        return $"<g>{svg}</g>";
    }

    private string RenderBreadcrumbTexts(IReadOnlyList<string> items, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, height = bounds.Height;
        var currentX = x;
        var svg = new StringBuilder();

        for (var index = 0; index < items.Count; index++)
        {
            var item = items[index];
            var isLast = index == items.Count - 1;
            var textColor = isLast ? theme.Colors.Text : theme.Colors.Primary;

            svg.Append($"<text x=\"{N(currentX)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text\" style=\"fill: {textColor}\">{E(item)}</text>");
            currentX += (item.Length * 8) + 8;

            if (!isLast)
            {
                svg.Append($"<text x=\"{N(currentX)}\" y=\"{N(y + (height / 2) + 5)}\" class=\"wire-text wire-text-secondary\">/</text>");
                currentX += ControlHelpers.BreadcrumbSeparatorWidth;
            }
        }

        return $"<g>{svg}</g>";
    }

    /// <summary>
    /// A stepper of Step elements. The step marked active (or selected) is the current one; with none marked, it is
    /// the one after the completed ones.
    /// </summary>
    private string RenderSteps(List<ComponentNode> steps, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width;
        var stepWidth = width / steps.Count;
        const double circleRadius = 14;
        var stepY = y + ControlHelpers.StepperCircleY;
        var c = theme.Colors;
        var marked = steps.FindIndex(step => step.Modifiers.Active || step.Modifiers.Selected);
        double current = marked >= 0 ? marked + 1 : steps.Count(step => step.Modifiers.Completed) + 1;

        var svg = new StringBuilder();

        for (var index = 0; index < steps.Count; index++)
        {
            var step = steps[index];
            double i = index + 1;
            var stepX = x + ((i - 0.5) * stepWidth);
            var isCurrent = i == current;
            var isCompleted = !isCurrent && (step.Modifiers.Completed || i < current);

            if (i > 1)
            {
                var prevX = x + ((i - 1.5) * stepWidth);
                var lineColor = isCompleted || isCurrent ? c.Primary : c.Border;
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

            if (!string.IsNullOrEmpty(step.Text))
            {
                var labelColor = isCurrent ? c.Text : c.TextSecondary;
                svg.Append($"<text x=\"{N(stepX)}\" y=\"{N(stepY + circleRadius + 18)}\" text-anchor=\"middle\" class=\"wire-text wire-text-small\" style=\"fill: {labelColor}\">{E(step.Text!)}</text>");
            }
        }

        return $"<g>{svg}</g>";
    }

    /// <summary>The border of a table whose rows draw themselves.</summary>
    private string RenderTableFrame(BoundingBox bounds) =>
        $"<rect x=\"{N(bounds.X)}\" y=\"{N(bounds.Y)}\" width=\"{N(bounds.Width)}\" height=\"{N(bounds.Height)}\" fill=\"{theme.Colors.Background}\" stroke=\"{theme.Colors.Border}\" stroke-width=\"{N(theme.Borders.Width)}\" />";

    /// <summary>
    /// A table written as <c>| a | b |</c> lines. The rows above the first separator line are the header; without a
    /// separator there is none.
    /// </summary>
    private string RenderTableRows(IReadOnlyList<TableRowData> tableRows, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, width = bounds.Width;
        const double rowHeight = ControlHelpers.TableRowHeight;
        var c = theme.Colors;
        var separator = -1;
        double columns = 1;
        for (var i = 0; i < tableRows.Count; i++)
        {
            if (tableRows[i].IsSeparator)
            {
                separator = separator < 0 ? i : separator;
            }
            else
            {
                columns = Js.Max(columns, tableRows[i].Cells.Count);
            }
        }

        var cellWidth = width / columns;

        var svg = new StringBuilder(RenderTableFrame(bounds));
        double line = 0;

        for (var index = 0; index < tableRows.Count; index++)
        {
            var row = tableRows[index];
            if (row.IsSeparator)
            {
                continue;
            }

            var isHeader = index < separator;
            var rowY = y + (line * rowHeight);
            line++;

            svg.Append($"<rect x=\"{N(x)}\" y=\"{N(rowY)}\" width=\"{N(width)}\" height=\"{N(rowHeight)}\" fill=\"{(isHeader ? c.Surface : "transparent")}\" />");
            svg.Append($"<line x1=\"{N(x)}\" y1=\"{N(rowY + rowHeight)}\" x2=\"{N(x + width)}\" y2=\"{N(rowY + rowHeight)}\" stroke=\"{c.Border}\" stroke-width=\"1\" />");

            for (var cell = 0; cell < row.Cells.Count; cell++)
            {
                var cellX = x + (cell * cellWidth);
                if (cell > 0)
                {
                    svg.Append($"<line x1=\"{N(cellX)}\" y1=\"{N(rowY)}\" x2=\"{N(cellX)}\" y2=\"{N(rowY + rowHeight)}\" stroke=\"{c.Border}\" stroke-width=\"1\" />");
                }

                svg.Append($"<text x=\"{N(cellX + 8)}\" y=\"{N(rowY + (rowHeight / 2) + 5)}\" class=\"wire-text wire-text-small{(isHeader ? " wire-text-bold" : "")}\">{E(row.Cells[cell])}</text>");
            }
        }

        return $"<g>{svg}</g>";
    }

    /// <summary>A tree written as <c>+ branch</c> and <c>- leaf</c> lines: every line is shown, a branch as open.</summary>
    private string RenderTreeLines(IReadOnlyList<TreeItemNode> items, BoundingBox bounds)
    {
        double line = 0;
        var svg = new StringBuilder();

        void Draw(IReadOnlyList<TreeItemNode> list, double level)
        {
            foreach (var item in list)
            {
                var row = new BoundingBox(
                    bounds.X,
                    bounds.Y + ControlHelpers.TreePadding + (line * ControlHelpers.TreeItemHeight),
                    bounds.Width,
                    ControlHelpers.TreeItemHeight);
                line++;
                svg.Append(RenderTreeRow(item.Text, level, true, item.Children.Count > 0, row));
                Draw(item.Children, level + 1);
            }
        }

        Draw(items, 0);

        return svg.ToString();
    }

    /// <summary>A list: a dot and a line of text per item.</summary>
    private string RenderList(IReadOnlyList<string> items, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y;
        const double itemHeight = ControlHelpers.ListItemHeight;
        var svg = new StringBuilder();

        for (var index = 0; index < items.Count; index++)
        {
            var rowY = y + (index * itemHeight);
            svg.Append($"<circle cx=\"{N(x + 8)}\" cy=\"{N(rowY + (itemHeight / 2))}\" r=\"2.5\" fill=\"{theme.Colors.TextSecondary}\" />");
            svg.Append($"<text x=\"{N(x + 20)}\" y=\"{N(rowY + (itemHeight / 2) + 5)}\" class=\"wire-text\">{E(items[index])}</text>");
        }

        return $"<g>{svg}</g>";
    }

    /// <summary>The three-line menu button.</summary>
    private string RenderHamburger(BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y;
        var svg = new StringBuilder();

        foreach (var lineY in new double[] { 6, 12, 18 })
        {
            svg.Append($"<line x1=\"{N(x + 3)}\" y1=\"{N(y + lineY)}\" x2=\"{N(x + 21)}\" y2=\"{N(y + lineY)}\" stroke=\"{theme.Colors.Text}\" stroke-width=\"2\" stroke-linecap=\"round\" />");
        }

        return $"<g>{svg}</g>";
    }

    /// <summary>The tip of a Hover, under what it is shown for.</summary>
    private string RenderHoverTip(ComponentNode node, BoundingBox bounds)
    {
        double x = bounds.X, y = bounds.Y, height = bounds.Height;
        const double tipHeight = ControlHelpers.HoverTipHeight;
        var tipY = y + height - tipHeight;

        return "<g>\n"
            + $"      <rect x=\"{N(x)}\" y=\"{N(tipY)}\" width=\"{N(ControlHelpers.HoverTipWidth(node.Text))}\" height=\"{N(tipHeight)}\" rx=\"{N(theme.Borders.Radius)}\" fill=\"{theme.Colors.Text}\" />\n"
            + $"      <text x=\"{N(x + 8)}\" y=\"{N(tipY + (tipHeight / 2) + 4)}\" class=\"wire-text wire-text-small\" style=\"fill: {theme.Colors.Background}\">{E(Or(node.Text, "Tip"))}</text>\n"
            + "    </g>";
    }
}
