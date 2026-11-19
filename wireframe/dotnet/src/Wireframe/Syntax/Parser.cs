namespace Wireframe.Syntax;

/// <summary>
/// Reads tokens into a syntax tree, as <c>parser/parser.ts</c>: it recovers from an error and goes on, and the
/// errors come with the tree.
/// </summary>
public sealed class Parser
{
    private static readonly HashSet<string> placeholderControls = new(StringComparer.Ordinal)
    {
        "TextInput", "NumberInput", "DateInput", "PasswordInput", "TextArea", "Dropdown",
    };

    private IReadOnlyList<Token> tokens = Array.Empty<Token>();
    private int current;
    private readonly List<Diagnostic> errors = new();
    private readonly HashSet<string> ids = new(StringComparer.Ordinal);
    private readonly List<string> openBlocks = new();

    /// <summary>Parse a source: the lexer's errors come first, then the parser's.</summary>
    public ParseResult Parse(string source)
    {
        var (lexed, lexerErrors) = Lexer.Tokenize(source);
        Reset(lexed);
        errors.AddRange(lexerErrors);
        return new ParseResult(ParseDocument(), errors.ToArray());
    }

    /// <summary>Parse tokens already made by the lexer.</summary>
    public ParseResult ParseTokens(IReadOnlyList<Token> tokens)
    {
        Reset(tokens);
        return new ParseResult(ParseDocument(), errors.ToArray());
    }

    private void Reset(IReadOnlyList<Token> lexed)
    {
        tokens = lexed;
        current = 0;
        errors.Clear();
        ids.Clear();
        openBlocks.Clear();
    }

    // ============ The document ============

    private sealed class DocumentParts
    {
        public string Style = "clean";
        public SourceLocation Start = SourceLocation.Default;
        public SourceLocation End = SourceLocation.Default;
        public readonly Dictionary<string, string> Attributes = new(StringComparer.Ordinal);
        public readonly List<ElementNode> Children = new();
        public readonly List<DataSectionNode> DataSections = new();

        public DocumentNode ToNode() => new()
        {
            Style = Style,
            Start = Start,
            End = End,
            Attributes = Attributes,
            Children = Children.ToArray(),
            DataSections = DataSections.ToArray(),
        };
    }

    private DocumentNode ParseDocument()
    {
        SkipNewlines();

        var doc = new DocumentParts();
        if (!Check(TokenKind.Wireframe))
        {
            ParseBody(doc, false);
            return doc.ToNode();
        }

        doc.Start = Advance().Start;

        if (Check(TokenKind.Identifier))
        {
            var style = JsLower(Advance().Value);
            if (style is "sketch" or "blueprint" or "clean" or "realistic")
            {
                doc.Style = style;
            }
            else
            {
                AddError("Unknown wireframe style: " + style);
            }
        }

        SkipNewlines();

        if (Check(TokenKind.Indent))
        {
            Advance();
            ReadDocumentAttributes(doc);
            ParseBody(doc, true);
            if (Check(TokenKind.Dedent))
            {
                Advance();
            }
        }
        else
        {
            ReadDocumentAttributes(doc);
        }

        ParseBody(doc, false);

        SkipNewlines();
        if (Check(TokenKind.EndWireframe))
        {
            doc.End = Advance().End;
        }
        else if (!IsAtEnd())
        {
            AddError("Expected /wireframe to close document");
        }

        return doc.ToNode();
    }

    private void ReadDocumentAttributes(DocumentParts doc)
    {
        while (Check(TokenKind.DocAttribute))
        {
            var token = Advance();
            if (!string.IsNullOrEmpty(token.AttributeName) && token.AttributeValue is not null)
            {
                SetProperty(doc.Attributes, token.AttributeName!, token.AttributeValue);
            }

            SkipNewlines();
        }
    }

    private static string JsLower(string text) => text.ToLowerInvariant();

    /// <summary>Set a property of what is a plain JavaScript object on the TypeScript side: there, <c>__proto__</c> is not stored.</summary>
    private static void SetProperty<T>(Dictionary<string, T> map, string key, T value)
    {
        if (key == "__proto__")
        {
            return;
        }

        map[key] = value;
    }

