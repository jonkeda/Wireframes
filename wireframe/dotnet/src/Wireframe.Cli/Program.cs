// The tool `wire` (.my/net/200-Cli.md). All of it is in WireCli.Run; this is the process around it.
using System.Text;
using Wireframe.Cli;

var utf8 = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false);
using var stdout = new StreamWriter(Console.OpenStandardOutput(), utf8) { AutoFlush = true, NewLine = "\n" };
using var stderr = new StreamWriter(Console.OpenStandardError(), utf8) { AutoFlush = true, NewLine = "\n" };
using var stdin = new StreamReader(Console.OpenStandardInput(), utf8);
using var cancel = new CancellationTokenSource();
Console.CancelKeyPress += (_, e) =>
{
    e.Cancel = true;
    cancel.Cancel();
};

return WireCli.Run(args, stdin, stdout, stderr, Environment.CurrentDirectory, cancel.Token);
