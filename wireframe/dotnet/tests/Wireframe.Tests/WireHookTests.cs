using System.Diagnostics;
using System.Text.Json;

namespace Wireframe.Tests;

/// <summary>
/// <c>wire hook after-write</c> and <c>wire hook before-stop</c>: the event as Claude Code sends it on standard
/// input (the shapes seen on 2026-11-19, <c>.my/net/510-HooksFindings.md</c>), the exit code and the output of each.
/// </summary>
public sealed class WireHookTests : IDisposable
{
    private const string Valid = "wireframe clean\n    Label \"Hello\"\n/wireframe\n";
    private const string Wrong = "wireframe clean\n    Label \"Hello\n/wireframe\n";

    private readonly CliFolder folder = new();

    public void Dispose() => folder.Dispose();

    private static string Doc(params (string Id, string Source)[] blocks) =>
        "# Spec\n\n" + string.Concat(blocks.Select(b => $"```wireframe id={b.Id}\n{b.Source}```\n\n"));

    private string Event(string name, string tool = "Edit", bool stopActive = false) => JsonSerializer.Serialize(new Dictionary<string, object>
    {
        ["session_id"] = "13b98471-test",
        ["cwd"] = folder.Dir,
        ["scratchpad_dir"] = Path.Combine(folder.Dir, "scratch"),
        ["hook_event_name"] = name,
        ["tool_name"] = tool,
        ["stop_hook_active"] = stopActive,
    });

    private string Wrote(string file, string tool = "Edit") => JsonSerializer.Serialize(new Dictionary<string, object>
    {
        ["session_id"] = "13b98471-test",
        ["cwd"] = folder.Dir,
        ["scratchpad_dir"] = Path.Combine(folder.Dir, "scratch"),
        ["hook_event_name"] = "PostToolUse",
        ["tool_name"] = tool,
        ["tool_input"] = new Dictionary<string, object> { ["file_path"] = Path.Combine(folder.Dir, file) },
    });

    private CliRun AfterWrite(string file, string tool = "Edit") => folder.RunWithInput(Wrote(file, tool), "hook", "after-write");

    private CliRun BeforeStop(bool active = false) => folder.RunWithInput(Event("Stop", stopActive: active), "hook", "before-stop");

    private bool Listed => folder.Exists("scratch/wire-hook-13b98471-test.txt");

    [Fact]
    public void A_file_that_cannot_hold_a_wireframe_is_left_alone()
    {
        folder.File("Program.cs", "class Program {}");

        var r = AfterWrite("Program.cs");

        Assert.Equal(new CliRun(0, "", ""), r);
        Assert.False(Listed);
    }

    [Fact]
    public void A_markdown_file_without_a_block_costs_a_read_and_writes_nothing()
    {
        folder.File("notes.md", "# Notes\n\nThe word wireframe is here, a block is not.\n");

        var r = AfterWrite("notes.md", "Write");

        Assert.Equal(new CliRun(0, "", ""), r);
        Assert.False(Listed);
        Assert.Single(Directory.GetFiles(folder.Dir));
    }

    [Fact]
    public void A_block_is_rendered_and_nothing_is_said()
    {
        folder.File("spec.md", Doc(("login", Valid)));

        var r = AfterWrite("spec.md");

        Assert.Equal(new CliRun(0, "", ""), r);
        Assert.StartsWith("<!-- wire v", folder.Read("spec.login.svg"), StringComparison.Ordinal);
        Assert.True(Listed);
        // What the hook wrote is what the tool writes: a check by hand finds it current.
        Assert.Equal(0, folder.Run("spec.md", "--check").Code);
    }

    [Fact]
    public void A_wire_file_is_rendered()
    {
        folder.File("screens/login.wire", Valid);

        var r = AfterWrite("screens/login.wire", "Write");

        Assert.Equal(new CliRun(0, "", ""), r);
        Assert.True(folder.Exists("screens/login.svg"));
    }

    [Fact]
    public void An_error_goes_to_the_agent_with_exit_code_2_and_the_documents_own_line()
    {
        folder.File("spec.md", Doc(("fine", Valid), ("login", Wrong)));

        var r = AfterWrite("spec.md");

        Assert.Equal(2, r.Code);
        Assert.Equal("", r.Out);
        Assert.Contains(r.ErrLines, l => l.StartsWith("spec.md(", StringComparison.Ordinal) && l.Contains("): error: ", StringComparison.Ordinal));
        Assert.Contains("Fix the block", r.ErrLines[^1], StringComparison.Ordinal);
        Assert.Contains(folder.Dir, r.ErrLines[^1], StringComparison.Ordinal);
        Assert.DoesNotContain("--force", r.Err, StringComparison.Ordinal);
        // The block without an error has its picture all the same.
        Assert.True(folder.Exists("spec.fine.svg"));
        Assert.False(folder.Exists("spec.login.svg"));
    }

    [Fact]
    public void A_second_edit_renders_again_and_a_block_that_went_takes_its_picture_with_it()
    {
        folder.File("spec.md", Doc(("login", Valid), ("list", Valid)));
        Assert.Equal(0, AfterWrite("spec.md").Code);
        var first = folder.Read("spec.login.svg");

        folder.File("spec.md", Doc(("login", Valid.Replace("Hello", "Sign in", StringComparison.Ordinal)), ("list", Valid)));
        Assert.Equal(0, AfterWrite("spec.md").Code);
        Assert.NotEqual(first, folder.Read("spec.login.svg"));

        folder.File("spec.md", "# Spec\n\nNo wireframes any more.\n");
        Assert.Equal(new CliRun(0, "", ""), AfterWrite("spec.md"));
        Assert.False(folder.Exists("spec.login.svg"));
        Assert.False(folder.Exists("spec.list.svg"));
    }

