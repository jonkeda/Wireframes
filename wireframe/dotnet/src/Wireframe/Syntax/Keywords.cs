namespace Wireframe.Syntax;

/// <summary>The keyword tables and token classes of <c>lexer/tokens.ts</c>.</summary>
public static class Keywords
{
    private static readonly Dictionary<string, TokenKind> words = new(StringComparer.Ordinal)
    {
        ["wireframe"] = TokenKind.Wireframe,
        ["sketch"] = TokenKind.Identifier,
        ["blueprint"] = TokenKind.Identifier,
        ["clean"] = TokenKind.Identifier,
        ["realistic"] = TokenKind.Identifier,
        ["Grid"] = TokenKind.Grid,
        ["Vertical"] = TokenKind.Vertical,
        ["Horizontal"] = TokenKind.Horizontal,
        ["Dock"] = TokenKind.Dock,
        ["Canvas"] = TokenKind.Canvas,
        ["Scroll"] = TokenKind.Scroll,
        ["Header"] = TokenKind.Header,
        ["Footer"] = TokenKind.Footer,
        ["Sidebar"] = TokenKind.Sidebar,
        ["Content"] = TokenKind.Content,
        ["Panel"] = TokenKind.Panel,
        ["Card"] = TokenKind.Card,
        ["Toolbar"] = TokenKind.Toolbar,
        ["StatusBar"] = TokenKind.StatusBar,
        ["Modal"] = TokenKind.Modal,
        ["Drawer"] = TokenKind.Drawer,
        ["Button"] = TokenKind.Button,
        ["IconButton"] = TokenKind.IconButton,
        ["TextInput"] = TokenKind.TextInput,
        ["NumberInput"] = TokenKind.NumberInput,
        ["DateInput"] = TokenKind.DateInput,
        ["PasswordInput"] = TokenKind.PasswordInput,
        ["TextArea"] = TokenKind.TextArea,
        ["Label"] = TokenKind.Label,
        ["Heading"] = TokenKind.Heading,
        ["Link"] = TokenKind.Link,
        ["Checkbox"] = TokenKind.Checkbox,
        ["Radio"] = TokenKind.Radio,
        ["Dropdown"] = TokenKind.Dropdown,
        ["Option"] = TokenKind.Option,
        ["Separator"] = TokenKind.Separator,
        ["Spacer"] = TokenKind.Spacer,
        ["Tabs"] = TokenKind.Tabs,
        ["Tab"] = TokenKind.Tab,
        ["Expander"] = TokenKind.Expander,
        ["Tree"] = TokenKind.Tree,
        ["TreeItem"] = TokenKind.TreeItem,
        ["List"] = TokenKind.List,
        ["Menu"] = TokenKind.Menu,
        ["MenuItem"] = TokenKind.MenuItem,
        ["Hamburger"] = TokenKind.Hamburger,
        ["Breadcrumb"] = TokenKind.Breadcrumb,
        ["BreadcrumbItem"] = TokenKind.BreadcrumbItem,
        ["Pagination"] = TokenKind.Pagination,
        ["Avatar"] = TokenKind.Avatar,
        ["Badge"] = TokenKind.Badge,
        ["Progress"] = TokenKind.Progress,
        ["Slider"] = TokenKind.Slider,
        ["Switch"] = TokenKind.Switch,
        ["Chip"] = TokenKind.Chip,
        ["Accordion"] = TokenKind.Accordion,
        ["AccordionSection"] = TokenKind.AccordionSection,
        ["Stepper"] = TokenKind.Stepper,
        ["Step"] = TokenKind.Step,
        ["Dialog"] = TokenKind.Dialog,
        ["Toast"] = TokenKind.Toast,
        ["Alert"] = TokenKind.Alert,
        ["Skeleton"] = TokenKind.Skeleton,
        ["Hover"] = TokenKind.Hover,
        ["Table"] = TokenKind.Table,
        ["Row"] = TokenKind.Row,
        ["Cell"] = TokenKind.Cell,
        ["DataGrid"] = TokenKind.DataGrid,
        ["Column"] = TokenKind.Column,
        ["ColumnText"] = TokenKind.ColumnText,
        ["ColumnDate"] = TokenKind.ColumnDate,
        ["ColumnNumber"] = TokenKind.ColumnNumber,
        ["ColumnCheckbox"] = TokenKind.ColumnCheckbox,
        ["ColumnImage"] = TokenKind.ColumnImage,
        ["ColumnLink"] = TokenKind.ColumnLink,
        ["ColumnButton"] = TokenKind.ColumnButton,
        ["Icon"] = TokenKind.Icon,
        ["Image"] = TokenKind.Image,
        ["data"] = TokenKind.Data,
        ["validations"] = TokenKind.Validations,
        ["calculations"] = TokenKind.Calculations,
        ["rules"] = TokenKind.Rules,
        ["fields"] = TokenKind.Fields,
        ["component"] = TokenKind.Component,
        ["Repeat"] = TokenKind.Repeat,
        ["if"] = TokenKind.If,
        ["else"] = TokenKind.Else,
        ["primary"] = TokenKind.Primary,
        ["secondary"] = TokenKind.Secondary,
        ["required"] = TokenKind.Required,
        ["disabled"] = TokenKind.Disabled,
        ["checked"] = TokenKind.Checked,
        ["selected"] = TokenKind.Selected,
        ["readonly"] = TokenKind.Readonly,
        ["editable"] = TokenKind.Editable,
        ["active"] = TokenKind.Active,
        ["expanded"] = TokenKind.Expanded,
        ["removable"] = TokenKind.Removable,
        ["circle"] = TokenKind.Circle,
        ["indeterminate"] = TokenKind.Indeterminate,
        ["completed"] = TokenKind.Completed,
        ["border"] = TokenKind.Border,
        ["true"] = TokenKind.Boolean,
        ["false"] = TokenKind.Boolean,

        // The TypeScript table is a plain object: these words find a property it inherits from Object.prototype.
        ["constructor"] = TokenKind.PrototypeProperty,
        ["hasOwnProperty"] = TokenKind.PrototypeProperty,
        ["isPrototypeOf"] = TokenKind.PrototypeProperty,
        ["propertyIsEnumerable"] = TokenKind.PrototypeProperty,
        ["toLocaleString"] = TokenKind.PrototypeProperty,
        ["toString"] = TokenKind.PrototypeProperty,
        ["valueOf"] = TokenKind.PrototypeProperty,
        ["__proto__"] = TokenKind.PrototypeProperty,
        ["__defineGetter__"] = TokenKind.PrototypeProperty,
        ["__defineSetter__"] = TokenKind.PrototypeProperty,
        ["__lookupGetter__"] = TokenKind.PrototypeProperty,
        ["__lookupSetter__"] = TokenKind.PrototypeProperty,
    };

