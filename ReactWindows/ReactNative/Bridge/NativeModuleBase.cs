using Newtonsoft.Json.Linq;
using ReactNative.Reflection;
using ReactNative.Tracing;
using System;
using System.Collections.Generic;
using System.Globalization;
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
        private static readonly MethodInfo s_toObjectGeneric = ((MethodInfo)ReflectionHelpers.InfoOf((JToken token) => token.ToObject<object>())).GetGenericMethodDefinition();

        private static readonly IReadOnlyDictionary<string, object> s_emptyConstants
            = new Dictionary<string, object>();

        private readonly IReadOnlyDictionary<string, INativeMethod> _methods;
        private readonly IReactDelegateFactory _delegateFactory;

        /// <summary>
        /// Instantiates a <see cref="NativeModuleBase"/>.
        /// </summary>
        protected NativeModuleBase()
            : this(ReflectionReactDelegateFactory.Instance)
        {
        }

        /// <summary>
        /// Instantiates a <see cref="NativeModuleBase"/>.
        /// </summary>
        /// <param name="delegateFactory">
        /// Factory responsible for creating delegates for method invocations.
        /// </param>
        protected NativeModuleBase(IReactDelegateFactory delegateFactory)
        {
            _delegateFactory = delegateFactory;
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

            private readonly Lazy<Action<INativeModule, ICatalystInstance, JArray>> _invokeDelegate;

            public NativeMethod(NativeModuleBase instance, MethodInfo method)
            {
                _instance = instance;
                _invokeDelegate = new Lazy<Action<INativeModule, ICatalystInstance, JArray>>(() => instance._delegateFactory.Create(instance, method));

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
                    _invokeDelegate.Value(_instance, catalystInstance, jsArguments);
                }
            }
        }
    }
}