    private void ParseBody(DocumentParts doc, bool insideBlock)
    {
        for (; ; )
        {
            SkipNewlines();
            if (!insideBlock && (Check(TokenKind.Dedent) || Check(TokenKind.Indent)))
            {
                Advance();
                continue;
            }

            doc.Children.AddRange(ParseElements());
            SkipNewlines();

            if (Keywords.IsDataSection(Peek().Kind))
            {
                var section = ParseDataSection();
                if (section is not null)
                {
                    doc.DataSections.Add(section);
                }

                continue;
            }

            if (!insideBlock && (Check(TokenKind.Dedent) || Check(TokenKind.Indent)))
            {
                continue;
            }

            break;
        }
    }

    // ============ Elements ============

    private List<ElementNode> ParseElements()
    {
        var elements = new List<ElementNode>();

        while (!IsAtEnd())
        {
            SkipNewlines();
            if (IsAtEnd())
            {
                break;
            }

            var token = Peek();
            if (token.Kind == TokenKind.EndBlock && !IsOpenBlock(token.ClosingKeyword))
            {
                AddError(
                    Keywords.IsKnownClosingKeyword(token.Value)
                        ? $"Unexpected {token.Value}: no {token.ClosingKeyword} is open here"
                        : $"Unknown closing keyword {token.Value}",
                    token);
                Advance();
                continue;
            }

            if ((token.Kind == TokenKind.Else || token.Kind == TokenKind.EndIf) && !IsOpenBlock("if"))
            {
                AddError($"Unexpected {token.Value}: no if is open here", token);
                Advance();
                continue;
            }

            if (IsBlockEnd())
            {
                break;
            }

            var element = ParseElement();
            if (element is not null)
            {
                elements.Add(element);
            }

            SkipNewlines();
        }

        return elements;
    }

    private ElementNode? ParseElement()
    {
        var token = Peek();
        if (Keywords.IsLayout(token.Kind))
        {
            return ParseLayout();
        }

        if (Keywords.IsSection(token.Kind))
        {
            return ParseSection();
        }

        if (Keywords.IsControl(token.Kind))
        {
            return ParseControl();
        }

        if (Keywords.IsComponent(token.Kind))
        {
            return ParseComponent();
        }

        if (token.Kind == TokenKind.Repeat)
        {
            return ParseRepeat();
        }

        if (token.Kind == TokenKind.If)
        {
            return ParseConditional();
        }

        if (token.Kind is not (TokenKind.Eof or TokenKind.Newline or TokenKind.EndBlock or TokenKind.EndWireframe))
        {
            AddError("Unexpected token: " + token.Value);
            Advance();
        }

        return null;
    }

    /// <summary>What <c>parseElementModifiers</c> fills in, kept until the node is made.</summary>
    private sealed class Parts
    {
        public string? Id;
        public string? Binding;
        public string? Navigation;
        public string? Icon;
        public readonly Dictionary<string, AttributeValue> Attributes = new(StringComparer.Ordinal);
        public ModifierSet Modifiers = ModifierSet.Empty;

        public AttributeValue? Attribute(string name) => Attributes.TryGetValue(name, out var value) ? value : null;
    }

    /// <summary>The children of an indented block, or none when no indent follows.</summary>
    private IReadOnlyList<ElementNode> ParseIndentedChildren(IReadOnlyList<ElementNode> none)
    {
        if (!Check(TokenKind.Indent))
        {
            return none;
        }

        Advance();
        var children = ParseElements();
        if (Check(TokenKind.Dedent))
        {
            Advance();
        }

        return children;
    }

    private LayoutNode ParseLayout()
    {
        var token = Advance();
        var layoutType = token.Kind.ToString();
        var parts = new Parts();
        ParseElementModifiers(parts);
        SkipNewlines();

        openBlocks.Add(layoutType);
        var children = ParseIndentedChildren(Array.Empty<ElementNode>());
        var end = CloseBlock(layoutType);

        return new LayoutNode
        {
            LayoutType = layoutType,
            Start = token.Start,
            End = end,
            Children = children,
            Id = parts.Id,
            Binding = parts.Binding,
            Navigation = parts.Navigation,
            Icon = parts.Icon,
            Attributes = parts.Attributes,
            Modifiers = parts.Modifiers,
        };
    }

