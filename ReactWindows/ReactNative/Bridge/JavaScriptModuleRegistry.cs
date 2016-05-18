using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Reflection;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Class responsible for holding all <see cref="IJavaScriptModule"/>s
    /// registered to a <see cref="IReactInstance"/>. Requires that
    /// JavaScript modules use the <see cref="JavaScriptModuleBase"/> base
    /// class, and implement each of it's methods to dispatch through the
    /// <see cref="JavaScriptModuleBase.Invoke(object[], string)"/> method.
    /// </summary>
    public class JavaScriptModuleRegistry
    {
        private readonly IDictionary<Type, IJavaScriptModule> _moduleInstances;
        private readonly IDictionary<Type, JavaScriptModuleRegistration> _moduleRegistrations;

        private JavaScriptModuleRegistry(IList<JavaScriptModuleRegistration> config)
        {
            _moduleInstances = new Dictionary<Type, IJavaScriptModule>(config.Count);
            _moduleRegistrations = new Dictionary<Type, JavaScriptModuleRegistration>(config.Count);
            foreach (var registration in config)
            {
                _moduleRegistrations.Add(registration.ModuleInterface, registration);
            }
        }

        /// <summary>
        /// Gets an instance of a <see cref="IJavaScriptModule"/>.
        /// </summary>
        /// <typeparam name="T">Type of JavaScript module.</typeparam>
        /// <param name="instance">The React instance.</param>
        /// <returns>The JavaScript module instance.</returns>
        public T GetJavaScriptModule<T>(IReactInstance instance) where T : IJavaScriptModule
        {
            lock (_moduleInstances)
            {
                var moduleInstance = default(IJavaScriptModule);
                if (!_moduleInstances.TryGetValue(typeof(T), out moduleInstance))
                {
                    var registration = default(JavaScriptModuleRegistration);
                    if (!_moduleRegistrations.TryGetValue(typeof(T), out registration))
                    {
                        throw new InvalidOperationException(
                            $"JS module '{typeof(T)}' hasn't been registered.");
                    }

                    var type = registration.ModuleInterface;
                    moduleInstance = (IJavaScriptModule)Activator.CreateInstance(type);
                    var invokeHandler = new JavaScriptModuleInvocationHandler(instance, registration);
                    moduleInstance.InvocationHandler = invokeHandler;
                    _moduleInstances.Add(type, moduleInstance);
                }

                return (T)moduleInstance;
            }
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
                    _moduleRegistration.Name,
                    name,
                    JArray.FromObject(args),
                    tracingName);
            }
        }

        /// <summary>
        /// Builder for <see cref="JavaScriptModuleRegistry"/>.
        /// </summary>
        public sealed class Builder
        {
            private readonly IList<JavaScriptModuleRegistration> _modules =
                new List<JavaScriptModuleRegistration>();

            /// <summary>
            /// Add a JavaScript module.
            /// </summary>
            /// <param name="type">The JavaScript module type.</param>
            /// <returns>The builder instance.</returns>
            public Builder Add(Type type)
            {
#if DEBUG
                Validate(type);
#endif
                _modules.Add(new JavaScriptModuleRegistration(type));
                return this;
            }

            /// <summary>
            /// Build the JavaScript module registry.
            /// </summary>
            /// <returns>The registry.</returns>
            public JavaScriptModuleRegistry Build()
            {
                return new JavaScriptModuleRegistry(_modules);
            }

            private static void Validate(Type type)
            {
                if (type.GetTypeInfo().IsAbstract)
                {
                    throw new ArgumentException(
                        $"JavaScript module '{type}' must not be abstract.",
                        nameof(type));
                }

                if (!typeof(IJavaScriptModule).IsAssignableFrom(type))
                {
                    throw new ArgumentException(
                        $"JavaScript module '{type}' must derive from IJavaScriptModule.",
                        nameof(type));
                }

                var defaultConstructor = type.GetConstructor(Array.Empty<Type>());
                if (defaultConstructor == null || !defaultConstructor.IsPublic)
                {
                    throw new ArgumentException(
                        $"JavaScript module '{type}' must have a public default constructor.",
                        nameof(type));
                }
            }
        }
    }
}
