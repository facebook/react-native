using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace ReactNative.Bridge
{
    public sealed class NativeModuleRegistry
    {
        private readonly IList<ModuleDefinition> _moduleTable;
        private readonly IDictionary<Type, INativeModule> _moduleInstances;
        private readonly IList<IOnBatchCompleteListener> _batchCompleteListenerModules;

        private NativeModuleRegistry(
            IList<ModuleDefinition> moduleTable,
            IDictionary<Type, INativeModule> moduleInstances)
        {
            _moduleTable = moduleTable;
            _moduleInstances = moduleInstances;
            _batchCompleteListenerModules = _moduleTable
                .Select(moduleDefinition => moduleDefinition.Target)
                .OfType<IOnBatchCompleteListener>()
                .ToList();
        }

        public ICollection<INativeModule> Modules
        {
            get
            {
                return _moduleInstances.Values;
            }
        }

        public T GetModule<T>() where T : INativeModule
        {
            var instance = default(INativeModule);
            if (_moduleInstances.TryGetValue(typeof(T), out instance))
            {
                return (T)instance;
            }

            throw new InvalidOperationException("No module instance for type '{0}'.");
        }

        class ModuleDefinition
        {
            private readonly int _id;
            private readonly string _name;
            private readonly IList<MethodRegistration> _methods;

            public ModuleDefinition(int id, string name, INativeModule target)
            {
                _id = id;
                _name = name;
                Target = target;
                _methods = new List<MethodRegistration>(target.Methods.Count);

                foreach (var entry in target.Methods)
                {
                    _methods.Add(
                        new MethodRegistration(
                            entry.Key,
                            "NativeCall__" + target.Name + "_" + entry.Key,
                            entry.Value));
                }
            }

            public INativeModule Target { get; }

            public void Invoke(ICatalystInstance catalystInstance, int methodId, JArray parameters)
            {
                _methods[methodId].Method.Invoke(catalystInstance, parameters);
            }

            class MethodRegistration
            {
                public MethodRegistration(string name, string tracingName, INativeMethod method)
                {
                    Name = name;
                    TracingName = tracingName;
                    Method = method;
                }

                public string Name { get; }

                public string TracingName { get; }

                public INativeMethod Method { get; }
            }
        }

        public sealed class Builder
        {
            private readonly IDictionary<string, INativeModule> _modules = 
                new Dictionary<string, INativeModule>();

            public Builder Add(INativeModule module)
            {
                if (module == null)
                    throw new ArgumentNullException(nameof(module));
                if (module.Name == null)
                    throw new ArgumentException(
                        string.Format(
                            CultureInfo.InvariantCulture,
                            "Native module '{0}' cannot have a null `Name`.",
                            module.GetType()),
                        nameof(module));

                var existing = default(INativeModule);
                if (_modules.TryGetValue(module.Name, out existing) && !module.CanOverrideExistingModule)
                {
                    throw new InvalidOperationException(
                        string.Format(
                            CultureInfo.InvariantCulture,
                            "Native module '{0}' tried to override '{1}' for module name '{2}'. " +
                            "If this was your intention, override `CanOverrideExistingModule`.",
                            module.GetType().Name,
                            existing.GetType().Name,
                            module.Name));

                }

                _modules[module.Name] = module;

                return this;
            }

            public NativeModuleRegistry Build()
            {
                var moduleTable = new List<ModuleDefinition>(_modules.Count); 
                var moduleInstances = new Dictionary<Type, INativeModule>(_modules.Count);

                var idx = 0;
                foreach (var module in _modules.Values)
                {
                    var moduleDef = new ModuleDefinition(idx++, module.Name, module);
                    moduleTable.Add(moduleDef);
                    moduleInstances.Add(module.GetType(), module);
                }

                return new NativeModuleRegistry(moduleTable, moduleInstances);
            }
        }
    }
}
