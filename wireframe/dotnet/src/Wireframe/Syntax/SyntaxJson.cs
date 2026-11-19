namespace Wireframe.Syntax;

/// <summary>
/// Writes a syntax tree and diagnostics as JSON text, byte for byte as the conformance set's script writes them
/// (<c>JSON.stringify(sorted(value), null, 2)</c> and a line feed): the same field names as <c>ast.ts</c>, keys in
/// order, fields the TypeScript tree leaves undefined left out.
/// </summary>
public static class SyntaxJson
{
    /// <summary>The tree as JSON text; <c>null</c> and a line feed when there is no document.</summary>
    public static string Write(DocumentNode? document) => JsJson.Write(document is null ? null : Document(document)) + "\n";

    /// <summary>The diagnostics as JSON text: an array of <c>{column, line, message}</c>, and a line feed.</summary>
    public static string Write(IEnumerable<Diagnostic> diagnostics)
    {
        if (diagnostics is null)
        {
            throw new ArgumentNullException(nameof(diagnostics));
        }

        var items = diagnostics
            .Select(d => (object?)new JsJson.Obj().Add("message", d.Message).Add("line", d.Line).Add("column", d.Column))
            .ToList();
        return JsJson.Write(items) + "\n";
    }

    private static object? Opt(string? value) => value is null ? JsJson.Undefined : value;

    private static JsJson.Obj Location(SourceLocation location) =>
        new JsJson.Obj().Add("line", location.Line).Add("column", location.Column).Add("offset", location.Offset);

    private static JsJson.Obj Document(DocumentNode node)
    {
        var attributes = new JsJson.Obj();
        foreach (var pair in node.Attributes)
        {
            attributes.Add(pair.Key, pair.Value);
        }

        return Base(node)
            .Add("style", node.Style)
            .Add("attributes", attributes)
            .Add("children", node.Children.Select(Element).ToList())
            .Add("dataSections", node.DataSections.Select(DataSection).ToList());
    }

    private static JsJson.Obj Base(SyntaxNode node) =>
        new JsJson.Obj().Add("type", node.Type).Add("start", Location(node.Start)).Add("end", Location(node.End));

    private static object? Attribute(AttributeValue value) => value.Kind switch
    {
        AttributeKind.String => value.Text,
        AttributeKind.Number => value.Number,
        _ => value.Boolean,
    };

    private static JsJson.Obj Modifiers(ModifierSet m)
    {
        var obj = new JsJson.Obj();
        void Flag(string name, bool on)
        {
            if (on)
            {
                obj.Add(name, true);
            }
        }

        Flag("primary", m.Primary);
        Flag("secondary", m.Secondary);
        Flag("required", m.Required);
        Flag("disabled", m.Disabled);
        Flag("checked", m.Checked);
        Flag("selected", m.Selected);
        Flag("readonly", m.Readonly);
        Flag("editable", m.Editable);
        Flag("active", m.Active);
        Flag("expanded", m.Expanded);
        Flag("removable", m.Removable);
        Flag("circle", m.Circle);
        Flag("indeterminate", m.Indeterminate);
        Flag("completed", m.Completed);
        Flag("border", m.Border);
        return obj;
    }

    private static List<object?> Elements(IReadOnlyList<ElementNode> elements) => elements.Select(Element).ToList();

    private static object? Element(ElementNode node)
    {
        var attributes = new JsJson.Obj();
        foreach (var pair in node.Attributes)
        {
            attributes.Add(pair.Key, Attribute(pair.Value));
        }

        var obj = Base(node)
            .Add("id", Opt(node.Id))
            .Add("binding", Opt(node.Binding))
            .Add("navigation", Opt(node.Navigation))
            .Add("icon", Opt(node.Icon))
            .Add("attributes", attributes)
            .Add("modifiers", Modifiers(node.Modifiers));

        switch (node)
        {
            case LayoutNode layout:
                obj.Add("layoutType", layout.LayoutType).Add("children", Elements(layout.Children));
                break;
            case SectionNode section:
                obj.Add("sectionType", section.SectionType)
                    .Add("dock", section.Dock is null ? JsJson.Undefined : Attribute(section.Dock))
                    .Add("children", Elements(section.Children));
                break;
            case ControlNode control:
                obj.Add("controlType", control.ControlType)
                    .Add("text", Opt(control.Text))
                    .Add("placeholder", Opt(control.Placeholder))
                    .Add("tooltip", Opt(control.Tooltip))
                    .Add("label", Opt(control.Label))
                    .Add("children", control.Children is null ? JsJson.Undefined : Elements(control.Children));
                break;
            case ComponentNode component:
                obj.Add("componentType", component.ComponentType)
                    .Add("text", Opt(component.Text))
                    .Add("children", Elements(component.Children))
                    .Add("tableRows", component.TableRows is null ? JsJson.Undefined : component.TableRows.Select(Row).ToList())
                    .Add("treeItems", component.TreeItems is null ? JsJson.Undefined : component.TreeItems.Select(TreeItem).ToList())
                    .Add("listItems", component.ListItems is null ? JsJson.Undefined : component.ListItems.ToList());
                break;
            case RepeatNode repeat:
                obj.Add("count", repeat.Count).Add("children", Elements(repeat.Children));
                break;
            case ConditionalNode conditional:
                obj.Add("condition", conditional.Condition)
                    .Add("thenChildren", Elements(conditional.ThenChildren))
                    .Add("elseChildren", conditional.ElseChildren is null ? JsJson.Undefined : Elements(conditional.ElseChildren));
                break;
        }

        return obj;
    }

    private static object? Row(TableRowData row) =>
        new JsJson.Obj().Add("cells", row.Cells.ToList()).Add("isSeparator", row.IsSeparator);

    private static object? TreeItem(TreeItemNode item) =>
        new JsJson.Obj().Add("text", item.Text).Add("isBranch", item.IsBranch)
            .Add("children", item.Children.Select(TreeItem).ToList());

    private static object? DataSection(DataSectionNode node)
    {
        return Base(node)
            .Add("sectionType", node.SectionType)
            .Add("rows", node.Rows.Select(Row).ToList())
            .Add("columns", node.Columns is null ? JsJson.Undefined : node.Columns.ToList())
            .Add("records", node.Records is null ? JsJson.Undefined : node.Records.Select(Record).ToList())
            .Add("componentName", Opt(node.ComponentName))
            .Add("componentParams", Opt(node.ComponentParams))
            .Add("componentBody", node.ComponentBody is null ? JsJson.Undefined : Elements(node.ComponentBody));
    }

    private static object? Record(IReadOnlyDictionary<string, string> record)
    {
        var obj = new JsJson.Obj();
        foreach (var pair in record)
        {
            obj.Add(pair.Key, pair.Value);
        }

        return obj;
    }
}
