using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

namespace ReactNative
{
    /// <summary>
    /// Base implementation for <see cref="IReactDelegateFactory"/>.
    /// </summary>
    public abstract class ReactDelegateFactoryBase : IReactDelegateFactory
    {
        const string METHOD_TYPE_REMOTE = "remote";
        const string METHOD_TYPE_REMOTE_ASYNC = "remoteAsync";
        
        /// <summary>
        /// Instantiates a <see cref="ReactDelegateFactoryBase"/>.
        /// </summary>
        protected ReactDelegateFactoryBase() { }

        /// <summary>
        /// Create an invocation delegate from the given method.
        /// </summary>
        /// <param name="module">The native module instance.</param>
        /// <param name="method">The method.</param>
        /// <returns>The invocation delegate.</returns>
        public abstract Action<INativeModule, IReactInstance, JArray> Create(INativeModule module, MethodInfo method);

        /// <summary>
        /// Extracts the native method type from the method.
        /// </summary>
        /// <param name="method">The method.</param>
        /// <returns>The native method type.</returns>
        public string GetMethodType(MethodInfo method)
        {
            if (method.ReturnType == typeof(Task))
            {
                throw new NotImplementedException("Async methods are not yet supported.");
            }

            var parameters = method.GetParameters();
            if (parameters.Length > 0 && parameters.Last().ParameterType == typeof(IPromise))
            {
                return METHOD_TYPE_REMOTE_ASYNC;
            }

            return METHOD_TYPE_REMOTE;
        }

        /// <summary>
        /// Check that the method is valid for <see cref="ReactMethodAttribute"/>.
        /// </summary>
        /// <param name="method">The method.</param>
        public void Validate(MethodInfo method)
        {
            var returnType = method.ReturnType;
            if (returnType != typeof(Task) && returnType != typeof(void))
            {
                throw new NotSupportedException("Native module methods must either return void or Task.");
            }

            var parameters = method.GetParameters();
            var n = parameters.Length;
            for (var i = 0; i < n; ++i)
            {
                var parameterType = parameters[i].ParameterType;
                if (parameterType == typeof(IPromise) && i != (n - 1))
                {
                    throw new NotSupportedException("Promises are only supported as the last parameter of a native module method.");
                }
                else if (parameterType == typeof(ICallback) && i != (n - 1))
                {
                    if (i != (n - 2) || parameters[n - 1].ParameterType != typeof(ICallback))
                    {
                        throw new NotSupportedException("Callbacks are only supported in the last two positions of a native module method.");
                    }
                }
                else if (returnType == typeof(Task) && (parameterType == typeof(ICallback) || parameterType == typeof(IPromise)))
                {
                    throw new NotSupportedException("Callbacks and promises are not supported in async native module methods.");
                }
            }
        }

        /// <summary>
        /// Create a callback.
        /// </summary>
        /// <param name="callbackToken">The callback ID token.</param>
        /// <param name="reactInstance">The react instance.</param>
        /// <returns>The callback.</returns>
        protected static ICallback CreateCallback(JToken callbackToken, IReactInstance reactInstance)
        {
            var id = callbackToken.Value<int>();
            return new Callback(id, reactInstance);
        }

        /// <summary>
        /// Create a promise.
        /// </summary>
        /// <param name="resolveToken">The resolve callback ID token.</param>
        /// <param name="rejectToken">The reject callback ID token.</param>
        /// <param name="reactInstance">The react instance.</param>
        /// <returns>The promise.</returns>
        protected static IPromise CreatePromise(JToken resolveToken, JToken rejectToken, IReactInstance reactInstance)
        {
            var resolveCallback = CreateCallback(resolveToken, reactInstance);
            var rejectCallback = CreateCallback(rejectToken, reactInstance);
            return new Promise(resolveCallback, rejectCallback);
        }

        class Callback : ICallback
        {
            private static readonly object[] s_empty = new object[0];

            private readonly int _id;
            private readonly IReactInstance _instance;

            public Callback(int id, IReactInstance instance)
            {
                _id = id;
                _instance = instance;
            }

            public void Invoke(params object[] arguments)
            {
                _instance.InvokeCallback(_id, JArray.FromObject(arguments ?? s_empty));
            }
        }

        class Promise : IPromise
        {
            private readonly ICallback _resolve;
            private readonly ICallback _reject;

            public Promise(ICallback resolve, ICallback reject)
            {
                _resolve = resolve;
                _reject = reject;
            }

            public void Reject(string reason)
            {
                if (_reject != null)
                {
                    _reject.Invoke(new Dictionary<string, string>
                    {
                        { "message", reason },
                    });
                }
            }

            public void Reject(Exception exception)
            {
                Reject(exception.Message);
            }

            public void Resolve(object value)
            {
                if (_resolve != null)
                {
                    _resolve.Invoke(value);
                }
            }
        }
    }
}