    private static readonly HashSet<string> closing = new(StringComparer.Ordinal)
    {
        "/wireframe", "/Grid", "/Vertical", "/Horizontal", "/Dock", "/Canvas", "/Scroll", "/Header", "/Footer",
        "/Sidebar", "/Content", "/Panel", "/Card", "/Toolbar", "/StatusBar", "/Modal", "/Drawer", "/Dropdown",
        "/Tabs", "/Tab", "/Expander", "/Tree", "/TreeItem", "/List", "/Menu", "/MenuItem", "/Hamburger",
        "/Breadcrumb", "/Accordion", "/AccordionSection", "/Stepper", "/Dialog", "/Alert", "/Hover", "/Toast",
        "/Skeleton", "/Table", "/DataGrid", "/Column", "/data", "/validations", "/calculations", "/rules",
        "/fields", "/component", "/Repeat", "/if",
    };

    /// <summary>The kind of a word, when it is a keyword (or a word the TypeScript table finds by accident).</summary>
    public static bool TryGetKeyword(string word, out TokenKind kind) => words.TryGetValue(word, out kind);

    /// <summary>Whether a closing keyword (with its slash, such as <c>/Grid</c>) is one the language knows.</summary>
    public static bool IsKnownClosingKeyword(string keyword) => closing.Contains(keyword);

