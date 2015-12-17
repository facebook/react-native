using Newtonsoft.Json;
using System.Collections.Generic;

namespace ReactNative.Bridge
{
    public class JavaScriptModulesConfig
    {
        private JavaScriptModulesConfig(IReadOnlyList<JavaScriptModuleRegistration> modules)
        {
            ModuleDefinitions = modules;
        }

        internal IReadOnlyList<JavaScriptModuleRegistration> ModuleDefinitions
        {
            get;
        }

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
                    writer.WritePropertyName(method.Name);
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

        public sealed class Builder
        {
            private readonly List<JavaScriptModuleRegistration> _modules =
                new List<JavaScriptModuleRegistration>();

            public Builder Add<T>() where T : IJavaScriptModule
            {
                var moduleId = _modules.Count;
                _modules.Add(new JavaScriptModuleRegistration(moduleId, typeof(T)));
                return this;
            }

            public JavaScriptModulesConfig Build()
            {
                return new JavaScriptModulesConfig(_modules);
            }
        }
    }
}
