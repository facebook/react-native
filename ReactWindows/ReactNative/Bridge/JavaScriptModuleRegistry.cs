using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Globalization;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Class responsible for holding all <see cref="IJavaScriptModule"/>s
    /// registered to a <see cref="ICatalystInstance"/>. Requires that
    /// JavaScript modules use the <see cref="JavaScriptModuleBase"/> base
    /// class, and implement each of it's methods to dispatch through the
    /// <see cref="JavaScriptModuleBase.Invoke(string, object[])"/> method.
    /// </summary>
    class JavaScriptModuleRegistry
    {
        private readonly IDictionary<Type, IJavaScriptModule> _moduleInstances;

        /// <summary>
        /// Instantiates the <see cref="JavaScriptModuleRegistry"/>.
        /// </summary>
        /// <param name="catalystInstance">The catalyst instance.</param>
        /// <param name="config">The module configuration.</param>
        public JavaScriptModuleRegistry(
            CatalystInstance catalystInstance,
            JavaScriptModulesConfig config)
        {
            _moduleInstances = new Dictionary<Type, IJavaScriptModule>(config.ModuleDefinitions.Count);
            foreach (var registration in config.ModuleDefinitions)
            {
                var type = registration.ModuleInterface;
                var moduleInstance = (IJavaScriptModule)Activator.CreateInstance(type);
                var invokeHandler = new JavaScriptModuleInvocationHandler(catalystInstance, registration);
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
            private readonly CatalystInstance _catalystInstance;
            private readonly JavaScriptModuleRegistration _moduleRegistration;

            public JavaScriptModuleInvocationHandler(
                CatalystInstance catalystInstance,
                JavaScriptModuleRegistration moduleRegistration)
            {
                _catalystInstance = catalystInstance;
                _moduleRegistration = moduleRegistration;
            }

            public void Invoke(string name, object[] args)
            {
                var tracingName = _moduleRegistration.GetTracingName(name);
                _catalystInstance.InvokeFunction(
                    _moduleRegistration.ModuleId,
                    _moduleRegistration.GetMethodId(name),
                    JArray.FromObject(args),
                    tracingName);
            }
        }
    }
}
