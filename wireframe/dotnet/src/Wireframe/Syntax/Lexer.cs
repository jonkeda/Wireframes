using System.Globalization;
using System.Text;

namespace Wireframe.Syntax;

/// <summary>
/// Turns a Wireframe source into tokens, as <c>lexer/lexer.ts</c>: indentation becomes indent and dedent tokens,
/// comments are dropped unless asked for.
/// </summary>
public sealed class Lexer
{
    private readonly string source;
    private readonly bool includeComments;
    private readonly int tabWidth;

    private int pos;
    private int line = 1;
    private int column = 1;
    private readonly List<Token> tokens = new();
    private readonly List<Diagnostic> errors = new();
    private readonly List<int> indentStack = new() { 0 };
    private bool atLineStart = true;

    /// <summary>A lexer for a source.</summary>
    /// <param name="source">The source, exactly as written.</param>
    /// <param name="includeComments">Whether to give comment tokens.</param>
    /// <param name="tabWidth">How many columns of indentation a tab counts for.</param>
    public Lexer(string source, bool includeComments = false, int tabWidth = 4)
    {
        this.source = source ?? throw new ArgumentNullException(nameof(source));
        this.includeComments = includeComments;
        this.tabWidth = tabWidth;
    }

    /// <summary>The tokens of the source (the last is the end) and the errors found on the way.</summary>
    public static (IReadOnlyList<Token> Tokens, IReadOnlyList<Diagnostic> Errors) Tokenize(string source) =>
        new Lexer(source).Tokenize();

    /// <summary>The tokens of the source (the last is the end) and the errors found on the way.</summary>
    public (IReadOnlyList<Token> Tokens, IReadOnlyList<Diagnostic> Errors) Tokenize()
    {
        tokens.Clear();
        errors.Clear();
        pos = 0;
        line = 1;
        column = 1;
        indentStack.Clear();
        indentStack.Add(0);
        atLineStart = true;

        while (!IsAtEnd())
        {
            ScanToken();
        }

        while (indentStack.Count > 1)
        {
            indentStack.RemoveAt(indentStack.Count - 1);
            AddToken(TokenKind.Dedent, "");
        }

        AddToken(TokenKind.Eof, "");
        return (tokens.ToArray(), errors.ToArray());
    }

    // ============ Reading ============

    private bool IsAtEnd() => pos >= source.Length;

    private char Peek(int offset = 0)
    {
        var idx = pos + offset;
        return idx >= source.Length ? '\0' : source[idx];
    }

    private char Advance()
    {
        var c = source[pos];
        pos++;
        if (c == '\n')
        {
            line++;
            column = 1;
        }
        else
        {
            column++;
        }

        return c;
    }

    private SourceLocation Location() => new(line, column, pos);

    private void AddToken(TokenKind kind, string value, string? closingKeyword = null)
    {
        var end = Location();
        var start = new SourceLocation(end.Line, end.Column - value.Length, end.Offset - value.Length);
        tokens.Add(new Token(kind, value, start, end) { ClosingKeyword = closingKeyword });
    }

    private void Push(TokenKind kind, string value, SourceLocation start) =>
        tokens.Add(new Token(kind, value, start, Location()));

    private void AddError(string message) => errors.Add(Diagnostic.At(message, Location()));

    private void SkipWhitespace()
    {
        while (!IsAtEnd())
        {
            var c = Peek();
            if (c == ' ' || c == '\t')
            {
                Advance();
            }
            else
            {
                break;
            }
        }
    }

    private string ReadToLineEnd()
    {
        var text = new StringBuilder();
        while (!IsAtEnd() && Peek() != '\n' && Peek() != '\r')
        {
            text.Append(Advance());
        }

        return text.ToString();
    }

    // ============ Tokens ============

    private void ScanToken()
    {
        if (atLineStart)
        {
            HandleIndentation();
            atLineStart = false;
        }

        SkipWhitespace();
        if (IsAtEnd())
        {
            return;
        }

        var c = Peek();

        if (c == '\n')
        {
            Advance();
            AddToken(TokenKind.Newline, "\n");
            atLineStart = true;
            return;
        }

        if (c == '\r')
        {
            Advance();
            if (Peek() == '\n')
            {
                Advance();
            }

            // The token's start is worked out from its one-character value: after "\r\n" that is column 0
            AddToken(TokenKind.Newline, "\n");
            atLineStart = true;
            return;
        }

        if (c == '/' && Peek(1) == '/')
        {
            ScanSingleLineComment();
            return;
        }

        if (c == '/' && Peek(1) == '*')
        {
            ScanMultiLineComment();
            return;
        }

        if (c == '/' && ScanClosingKeyword())
        {
            return;
        }

        switch (c)
        {
            case '%':
                ScanDocAttribute();
                return;
            case ':':
                ScanWord(TokenKind.Id, ':', allowDot: false, allowColon: false);
                return;
            case '?':
                ScanWord(TokenKind.Binding, '?', allowDot: true, allowColon: false);
                return;
            case '@':
                ScanWord(TokenKind.Navigation, '@', allowDot: false, allowColon: true);
                return;
            case '$':
                ScanIconRef();
                return;
            case '"':
            case '\'':
                ScanString();
                return;
        }

        if (IsDigit(c) || (c == '-' && IsDigit(Peek(1))))
        {
            ScanNumber();
            return;
        }

        if (c == '|')
        {
            ScanTableRow();
            return;
        }

        if ((c == '+' || c == '-') && IsFirstTokenOnLine())
        {
            var next = Peek(1);
            if (next == ' ' || next == '\t')
            {
                ScanTreeItem(c);
                return;
            }
        }

        if (IsAlpha(c))
        {
            ScanIdentifierOrKeyword();
            return;
        }

        AddError("Unexpected character: " + c);
        Advance();
    }

