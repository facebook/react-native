using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Globalization;

namespace ReactNative.Bridge
{
    class JavaScriptModuleRegistry
    {
        private readonly IDictionary<Type, IJavaScriptModule> _moduleInstances;

        public JavaScriptModuleRegistry(
            CatalystInstance catalystInstance,
            JavaScriptModulesConfig config)
        {
            _moduleInstances = new Dictionary<Type, IJavaScriptModule>(config.ModuleDefinitions.Count);
            foreach (var registration in config.ModuleDefinitions)
            {
                var type = registration.ModuleInterface;
                var moduleInstance = (IJavaScriptModule)Activator.CreateInstance(type);
                var invokeHandler = new JavaScriptModuleInvokeHandler(catalystInstance, registration);
                moduleInstance.InvokeHandler = invokeHandler;
                _moduleInstances.Add(type, moduleInstance);
            }
        }

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

        class JavaScriptModuleInvokeHandler : IInvokeHandler
        {
            private readonly CatalystInstance _catalystInstance;
            private readonly JavaScriptModuleRegistration _moduleRegistration;

            public JavaScriptModuleInvokeHandler(
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