    /// <summary>The kind of a known closing keyword: <c>/wireframe</c> and <c>/if</c> have their own.</summary>
    internal static TokenKind ClosingKind(string keyword) => keyword switch
    {
        "/wireframe" => TokenKind.EndWireframe,
        "/if" => TokenKind.EndIf,
        _ => TokenKind.EndBlock,
    };

    /// <summary>Grid, Vertical, Horizontal, Dock, Canvas, Scroll.</summary>
    public static bool IsLayout(TokenKind kind) => kind is TokenKind.Grid or TokenKind.Vertical or TokenKind.Horizontal
        or TokenKind.Dock or TokenKind.Canvas or TokenKind.Scroll;

    /// <summary>Header, Footer, Sidebar, Content, Panel, Card, Toolbar, StatusBar, Modal, Drawer.</summary>
    public static bool IsSection(TokenKind kind) => kind is TokenKind.Header or TokenKind.Footer or TokenKind.Sidebar
        or TokenKind.Content or TokenKind.Panel or TokenKind.Card or TokenKind.Toolbar or TokenKind.StatusBar
        or TokenKind.Modal or TokenKind.Drawer;

    /// <summary>The controls: elements without children of their own (the Dropdown has options).</summary>
    public static bool IsControl(TokenKind kind) => kind is TokenKind.Button or TokenKind.IconButton
        or TokenKind.TextInput or TokenKind.NumberInput or TokenKind.DateInput or TokenKind.PasswordInput
        or TokenKind.TextArea or TokenKind.Label or TokenKind.Heading or TokenKind.Link or TokenKind.Checkbox
        or TokenKind.Radio or TokenKind.Dropdown or TokenKind.Option or TokenKind.Separator or TokenKind.Spacer
        or TokenKind.Icon or TokenKind.Image or TokenKind.Avatar or TokenKind.Badge or TokenKind.Progress
        or TokenKind.Slider or TokenKind.Switch or TokenKind.Chip or TokenKind.Pagination or TokenKind.Toast
        or TokenKind.Skeleton;

    /// <summary>The components the parser reads (Step, BreadcrumbItem, Row, Cell and the typed columns are not among them).</summary>
    public static bool IsComponent(TokenKind kind) => kind is TokenKind.Tabs or TokenKind.Tab or TokenKind.Expander
        or TokenKind.Tree or TokenKind.TreeItem or TokenKind.List or TokenKind.Menu or TokenKind.MenuItem
        or TokenKind.Hamburger or TokenKind.Breadcrumb or TokenKind.Accordion or TokenKind.AccordionSection
        or TokenKind.Stepper or TokenKind.Dialog or TokenKind.Alert or TokenKind.Hover or TokenKind.Table
        or TokenKind.DataGrid or TokenKind.Column;

    /// <summary>The modifiers: primary, secondary, required, …</summary>
    public static bool IsModifier(TokenKind kind) => kind is TokenKind.Primary or TokenKind.Secondary
        or TokenKind.Required or TokenKind.Disabled or TokenKind.Checked or TokenKind.Selected or TokenKind.Readonly
        or TokenKind.Editable or TokenKind.Active or TokenKind.Expanded or TokenKind.Removable or TokenKind.Circle
        or TokenKind.Indeterminate or TokenKind.Completed or TokenKind.Border;

    /// <summary>The tokens that start a data section.</summary>
    public static bool IsDataSection(TokenKind kind) => kind is TokenKind.Data or TokenKind.Validations
        or TokenKind.Calculations or TokenKind.Rules or TokenKind.Fields or TokenKind.Component;
}
