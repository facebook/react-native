using ReactNative.Bridge;

namespace ReactNative.Tests
{
    static class JavaScriptModuleRegistryExtensions
    {
        public static JavaScriptModuleRegistry.Builder Add<T>(this JavaScriptModuleRegistry.Builder builder)
            where T : IJavaScriptModule
        {
            return builder.Add(typeof(T));
        }
    }
}
