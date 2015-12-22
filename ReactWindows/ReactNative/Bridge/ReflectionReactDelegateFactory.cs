using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;

namespace ReactNative.Bridge
{
    /// <summary>
    /// A delegate factory that uses reflection to create the native method.
    /// </summary>
    public sealed class ReflectionReactDelegateFactory : ReactDelegateFactoryBase
    {
        private ReflectionReactDelegateFactory() { }

        /// <summary>
        /// The <see cref="ReflectionReactDelegateFactory"/> instance.
        /// </summary>
        public static ReflectionReactDelegateFactory Instance { get; } 
            = new ReflectionReactDelegateFactory();

        /// <summary>
        /// Create an invocation delegate from the given method.
        /// </summary>
        /// <param name="method">The method.</param>
        /// <returns>The invocation delegate.</returns>
        public override Action<INativeModule, ICatalystInstance, JArray> Create(INativeModule module, MethodInfo method)
        {
            var extractors = CreateExtractors(module, method);
            var expectedArguments = extractors.Sum(e => e.ExpectedArguments);
            var extractFunctions = extractors.Select(e => e.ExtractFunction).ToList();

            return (moduleInstance, catalystInstance, arguments) => 
                Invoke(
                    method, 
                    expectedArguments,
                    extractFunctions,
                    moduleInstance,
                    catalystInstance,
                    arguments);
        }

        private IList<Extractor> CreateExtractors(INativeModule module, MethodInfo method)
        {
            var parameters = method.GetParameters();
            var extractors = new List<Extractor>(parameters.Length);
            foreach (var parameter in parameters)
            {
                extractors.Add(CreateExtractor(parameter.ParameterType, module.Name, method.Name));
            }

            return extractors;
        }

        private Extractor CreateExtractor(Type type, string moduleName, string methodName)
        {
            var exceptionFormat = string.Format(
                CultureInfo.InvariantCulture,
                "Error extracting argument for module '{0}' method '{1}' at index '{{0}}'.",
                moduleName,
                methodName);

           
            if (type == typeof(ICallback))
            {
                return new Extractor(
                    1,
                    (catalystInstance, arguments, index) =>
                    {
                        try
                        {
                            return new Result(
                                index + 1, 
                                CreateCallback(arguments[index], catalystInstance));
                        }
                        catch (Exception ex)
                        {
                            throw new NativeArgumentsParseException(
                                string.Format(exceptionFormat, index),
                                "jsArguments",
                                ex);
                        }
                    });
            }
            else if (type == typeof(IPromise))
            {
                return new Extractor(
                    2,
                    (catalystInstance, arguments, index) =>
                    {
                        var nextIndex = index + 1;
                        if (nextIndex >= arguments.Count)
                        {
                            throw new NativeArgumentsParseException(
                                string.Format(exceptionFormat, index + " and " + (index + 1)),
                                "jsArguments");
                        }

                        try
                        {
                            return new Result(
                                nextIndex + 1,
                                CreatePromise(arguments[index], arguments[nextIndex], catalystInstance));
                        }
                        catch (Exception ex)
                        {
                            throw new NativeArgumentsParseException(
                                string.Format(exceptionFormat, index + " and " + nextIndex),
                                "jsArguments",
                                ex);
                        }
                    });
            }
            else
            {
                return new Extractor(
                    1,
                    (catalystInstance, arguments, index) =>
                    {
                        try
                        {
                            return new Result(
                                index + 1,
                                arguments[index].ToObject(type));
                        }
                        catch (Exception ex)
                        {
                            throw new NativeArgumentsParseException(
                                string.Format(exceptionFormat, index),
                                "jsArguments",
                                ex.InnerException);
                        }
                    });
            }
        }

        private static void Invoke(
            MethodInfo method,
            int expectedArguments,
            IList<Func<ICatalystInstance, JArray, int, Result>> extractors,
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

            var n = expectedArguments;
            var c = extractors.Count;
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

            var idx = 0;
            var args = new object[extractors.Count];
            for (var j = 0; j < c; ++j)
            {
                var result = extractors[j](catalystInstance, jsArguments, idx);
                args[j] = result.Value;
                idx = result.NextIndex;
            }

            method.Invoke(moduleInstance, args);
        }

        private struct Result
        {
            public Result(int nextIndex, object value)
            {
                NextIndex = nextIndex;
                Value = value;
            }

            public int NextIndex { get; }

            public object Value { get; }
        }

        private struct Extractor
        {
            public Extractor(int expectedArguments, Func<ICatalystInstance, JArray, int, Result> extractFunction)
            {
                ExpectedArguments = expectedArguments;
                ExtractFunction = extractFunction;
            }

            public int ExpectedArguments { get; }
            public Func<ICatalystInstance, JArray, int, Result> ExtractFunction { get; }
        }
    }
}
