namespace Wireframe.Syntax;

/// <summary>What an attribute value is.</summary>
public enum AttributeKind
{
    /// <summary>Text.</summary>
    String,
    /// <summary>A number (the value was how JavaScript writes one).</summary>
    Number,
    /// <summary><c>true</c> or <c>false</c>.</summary>
    Boolean,
}

/// <summary>The value of an attribute (<c>name=value</c>): text, a number or a boolean, as <c>ast.ts</c>'s <c>AttributeMap</c>.</summary>
public sealed record AttributeValue
{
    private AttributeValue(AttributeKind kind, string text, double number, bool boolean)
    {
        Kind = kind;
        Text = text;
        Number = number;
        Boolean = boolean;
    }

    /// <summary>What the value is.</summary>
    public AttributeKind Kind { get; }

    /// <summary>For text, the text.</summary>
    public string Text { get; }

    /// <summary>For a number, the number (it can be infinite: <c>Infinity</c> is how JavaScript writes one).</summary>
    public double Number { get; }

    /// <summary>For a boolean, the boolean.</summary>
    public bool Boolean { get; }

    /// <summary>A text value.</summary>
    public static AttributeValue FromString(string text) => new(AttributeKind.String, text, 0, false);

    /// <summary>A number value.</summary>
    public static AttributeValue FromNumber(double number) => new(AttributeKind.Number, "", number, false);

    /// <summary>A boolean value.</summary>
    public static AttributeValue FromBoolean(bool boolean) => new(AttributeKind.Boolean, "", 0, boolean);

    /// <summary>JavaScript's truthiness: not empty text, not 0, not false.</summary>
    public bool IsTruthy => Kind switch
    {
        AttributeKind.String => Text.Length > 0,
        AttributeKind.Number => Number != 0 && !double.IsNaN(Number),
        _ => Boolean,
    };

    /// <summary>JavaScript's <c>String(value)</c>.</summary>
    public override string ToString() => Kind switch
    {
        AttributeKind.String => Text,
        AttributeKind.Number => JsText.NumberToString(Number),
        _ => Boolean ? "true" : "false",
    };
}

/// <summary>The modifiers written on an element; a modifier not written is false (and left out of the JSON).</summary>
public sealed record ModifierSet
{
    /// <summary>No modifiers.</summary>
    public static ModifierSet Empty { get; } = new();

    /// <summary><c>primary</c></summary>
    public bool Primary { get; init; }
    /// <summary><c>secondary</c></summary>
    public bool Secondary { get; init; }
    /// <summary><c>required</c></summary>
    public bool Required { get; init; }
    /// <summary><c>disabled</c></summary>
    public bool Disabled { get; init; }
    /// <summary><c>checked</c></summary>
    public bool Checked { get; init; }
    /// <summary><c>selected</c></summary>
    public bool Selected { get; init; }
    /// <summary><c>readonly</c></summary>
    public bool Readonly { get; init; }
    /// <summary><c>editable</c></summary>
    public bool Editable { get; init; }
    /// <summary><c>active</c></summary>
    public bool Active { get; init; }
    /// <summary><c>expanded</c></summary>
    public bool Expanded { get; init; }
    /// <summary><c>removable</c></summary>
    public bool Removable { get; init; }
    /// <summary><c>circle</c></summary>
    public bool Circle { get; init; }
    /// <summary><c>indeterminate</c></summary>
    public bool Indeterminate { get; init; }
    /// <summary><c>completed</c></summary>
    public bool Completed { get; init; }
    /// <summary><c>border</c></summary>
    public bool Border { get; init; }
}

/// <summary>A node of the syntax tree with a place in the source.</summary>
public abstract record SyntaxNode
{
    /// <summary>The node's <c>type</c> in <c>ast.ts</c>: Document, Layout, Section, Control, …</summary>
    public abstract string Type { get; }

    /// <summary>Where the node starts.</summary>
    public SourceLocation Start { get; init; } = SourceLocation.Default;

    /// <summary>Where the node ends.</summary>
    public SourceLocation End { get; init; } = SourceLocation.Default;
}

/// <summary>The root of the tree.</summary>
public sealed record DocumentNode : SyntaxNode
{
    /// <inheritdoc />
    public override string Type => "Document";

    /// <summary>sketch, blueprint, clean or realistic.</summary>
    public string Style { get; init; } = "clean";

    /// <summary>The document attributes (<c>%name: value</c>).</summary>
    public IReadOnlyDictionary<string, string> Attributes { get; init; } = new Dictionary<string, string>();

    /// <summary>The elements of the screen.</summary>
    public IReadOnlyList<ElementNode> Children { get; init; } = Array.Empty<ElementNode>();

    /// <summary>The data sections (data, validations, …, component).</summary>
    public IReadOnlyList<DataSectionNode> DataSections { get; init; } = Array.Empty<DataSectionNode>();
}

/// <summary>An element: a layout, section, control, component, repeat or conditional.</summary>
public abstract record ElementNode : SyntaxNode
{
    /// <summary>The id (<c>:name</c>), when written.</summary>
    public string? Id { get; init; }

    /// <summary>The binding (<c>?path</c>), when written.</summary>
    public string? Binding { get; init; }

    /// <summary>The navigation target (<c>@target</c>), when written.</summary>
    public string? Navigation { get; init; }

    /// <summary>
    /// The icon (<c>$name</c>), when written. <c>ast.ts</c> declares it on controls and components only, but the
    /// TypeScript parser sets it on any element that reads modifiers, layouts, sections and repeats included.
    /// </summary>
    public string? Icon { get; init; }

    /// <summary>The attributes (<c>name=value</c>).</summary>
    public IReadOnlyDictionary<string, AttributeValue> Attributes { get; init; } = new Dictionary<string, AttributeValue>();

