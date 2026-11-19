#if NETSTANDARD2_0
namespace System.Runtime.CompilerServices
{
    // What records and init-only setters need, and netstandard2.0 does not have.
    internal static class IsExternalInit
    {
    }
}
#endif
