using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Globalization;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Class responsible for holding all <see cref="IJavaScriptModule"/>s
    /// registered to a <see cref="IReactInstance"/>. Requires that
    /// JavaScript modules use the <see cref="JavaScriptModuleBase"/> base
    /// class, and implement each of it's methods to dispatch through the
    /// <see cref="JavaScriptModuleBase.Invoke(string, object[])"/> method.
    /// </summary>
    public class JavaScriptModuleRegistry
    {
        private readonly IDictionary<Type, IJavaScriptModule> _moduleInstances;

        /// <summary>
        /// Instantiates the <see cref="JavaScriptModuleRegistry"/>.
        /// </summary>
        /// <param name="reactInstance">The react instance.</param>
        /// <param name="config">The module configuration.</param>
        public JavaScriptModuleRegistry(
            IReactInstance reactInstance,
            JavaScriptModulesConfig config)
        {
            if (reactInstance == null)
                throw new ArgumentNullException(nameof(reactInstance));
            if (config == null)
                throw new ArgumentNullException(nameof(config));

            _moduleInstances = new Dictionary<Type, IJavaScriptModule>(config.ModuleDefinitions.Count);
            foreach (var registration in config.ModuleDefinitions)
            {
                var type = registration.ModuleInterface;
                var moduleInstance = (IJavaScriptModule)Activator.CreateInstance(type);
                var invokeHandler = new JavaScriptModuleInvocationHandler(reactInstance, registration);
                moduleInstance.InvocationHandler = invokeHandler;
                _moduleInstances.Add(type, moduleInstance);
            }
        }

        /// <summary>
        /// Gets an instance of a <see cref="IJavaScriptModule"/>.
        /// </summary>
        /// <typeparam name="T">Type of JavaScript module.</typeparam>
        /// <returns>The JavaScript module instance.</returns>
        public T GetJavaScriptModule<T>() where T : IJavaScriptModule
        {
            var instance = default(IJavaScriptModule);
            if (!_moduleInstances.TryGetValue(typeof(T), out instance))
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "JS module '{0}' hasn't been registered.",
                        typeof(T)));
            }

            return (T)instance;
        }

        class JavaScriptModuleInvocationHandler : IInvocationHandler
        {
            private readonly IReactInstance _reactInstance;
            private readonly JavaScriptModuleRegistration _moduleRegistration;

            public JavaScriptModuleInvocationHandler(
                IReactInstance reactInstance,
                JavaScriptModuleRegistration moduleRegistration)
            {
                _reactInstance = reactInstance;
                _moduleRegistration = moduleRegistration;
            }

            public void Invoke(string name, object[] args)
            {
                var tracingName = _moduleRegistration.GetTracingName(name);
                _reactInstance.InvokeFunction(
                    _moduleRegistration.ModuleId,
                    _moduleRegistration.GetMethodId(name),
                    JArray.FromObject(args),
                    tracingName);
            }
        }
    }
}