    private SourceLocation CloseBlock(string name)
    {
        SkipNewlines();
        var end = PreviousEnd();
        if (Check(TokenKind.EndBlock) && Peek().ClosingKeyword == name)
        {
            end = Advance().End;
        }

        var at = openBlocks.LastIndexOf(name);
        if (at >= 0)
        {
            openBlocks.RemoveAt(at);
        }

        return end;
    }

    private bool IsOpenBlock(string? name) => name is not null && openBlocks.Contains(name);

    private SectionNode ParseSection()
    {
        var token = Advance();
        var sectionType = token.Kind.ToString();
        var parts = new Parts();
        ParseElementModifiers(parts);

        var dock = parts.Attribute("dock");
        if (dock is not null && !dock.IsTruthy)
        {
            dock = null;
        }

        SkipNewlines();

        openBlocks.Add(sectionType);
        var children = ParseIndentedChildren(Array.Empty<ElementNode>());
        var end = CloseBlock(sectionType);

        return new SectionNode
        {
            SectionType = sectionType,
            Dock = dock,
            Start = token.Start,
            End = end,
            Children = children,
            Id = parts.Id,
            Binding = parts.Binding,
            Navigation = parts.Navigation,
            Icon = parts.Icon,
            Attributes = parts.Attributes,
            Modifiers = parts.Modifiers,
        };
    }

    private ControlNode ParseControl()
    {
        var token = Advance();
        var controlType = token.Kind.ToString();
        var parts = new Parts();
        string? text = null;
        string? placeholder = null;
        string? tooltip = null;
        string? label = null;
        IReadOnlyList<ElementNode>? children = null;

        if (Check(TokenKind.String))
        {
            var value = Advance().Value;
            if (placeholderControls.Contains(controlType))
            {
                placeholder = value;
            }
            else
            {
                text = value;
            }
        }

        if (controlType == "IconButton" && Check(TokenKind.IconRef))
        {
            parts.Icon = Advance().Value.Substring(1);
            if (Check(TokenKind.String))
            {
                text = Advance().Value;
            }
        }

        if (controlType == "Icon" && Check(TokenKind.IconRef))
        {
            parts.Icon = Advance().Value.Substring(1);
        }

        if (controlType == "Image" && Check(TokenKind.String))
        {
            text = Advance().Value;
        }

        ParseElementModifiers(parts);

        if (parts.Attribute("tooltip") is { } tooltipValue)
        {
            tooltip = tooltipValue.ToString();
        }

        if (parts.Attribute("label") is { } labelValue)
        {
            label = labelValue.ToString();
        }

        if (parts.Attribute("placeholder") is { } placeholderValue)
        {
            placeholder = placeholderValue.ToString();
        }

        SourceLocation end;
        if (controlType == "Dropdown")
        {
            var inlineOptions = new List<string>();
            while (Check(TokenKind.String))
            {
                inlineOptions.Add(Advance().Value);
            }

            ParseElementModifiers(parts);
            SkipNewlines();

            openBlocks.Add("Dropdown");
            if (Check(TokenKind.Indent))
            {
                children = ParseIndentedChildren(Array.Empty<ElementNode>());
            }
            else if (inlineOptions.Count > 0)
            {
                children = inlineOptions
                    .Select(option => (ElementNode)new ControlNode { ControlType = "Option", Text = option })
                    .ToArray();
            }

            end = CloseBlock("Dropdown");
        }
        else
        {
            end = PreviousEnd();
        }

        return new ControlNode
        {
            ControlType = controlType,
            Start = token.Start,
            End = end,
            Text = text,
            Placeholder = placeholder,
            Tooltip = tooltip,
            Label = label,
            Children = children,
            Id = parts.Id,
            Binding = parts.Binding,
            Navigation = parts.Navigation,
            Icon = parts.Icon,
            Attributes = parts.Attributes,
            Modifiers = parts.Modifiers,
        };
    }