    private void HandleIndentation()
    {
        var indent = 0;
        var startPos = pos;

        while (!IsAtEnd())
        {
            var c = Peek();
            if (c == ' ')
            {
                indent++;
                Advance();
            }
            else if (c == '\t')
            {
                indent += tabWidth;
                Advance();
            }
            else
            {
                break;
            }
        }

        if (IsAtEnd() || Peek() == '\n' || Peek() == '\r')
        {
            return;
        }

        if (Peek() == '/' && (Peek(1) == '/' || Peek(1) == '*'))
        {
            return;
        }

        var currentIndent = indentStack[indentStack.Count - 1];
        if (indent > currentIndent)
        {
            indentStack.Add(indent);
            tokens.Add(new Token(TokenKind.Indent, source.Substring(startPos, pos - startPos),
                new SourceLocation(line, 1, startPos), Location()));
        }
        else if (indent < currentIndent)
        {
            while (indentStack.Count > 1 && indentStack[indentStack.Count - 1] > indent)
            {
                indentStack.RemoveAt(indentStack.Count - 1);
                tokens.Add(new Token(TokenKind.Dedent, "", Location(), Location()));
            }

            if (indentStack[indentStack.Count - 1] != indent)
            {
                AddError("Inconsistent indentation");
            }
        }
    }

    private bool IsFirstTokenOnLine()
    {
        if (tokens.Count == 0)
        {
            return true;
        }

        var last = tokens[tokens.Count - 1].Kind;
        return last is TokenKind.Newline or TokenKind.Indent or TokenKind.Dedent;
    }

    /// <summary>One escape sequence; the backslash is already read.</summary>
    private string ReadEscape()
    {
        if (IsAtEnd())
        {
            // A backslash at the very end: JavaScript reads past the end, gets undefined and adds it as text
            pos++;
            column++;
            return "undefined";
        }

        var escaped = Advance();
        return escaped switch
        {
            'n' => "\n",
            't' => "\t",
            'r' => "\r",
            _ => escaped.ToString(),
        };
    }

    private void ScanSingleLineComment()
    {
        var start = Location();
        var value = new StringBuilder("//");
        Advance();
        Advance();
        while (!IsAtEnd() && Peek() != '\n')
        {
            value.Append(Advance());
        }

        if (includeComments)
        {
            Push(TokenKind.Comment, value.ToString(), start);
        }
    }

    private void ScanMultiLineComment()
    {
        var start = Location();
        var value = new StringBuilder("/*");
        Advance();
        Advance();
        while (!IsAtEnd())
        {
            if (Peek() == '*' && Peek(1) == '/')
            {
                value.Append(Advance());
                value.Append(Advance());
                break;
            }

            value.Append(Advance());
        }

        if (includeComments)
        {
            Push(TokenKind.MultilineComment, value.ToString(), start);
        }
    }

    private bool ScanClosingKeyword()
    {
        if (!IsAlpha(Peek(1)))
        {
            return false;
        }

        Advance(); // '/'
        var keyword = new StringBuilder("/");
        while (!IsAtEnd() && IsAlphaNumeric(Peek()))
        {
            keyword.Append(Advance());
        }

        var text = keyword.ToString();
        var kind = Keywords.IsKnownClosingKeyword(text) ? Keywords.ClosingKind(text) : TokenKind.EndBlock;
        AddToken(kind, text, text.Substring(1));
        return true;
    }

    private void ScanDocAttribute()
    {
        var start = Location();
        Advance(); // %

        var name = new StringBuilder();
        while (!IsAtEnd() && IsAlphaNumeric(Peek()))
        {
            name.Append(Advance());
        }

        if (Peek() == ':')
        {
            Advance();
        }

        SkipWhitespace();
        var value = JsText.Trim(ReadToLineEnd());
        tokens.Add(new Token(TokenKind.DocAttribute, "%" + name + ": " + value, start, Location())
        {
            AttributeName = name.ToString(),
            AttributeValue = value,
        });
    }

    private void ScanWord(TokenKind kind, char marker, bool allowDot, bool allowColon)
    {
        var start = Location();
        Advance();
        var value = new StringBuilder().Append(marker);
        while (!IsAtEnd())
        {
            var c = Peek();
            if (IsAlphaNumeric(c) || c == '_' || (allowDot && c == '.') || (allowColon && c == ':'))
            {
                value.Append(Advance());
            }
            else
            {
                break;
            }
        }

        Push(kind, value.ToString(), start);
    }

