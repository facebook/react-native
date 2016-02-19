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
        public override Action<INativeModule, IReactInstance, JArray> Create(INativeModule module, MethodInfo method)
        {
            var extractors = CreateExtractors(module, method);
            var expectedArguments = extractors.Sum(e => e.ExpectedArguments);
            var extractFunctions = extractors.Select(e => e.ExtractFunction).ToList();

            return (moduleInstance, reactInstance, arguments) => 
                Invoke(
                    method, 
                    expectedArguments,
                    extractFunctions,
                    moduleInstance,
                    reactInstance,
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
            var exceptionFormat =
                $"Error extracting argument for module '{moduleName}' method '{methodName}' at index '{{0}}'.";
           
            if (type == typeof(ICallback))
            {
                return new Extractor(
                    1,
                    (reactInstance, arguments, index) =>
                    {
                        try
                        {
                            return new Result(
                                index + 1, 
                                CreateCallback(arguments[index], reactInstance));
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
                    (reactInstance, arguments, index) =>
                    {
                        var nextIndex = index + 1;
                        if (nextIndex >= arguments.Count)
                        {
                            throw new NativeArgumentsParseException(
                                string.Format(exceptionFormat, index + "' and '" + (index + 1)),
                                "jsArguments");
                        }

                        try
                        {
                            return new Result(
                                nextIndex + 1,
                                CreatePromise(arguments[index], arguments[nextIndex], reactInstance));
                        }
                        catch (Exception ex)
                        {
                            throw new NativeArgumentsParseException(
                                string.Format(exceptionFormat, index + "' and '" + nextIndex),
                                "jsArguments",
                                ex);
                        }
                    });
            }
            else
            {
                return new Extractor(
                    1,
                    (reactInstance, arguments, index) =>
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
            IList<Func<IReactInstance, JArray, int, Result>> extractors,
            INativeModule moduleInstance,
            IReactInstance reactInstance,
            JArray jsArguments)
        {
            if (moduleInstance == null)
                throw new ArgumentNullException(nameof(moduleInstance));
            if (reactInstance == null)
                throw new ArgumentNullException(nameof(reactInstance));
            if (jsArguments == null)
                throw new ArgumentNullException(nameof(jsArguments));

            var n = expectedArguments;
            var c = extractors.Count;
            if (jsArguments.Count != n) 
            {
                throw new NativeArgumentsParseException(
                    $"Module '{moduleInstance.Name}' method '{method.Name}' got '{jsArguments.Count}' arguments, expected '{n}'.",
                    nameof(jsArguments));
            }

            var idx = 0;
            var args = new object[extractors.Count];
            for (var j = 0; j < c; ++j)
            {
                var result = extractors[j](reactInstance, jsArguments, idx);
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
            public Extractor(int expectedArguments, Func<IReactInstance, JArray, int, Result> extractFunction)
            {
                ExpectedArguments = expectedArguments;
                ExtractFunction = extractFunction;
            }

            public int ExpectedArguments { get; }
            public Func<IReactInstance, JArray, int, Result> ExtractFunction { get; }
        }
    }
}
