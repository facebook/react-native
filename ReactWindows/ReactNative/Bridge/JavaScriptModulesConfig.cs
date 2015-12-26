using Newtonsoft.Json;
using ReactNative.Reflection;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Reflection;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Class to store the configuration of JavaScript modules that can be used
    /// across the bridge.
    /// </summary>
    public class JavaScriptModulesConfig
    {
        private JavaScriptModulesConfig(IReadOnlyList<JavaScriptModuleRegistration> modules)
        {
            ModuleDefinitions = modules;
        }

        /// <summary>
        /// The module definitions.
        /// </summary>
        internal IReadOnlyList<JavaScriptModuleRegistration> ModuleDefinitions
        {
            get;
        }

        /// <summary>
        /// Writes the description of the modules to a <see cref="JsonWriter"/>.
        /// </summary>
        /// <param name="writer">The JSON writer.</param>
        public void WriteModuleDescriptions(JsonWriter writer)
        {
            writer.WriteStartObject();
            foreach (var module in ModuleDefinitions)
            {
                writer.WritePropertyName(module.Name);
                writer.WriteStartObject();
                writer.WritePropertyName("moduleID");
                writer.WriteValue(module.ModuleId);
                writer.WritePropertyName("methods");
                writer.WriteStartObject();
                foreach (var method in module.Methods)
                {
                    writer.WritePropertyName(method);
                    writer.WriteStartObject();
                    writer.WritePropertyName("methodID");
                    writer.WriteValue(module.GetMethodId(method));
                    writer.WriteEndObject();
                }
                writer.WriteEndObject();
                writer.WriteEndObject();
            }
            writer.WriteEndObject();
        }

        /// <summary>
        /// Builder for <see cref="JavaScriptModulesConfig"/> instances.
        /// </summary>
        public sealed class Builder
        {
            private static readonly Type[] s_emptyArray = new Type[0];

            private readonly List<JavaScriptModuleRegistration> _modules =
                new List<JavaScriptModuleRegistration>();

            /// <summary>
            /// Adds a JavaScript module of the given type.
            /// </summary>
            /// <typeparam name="T">Type of JavaScript module.</typeparam>
            /// <returns>The builder instance.</returns>
            public Builder Add<T>() where T : IJavaScriptModule, new()
            {
                var moduleId = _modules.Count;
                if (ValidJavaScriptModuleType(typeof(T)))
                {
                    _modules.Add(new JavaScriptModuleRegistration(moduleId, typeof(T)));
                }
                    
                return this;
            }

            /// <summary>
            /// Validates the module type is a proper javascript module type, 
            /// and will throw the proper exception if 
            /// </summary>
            /// <param name="moduleType">The object type</param>
            /// <returns>true: if the type is a valid JS module type</returns>
            public static bool ValidJavaScriptModuleType(Type moduleType)
            {
                if (moduleType.GetTypeInfo().IsAbstract)
                {
                    throw new ArgumentException(
                        string.Format(
                            CultureInfo.InvariantCulture,
                            "JavaScript module '{0}' must not be abstract.",
                            moduleType),
                        nameof(moduleType));
                }

                if (!typeof(IJavaScriptModule).IsAssignableFrom(moduleType))
                {
                    throw new ArgumentException(
                        string.Format(
                            CultureInfo.InvariantCulture,
                            "JavaScript module '{0}' must derive from IJavaScriptModule.",
                            moduleType),
                        nameof(moduleType));
                }

                var defaultConstructor = moduleType.GetConstructor(s_emptyArray);
                if (defaultConstructor == null || !defaultConstructor.IsPublic)
                {
                    throw new ArgumentException(
                        string.Format(
                            CultureInfo.InvariantCulture,
                            "JavaScript module '{0}' must have a public default constructor.",
                            moduleType),
                        nameof(moduleType));
                }

                return true;
            }

            /// <summary>
            /// Adds a JavaScript module of the given type.
            /// </summary>
            /// <param name="moduleType">The module type.</param>
            /// <returns>The builder instance.</returns>
            public Builder Add(Type moduleType)
            {
                var moduleId = _modules.Count;

                if (ValidJavaScriptModuleType(moduleType))
                {
                    _modules.Add(new JavaScriptModuleRegistration(moduleId, moduleType));
                }

                return this;
            }

            /// <summary>
            /// Builds the <see cref="JavaScriptModulesConfig"/> instance.
            /// </summary>
            /// <returns>The instance.</returns>
            public JavaScriptModulesConfig Build()
            {
                return new JavaScriptModulesConfig(_modules);
            }
        }
    }
}
