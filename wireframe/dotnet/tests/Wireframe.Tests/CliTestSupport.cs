using System.Text;
using Wireframe.Cli;

namespace Wireframe.Tests;

/// <summary>What one run of the tool gave.</summary>
public sealed record CliRun(int Code, string Out, string Err)
{
    /// <summary>The lines of standard error.</summary>
    public string[] ErrLines => Err.Split('\n', StringSplitOptions.RemoveEmptyEntries);
}

/// <summary>A temporary folder for one test, removed afterwards; runs the tool in it.</summary>
public sealed class CliFolder : IDisposable
{
    private static readonly UTF8Encoding Utf8 = new(false);

    public CliFolder()
    {
        Dir = Path.Combine(Path.GetTempPath(), "wire-cli-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Dir);
    }

    public string Dir { get; }

    /// <summary>The path of a file in the folder, written when content is given.</summary>
    public string File(string name, string? content = null)
    {
        var path = Path.Combine(Dir, name);
        if (content is not null)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            System.IO.File.WriteAllBytes(path, Utf8.GetBytes(content));
        }

        return path;
    }

    public string Read(string name) => Utf8.GetString(System.IO.File.ReadAllBytes(Path.Combine(Dir, name)));

    public bool Exists(string name) => System.IO.File.Exists(Path.Combine(Dir, name));

    public CliRun Run(params string[] args) => RunWithInput("", args);

    public CliRun RunWithInput(string stdin, params string[] args)
    {
        var output = new StringWriter();
        var error = new StringWriter();
        var code = WireCli.Run(args, new StringReader(stdin), output, error, Dir);
        return new CliRun(code, output.ToString(), error.ToString());
    }

    public void Dispose()
    {
        try
        {
            Directory.Delete(Dir, recursive: true);
        }
        catch (IOException)
        {
            // A temporary folder: the system cleans it up in the end
        }
    }
}