    private ComponentNode ParseComponent()
    {
        var token = Advance();
        var componentType = token.Kind.ToString();
        var parts = new Parts();
        string? text = null;
        IReadOnlyList<ElementNode> children = Array.Empty<ElementNode>();
        List<TableRowData>? tableRows = null;
        IReadOnlyList<TreeItemNode>? treeItems = null;
        List<string>? listItems = null;

        if (Check(TokenKind.String))
        {
            text = Advance().Value;
        }

        ParseElementModifiers(parts);
        SkipNewlines();

        openBlocks.Add(componentType);
        if (componentType == "Table")
        {
            tableRows = new List<TableRowData>();
            if (Check(TokenKind.Indent))
            {
                Advance();
                while (Check(TokenKind.TableRow) || Check(TokenKind.TableSeparator))
                {
                    tableRows.Add(ParseTableRow(Advance()));
                    SkipNewlines();
                }

                if (Check(TokenKind.Dedent))
                {
                    Advance();
                }
            }
        }
        else if (componentType == "Tree")
        {
            if (Check(TokenKind.Indent))
            {
                Advance();
                if (Check(TokenKind.TreeBranch) || Check(TokenKind.TreeLeaf))
                {
                    treeItems = ParseTreeItems();
                }
                else
                {
                    children = ParseElements();
                }

                if (Check(TokenKind.Dedent))
                {
                    Advance();
                }
            }
        }
        else if (componentType == "List")
        {
            listItems = new List<string>();
            if (Check(TokenKind.Indent))
            {
                Advance();
                while (Check(TokenKind.TreeLeaf))
                {
                    listItems.Add(Advance().Value);
                    SkipNewlines();
                }

                if (Check(TokenKind.Dedent))
                {
                    Advance();
                }
            }
        }
        else
        {
            children = ParseIndentedChildren(children);
        }

        var end = CloseBlock(componentType);

        return new ComponentNode
        {
            ComponentType = componentType,
            Start = token.Start,
            End = end,
            Text = text,
            Children = children,
            TableRows = tableRows?.ToArray(),
            TreeItems = treeItems,
            ListItems = listItems?.ToArray(),
            Id = parts.Id,
            Binding = parts.Binding,
            Navigation = parts.Navigation,
            Icon = parts.Icon,
            Attributes = parts.Attributes,
            Modifiers = parts.Modifiers,
        };
    }

    private RepeatNode ParseRepeat()
    {
        var token = Advance();
        var parts = new Parts();
        double count = 1;

        if (Check(TokenKind.Number))
        {
            count = JsText.ParseInt(Advance().Value);
        }

        ParseElementModifiers(parts);
        SkipNewlines();

        openBlocks.Add("Repeat");
        IReadOnlyList<ElementNode> children = Array.Empty<ElementNode>();
        if (Check(TokenKind.Indent))
        {
            children = ParseIndentedChildren(children);
        }
        else
        {
            var element = ParseElement();
            if (element is not null)
            {
                children = new[] { element };
            }
        }

        var end = CloseBlock("Repeat");

        return new RepeatNode
        {
            Count = count,
            Start = token.Start,
            End = end,
            Children = children,
            Id = parts.Id,
            Binding = parts.Binding,
            Navigation = parts.Navigation,
            Icon = parts.Icon,
            Attributes = parts.Attributes,
            Modifiers = parts.Modifiers,
        };
    }

    private ConditionalNode ParseConditional()
    {
        var token = Advance();
        var condition = token.AttributeValue ?? "";
        if (condition.Length == 0)
        {
            AddError("An if needs a condition", token);
        }

        SkipNewlines();
        openBlocks.Add("if");

        var thenChildren = ParseBranch();
        IReadOnlyList<ElementNode>? elseChildren = null;

        SkipNewlines();
        if (Check(TokenKind.Else))
        {
            Advance();
            if (Check(TokenKind.If))
            {
                elseChildren = new ElementNode[] { ParseConditional() };
            }
            else
            {
                SkipNewlines();
                elseChildren = ParseBranch();
            }
        }

        SkipNewlines();
        var end = Check(TokenKind.EndIf) ? Advance().End : PreviousEnd();

        var at = openBlocks.LastIndexOf("if");
        if (at >= 0)
        {
            openBlocks.RemoveAt(at);
        }

        return new ConditionalNode
        {
            Condition = condition,
            ThenChildren = thenChildren,
            ElseChildren = elseChildren,
            Start = token.Start,
            End = end,
        };
    }

    private IReadOnlyList<ElementNode> ParseBranch() =>
        Check(TokenKind.Indent) ? ParseIndentedChildren(Array.Empty<ElementNode>()) : ParseElements();

