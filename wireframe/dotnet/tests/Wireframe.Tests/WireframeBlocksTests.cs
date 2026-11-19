using Wireframe.Markdown;

namespace Wireframe.Tests;

/// <summary>The fenced wireframe blocks of a Markdown text.</summary>
public class WireframeBlocksTests
{
    private const string Body = "wireframe\n    Button \"Go\"\n/wireframe\n";

    [Fact]
    public void Finds_a_block_with_its_exact_source_and_content_line()
    {
        var md = "# Title\n\nText\n\n```wireframe\n" + Body + "```\n\nAfter\n";
        var blocks = WireframeBlocks.Find(md);
        var block = Assert.Single(blocks);
        Assert.Equal(Body, block.Source);
        Assert.Equal(5, block.FenceLine);
        Assert.Equal(6, block.ContentLine);
        Assert.Equal(9, block.ClosingLine);
        Assert.Equal(1, block.Number);
        Assert.Null(block.Id);
    }

    [Fact]
    public void Reads_the_id_from_the_info_string()
    {
        var md = "```wireframe id=login\n" + Body + "```\n```wireframe  title=x   id=signup\n" + Body + "```\n";
        var blocks = WireframeBlocks.Find(md);
        Assert.Equal(new[] { "login", "signup" }, blocks.Select(b => b.Id));
        Assert.Equal("wireframe id=login", blocks[0].Info);
    }

    [Fact]
    public void Takes_only_wireframe_blocks_and_numbers_them_among_themselves()
    {
        var md = "```js\nlet a;\n```\n```wireframe\n" + Body + "```\n```wireframes\nx\n```\n```Wireframe\nx\n```\n```wireframe\n" + Body + "```\n";
        var blocks = WireframeBlocks.Find(md);
        Assert.Equal(2, blocks.Count);
        Assert.Equal(new[] { 1, 2 }, blocks.Select(b => b.Number));
        Assert.Equal(new[] { 5, 16 }, blocks.Select(b => b.ContentLine));
    }

    [Fact]
    public void Tildes_and_longer_fences_close_only_with_a_fence_as_long()
    {
        var md = "~~~~wireframe\n" + Body + "~~~\n```\n~~~~~\nafter\n";
        var block = Assert.Single(WireframeBlocks.Find(md));
        Assert.Equal(Body + "~~~\n```\n", block.Source);
        Assert.Equal(7, block.ClosingLine);

        var backticks = "````wireframe\n" + Body + "```\n````\n";
        Assert.Equal(Body + "```\n", Assert.Single(WireframeBlocks.Find(backticks)).Source);
    }

    [Fact]
    public void A_wireframe_fence_inside_another_code_block_is_not_taken()
    {
        var md = "````markdown\n```wireframe\n" + Body + "```\n````\n\n~~~\n```wireframe\n" + Body + "```\n~~~\n";
        Assert.Empty(WireframeBlocks.Find(md));
    }

    [Fact]
    public void An_indented_fence_has_its_indentation_stripped_from_the_content()
    {
        var md = "   ```wireframe id=x\n   wireframe\n       Button \"Go\"\n  /wireframe\n   ```\n";
        var block = Assert.Single(WireframeBlocks.Find(md));
        Assert.Equal(Body, block.Source);
        Assert.Equal(3, block.FenceIndent);
        Assert.Equal((2, 4), block.ToDocument(1, 1));
        Assert.Equal((3, 8), block.ToDocument(2, 5));
        Assert.Equal((4, 3), block.ToDocument(3, 1));
    }

    [Fact]
    public void Four_spaces_is_an_indented_code_block_not_a_fence()
    {
        var md = "Text\n\n    ```wireframe\n    wireframe\n    /wireframe\n    ```\n";
        Assert.Empty(WireframeBlocks.Find(md));
    }

    [Fact]
    public void Finds_a_fence_inside_a_list_item()
    {
        var md = "1. First step\n\n   ```wireframe id=one\n   wireframe\n       Button \"Go\"\n   /wireframe\n   ```\n\n- ```wireframe\n  " +
            "wireframe\n      Button \"Go\"\n  /wireframe\n  ```\n";
        var blocks = WireframeBlocks.Find(md);
        Assert.Equal(2, blocks.Count);
        Assert.Equal("one", blocks[0].Id);
        Assert.Equal(Body, blocks[0].Source);
        Assert.Equal(3, blocks[0].FenceIndent);
        Assert.Equal(Body, blocks[1].Source);
        Assert.Equal(10, blocks[1].ContentLine);
        Assert.Equal(13, blocks[1].ClosingLine);

        // Nested list: the fence is indented past the outer item's content
        var nested = "- Outer\n  - Inner\n\n    ```wireframe\n    wireframe\n    /wireframe\n    ```\n";
        var inner = Assert.Single(WireframeBlocks.Find(nested));
        Assert.Equal("wireframe\n/wireframe\n", inner.Source);
    }

    [Fact]
    public void Keeps_crlf_line_ends_and_counts_lines_right()
    {
        var md = "# T\r\n\r\n```wireframe id=a\r\nwireframe\r\n    Button \"Go\"\r\n/wireframe\r\n```\r\n";
        var block = Assert.Single(WireframeBlocks.Find(md));
        Assert.Equal("wireframe\r\n    Button \"Go\"\r\n/wireframe\r\n", block.Source);
        Assert.Equal(4, block.ContentLine);
        Assert.Equal(7, block.ClosingLine);
        Assert.Equal("a", block.Id);
    }

    [Fact]
    public void An_unclosed_fence_runs_to_the_end_of_the_document()
    {
        var md = "```wireframe\n" + Body;
        var block = Assert.Single(WireframeBlocks.Find(md));
        Assert.Equal(Body, block.Source);
        Assert.Equal(0, block.ClosingLine);
    }

    [Fact]
    public void A_backtick_fence_whose_info_has_a_backtick_is_not_a_fence()
    {
        Assert.Empty(WireframeBlocks.Find("```wireframe `x`\n" + Body + "```\n"));
    }

    [Fact]
    public void An_empty_document_has_no_blocks() => Assert.Empty(WireframeBlocks.Find(""));
}
