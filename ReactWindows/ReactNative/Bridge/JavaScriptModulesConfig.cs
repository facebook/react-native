using Newtonsoft.Json;
using System.Collections.Generic;

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
                _modules.Add(new JavaScriptModuleRegistration(moduleId, typeof(T)));
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
