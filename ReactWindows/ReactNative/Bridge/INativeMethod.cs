using Newtonsoft.Json.Linq;

namespace ReactNative.Bridge
{
    /// <summary>
    /// An interface representing native methods.
    /// </summary>
    public interface INativeMethod
    {
        /// <summary>
        /// The type of method.
        /// </summary>
        string Type { get; }

        /// <summary>
        /// Invoke the native method.
        /// </summary>
        /// <param name="catalystInstance">The catalyst instance.</param>
        /// <param name="jsArguments">The arguments.</param>
        void Invoke(ICatalystInstance catalystInstance, JArray jsArguments);
    }
}
