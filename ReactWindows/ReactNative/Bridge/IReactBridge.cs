using Newtonsoft.Json.Linq;
using System;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Interface to the JavaScript execution environment and means of
    /// transport for messages between JavaScript and the native environment.
    /// </summary>
    public interface IReactBridge
    {
        /// <summary>
        /// Calls a JavaScript function.
        /// </summary>
        /// <param name="moduleId">The module ID.</param>
        /// <param name="methodId">The method ID.</param>
        /// <param name="arguments">The arguments.</param>
        void CallFunction(int moduleId, int methodId, JArray arguments);

        /// <summary>
        /// Invokes a JavaScript callback.
        /// </summary>
        /// <param name="callbackID">The callback ID.</param>
        /// <param name="arguments">The arguments.</param>
        void InvokeCallback(int callbackID, JArray arguments);

        /// <summary>
        /// Sets a global JavaScript variable.
        /// </summary>
        /// <param name="propertyName">The property name.</param>
        /// <param name="jsonEncodedArgument">The JSON-encoded value.</param>
        void SetGlobalVariable(string propertyName, string jsonEncodedArgument);

        /// <summary>
        /// Evaluates JavaScript.
        /// </summary>
        /// <param name="script">The script.</param>
        void RunScript(string script);
    }
}
