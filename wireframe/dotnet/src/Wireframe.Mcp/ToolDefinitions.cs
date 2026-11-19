using System.Text.Json;

namespace Wireframe.Mcp;

/// <summary>The arguments of one call, read with the words a model can act on when one is wrong.</summary>
internal sealed class ToolArgs
{
    private readonly JsonElement? arguments;

    public ToolArgs(JsonElement? arguments) => this.arguments = arguments;

    /// <summary>Refuse an argument the tool does not take, so a misspelled one is not silently ignored.</summary>
    public void Allow(params string[] names)
    {
        if (arguments is not { } args)
        {
            return;
        }

        foreach (var property in args.EnumerateObject())
        {
            if (!names.Contains(property.Name))
            {
                throw new ToolInputException($"unknown argument \"{property.Name}\"; this tool takes " + (names.Length == 0 ? "none" : string.Join(", ", names)));
            }
        }
    }

    private JsonElement? Get(string name) =>
        arguments is { } args && args.TryGetProperty(name, out var value) && value.ValueKind != JsonValueKind.Null ? value : null;

    public string? String(string name)
    {
        if (Get(name) is not { } value)
        {
            return null;
        }

        if (value.ValueKind == JsonValueKind.Number && name == "block")
        {
            return value.GetRawText();
        }

        return value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : throw new ToolInputException($"{name} must be a string");
    }

    public bool? Bool(string name)
    {
        if (Get(name) is not { } value)
        {
            return null;
        }

        return value.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            _ => throw new ToolInputException($"{name} must be true or false"),
        };
    }

    public int? PositiveInt(string name)
    {
        if (Get(name) is not { } value)
        {
            return null;
        }

        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var n) && n > 0)
        {
            return n;
        }

        throw new ToolInputException($"{name} must be a positive whole number of pixels");
    }
}

/// <summary>The tools as <c>tools/list</c> gives them: names, descriptions and input schemas for a model that has
/// never seen the language.</summary>
public sealed partial class WireframeTools
{
    private const string ThemeSchema = """
        "theme": { "type": "string", "enum": ["clean", "sketch", "blueprint", "realistic"], "description": "The drawing style. Default: the wireframe's own header (a first line 'wireframe sketch'), else clean." }
        """;

    private const string WidthSchema = """
        "width": { "type": "integer", "minimum": 1, "description": "The SVG's width in pixels. Default: fits the content, 800 at most." }
        """;

    private const string PathSchema = """
        "path": { "type": "string", "description": "A file, relative to the folder the server works in (or absolute, under it): a .wire file, or a Markdown document (.md, .markdown) holding ```wireframe code blocks." }
        """;

    private const string BlockSchema = """
        "block": { "type": "string", "description": "For a Markdown path: which ```wireframe block, by its id (a fence written ```wireframe id=login) or its number in the document (1 for the first). Not needed when the document has one block." }
        """;

    private const string SourceSchema = """
        "source": { "type": "string", "description": "The wireframe's text, for example: wireframe clean\n    Vertical gap=16\n        TextInput \"Email\" :email required\n        Button \"Sign in\" primary\n    /Vertical\n/wireframe\nIndentation nests elements. Give either source or path." }
        """;

