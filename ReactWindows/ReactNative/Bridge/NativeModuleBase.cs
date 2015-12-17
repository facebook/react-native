using Newtonsoft.Json.Linq;
using ReactNative.Reflection;
using ReactNative.Tracing;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq.Expressions;
using System.Reflection;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Base class for catalyst native modules. Implementations can be linked
    /// to lifecycle events, such as the creation and disposal of the
    /// <see cref="ICatalystInstance"/> by overriding the appropriate methods.
    /// 
    /// Native methods are exposed to JavaScript with the
    /// <see cref="ReactMethodAttribute"/> annotation. These methods may only
    /// use arguments that can be parsed by <see cref="JToken.ToObject{T}"/> or
    /// <see cref="ICallback"/>, which maps from a JavaScript function and can
    /// be used only as a last parameter, or in the case of success and error
    /// callback pairs, the last two arguments respectively.
    /// 
    /// All methods annotated with <see cref="ReactMethodAttribute"/> must
    /// return <see cref="void"/>.
    /// 
    /// Please note that it is not allowed to have multiple methods annotated
    /// with <see cref="ReactMethodAttribute"/> that share the same name.
    /// </summary>
    /// <remarks>
    /// Default implementations of <see cref="Initialize"/> and 
    /// <see cref="OnCatalystInstanceDispose"/> are provided for convenience.
    /// Subclasses need not call these base methods should they choose to
    /// override them.
    /// </remarks>
    public abstract class NativeModuleBase : INativeModule
    {
        private static readonly IReadOnlyDictionary<string, object> s_emptyConstants
            = new Dictionary<string, object>();

        private readonly IReadOnlyDictionary<string, INativeMethod> _methods;

        /// <summary>
        /// Instantiates a <see cref="NativeModuleBase"/>.
        /// </summary>
        protected NativeModuleBase()
        {
            _methods = InitializeMethods();
        }

        /// <summary>
        /// Return true if you intend to override some other native module that
        /// was registered, e.g., as part of a different package (such as the
        /// core one). Trying to override without returning true from this 
        /// method is considered an error and will throw an exception during
        /// initialization. By default, all modules return false.
        /// </summary>
        public virtual bool CanOverrideExistingModule
        {
            get
            {
                return false;
            }
        }

        /// <summary>
        /// Get the constants exported by this module.
        /// </summary>
        public virtual IReadOnlyDictionary<string, object> Constants
        {
            get
            {
                return s_emptyConstants;
            }
        }

        /// <summary>
        /// Get the methods callabke from JavaScript on this module.
        /// </summary>
        public IReadOnlyDictionary<string, INativeMethod> Methods
        {
            get
            {
                if (_methods == null)
                {
                    throw new InvalidOperationException("Module has not been initialized.");
                }

                return _methods;
            }
        }

        /// <summary>
        /// Get the name of the module.
        /// </summary>
        /// <remarks>
        /// This will be the name used to <code>require()</code> this module
        /// from JavaScript.
        /// </remarks>
        public abstract string Name
        {
            get;
        }

        /// <summary>
        /// Called after the creation of a <see cref="ICatalystInstance"/>, in
        /// order to initialize native modules that require the catalyst or
        /// JavaScript modules.
        /// </summary>
        public virtual void Initialize()
        {
        }

        /// <summary>
        /// Called before a <see cref="ICatalystInstance"/> is disposed.
        /// </summary>
        public virtual void OnCatalystInstanceDispose()
        {
        }

        /// <summary>
        /// Create the set of constants to configure the global environment.
        /// </summary>
        /// <returns>The set of constants.</returns>
        /// <remarks>
        /// This virtual method will be called during <see cref="Initialize"/>.
        /// </remarks>
        protected virtual IReadOnlyDictionary<string, object> CreateConstants()
        {
            return new Dictionary<string, object>();
        }

        private IReadOnlyDictionary<string, INativeMethod> InitializeMethods()
        {
            var declaredMethods = GetType().GetMethods();
            var exportedMethods = new List<MethodInfo>();
            foreach (var method in declaredMethods)
            {
                if (method.IsDefined(typeof(ReactMethodAttribute)))
                {
                    exportedMethods.Add(method);
                }
            }

            var methodMap = new Dictionary<string, INativeMethod>(exportedMethods.Count);
            foreach (var method in exportedMethods)
            {
                var existingMethod = default(INativeMethod);
                if (methodMap.TryGetValue(method.Name, out existingMethod))
                {
                    throw new NotSupportedException(
                        string.Format(
                            CultureInfo.InvariantCulture,
                            "React module '{0}' with name '{1}' has more than one ReactMethod with the name '{2}'.",
                            GetType(),
                            Name,
                            method.Name));
                }

                methodMap.Add(method.Name, new NativeMethod(this, method));
            }

            return methodMap;
        }

        class NativeMethod : INativeMethod
        {
            const string METHOD_TYPE_REMOTE = "remote";
            const string METHOD_TYPE_REMOTE_ASYNC = "remoteAsync";

            private readonly NativeModuleBase _instance;

            private readonly Lazy<Action<ICatalystInstance, JArray>> _invokeDelegate;

            public NativeMethod(NativeModuleBase instance, MethodInfo method)
            {
                _instance = instance;
                _invokeDelegate = new Lazy<Action<ICatalystInstance, JArray>>(() => GenerateExpression(instance, method).Compile());

                if (method.IsAsync())
                {
                    throw new NotImplementedException("Async methods not yet supported.");
                }

                Type = METHOD_TYPE_REMOTE;
            }

            public string Type
            {
                get;
            }

            public void Invoke(ICatalystInstance catalystInstance, JArray jsArguments)
            {
                using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "callNativeModuleMethod"))
                {
                    _invokeDelegate.Value(catalystInstance, jsArguments);
                }
            }

            private static ConstructorInfo s_newArgumentNullException = (ConstructorInfo)ReflectionHelpers.InfoOf(() => new ArgumentNullException(default(string)));
            private static ConstructorInfo s_newArgumentException = (ConstructorInfo)ReflectionHelpers.InfoOf(() => new ArgumentException(default(string), default(string)));
            private static ConstructorInfo s_newNativeArgumentParseException = (ConstructorInfo)ReflectionHelpers.InfoOf(() => new NativeArgumentsParseException(default(string), default(string)));
            private static ConstructorInfo s_newNativeArgumentParseExceptionInner = (ConstructorInfo)ReflectionHelpers.InfoOf(() => new NativeArgumentsParseException(default(string), default(string), default(Exception)));
            private static ConstructorInfo s_newCallback = (ConstructorInfo)ReflectionHelpers.InfoOf(() => new Callback(default(int), default(ICatalystInstance)));
            private static MethodInfo s_valueInt = ((MethodInfo)ReflectionHelpers.InfoOf((JToken token) => token.Value<object>())).GetGenericMethodDefinition().MakeGenericMethod(typeof(int));
            private static MethodInfo s_toObjectGeneric = ((MethodInfo)ReflectionHelpers.InfoOf((JToken token) => token.ToObject<object>())).GetGenericMethodDefinition();
            private static MethodInfo s_stringFormat = (MethodInfo)ReflectionHelpers.InfoOf(() => string.Format(default(IFormatProvider), default(string), default(object)));
            private static MethodInfo s_getIndex = (MethodInfo)ReflectionHelpers.InfoOf((JArray arr) => arr[0]);
            private static PropertyInfo s_countProperty = (PropertyInfo)ReflectionHelpers.InfoOf((JArray arr) => arr.Count);

            private static Expression<Action<ICatalystInstance, JArray>> GenerateExpression(NativeModuleBase module, MethodInfo method)
            {
                var parameterInfos = method.GetParameters();
                var n = parameterInfos.Length;

                var parameterExpressions = new ParameterExpression[n];
                var extractExpressions = new Expression[n];
                
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
                        Expression.Call(jsArgumentsParameter, s_getIndex, Expression.Constant(i)),
                        catalystInstanceParameter,
                        jsArgumentsParameter.Name,
                        module.Name,
                        method.Name,
                        i);
                }

                var blockStatements = new Expression[parameterInfos.Length + 4];

                //
                // if (catalystInstance == null)
                //     throw new ArgumentNullException(nameof(catalystInstance));
                //
                blockStatements[0] = CreateNullCheckExpression<ICatalystInstance>(catalystInstanceParameter);

                //
                // if (jsArguments == null)
                //     throw new ArgumentNullException(nameof(jsArguments));
                //
                blockStatements[1] = CreateNullCheckExpression<JArray>(jsArgumentsParameter);

                //
                // if (jsArguments.Count != valueOf(parameterInfos.Count))
                //     throw new NativeArgumentsParseException(
                //         string.Format(
                //             CultureInfo.InvariantCulture,
                //             "Module 'moduleName' method 'methodName' got '{0}' arguments, expected 'parameterCount'."
                //             jsArguments.Count));
                //
                blockStatements[2] = Expression.IfThen(
                    Expression.NotEqual(
                        Expression.MakeMemberAccess(jsArgumentsParameter, s_countProperty),
                        Expression.Constant(parameterInfos.Length)
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
                                        parameterInfos.Length)
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
                Array.Copy(extractExpressions, 0, blockStatements, 3, parameterInfos.Length);

                blockStatements[blockStatements.Length - 1] = Expression.Call(
                    Expression.Constant(module),
                    method,
                    parameterExpressions);

                return Expression.Lambda<Action<ICatalystInstance, JArray>>(
                    Expression.Block(parameterExpressions, blockStatements),
                    catalystInstanceParameter,
                    jsArgumentsParameter
                );
            }

            private static Expression GenerateExtractExpression(
                Type type,
                Expression leftExpression,
                Expression tokenExpression,
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
                //         string.Format(
                //             CultureInfo.InvariantCulture,
                //             "Error extracting argument for module 'moduleName' method 'methodName' at index '{0}'.",
                //             argumentIndex),
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
                                Expression.Call(
                                    s_stringFormat,
                                    Expression.Constant(CultureInfo.InvariantCulture),
                                    Expression.Constant(
                                        string.Format(
                                            CultureInfo.InvariantCulture,
                                            "Error extracting argument for module '{0}' method '{1}' at index '{{0}}'.",
                                            moduleName,
                                            methodName)
                                    ),
                                    Expression.Constant(argumentIndex, typeof(object))
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
                    valueExpression = Expression.Parameter(typeof(int), "id").Let(id =>
                        Expression.Block(
                            new[] { id },
                            Expression.Assign(
                                id,
                                Expression.Call(s_valueInt, tokenExpression)
                            ),
                            Expression.New(s_newCallback, id, catalystInstanceExpression)
                        )
                    );
                }
                else
                {
                    var toObjectMethod = s_toObjectGeneric.MakeGenericMethod(type);
                    valueExpression = Expression.Call(tokenExpression, toObjectMethod);
                }

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

            class Callback : ICallback
            {
                private static readonly object[] s_empty = new object[0];

                private readonly int _id;
                private readonly ICatalystInstance _instance;

                public Callback(int id, ICatalystInstance instance)
                {
                    _id = id;
                    _instance = instance;
                }

                public void Invoke(params object[] arguments)
                {
                    _instance.InvokeCallback(_id, JArray.FromObject(arguments ?? s_empty));
                }
            }
        }
    }
}