    /// <summary>The modifiers.</summary>
    public ModifierSet Modifiers { get; init; } = ModifierSet.Empty;
}

/// <summary>Grid, Vertical, Horizontal, Dock, Canvas or Scroll.</summary>
public sealed record LayoutNode : ElementNode
{
    /// <inheritdoc />
    public override string Type => "Layout";

    /// <summary>Which layout.</summary>
    public string LayoutType { get; init; } = "";

    /// <summary>The elements inside.</summary>
    public IReadOnlyList<ElementNode> Children { get; init; } = Array.Empty<ElementNode>();
}

/// <summary>Header, Footer, Sidebar, Content, Panel, Card, Toolbar, StatusBar, Modal or Drawer.</summary>
public sealed record SectionNode : ElementNode
{
    /// <inheritdoc />
    public override string Type => "Section";

    /// <summary>Which section.</summary>
    public string SectionType { get; init; } = "";

    /// <summary>The <c>dock</c> attribute, when it is truthy (it is not checked to be a position).</summary>
    public AttributeValue? Dock { get; init; }

    /// <summary>The elements inside.</summary>
    public IReadOnlyList<ElementNode> Children { get; init; } = Array.Empty<ElementNode>();
}

/// <summary>A control: Button, TextInput, Label, …</summary>
public sealed record ControlNode : ElementNode
{
    /// <inheritdoc />
    public override string Type => "Control";

    /// <summary>Which control.</summary>
    public string ControlType { get; init; } = "";

    /// <summary>The text, when written.</summary>
    public string? Text { get; init; }

    /// <summary>The placeholder, when written.</summary>
    public string? Placeholder { get; init; }

    /// <summary>The tooltip attribute as text, when written.</summary>
    public string? Tooltip { get; init; }

    /// <summary>The label attribute as text, when written.</summary>
    public string? Label { get; init; }

    /// <summary>For a Dropdown, its options; null when it has none written.</summary>
    public IReadOnlyList<ElementNode>? Children { get; init; }
}

/// <summary>A component: Tabs, Tree, List, Table, Dialog, …</summary>
public sealed record ComponentNode : ElementNode
{
    /// <inheritdoc />
    public override string Type => "Component";

    /// <summary>Which component.</summary>
    public string ComponentType { get; init; } = "";

    /// <summary>The text, when written.</summary>
    public string? Text { get; init; }

    /// <summary>The elements inside.</summary>
    public IReadOnlyList<ElementNode> Children { get; init; } = Array.Empty<ElementNode>();

    /// <summary>For a Table, its rows.</summary>
    public IReadOnlyList<TableRowData>? TableRows { get; init; }

    /// <summary>For a Tree written with + and -, its items.</summary>
    public IReadOnlyList<TreeItemNode>? TreeItems { get; init; }

    /// <summary>For a List, its items.</summary>
    public IReadOnlyList<string>? ListItems { get; init; }
}

/// <summary>A row of a table: its cells, and whether it is a separator row.</summary>
/// <param name="Cells">The cells, trimmed; an empty cell stays.</param>
/// <param name="IsSeparator">Whether the row is a separator (<c>|---|</c>).</param>
public sealed record TableRowData(IReadOnlyList<string> Cells, bool IsSeparator);

/// <summary>An item of a tree written with + and -.</summary>
/// <param name="Text">The item's text.</param>
/// <param name="IsBranch">Whether it was written with +.</param>
/// <param name="Children">The items below it.</param>
public sealed record TreeItemNode(string Text, bool IsBranch, IReadOnlyList<TreeItemNode> Children);

/// <summary><c>Repeat n</c>: content shown n times.</summary>
public sealed record RepeatNode : ElementNode
{
    /// <inheritdoc />
    public override string Type => "Repeat";

    /// <summary>How many times (JavaScript's <c>parseInt</c> of the number written, so it can be large or negative).</summary>
    public double Count { get; init; } = 1;

    /// <summary>The elements repeated.</summary>
    public IReadOnlyList<ElementNode> Children { get; init; } = Array.Empty<ElementNode>();
}

/// <summary><c>if</c> … <c>else</c> … <c>/if</c>.</summary>
public sealed record ConditionalNode : ElementNode
{
    /// <inheritdoc />
    public override string Type => "Conditional";

    /// <summary>The condition as written.</summary>
    public string Condition { get; init; } = "";

    /// <summary>The elements of the then branch.</summary>
    public IReadOnlyList<ElementNode> ThenChildren { get; init; } = Array.Empty<ElementNode>();

    /// <summary>The elements of the else branch, when there is one.</summary>
    public IReadOnlyList<ElementNode>? ElseChildren { get; init; }
}

/// <summary>A data section: data, validations, calculations, rules, fields or component.</summary>
public sealed record DataSectionNode : SyntaxNode
{
    /// <inheritdoc />
    public override string Type => "DataSection";

    /// <summary>Which section.</summary>
    public string SectionType { get; init; } = "";

    /// <summary>Every row as written, the header and separator included.</summary>
    public IReadOnlyList<TableRowData> Rows { get; init; } = Array.Empty<TableRowData>();

    /// <summary>The header's cells, when the first row is followed by a separator row.</summary>
    public IReadOnlyList<string>? Columns { get; init; }

    /// <summary>The rows below the header, as column name to cell.</summary>
    public IReadOnlyList<IReadOnlyDictionary<string, string>>? Records { get; init; }

    /// <summary>For a component, its name.</summary>
    public string? ComponentName { get; init; }

    /// <summary>For a component, the rest of its line.</summary>
    public string? ComponentParams { get; init; }

    /// <summary>For a component, its body.</summary>
    public IReadOnlyList<ElementNode>? ComponentBody { get; init; }
}