    // ============ Data sections ============

    private DataSectionNode? ParseDataSection()
    {
        var token = Advance();
        var sectionType = token.Kind switch
        {
            TokenKind.Data => "data",
            TokenKind.Validations => "validations",
            TokenKind.Calculations => "calculations",
            TokenKind.Rules => "rules",
            TokenKind.Fields => "fields",
            TokenKind.Component => "component",
            _ => null,
        };
        if (sectionType is null)
        {
            return null;
        }

        string? componentName = null;
        string? componentParams = null;
        IReadOnlyList<ElementNode>? componentBody = null;
        var rows = new List<TableRowData>();

        if (sectionType == "component")
        {
            var header = new List<string>();
            while (!IsAtEnd() && !Check(TokenKind.Newline) && !Check(TokenKind.Indent))
            {
                header.Add(Advance().Value);
            }

            if (header.Count == 0)
            {
                AddError("A component needs a name", token);
            }
            else
            {
                componentName = header[0];
                if (header.Count > 1)
                {
                    componentParams = string.Join(" ", header.Skip(1));
                }
            }
        }

        SkipNewlines();

        openBlocks.Add(sectionType);
        if (Check(TokenKind.Indent))
        {
            Advance();
            if (sectionType == "component" && !Check(TokenKind.TableRow) && !Check(TokenKind.TableSeparator))
            {
                componentBody = ParseElements();
            }
            else
            {
                while (Check(TokenKind.TableRow) || Check(TokenKind.TableSeparator))
                {
                    rows.Add(ParseTableRow(Advance()));
                    SkipNewlines();
                }
            }

            if (Check(TokenKind.Dedent))
            {
                Advance();
            }
        }

        // A table whose first row is followed by a separator row has a header
        IReadOnlyList<string>? columns = null;
        List<IReadOnlyDictionary<string, string>>? records = null;
        if (rows.Count >= 2 && !rows[0].IsSeparator && rows[1].IsSeparator)
        {
            var headerRow = rows[0];
            columns = headerRow.Cells;
            records = new List<IReadOnlyDictionary<string, string>>();
            foreach (var row in rows.Skip(2).Where(row => !row.IsSeparator))
            {
                if (row.Cells.Count > headerRow.Cells.Count)
                {
                    AddError($"A row has {row.Cells.Count} cells, the header {headerRow.Cells.Count}: {string.Join(" | ", row.Cells)}");
                }

                var record = new Dictionary<string, string>(StringComparer.Ordinal);
                for (var i = 0; i < headerRow.Cells.Count; i++)
                {
                    SetProperty(record, headerRow.Cells[i], i < row.Cells.Count ? row.Cells[i] : "");
                }

                records.Add(record);
            }
        }

        var end = CloseBlock(sectionType);

        return new DataSectionNode
        {
            SectionType = sectionType,
            Start = token.Start,
            End = end,
            Rows = rows.ToArray(),
            Columns = columns,
            Records = records?.ToArray(),
            ComponentName = componentName,
            ComponentParams = componentParams,
            ComponentBody = componentBody,
        };
    }

    private static TableRowData ParseTableRow(Token token)
    {
        var isSeparator = token.Kind == TokenKind.TableSeparator;
        var value = JsText.Trim(token.Value);
        if (value.StartsWith("|", StringComparison.Ordinal))
        {
            value = value.Substring(1);
        }

        if (value.EndsWith("|", StringComparison.Ordinal))
        {
            value = value.Substring(0, value.Length - 1);
        }

        var cells = value.Split('|').Select(JsText.Trim).ToArray();
        return new TableRowData(cells, isSeparator);
    }

    private List<TreeItemNode> ParseTreeItems()
    {
        var items = new List<TreeItemNode>();
        while (Check(TokenKind.TreeBranch) || Check(TokenKind.TreeLeaf))
        {
            var token = Advance();
            IReadOnlyList<TreeItemNode> children = Array.Empty<TreeItemNode>();
            SkipNewlines();

            if (Check(TokenKind.Indent))
            {
                Advance();
                children = ParseTreeItems();
                if (Check(TokenKind.Dedent))
                {
                    Advance();
                }
            }

            items.Add(new TreeItemNode(token.Value, token.Kind == TokenKind.TreeBranch, children));
            SkipNewlines();
        }

        return items;
    }

