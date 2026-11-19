namespace Wireframe.Syntax;

/// <summary>The kinds of token the lexer gives, as <c>TokenType</c> in <c>lexer/tokens.ts</c>.</summary>
public enum TokenKind
{
    /// <summary><c>wireframe</c></summary>
    Wireframe,
    /// <summary><c>/wireframe</c></summary>
    EndWireframe,

    /// <summary><c>Grid</c></summary>
    Grid,
    /// <summary><c>Vertical</c></summary>
    Vertical,
    /// <summary><c>Horizontal</c></summary>
    Horizontal,
    /// <summary><c>Dock</c></summary>
    Dock,
    /// <summary><c>Canvas</c></summary>
    Canvas,
    /// <summary><c>Scroll</c></summary>
    Scroll,

    /// <summary><c>Header</c></summary>
    Header,
    /// <summary><c>Footer</c></summary>
    Footer,
    /// <summary><c>Sidebar</c></summary>
    Sidebar,
    /// <summary><c>Content</c></summary>
    Content,
    /// <summary><c>Panel</c></summary>
    Panel,
    /// <summary><c>Card</c></summary>
    Card,
    /// <summary><c>Toolbar</c></summary>
    Toolbar,
    /// <summary><c>StatusBar</c></summary>
    StatusBar,
    /// <summary><c>Modal</c></summary>
    Modal,
    /// <summary><c>Drawer</c></summary>
    Drawer,

    /// <summary><c>Button</c></summary>
    Button,
    /// <summary><c>IconButton</c></summary>
    IconButton,
    /// <summary><c>TextInput</c></summary>
    TextInput,
    /// <summary><c>NumberInput</c></summary>
    NumberInput,
    /// <summary><c>DateInput</c></summary>
    DateInput,
    /// <summary><c>PasswordInput</c></summary>
    PasswordInput,
    /// <summary><c>TextArea</c></summary>
    TextArea,
    /// <summary><c>Label</c></summary>
    Label,
    /// <summary><c>Heading</c></summary>
    Heading,
    /// <summary><c>Link</c></summary>
    Link,
    /// <summary><c>Checkbox</c></summary>
    Checkbox,
    /// <summary><c>Radio</c></summary>
    Radio,
    /// <summary><c>Dropdown</c></summary>
    Dropdown,
    /// <summary><c>Option</c></summary>
    Option,
    /// <summary><c>Separator</c></summary>
    Separator,
    /// <summary><c>Spacer</c></summary>
    Spacer,

    /// <summary><c>Tabs</c></summary>
    Tabs,
    /// <summary><c>Tab</c></summary>
    Tab,
    /// <summary><c>Expander</c></summary>
    Expander,
    /// <summary><c>Tree</c></summary>
    Tree,
    /// <summary><c>TreeItem</c></summary>
    TreeItem,
    /// <summary><c>List</c></summary>
    List,
    /// <summary><c>Menu</c></summary>
    Menu,
    /// <summary><c>MenuItem</c></summary>
    MenuItem,
    /// <summary><c>Hamburger</c></summary>
    Hamburger,
    /// <summary><c>Breadcrumb</c></summary>
    Breadcrumb,
    /// <summary><c>BreadcrumbItem</c></summary>
    BreadcrumbItem,
    /// <summary><c>Pagination</c></summary>
    Pagination,
    /// <summary><c>Avatar</c></summary>
    Avatar,
    /// <summary><c>Badge</c></summary>
    Badge,
    /// <summary><c>Progress</c></summary>
    Progress,
    /// <summary><c>Slider</c></summary>
    Slider,
    /// <summary><c>Switch</c></summary>
    Switch,
    /// <summary><c>Chip</c></summary>
    Chip,
    /// <summary><c>Accordion</c></summary>
    Accordion,
    /// <summary><c>AccordionSection</c></summary>
    AccordionSection,
    /// <summary><c>Stepper</c></summary>
    Stepper,
    /// <summary><c>Step</c></summary>
    Step,
    /// <summary><c>Dialog</c></summary>
    Dialog,
    /// <summary><c>Toast</c></summary>
    Toast,
    /// <summary><c>Alert</c></summary>
    Alert,
    /// <summary><c>Skeleton</c></summary>
    Skeleton,
    /// <summary><c>Hover</c></summary>
    Hover,
    /// <summary><c>Table</c></summary>
    Table,
    /// <summary><c>Row</c></summary>
    Row,
    /// <summary><c>Cell</c></summary>
    Cell,
    /// <summary><c>DataGrid</c></summary>
    DataGrid,
    /// <summary><c>Column</c></summary>
    Column,
    /// <summary><c>ColumnText</c></summary>
    ColumnText,
    /// <summary><c>ColumnDate</c></summary>
    ColumnDate,
    /// <summary><c>ColumnNumber</c></summary>
    ColumnNumber,
    /// <summary><c>ColumnCheckbox</c></summary>
    ColumnCheckbox,
    /// <summary><c>ColumnImage</c></summary>
    ColumnImage,
    /// <summary><c>ColumnLink</c></summary>
    ColumnLink,
    /// <summary><c>ColumnButton</c></summary>
    ColumnButton,

