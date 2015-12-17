using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ReactNative.Bridge
{
    /// <summary>
    /// An abstraction for the asynchronous JavaScript bridge. This provides an
    /// environment allowing the invocation of JavaScript methods and lets a
    /// set of native APIs be invokable from JavaScript as well.
    /// </summary>
    public interface ICatalystInstance
    {
        /// <summary>
        /// Enumerates the available native modules.
        /// </summary>
        IEnumerable<INativeModule> NativeModules { get; }

        /// <summary>
        /// Invokes a JavaScript callback.
        /// </summary>
        /// <param name="callbackId">The callback ID.</param>
        /// <param name="arguments">The arguments.</param>
        void InvokeCallback(int callbackId, JArray arguments);

        /// <summary>
        /// Initializes the instance.
        /// </summary>
        /// <returns>A task to await initialization.</returns>
        Task InitializeAsync();

        /// <summary>
        /// Gets a native module instance.
        /// </summary>
        /// <typeparam name="T">Type of native module.</typeparam>
        /// <returns>The native module instance.</returns>
        T GetNativeModule<T>() where T : INativeModule;
    }
}