    // ============ Modifiers and attributes ============

    private void ParseElementModifiers(Parts node)
    {
        while (!IsAtEnd() && !Check(TokenKind.Newline) && !Check(TokenKind.Indent))
        {
            var token = Peek();

            switch (token.Kind)
            {
                case TokenKind.Id:
                {
                    Advance();
                    var id = token.Value.Substring(1);
                    if (!ids.Add(id))
                    {
                        AddError("Duplicate ID: " + id, token);
                    }

                    node.Id = id;
                    continue;
                }

                case TokenKind.Binding:
                    Advance();
                    node.Binding = token.Value.Substring(1);
                    continue;

                case TokenKind.Navigation:
                    Advance();
                    node.Navigation = token.Value.Substring(1);
                    continue;

                case TokenKind.Attribute:
                {
                    Advance();
                    if (!string.IsNullOrEmpty(token.AttributeName) && token.AttributeValue is { } raw)
                    {
                        AttributeValue value;
                        if (JsText.TryCanonicalNumber(raw, out var number))
                        {
                            value = AttributeValue.FromNumber(number);
                        }
                        else if (raw == "true")
                        {
                            value = AttributeValue.FromBoolean(true);
                        }
                        else if (raw == "false")
                        {
                            value = AttributeValue.FromBoolean(false);
                        }
                        else
                        {
                            value = AttributeValue.FromString(raw);
                        }

                        SetProperty(node.Attributes, token.AttributeName!, value);
                    }

                    continue;
                }

                case TokenKind.IconRef:
                {
                    Advance();
                    var icon = token.Value.Substring(1);
                    if (icon.StartsWith("icon:", StringComparison.Ordinal))
                    {
                        icon = icon.Substring(5);
                    }

                    node.Icon = icon;
                    continue;
                }
            }

            if (Keywords.IsModifier(token.Kind))
            {
                Advance();
                node.Modifiers = WithModifier(node.Modifiers, token.Kind);
                continue;
            }

            // A string, a number or anything else ends the modifiers
            break;
        }
    }

    private static ModifierSet WithModifier(ModifierSet set, TokenKind kind) => kind switch
    {
        TokenKind.Primary => set with { Primary = true },
        TokenKind.Secondary => set with { Secondary = true },
        TokenKind.Required => set with { Required = true },
        TokenKind.Disabled => set with { Disabled = true },
        TokenKind.Checked => set with { Checked = true },
        TokenKind.Selected => set with { Selected = true },
        TokenKind.Readonly => set with { Readonly = true },
        TokenKind.Editable => set with { Editable = true },
        TokenKind.Active => set with { Active = true },
        TokenKind.Expanded => set with { Expanded = true },
        TokenKind.Removable => set with { Removable = true },
        TokenKind.Circle => set with { Circle = true },
        TokenKind.Indeterminate => set with { Indeterminate = true },
        TokenKind.Completed => set with { Completed = true },
        TokenKind.Border => set with { Border = true },
        _ => set,
    };

    // ============ Tokens ============

    private bool IsAtEnd() => Peek().Kind == TokenKind.Eof;

    private bool IsBlockEnd()
    {
        var kind = Peek().Kind;
        return kind is TokenKind.EndBlock or TokenKind.EndWireframe or TokenKind.Dedent or TokenKind.Else
            or TokenKind.EndIf || Keywords.IsDataSection(kind);
    }

    private static readonly Token missing =
        new(TokenKind.Eof, "", SourceLocation.Default, SourceLocation.Default);

    private Token Peek() => current < tokens.Count ? tokens[current] : missing;

    private Token Previous() => current - 1 >= 0 && current - 1 < tokens.Count ? tokens[current - 1] : Peek();

    private SourceLocation PreviousEnd() => Previous().End;

    private Token Advance()
    {
        if (!IsAtEnd())
        {
            current++;
        }

        return Previous();
    }

    private bool Check(TokenKind kind) => Peek().Kind == kind;

    private void SkipNewlines()
    {
        while (Check(TokenKind.Newline))
        {
            Advance();
        }
    }

    private void AddError(string message, Token? token = null) =>
        errors.Add(Diagnostic.At(message, token?.Start ?? Peek().Start));
}
