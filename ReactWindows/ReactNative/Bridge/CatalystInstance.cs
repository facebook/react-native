using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge.Queue;
using ReactNative.Common;
using ReactNative.Tracing;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace ReactNative.Bridge
{
    class CatalystInstance : ICatalystInstance, IDisposable
    {
        private readonly NativeModuleRegistry _registry;
        private readonly CatalystQueueConfiguration _catalystQueueConfiguration;
        private readonly IJavaScriptExecutor _jsExecutor;

        private readonly JavaScriptModulesConfig _jsModulesConfig;
        private IReactBridge _bridge;

        private bool _initialized;
        private bool _disposed;

        public CatalystInstance(
            CatalystQueueConfigurationSpec catalystQueueConfigurationSpec,
            IJavaScriptExecutor jsExecutor,
            NativeModuleRegistry registry,
            JavaScriptModulesConfig jsModulesConfig)
        {
            _registry = registry;
            _jsExecutor = jsExecutor;
            _jsModulesConfig = jsModulesConfig;

            _catalystQueueConfiguration = CatalystQueueConfiguration.Create(
                catalystQueueConfigurationSpec,
                HandleException);
        }

        public IEnumerable<INativeModule> NativeModules
        {
            get
            {
                return _registry.Modules;
            }
        }

        public T GetNativeModule<T>() where T : INativeModule
        {
            return _registry.GetModule<T>();
        }

        public async Task InitializeAsync()
        {
            DispatcherHelpers.AssertOnDispatcher();
            if (_initialized)
            {
                throw new InvalidOperationException("This catalyst instance has already been initialized.");
            }

            await InitializeBridgeAsync();

            _initialized = true;
            _registry.NotifyCatalystInstanceInitialize();
        }

        public void InvokeCallback(int callbackId, JArray arguments)
        {
            if (_disposed)
            {
                Tracer.Write(ReactConstants.Tag, "Invoking JS callback after bridge has been destroyed.");
                return;
            }

            _catalystQueueConfiguration.JSQueueThread.RunOnQueue(() =>
            {
                _catalystQueueConfiguration.JSQueueThread.AssertIsOnThread();
                if (_disposed)
                {
                    return;
                }

                using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "<callback>"))
                {
                    _bridge.InvokeCallback(callbackId, arguments);
                }
            });
        }

        public void InvokeFunction(int moduleId, int methodId, JArray arguments, string tracingName)
        {
            _catalystQueueConfiguration.JSQueueThread.RunOnQueue(() =>
            {
                _catalystQueueConfiguration.JSQueueThread.AssertIsOnThread();

                if (_disposed)
                {
                    return;
                }

                using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, tracingName))
                {
                    if (_bridge == null)
                    {
                        throw new InvalidOperationException("Bridge has not been initialized.");
                    }

                    _bridge.CallFunction(moduleId, methodId, arguments);
                }
            });
        }

        public void Dispose()
        {
            DispatcherHelpers.AssertOnDispatcher();

            if (_disposed)
            {
                return;
            }

            _disposed = true;
            _registry.NotifyCatalystInstanceDispose();
            _catalystQueueConfiguration.Dispose();
            // TODO: notify bridge idle listeners
            _bridge.Dispose();
        }

        private Task InitializeBridgeAsync()
        {
            return _catalystQueueConfiguration.JSQueueThread.CallOnQueue(() =>
            {
                _catalystQueueConfiguration.JSQueueThread.AssertIsOnThread();

                using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "ReactBridgeCtor"))
                {
                    _bridge = new ReactBridge(
                        _jsExecutor,
                        new NativeModulesReactCallback(this),
                        _catalystQueueConfiguration.NativeModulesQueueThread);
                }

                using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "setBatchedBridgeConfig"))
                {
                    _bridge.SetGlobalVariable("__fbBatchedBridgeConfig", BuildModulesConfig());
                }

                return _bridge;
            });
        }

        private string BuildModulesConfig()
        {
            using (var stringWriter = new StringWriter())
            {
                using (var writer = new JsonTextWriter(stringWriter))
                {
                    writer.WriteStartObject();
                    writer.WritePropertyName("remoteModuleConfig");
                    _registry.WriteModuleDescriptions(writer);
                    writer.WritePropertyName("localModulesConfig");
                    _jsModulesConfig.WriteModuleDescriptions(writer);
                    writer.WriteEndObject();
                }

                return stringWriter.ToString();
            }
        }

        private void HandleException(Exception ex)
        {
            // TODO
        }

        class NativeModulesReactCallback : IReactCallback
        {
            private readonly CatalystInstance _parent;

            public NativeModulesReactCallback(CatalystInstance parent)
            {
                _parent = parent;
            }

            public void Invoke(int moduleId, int methodId, JArray parameters)
            {
                _parent._catalystQueueConfiguration.NativeModulesQueueThread.AssertIsOnThread();

                if (_parent._disposed)
                {
                    return;
                }

                _parent._registry.Invoke(_parent, moduleId, methodId, parameters);
            }

            public void OnBatchComplete()
            {
                _parent._catalystQueueConfiguration.NativeModulesQueueThread.AssertIsOnThread();
            }
        }
    }
}