    /// <summary><c>Icon</c></summary>
    Icon,
    /// <summary><c>Image</c></summary>
    Image,

    /// <summary><c>data</c></summary>
    Data,
    /// <summary><c>validations</c></summary>
    Validations,
    /// <summary><c>calculations</c></summary>
    Calculations,
    /// <summary><c>rules</c></summary>
    Rules,
    /// <summary><c>fields</c></summary>
    Fields,
    /// <summary><c>component</c></summary>
    Component,

    /// <summary><c>Repeat</c></summary>
    Repeat,

    /// <summary>Not given by the lexer; kept because the TypeScript has it.</summary>
    Desktop,
    /// <summary>Not given by the lexer; kept because the TypeScript has it.</summary>
    Tablet,
    /// <summary>Not given by the lexer; kept because the TypeScript has it.</summary>
    Mobile,

    /// <summary><c>if</c>, with the rest of the line as its condition.</summary>
    If,
    /// <summary><c>else</c></summary>
    Else,
    /// <summary>Not given by the lexer; kept because the TypeScript has it.</summary>
    ElseIf,
    /// <summary><c>/if</c></summary>
    EndIf,

    /// <summary><c>:identifier</c></summary>
    Id,
    /// <summary><c>?binding</c></summary>
    Binding,
    /// <summary><c>@target</c></summary>
    Navigation,
    /// <summary><c>$icon</c></summary>
    IconRef,
    /// <summary><c>name=value</c></summary>
    Attribute,
    /// <summary>A quoted string.</summary>
    String,
    /// <summary><c>123</c>, <c>12.5</c>, <c>50%</c></summary>
    Number,
    /// <summary><c>true</c>, <c>false</c></summary>
    Boolean,
    /// <summary>Any other word.</summary>
    Identifier,

    /// <summary><c>primary</c></summary>
    Primary,
    /// <summary><c>secondary</c></summary>
    Secondary,
    /// <summary><c>required</c></summary>
    Required,
    /// <summary><c>disabled</c></summary>
    Disabled,
    /// <summary><c>checked</c></summary>
    Checked,
    /// <summary><c>selected</c></summary>
    Selected,
    /// <summary><c>readonly</c></summary>
    Readonly,
    /// <summary><c>editable</c></summary>
    Editable,
    /// <summary><c>active</c></summary>
    Active,
    /// <summary><c>expanded</c></summary>
    Expanded,
    /// <summary><c>removable</c></summary>
    Removable,
    /// <summary><c>circle</c></summary>
    Circle,
    /// <summary><c>indeterminate</c></summary>
    Indeterminate,
    /// <summary><c>completed</c></summary>
    Completed,
    /// <summary><c>border</c></summary>
    Border,

    /// <summary><c>| col | col |</c></summary>
    TableRow,
    /// <summary><c>|---|---|</c></summary>
    TableSeparator,

    /// <summary><c>+ text</c> as the first token of a line.</summary>
    TreeBranch,
    /// <summary><c>- text</c> as the first token of a line.</summary>
    TreeLeaf,

    /// <summary><c>/Keyword</c>, known or not.</summary>
    EndBlock,

    /// <summary><c>%name: value</c></summary>
    DocAttribute,

    /// <summary><c>// …</c> (only when comments are asked for).</summary>
    Comment,
    /// <summary><c>/* … */</c> (only when comments are asked for).</summary>
    MultilineComment,

    /// <summary>A line end.</summary>
    Newline,
    /// <summary>The indentation grew.</summary>
    Indent,
    /// <summary>The indentation shrank by one level.</summary>
    Dedent,
    /// <summary>The end of the source.</summary>
    Eof,

    /// <summary>Not given by the lexer; kept because the TypeScript has it.</summary>
    Error,

    /// <summary>
    /// A word that is the name of a property of JavaScript's <c>Object.prototype</c> (<c>constructor</c>,
    /// <c>toString</c>, …). The TypeScript lexer looks words up in a plain object, finds the inherited property and
    /// gives a token whose type is neither a keyword nor <c>IDENTIFIER</c>; this kind stands for that token.
    /// </summary>
    PrototypeProperty,
}
