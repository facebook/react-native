using Newtonsoft.Json.Linq;
using System;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Interface for making JavaScript calls from native code.
    /// </summary>
    public interface IJavaScriptExecutor : IDisposable
    {
        /// <summary>
        /// Initializes the JavaScript runtime.
        /// </summary>
        /// <remarks>
        /// Must be called from the JavaScript thread.
        /// </remarks>
        void Initialize();

        /// <summary>
        /// Call the JavaScript method from the given module.
        /// </summary>
        /// <param name="moduleName">The module name.</param>
        /// <param name="methodName">The method name.</param>
        /// <param name="arguments">The arguments.</param>
        /// <returns>The result of the call.</returns>
        JToken Call(string moduleName, string methodName, JArray arguments);

        /// <summary>
        /// Sets a global variable in the JavaScript runtime.
        /// </summary>
        /// <param name="propertyName">The global variable name.</param>
        /// <param name="value">The value.</param>
        void SetGlobalVariable(string propertyName, JToken value);

        /// <summary>
        /// Runs the given script.
        /// </summary>
        /// <param name="script">The script.</param>
        void RunScript(string script);
    }
}
