using Newtonsoft.Json.Linq;
using System;
using System.Reflection;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Factory interface for manufacturing method invocation delegates.
    /// </summary>
    public interface IReactDelegateFactory
    {
        /// <summary>
        /// Create an invocation delegate from the given method.
        /// </summary>
        /// <param name="method">The method.</param>
        /// <returns>The invocation delegate.</returns>
        Action<INativeModule, ICatalystInstance, JArray> Create(INativeModule module, MethodInfo method);
    }
}
