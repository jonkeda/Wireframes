using Wireframe.Syntax;

namespace Wireframe.Cli;

/// <summary>One keyword of the language, as <c>wire components</c> lists it.</summary>
/// <param name="Name">The word as written (<c>Button</c>, <c>data</c>).</param>
/// <param name="Kind">layout, section, control, component, data, part or flow.</param>
/// <param name="Closes">Whether it has a closing keyword (<c>/Card</c>), so it holds children.</param>
public sealed record ComponentInfo(string Name, string Kind, bool Closes);

/// <summary><c>wire components</c>: the language's keywords, from the parser's own tables.</summary>
public static class Components
{
    /// <summary>The kinds, in the order they are listed.</summary>
    public static readonly string[] Kinds = { "layout", "section", "control", "component", "part", "flow", "data" };

    /// <summary>Every element keyword the parser knows, with its kind.</summary>
    public static IReadOnlyList<ComponentInfo> All()
    {
        var list = new List<ComponentInfo>();
        foreach (var kind in Enum.GetValues<TokenKind>())
        {
            if (kind is TokenKind.Wireframe or TokenKind.Boolean or TokenKind.PrototypeProperty || Keywords.IsModifier(kind))
            {
                continue;
            }

            var word = WordOf(kind);
            if (word is null)
            {
                continue;
            }

            var category =
                Keywords.IsLayout(kind) ? "layout" :
                Keywords.IsSection(kind) ? "section" :
                Keywords.IsControl(kind) ? "control" :
                Keywords.IsComponent(kind) ? "component" :
                Keywords.IsDataSection(kind) ? "data" :
                kind is TokenKind.Repeat or TokenKind.If or TokenKind.Else ? "flow" : "part";
            list.Add(new ComponentInfo(word, category, Keywords.IsKnownClosingKeyword("/" + word)));
        }

        return list
            .OrderBy(c => Array.IndexOf(Kinds, c.Kind))
            .ThenBy(c => c.Name, StringComparer.Ordinal)
            .ToList();
    }

    /// <summary>The modifiers (<c>primary</c>, <c>disabled</c>, …): words any element may carry.</summary>
    public static IReadOnlyList<string> Modifiers() =>
        Enum.GetValues<TokenKind>().Where(Keywords.IsModifier).Select(WordOf).OfType<string>().ToList();

    /// <summary>The themes.</summary>
    public static readonly string[] Themes = { "clean", "sketch", "blueprint", "realistic" };

    /// <summary>The keyword written for a token kind, when the kind is one (Button, or data for Data).</summary>
    private static string? WordOf(TokenKind kind)
    {
        var name = kind.ToString();
        if (Keywords.TryGetKeyword(name, out var k) && k == kind)
        {
            return name;
        }

        var lower = char.ToLowerInvariant(name[0]) + name.Substring(1);
        return Keywords.TryGetKeyword(lower, out k) && k == kind ? lower : null;
    }
}
