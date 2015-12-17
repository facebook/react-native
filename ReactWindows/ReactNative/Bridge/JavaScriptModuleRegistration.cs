using System;
using System.Collections.Generic;
using System.Globalization;
using System.Reflection;

namespace ReactNative.Bridge
{
    internal class JavaScriptModuleRegistration
    {
        private readonly IDictionary<string, int> _methodsToIds;
        private readonly IDictionary<string, string> _methodsToTracingStrings;

        public JavaScriptModuleRegistration(int moduleId, Type moduleInterface)
        {
            ModuleId = moduleId;
            ModuleInterface = moduleInterface;

            var methods = moduleInterface.GetMethods();
            var methodNames = new string[methods.Length];
            for (var i = 0; i < methods.Length; ++i)
            {
                methodNames[i] = methods[i].Name;
            }

            Array.Sort(methodNames, Comparer<string>.Create((s1, s2) => s1.CompareTo(s2)));

            _methodsToIds = new Dictionary<string, int>(methods.Length);
            _methodsToTracingStrings = new Dictionary<string, string>(methods.Length);

            InitializeMethodTables(methodNames);
        }

        public int ModuleId { get; }
        
        public Type ModuleInterface { get; }

        public string Name
        {
            get
            {
                return ModuleInterface.Name;
            }
        }

        public IEnumerable<string> Methods
        {
            get
            {
                return _methodsToIds.Keys;
            }
        }

        public int GetMethodId(string method)
        {
            var idx = default(int);
            if (!_methodsToIds.TryGetValue(method, out idx))
            {
                throw new InvalidOperationException("Unknown method: " + method);
            }

            return idx;
        }

        public string GetTracingName(string method)
        {
            var name = default(string);
            if (!_methodsToTracingStrings.TryGetValue(method, out name))
            {
                throw new InvalidOperationException("Unknown method: " + method);
            }

            return name;
        }

        private void InitializeMethodTables(string[] methods)
        {
            var lastMethod = default(string);
            for (var i = 0; i < methods.Length; ++i)
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