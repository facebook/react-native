using Newtonsoft.Json.Linq;
using ReactNative.Reflection;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Reflection;

namespace ReactNative.Bridge
{
    public abstract class NativeModuleBase : INativeModule
    {
        private IReadOnlyDictionary<string, INativeMethod> _methods;
        private IReadOnlyDictionary<string, object> _constants;

        public virtual bool CanOverrideExistingModule
        {
            get
            {
                return false;
            }
        }

        public virtual IReadOnlyDictionary<string, object> Constants
        {
            get
            {
                return _constants;
            }
        }

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

        public abstract string Name
        {
            get;
        }

        public void Initialize()
        {
            _methods = InitializeMethods();
            _constants = CreateConstants();
        }

        public virtual void OnCatalystInstanceDestroy()
        {
        }

        protected virtual IReadOnlyDictionary<string, object> CreateConstants()
        {
            return new Dictionary<string, object>();
        }

        private IReadOnlyDictionary<string, INativeMethod> InitializeMethods()
        {
            var declaredMethods = GetType().GetTypeInfo().DeclaredMethods;
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

            public void Invoke(ICatalystInstance instance, JArray parameters)
            {
                
            }

            private static MethodInfo s_extractCallback = (MethodInfo)ReflectionHelpers.InfoOf(() => ExtractCallback(default(JToken), default(ICatalystInstance)));
            private static MethodInfo s_extractGeneric = ((MethodInfo)ReflectionHelpers.InfoOf(() => Extract<object>(default(JToken)))).GetGenericMethodDefinition();
            private static PropertyInfo s_countProperty = (PropertyInfo)ReflectionHelpers.InfoOf((JArray arr) => arr.Count);
            private static Expression s_throwExpression = Expression.Throw(Expression.Constant(new ArgumentException("Invalid argument count.")));

            private static Expression<Action<ICatalystInstance, JArray>> GenerateExpression(NativeModuleBase instance, MethodInfo method)
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

                    if (parameterType == typeof(ICallback))
                    {
                        //
                        // valueOf(parameterInfo.Name) = ExtractCallback(jsArguments[valueOf(i)], catalystInstance)
                        //
                        extractExpressions[i] = Expression.Assign(
                            parameterExpression,
                            Expression.Call(
                                s_extractCallback,
                                Expression.ArrayIndex(
                                    jsArgumentsParameter,
                                    Expression.Constant(i)
                                ),
                                catalystInstanceParameter
                            )
                        );
                    }
                    else
                    {
                        var extractMethod = s_extractGeneric.MakeGenericMethod(parameterType);

                        //
                        // valueOf(parameterInfo.Name) = Extract<T>(jsArguments[valueOf(i)]);
                        //
                        extractExpressions[i] = Expression.Assign(
                            parameterExpression,
                            Expression.Call(
                                extractMethod,
                                Expression.ArrayIndex(
                                    jsArgumentsParameter,
                                    Expression.Constant(i)
                                )
                            )
                        );
                    }
                }

                var blockStatements = new Expression[parameterInfos.Length + 2];

                //
                // if (args.Count != valueOf(n))
                //     throw new ArgumentException("Invalid argument count.");
                //
                blockStatements[0] = Expression.Condition(
                    Expression.NotEqual(
                        Expression.Property(jsArgumentsParameter, s_countProperty),
                        Expression.Constant(n)
                    ),
                    s_throwExpression,
                    Expression.Empty()
                );

                //
                // p0 = Extract<T>(jsArguments[0]);
                // p1 = Extract<T>(jsArguments[1]);
                // ...
                // pn = Extract<T>(jsArguments[n]);
                //
                Array.Copy(extractExpressions, 0, blockStatements, 1, parameterInfos.Length);

                blockStatements[parameterInfos.Length + 1] = Expression.Call(
                    Expression.Constant(instance),
                    method,
                    parameterExpressions);

                return Expression.Lambda<Action<ICatalystInstance, JArray>>(
                    Expression.Block(parameterExpressions, blockStatements),
                    catalystInstanceParameter,
                    jsArgumentsParameter
                );
            }

            private static T Extract<T>(JToken value)
            {
                return value.ToObject<T>();
            }

            private static ICallback ExtractCallback(JToken value, ICatalystInstance instance)
            {
                var id = value.Value<int>();
                return new Callback(id, instance);
            }
            
            class Callback : ICallback
            {
                private readonly int _id;
                private readonly ICatalystInstance _instance;

                public Callback(int id, ICatalystInstance instance)
                {
                    _id = id;
                    _instance = instance;
                }

                public void Invoke(params object[] arguments)
                {
                    _instance.InvokeCallback(_id, JArray.FromObject(arguments));
                }
            }
        }
    }
}
