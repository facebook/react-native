using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge.Queue;
using ReactNative.Common;
using ReactNative.Hosting.Bridge;
using ReactNative.Tracing;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Threading.Tasks;

namespace ReactNative.Bridge
{
    class CatalystInstance : ICatalystInstance, IDisposable
    {
        private readonly NativeModuleRegistry _registry;
        private readonly JavaScriptModuleRegistry _jsRegistry;
        private readonly IJavaScriptExecutor _jsExecutor;
        private readonly JavaScriptModulesConfig _jsModulesConfig;
        private readonly Action<Exception> _nativeModuleCallExceptionHandler;

        private IReactBridge _bridge;

        private bool _initialized;

        private CatalystInstance(
            CatalystQueueConfigurationSpec catalystQueueConfigurationSpec,
            IJavaScriptExecutor jsExecutor,
            NativeModuleRegistry registry,
            JavaScriptModulesConfig jsModulesConfig,
            Action<Exception> nativeModuleCallsExceptionHandler)
        {
            _registry = registry;
            _jsExecutor = jsExecutor;
            _jsModulesConfig = jsModulesConfig;
            _nativeModuleCallsExceptionHandler = nativeModuleCallsExceptionHandler;
            _jsRegistry = new JavaScriptModuleRegistry(this, _jsModulesConfig);

            QueueConfiguration = CatalystQueueConfiguration.Create(
                catalystQueueConfigurationSpec,
                HandleException);
        }

        public bool IsDisposed
        {
            get;
            private set;
        }

        public IEnumerable<INativeModule> NativeModules
        {
            get
            {
                return _registry.Modules;
            }
        }

        public ICatalystQueueConfiguration QueueConfiguration
        {
            get;
        } 

        public T GetJavaScriptModule<T>() where T : IJavaScriptModule
        {
            return _jsRegistry.GetJavaScriptModule<T>();
        }

        public T GetNativeModule<T>() where T : INativeModule
        {
            return _registry.GetModule<T>();
        }

        public void Initialize()
        {
            DispatcherHelpers.AssertOnDispatcher();
            if (_initialized)
            {
                throw new InvalidOperationException("This catalyst instance has already been initialized.");
            }

            _initialized = true;
            _registry.NotifyCatalystInstanceInitialize();
        }

        public void InvokeCallback(int callbackId, JArray arguments)
        {
            if (IsDisposed)
            {
                Tracer.Write(ReactConstants.Tag, "Invoking JS callback after bridge has been destroyed.");
                return;
            }

            QueueConfiguration.JSQueueThread.RunOnQueue(() =>
            {
                QueueConfiguration.JSQueueThread.AssertIsOnThread();
                if (IsDisposed)
                {
                    return;
                }

                using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "<callback>"))
                {
                    _bridge.InvokeCallback(callbackId, arguments);
                }
            });
        }

        public /* TODO: internal? */ void InvokeFunction(int moduleId, int methodId, JArray arguments, string tracingName)
        {
            QueueConfiguration.JSQueueThread.RunOnQueue(() =>
            {
                QueueConfiguration.JSQueueThread.AssertIsOnThread();

                if (IsDisposed)
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

            if (IsDisposed)
            {
                return;
            }

            IsDisposed = true;
            _registry.NotifyCatalystInstanceDispose();
            QueueConfiguration.Dispose();
            // TODO: notify bridge idle listeners
        }

        public Task InitializeBridgeAsync()
        {
            return QueueConfiguration.JSQueueThread.CallOnQueue(() =>
            {
                QueueConfiguration.JSQueueThread.AssertIsOnThread();

                using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "ReactBridgeCtor"))
                {
                    _bridge = new ReactBridge(
                        _jsExecutor,
                        new NativeModulesReactCallback(this),
                        QueueConfiguration.NativeModulesQueueThread);
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
            _nativeModuleCallsExceptionHandler(ex);
            QueueConfiguration.DispatcherQueueThread.RunOnQueue(Dispose);
        }

        public sealed class Builder
        {
            private CatalystQueueConfigurationSpec _catalystQueueConfigurationSpec;
            private NativeModuleRegistry _registry;
            private JavaScriptModulesConfig _jsModulesConfig;
            private IJavaScriptExecutor _jsExecutor;
            private Action<Exception> _nativeModuleCallExceptionHandler;

            public CatalystQueueConfigurationSpec QueueConfigurationSpec
            {
                set
                {
                    _catalystQueueConfigurationSpec = value;
                }
            }

            public NativeModuleRegistry Registry
            {
                set
                {
                    _registry = value;
                }
            }

            public JavaScriptModulesConfig JavaScriptModulesConfig
            {
                set
                {
                    _jsModulesConfig = value;
                }
            }

            public IJavaScriptExecutor JavaScriptExecutor
            {
                set
                {
                    _jsExecutor = value;
                }
            }

            public Action<Exception> NativeModuleCallExceptionHandler
            {
                set
                {
                    _nativeModuleCallExceptionHandler = value;
                }
            }

            public CatalystInstance Build()
            {
                AssertNotNull(_catalystQueueConfigurationSpec, nameof(QueueConfigurationSpec));
                AssertNotNull(_jsExecutor, nameof(IJavaScriptExecutor));
                AssertNotNull(_registry, nameof(Registry));
                AssertNotNull(_jsModulesConfig, nameof(JavaScriptModulesConfig));
                AssertNotNull(_nativeModuleCallExceptionHandler, nameof(NativeModuleCallExceptionHandler));

                return new CatalystInstance(
                    _catalystQueueConfigurationSpec,
                    _jsExecutor,
                    _registry,
                    _jsModulesConfig,
                    _nativeModuleCallExceptionHandler);
            }

            private void AssertNotNull(object value, string name)
            {
                if (value == null)
                    throw new InvalidOperationException(
                        string.Format(
                            CultureInfo.InvariantCulture,
                            "{0} has not been set.",
                            name));
            }
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
                _parent.QueueConfiguration.NativeModulesQueueThread.AssertIsOnThread();

                if (_parent.IsDisposed)
                {
                    return;
                }

                _parent._registry.Invoke(_parent, moduleId, methodId, parameters);
            }

            public void OnBatchComplete()
            {
                _parent.QueueConfiguration.NativeModulesQueueThread.AssertIsOnThread();
            }
        }
    }
}
