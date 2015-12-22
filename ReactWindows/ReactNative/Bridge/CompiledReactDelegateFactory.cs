using Newtonsoft.Json.Linq;
using ReactNative.Reflection;
using System;
using System.Globalization;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace ReactNative.Bridge
{
    /// <summary>
    /// A delegate factory that will compile a delegate to call the native method.
    /// </summary>
    public sealed class CompiledReactDelegateFactory : ReactDelegateFactoryBase
    {
        private static readonly ConstructorInfo s_newArgumentNullException = (ConstructorInfo)ReflectionHelpers.InfoOf(() => new ArgumentNullException(default(string)));
        private static readonly ConstructorInfo s_newArgumentException = (ConstructorInfo)ReflectionHelpers.InfoOf(() => new ArgumentException(default(string), default(string)));
        private static readonly ConstructorInfo s_newNativeArgumentParseException = (ConstructorInfo)ReflectionHelpers.InfoOf(() => new NativeArgumentsParseException(default(string), default(string)));
        private static readonly ConstructorInfo s_newNativeArgumentParseExceptionInner = (ConstructorInfo)ReflectionHelpers.InfoOf(() => new NativeArgumentsParseException(default(string), default(string), default(Exception)));
        private static readonly MethodInfo s_createCallback = ((MethodInfo)ReflectionHelpers.InfoOf(() => CreateCallback(default(JToken), default(ICatalystInstance))));
        private static readonly MethodInfo s_createPromise = ((MethodInfo)ReflectionHelpers.InfoOf(() => CreatePromise(default(JToken), default(JToken), default(ICatalystInstance))));
        private static readonly MethodInfo s_toObject = ((MethodInfo)ReflectionHelpers.InfoOf((JToken token) => token.ToObject(typeof(Type))));
        private static readonly MethodInfo s_stringFormat = (MethodInfo)ReflectionHelpers.InfoOf(() => string.Format(default(IFormatProvider), default(string), default(object)));
        private static readonly MethodInfo s_getIndex = (MethodInfo)ReflectionHelpers.InfoOf((JArray arr) => arr[0]);
        private static readonly PropertyInfo s_countProperty = (PropertyInfo)ReflectionHelpers.InfoOf((JArray arr) => arr.Count);

        private CompiledReactDelegateFactory() { }

        /// <summary>
        /// The <see cref="CompiledReactDelegateFactory"/> instance.
        /// </summary>
        public static CompiledReactDelegateFactory Instance { get; } 
            = new CompiledReactDelegateFactory();

        /// <summary>
        /// Create an invocation delegate from the given method.
        /// </summary>
        /// <param name="method">The method.</param>
        /// <returns>The invocation delegate.</returns>
        public override Action<INativeModule, ICatalystInstance, JArray> Create(INativeModule module, MethodInfo method)
        {
            return GenerateExpression(module, method).Compile();
        }

        private static Expression<Action<INativeModule, ICatalystInstance, JArray>> GenerateExpression(INativeModule module, MethodInfo method)
        {
            var parameterInfos = method.GetParameters();

            var n = parameterInfos.Length;
            var argc = n > 0 && parameterInfos.Last().ParameterType == typeof(IPromise) ? n + 1 : n;

            var parameterExpressions = new ParameterExpression[n];
            var extractExpressions = new Expression[n];

            var moduleInstanceParameter = Expression.Parameter(typeof(INativeModule), "moduleInstance");
            var catalystInstanceParameter = Expression.Parameter(typeof(ICatalystInstance), "catalystInstance");
            var jsArgumentsParameter = Expression.Parameter(typeof(JArray), "jsArguments");

            for (var i = 0; i < n; ++i)
            {
                var parameterInfo = parameterInfos[i];
                var parameterType = parameterInfo.ParameterType;
                var parameterExpression = Expression.Parameter(parameterType, parameterInfo.Name);
                parameterExpressions[i] = parameterExpression;
                extractExpressions[i] = GenerateExtractExpression(
                    parameterInfo.ParameterType,
                    parameterExpression,
                    jsArgumentsParameter,
                    catalystInstanceParameter,
                    jsArgumentsParameter.Name,
                    module.Name,
                    method.Name,
                    i);
            }

            var blockStatements = new Expression[n + 5];

            //
            // if (moduleInstance == null)
            //     throw new ArgumentNullException(nameof(moduleInstance));
            //
            blockStatements[0] = CreateNullCheckExpression<ICatalystInstance>(moduleInstanceParameter);

            //
            // if (catalystInstance == null)
            //     throw new ArgumentNullException(nameof(catalystInstance));
            //
            blockStatements[1] = CreateNullCheckExpression<ICatalystInstance>(catalystInstanceParameter);

            //
            // if (jsArguments == null)
            //     throw new ArgumentNullException(nameof(jsArguments));
            //
            blockStatements[2] = CreateNullCheckExpression<JArray>(jsArgumentsParameter);

            //
            // if (jsArguments.Count != argc)
            //     throw new NativeArgumentsParseException(
            //         string.Format(
            //             CultureInfo.InvariantCulture,
            //             "Module 'moduleName' method 'methodName' got '{0}' arguments, expected 'parameterCount'."
            //             jsArguments.Count));
            //
            blockStatements[3] = Expression.IfThen(
                Expression.NotEqual(
                    Expression.MakeMemberAccess(jsArgumentsParameter, s_countProperty),
                    Expression.Constant(argc)
                ),
                Expression.Throw(
                    Expression.New(
                        s_newNativeArgumentParseException,
                        Expression.Call(
                            s_stringFormat,
                            Expression.Constant(CultureInfo.InvariantCulture),
                            Expression.Constant(
                                string.Format(
                                    CultureInfo.InvariantCulture,
                                    "Module '{0}' method '{1}' got '{{0}}' arguments, expected '{2}'.",
                                    module.Name,
                                    method.Name,
                                    argc)
                            ),
                            Expression.Convert(
                                Expression.MakeMemberAccess(jsArgumentsParameter, s_countProperty),
                                typeof(object)
                            )
                        ),
                        Expression.Constant(jsArgumentsParameter.Name)
                    )
                )
            );

            //
            // p0 = Extract<T>(jsArguments[0]);
            // p1 = Extract<T>(jsArguments[1]);
            // ...
            // pn = Extract<T>(jsArguments[n]);
            //
            Array.Copy(extractExpressions, 0, blockStatements, 4, n);

            blockStatements[blockStatements.Length - 1] = Expression.Call(
                Expression.Convert(moduleInstanceParameter, method.DeclaringType),
                method,
                parameterExpressions);

            return Expression.Lambda<Action<INativeModule, ICatalystInstance, JArray>>(
                Expression.Block(parameterExpressions, blockStatements),
                moduleInstanceParameter,
                catalystInstanceParameter,
                jsArgumentsParameter
            );
        }

        private static Expression GenerateExtractExpression(
            Type type,
            Expression leftExpression,
            Expression argumentsExpression,
            Expression catalystInstanceExpression,
            string parameterName,
            string moduleName,
            string methodName,
            int argumentIndex)
        {
            //
            // try
            // {
            //     ...
            // }
            // catch (Exception ex)
            // {
            //     throw new NativeArgumentParseException(
            //         "Error extracting argument for module 'moduleName' method 'methodName' at index 'argumentIndex'."),
            //         paramName,
            //         ex);
            // }
            //
            var catchBlock = Expression.Parameter(typeof(Exception), "ex").Let(ex =>
                Expression.Catch(
                    ex,
                    Expression.Throw(
                        Expression.New(
                            s_newNativeArgumentParseExceptionInner,
                            Expression.Constant(
                                string.Format(
                                    CultureInfo.InvariantCulture,
                                    "Error extracting argument for module '{0}' method '{1}' at index '{2}'.",
                                    moduleName,
                                    methodName,
                                    argumentIndex)
                            ),
                            Expression.Constant(parameterName),
                            ex
                        )
                    )
                )
            );

            var valueExpression = default(Expression);
            if (type == typeof(ICallback))
            {
                //
                // CreateCallback(jsArguments[i], catalystInstance);
                //
                valueExpression = Expression.Call(
                    s_createCallback,
                    Expression.Call(
                        argumentsExpression,
                        s_getIndex,
                        Expression.Constant(argumentIndex)
                    ),
                    catalystInstanceExpression);
            }
            else if (type == typeof(IPromise))
            {
                //
                // if (i > jsArguments.Count - 2)
                //     throw new NativeArgumentsParseException(...);
                //
                // CreatePromise(jsArguments[i], jsArguments[i + 1], catalystInstance);
                //
                valueExpression = Expression.Condition(
                    Expression.Equal(
                        Expression.Constant(argumentIndex),
                        Expression.Subtract(
                            Expression.Property(
                                argumentsExpression,
                                s_countProperty
                            ),
                            Expression.Constant(2)
                        )
                    ),
                    Expression.Call(
                        s_createPromise,
                        Expression.Call(
                            argumentsExpression,
                            s_getIndex,
                            Expression.Constant(argumentIndex)
                        ),
                        Expression.Call(
                            argumentsExpression,
                            s_getIndex,
                            Expression.Constant(argumentIndex + 1)
                        ),
                        catalystInstanceExpression
                    ),
                    Expression.Throw(
                        Expression.New(
                            s_newNativeArgumentParseException,
                            Expression.Constant(
                                string.Format(
                                    CultureInfo.InvariantCulture,
                                    "Error extracting argument for module '{0}' method '{1}' at index '{2}'.",
                                    moduleName,
                                    methodName,
                                    argumentIndex + " and " + (argumentIndex + 1))
                            ),
                            Expression.Constant(parameterName)
                        ),
                        type
                    )
                );
            }
            else
            {
                //
                // (T)jsArguments[i].ToObject(typeof(T));
                //
                valueExpression = Expression.Convert(
                    Expression.Call(
                        Expression.Call(
                            argumentsExpression,
                            s_getIndex,
                            Expression.Constant(argumentIndex)
                        ),
                        s_toObject, 
                        Expression.Constant(type)
                    ),
                    type
                );
            }

            //
            // try
            // {
            //     arg = ...
            // }
            // catch (Exception ex)
            // {
            //     ...
            // }
            // 
            return Expression.TryCatch(
                Expression.Block(
                    typeof(void),
                    Expression.Assign(leftExpression, valueExpression)
                ),
                catchBlock
            );
        }

        private static Expression CreateNullCheckExpression<T>(ParameterExpression parameter)
            where T : class
        {
            return Expression.IfThen(
                Expression.Equal(
                    parameter,
                    Expression.Default(typeof(T))
                ),
                Expression.Throw(Expression.New(s_newArgumentNullException, Expression.Constant(parameter.Name)))
            );
        }
    }
}
