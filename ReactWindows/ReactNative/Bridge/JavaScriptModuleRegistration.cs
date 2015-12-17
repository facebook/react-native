using System;
using System.Collections.Generic;
using System.Globalization;
using System.Reflection;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Registration information for a <see cref="IJavaScriptModule"/>. Creates
    /// a mapping of methods to IDs.
    /// </summary>
    internal class JavaScriptModuleRegistration
    {
        private readonly IDictionary<string, int> _methodsToIds;
        private readonly IDictionary<string, string> _methodsToTracingStrings;

        /// <summary>
        /// Instantiates the <see cref="JavaScriptModuleRegistration"/>.
        /// </summary>
        /// <param name="moduleId">The module ID.</param>
        /// <param name="moduleInterface">The module type.</param>
        public JavaScriptModuleRegistration(int moduleId, Type moduleInterface)
        {
            ModuleId = moduleId;
            ModuleInterface = moduleInterface;

            var methods = moduleInterface.GetTypeInfo().DeclaredMethods;
            var methodNames = new List<string>();
            foreach (var method in methods)
            {
                methodNames.Add(method.Name);
            }

            methodNames.Sort((s1, s2) => s1.CompareTo(s2));

            _methodsToIds = new Dictionary<string, int>(methodNames.Count);
            _methodsToTracingStrings = new Dictionary<string, string>(methodNames.Count);

            InitializeMethodTables(methodNames);
        }

        /// <summary>
        /// The module ID.
        /// </summary>
        public int ModuleId { get; }
        
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
        /// The set of methods available in the module.
        /// </summary>
        public IEnumerable<string> Methods
        {
            get
            {
                return _methodsToIds.Keys;
            }
        }

        /// <summary>
        /// Get the ID for a particular module method by name.
        /// </summary>
        /// <param name="method">The method name.</param>
        /// <returns>The method ID.</returns>
        public int GetMethodId(string method)
        {
            var idx = default(int);
            if (!_methodsToIds.TryGetValue(method, out idx))
            {
                throw new InvalidOperationException("Unknown method: " + method);
            }

            return idx;
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
                throw new InvalidOperationException("Unknown method: " + method);
            }

            return name;
        }

        private void InitializeMethodTables(IList<string> methods)
        {
            var lastMethod = default(string);
            for (var i = 0; i < methods.Count; ++i)
            {
                var method = methods[i];
                if (method == lastMethod)
                {
                    throw new NotSupportedException(
                        string.Format(
                            CultureInfo.InvariantCulture,
                            "Method overloading is not supported: {0}.{1}",
                            ModuleInterface.Name,
                            method));
                }

                lastMethod = method;
                _methodsToIds.Add(method, i);
                _methodsToTracingStrings.Add(method, "JSCall__" + Name + "_" + method);
            }
        }
    }
}