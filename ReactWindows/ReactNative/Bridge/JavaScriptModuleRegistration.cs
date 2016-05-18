using System;
using System.Collections.Generic;
using System.Reflection;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Registration information for a <see cref="IJavaScriptModule"/>. Creates
    /// a mapping of methods to IDs.
    /// </summary>
    public class JavaScriptModuleRegistration
    {
        private readonly IDictionary<string, string> _methodsToTracingStrings;

        /// <summary>
        /// Instantiates the <see cref="JavaScriptModuleRegistration"/>.
        /// </summary>
        /// <param name="moduleInterface">The module type.</param>
        public JavaScriptModuleRegistration(Type moduleInterface)
        {
            ModuleInterface = moduleInterface;
            _methodsToTracingStrings = new Dictionary<string, string>();
        }

        /// <summary>
        /// The module type.
        /// </summary>
        public Type ModuleInterface { get; }

        /// <summary>
        /// The module name.
        /// </summary>
        public string Name
        {
            get
            {
                return ModuleInterface.Name;
            }
        }

        /// <summary>
        /// Get the tracing name for a particular module method by name.s
        /// </summary>
        /// <param name="method">The method name.</param>
        /// <returns>The tracing name.</returns>
        public string GetTracingName(string method)
        {
            var name = default(string);
            if (!_methodsToTracingStrings.TryGetValue(method, out name))
            {
                name = "JSCall__" + Name + "_" + method;
                _methodsToTracingStrings.Add(method, name);
            }

            return name;
        }
    }
}