    private static readonly (string Name, string Title, string Description, string Schema, bool ReadOnly)[] Definitions =
    {
        (
            "wireframe_validate",
            "Check a wireframe for errors",
            "Check a wireframe for errors without drawing it. Give the wireframe's text as source, or a file as path: a .wire file, "
            + "or a Markdown document whose ```wireframe blocks are all checked (or only the one named by block). "
            + "Returns every error, one per line, as file(line,column): error: message; for a Markdown document the line and column are the document's. "
            + "isError is true when there are errors. Writes nothing.",
            "{ \"type\": \"object\", \"properties\": { " + SourceSchema + ", " + PathSchema + ", " + BlockSchema + " }, \"additionalProperties\": false }",
            true),
        (
            "wireframe_render",
            "Draw a wireframe as SVG",
            "Draw a wireframe as an SVG picture. Give source (the wireframe's text) or path (a .wire file, or a Markdown document with block naming one of its ```wireframe blocks). "
            + "Errors come first, as file(line,column): error: message; a wireframe with errors gives no picture unless force is true. "
            + "Returns the SVG as text; with image: true also as an image item (image/svg+xml). By default nothing is written to disk. "
            + "With write: true the SVG file is written (login.wire -> login.svg; block login of spec.md -> spec.login.svg beside it; a source -> output) "
            + "and the result gives its path instead of the SVG text.",
            "{ \"type\": \"object\", \"properties\": { " + SourceSchema + ", " + PathSchema + ", " + BlockSchema + ", " + ThemeSchema + ", " + WidthSchema + ", "
            + "\"height\": { \"type\": \"integer\", \"minimum\": 1, \"description\": \"The SVG's least height in pixels. Default: fits the content.\" }, "
            + "\"write\": { \"type\": \"boolean\", \"default\": false, \"description\": \"Write the SVG file: beside the .wire file or the Markdown document, or for a source to output. Only .svg files are written.\" }, "
            + "\"output\": { \"type\": \"string\", \"description\": \"With source and write: the .svg file to write, relative to the folder the server works in.\" }, "
            + "\"force\": { \"type\": \"boolean\", \"default\": false, \"description\": \"Draw (and write) even when the wireframe has errors; the errors are still reported and isError is true.\" }, "
            + "\"image\": { \"type\": \"boolean\", \"default\": false, \"description\": \"Also give the picture as an image item (image/svg+xml). Only for a client known to take SVG images: a model takes PNG, JPEG, GIF and WebP, and a request that carries an SVG image may fail.\" } "
            + "}, \"additionalProperties\": false }",
            false),
        (
            "wireframe_render_document",
            "Render every wireframe of a Markdown document",
            "Render every ```wireframe block of a Markdown document, as the command 'wire <file.md>' does. Each block's SVG is written beside the document: "
            + "<document>.<id>.svg for a block with an id (```wireframe id=login), else <document>.<n>.svg with n the block's number. "
            + "An SVG that would not change is not rewritten; the SVG of a block that is gone is deleted (only SVGs wire wrote for this document). "
            + "With link: true an image line is written under each block in the document, between <!-- wire:image --> markers. "
            + "Returns the errors (with the document's line and column) and what happened to each SVG. isError is true when a block has errors.",
            "{ \"type\": \"object\", \"properties\": { "
            + "\"path\": { \"type\": \"string\", \"description\": \"The Markdown document (.md, .markdown), relative to the folder the server works in.\" }, "
            + ThemeSchema + ", " + WidthSchema + ", "
            + "\"link\": { \"type\": \"boolean\", \"default\": false, \"description\": \"Also write an image line under each block in the document, so the document shows its pictures.\" } "
            + "}, \"required\": [\"path\"], \"additionalProperties\": false }",
            false),
        (
            "wireframe_check",
            "Find missing or stale SVGs",
            "Find the SVG files that are missing or stale (their wireframe or the options changed since they were written). "
            + "For a Markdown document: its blocks' SVGs; for a .wire file: its .svg; for a folder: every .wire and Markdown file under it "
            + "(hidden folders, node_modules, bin and obj are skipped). Writes nothing. Give the theme and width the SVGs were rendered with. "
            + "isError is true when anything is missing, stale or has errors.",
            "{ \"type\": \"object\", \"properties\": { "
            + "\"path\": { \"type\": \"string\", \"description\": \"A file or a folder, relative to the folder the server works in. Default: that whole folder.\" }, "
            + ThemeSchema + ", " + WidthSchema
            + " }, \"additionalProperties\": false }",
            true),
        (
            "wireframe_components",
            "The elements of the language",
            "The elements of the Wireframe language. Without name: every layout, section, control, component, modifier and theme, one line per kind. "
            + "With name (a keyword such as Button, Card, Grid, Table; case matters): what it is, how it is written, what it may hold, "
            + "the attributes the documentation's examples give it, and a short example.",
            "{ \"type\": \"object\", \"properties\": { "
            + "\"name\": { \"type\": \"string\", \"description\": \"One keyword, as written in a wireframe: Button, TextInput, Card, Grid, Table, Tabs.\" } "
            + "}, \"additionalProperties\": false }",
            true),
        (
            "wireframe_examples",
            "Working examples to start from",
            "Up to three complete, working wireframes from the language's documentation that fit a word, such as form, table, dialog, login, dashboard, sidebar or tabs. "
            + "Without about: the titles of all examples.",
            "{ \"type\": \"object\", \"properties\": { "
            + "\"about\": { \"type\": \"string\", \"description\": \"A word for what the example should show: form, table, dialog, login, navigation, dashboard.\" } "
            + "}, \"additionalProperties\": false }",
            true),
    };

    /// <summary>Write the result of <c>tools/list</c>.</summary>
    public void WriteList(Utf8JsonWriter json)
    {
        ArgumentNullException.ThrowIfNull(json);
        json.WriteStartObject();
        json.WriteStartArray("tools");
        foreach (var (name, title, description, schema, readOnly) in Definitions)
        {
            json.WriteStartObject();
            json.WriteString("name", name);
            json.WriteString("title", title);
            json.WriteString("description", description);
            json.WritePropertyName("inputSchema");
            using (var document = JsonDocument.Parse(schema))
            {
                document.RootElement.WriteTo(json);
            }

            json.WriteStartObject("annotations");
            json.WriteString("title", title);
            json.WriteBoolean("readOnlyHint", readOnly);
            if (!readOnly)
            {
                json.WriteBoolean("destructiveHint", name == "wireframe_render_document");
                json.WriteBoolean("idempotentHint", true);
            }

            json.WriteBoolean("openWorldHint", false);
            json.WriteEndObject();
            json.WriteEndObject();
        }

        json.WriteEndArray();
        json.WriteEndObject();
    }
}
