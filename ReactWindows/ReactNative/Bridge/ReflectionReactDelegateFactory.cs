using Newtonsoft.Json.Linq;
using ReactNative.Reflection;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Reflection;

namespace ReactNative.Bridge
{
    public sealed class ReflectionReactDelegateFactory : IReactDelegateFactory
    {
        private ReflectionReactDelegateFactory() { }

        public static ReflectionReactDelegateFactory Instance { get; } 
            = new ReflectionReactDelegateFactory();

        public Action<INativeModule, ICatalystInstance, JArray> Create(INativeModule module, MethodInfo method)
        {
            var extractors = CreateExtractors(module, method);
            return (moduleInstance, catalystInstance, arguments) => Invoke(method, extractors, moduleInstance, catalystInstance, arguments);
        }

        private IList<Func<ICatalystInstance, JToken, int, object>> CreateExtractors(INativeModule module, MethodInfo method)
        {
            var parameters = method.GetParameters();
            var extractors = new List<Func<ICatalystInstance, JToken, int, object>>(parameters.Length);
            foreach (var parameter in parameters)
            {
                extractors.Add(CreateExtractor(parameter.ParameterType, module.Name, method.Name));
            }

            return extractors;
        }

        private Func<ICatalystInstance, JToken, int, object> CreateExtractor(Type type, string moduleName, string methodName)
        {
            var exceptionFormat = string.Format(
                CultureInfo.InvariantCulture,
                "Error extracting argument for module '{0}' method '{1}' at index '{{0}}'.",
                moduleName,
                methodName);

            if (type == typeof(ICallback))
            {
                return (catalystInstance, token, index) =>
                {
                    try
                    {
                        var id = token.Value<int>();
                        return new Callback(id, catalystInstance);
                    }
                    catch (Exception ex)
                    {
                        throw new NativeArgumentsParseException(
                            string.Format(exceptionFormat, index),
                            "jsArguments",
                            ex);
                    }
                };
            }
            else
            {
                return (catalystInstance, token, index) =>
                {
                    try
                    {
                        return token.ToObject(type);
                    }
                    catch (Exception ex)
                    {
                        throw new NativeArgumentsParseException(
                            string.Format(exceptionFormat, index),
                            "jsArguments",
                            ex.InnerException);
                    }
                };
            }
        }

        private static void Invoke(
            MethodInfo method,
            IList<Func<ICatalystInstance, JToken, int, object>> extractors,
            INativeModule moduleInstance,
            ICatalystInstance catalystInstance,
            JArray jsArguments)
        {
            if (moduleInstance == null)
                throw new ArgumentNullException(nameof(moduleInstance));
            if (catalystInstance == null)
                throw new ArgumentNullException(nameof(catalystInstance));
            if (jsArguments == null)
                throw new ArgumentNullException(nameof(jsArguments));

            var n = extractors.Count;
            if (jsArguments.Count != n) 
            {
                throw new NativeArgumentsParseException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Module '{0}' method '{1}' got '{{0}}' arguments, expected '{2}'.",
                        moduleInstance.Name,
                        method.Name,
                        n),
                    nameof(jsArguments));
            }

            var args = new object[n];
            for (var i = 0; i < n; ++i)
            {
                args[i] = extractors[i](catalystInstance, jsArguments[i], i);
            }

            method.Invoke(moduleInstance, args);
        }
    }
}