    [Fact]
    public void The_file_that_was_written_is_never_changed()
    {
        var text = Doc(("login", Valid));
        folder.File("spec.md", text);

        AfterWrite("spec.md");

        Assert.Equal(text, folder.Read("spec.md"));
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("[]")]
    [InlineData("{\"tool_input\":{}}")]
    [InlineData("{\"tool_input\":{\"file_path\":\"relative.md\"}}")]
    [InlineData("{\"tool_input\":{\"file_path\":42}}")]
    public void An_event_without_a_usable_file_is_nothing_to_do(string input)
    {
        Assert.Equal(new CliRun(0, "", ""), folder.RunWithInput(input, "hook", "after-write"));
        Assert.Equal(new CliRun(0, "", ""), folder.RunWithInput(input, "hook", "before-stop"));
    }

    [Fact]
    public void An_event_that_is_not_json_is_one_line_and_blocks_nothing()
    {
        var r = folder.RunWithInput("not json", "hook", "after-write");

        // Exit code 1 is a failed hook to Claude Code: shown, and the work goes on. Only 2 hands text to the agent.
        Assert.Equal(1, r.Code);
        Assert.Equal("", r.Out);
        Assert.Single(r.ErrLines);
        Assert.StartsWith("wire hook after-write: ", r.Err, StringComparison.Ordinal);
    }

    [Fact]
    public void A_file_that_is_gone_is_nothing_to_do()
    {
        Assert.Equal(new CliRun(0, "", ""), AfterWrite("gone.md"));
    }

    [Theory]
    [InlineData("hook")]
    [InlineData("hook other")]
    [InlineData("hook after-write more")]
    public void Anything_but_the_two_hooks_is_a_usage_error(string line)
    {
        var r = folder.Run(line.Split(' '));

        Assert.Equal(2, r.Code);
        Assert.Contains("after-write", r.Err, StringComparison.Ordinal);
    }

    [Fact]
    public void The_end_hook_says_nothing_when_no_file_was_handled_or_all_is_current()
    {
        Assert.Equal(new CliRun(0, "", ""), BeforeStop());

        folder.File("spec.md", Doc(("login", Valid)));
        AfterWrite("spec.md");

        Assert.Equal(new CliRun(0, "", ""), BeforeStop());
    }

    [Fact]
    public void The_end_hook_sends_the_agent_back_for_a_stale_picture_and_for_an_error_left()
    {
        folder.File("spec.md", Doc(("login", Valid)));
        folder.File("other/list.md", Doc(("list", Valid)));
        AfterWrite("spec.md");
        AfterWrite("other/list.md");
        // Changed without the first hook seeing it: by a shell command, say.
        folder.File("spec.md", Doc(("login", Valid.Replace("Hello", "Sign in", StringComparison.Ordinal))));
        folder.File("other/list.md", Doc(("list", Wrong)));

        var r = BeforeStop();

        Assert.Equal(0, r.Code);
        Assert.Equal("", r.Err);
        using var answer = JsonDocument.Parse(r.Out);
        Assert.Equal("block", answer.RootElement.GetProperty("decision").GetString());
        var reason = answer.RootElement.GetProperty("reason").GetString()!;
        Assert.Contains("spec.login.svg is stale", reason, StringComparison.Ordinal);
        Assert.Contains("list.md(", reason, StringComparison.Ordinal);
        Assert.Contains(Path.Combine(folder.Dir, "other"), reason, StringComparison.Ordinal);
        Assert.Contains("stop again", reason, StringComparison.Ordinal);
        // It checks; it does not render.
        Assert.Equal(1, folder.Run("spec.md", "--check").Code);
    }

    [Fact]
    public void The_end_hook_does_not_send_the_agent_back_twice()
    {
        folder.File("spec.md", Doc(("login", Valid)));
        AfterWrite("spec.md");
        folder.File("spec.md", Doc(("login", Wrong)));

        Assert.Contains("\"block\"", BeforeStop().Out, StringComparison.Ordinal);
        Assert.Equal(new CliRun(0, "", ""), BeforeStop(active: true));
    }

    [Fact]
    public void The_end_hook_forgets_a_file_that_was_deleted()
    {
        folder.File("spec.md", Doc(("login", Valid)));
        AfterWrite("spec.md");
        File.Delete(folder.File("spec.md"));

        Assert.Equal(new CliRun(0, "", ""), BeforeStop());
    }

    [Fact]
    public void A_document_of_ten_blocks_is_rendered_well_inside_the_time_a_hook_may_take()
    {
        folder.File("spec.md", Doc(Enumerable.Range(1, 10).Select(n => ("b" + n, Valid.Replace("Hello", "Block " + n, StringComparison.Ordinal))).ToArray()));
        AfterWrite("spec.md");

        // In process, so without the start of the program (65 ms measured on 2026-11-19): the work itself. The
        // middle run, not the slowest: the other tests run beside this one.
        var times = new List<double>();
        for (var i = 0; i < 21; i++)
        {
            var watch = Stopwatch.StartNew();
            Assert.Equal(0, AfterWrite("spec.md").Code);
            times.Add(watch.Elapsed.TotalMilliseconds);
        }

        times.Sort();
        Assert.True(times[10] < 100, $"the middle of 21 runs took {times[10]:0} ms");
    }
}