    private void ScanIconRef()
    {
        var start = Location();
        Advance(); // $
        var value = new StringBuilder("$");
        while (!IsAtEnd() && (IsAlphaNumeric(Peek()) || Peek() == '_'))
        {
            value.Append(Advance());
        }

        var soFar = value.ToString();
        if (Peek() == ':' && (soFar == "$icon" || soFar == "$Icon"))
        {
            value.Append(Advance());
            while (!IsAtEnd() && (IsAlphaNumeric(Peek()) || Peek() == '_' || Peek() == '-'))
            {
                value.Append(Advance());
            }
        }

        Push(TokenKind.IconRef, value.ToString(), start);
    }

    private void ScanString()
    {
        var start = Location();
        var quote = Advance();
        var value = new StringBuilder();

        while (!IsAtEnd() && Peek() != quote)
        {
            if (Peek() == '\\')
            {
                Advance();
                value.Append(ReadEscape());
            }
            else if (Peek() == '\n')
            {
                // Reported here and again below: the string is not closed on its line
                AddError("Unterminated string literal");
                break;
            }
            else
            {
                value.Append(Advance());
            }
        }

        if (Peek() == quote && !IsAtEnd())
        {
            Advance();
        }
        else
        {
            AddError("Unterminated string literal");
        }

        Push(TokenKind.String, value.ToString(), start);
    }

    private void ScanNumber()
    {
        var start = Location();
        var value = new StringBuilder();
        if (Peek() == '-')
        {
            value.Append(Advance());
        }

        while (!IsAtEnd() && IsDigit(Peek()))
        {
            value.Append(Advance());
        }

        if (Peek() == '.' && IsDigit(Peek(1)))
        {
            value.Append(Advance());
            while (!IsAtEnd() && IsDigit(Peek()))
            {
                value.Append(Advance());
            }
        }

        if (Peek() == '%')
        {
            value.Append(Advance());
        }

        Push(TokenKind.Number, value.ToString(), start);
    }

    private void ScanTableRow()
    {
        var start = Location();

        var isSeparator = true;
        for (var i = pos; i < source.Length && source[i] != '\n'; i++)
        {
            var c = source[i];
            if (c != '|' && c != '-' && c != ' ' && c != '\t' && c != ':')
            {
                isSeparator = false;
                break;
            }
        }

        var value = ReadToLineEnd();
        Push(isSeparator ? TokenKind.TableSeparator : TokenKind.TableRow, value, start);
    }

    private void ScanTreeItem(char marker)
    {
        var start = Location();
        Advance();
        SkipWhitespace();
        var text = ReadToLineEnd();
        Push(marker == '+' ? TokenKind.TreeBranch : TokenKind.TreeLeaf, JsText.Trim(text), start);
    }

    private void ScanIdentifierOrKeyword()
    {
        var start = Location();
        var word = new StringBuilder();
        while (!IsAtEnd() && IsAlphaNumeric(Peek()))
        {
            word.Append(Advance());
        }

        var value = word.ToString();

        if (Peek() == '=')
        {
            Advance();
            var attrValue = new StringBuilder();
            if (Peek() == '"' || Peek() == '\'')
            {
                var quote = Advance();
                while (!IsAtEnd() && Peek() != quote && Peek() != '\n')
                {
                    if (Peek() == '\\')
                    {
                        Advance();
                        attrValue.Append(ReadEscape());
                    }
                    else
                    {
                        attrValue.Append(Advance());
                    }
                }

                if (Peek() == quote && !IsAtEnd())
                {
                    Advance();
                }
            }
            else
            {
                while (!IsAtEnd() && !IsWhitespace(Peek()))
                {
                    attrValue.Append(Advance());
                }
            }

            var text = attrValue.ToString();
            tokens.Add(new Token(TokenKind.Attribute, value + "=" + text, start, Location())
            {
                AttributeName = value,
                AttributeValue = text,
            });
            return;
        }

        if (!Keywords.TryGetKeyword(value, out var kind))
        {
            kind = TokenKind.Identifier;
        }

        if (kind == TokenKind.If)
        {
            SkipWhitespace();
            var condition = ReadToLineEnd();
            tokens.Add(new Token(TokenKind.If, value, start, Location()) { AttributeValue = JsText.Trim(condition) });
            return;
        }

        Push(kind, value, start);
    }

    // ============ Character classes ============

    private static bool IsDigit(char c) => c >= '0' && c <= '9';

    private static bool IsAlpha(char c) => c == '_' || char.IsLetter(c);

    private static bool IsAlphaNumeric(char c)
    {
        if (IsAlpha(c) || IsDigit(c))
        {
            return true;
        }

        var category = CharUnicodeInfo.GetUnicodeCategory(c);
        return category is UnicodeCategory.NonSpacingMark or UnicodeCategory.SpacingCombiningMark
            or UnicodeCategory.EnclosingMark;
    }

    private static bool IsWhitespace(char c) => c == ' ' || c == '\t' || c == '\n' || c == '\r';
}
