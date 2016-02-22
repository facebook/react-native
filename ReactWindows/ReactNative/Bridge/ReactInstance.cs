using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge.Queue;
using ReactNative.Common;
using ReactNative.Tracing;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace ReactNative.Bridge
{
    /// <summary>
    /// A higher level API on top of the <see cref="IJavaScriptExecutor" /> and module registries. This provides an
    /// environment allowing the invocation of JavaScript methods.
    /// </summary>
    class ReactInstance : IReactInstance, IDisposable
    {
        private readonly NativeModuleRegistry _registry;
        private readonly JavaScriptModuleRegistry _jsRegistry;
        private readonly Func<IJavaScriptExecutor> _jsExecutorFactory;
        private readonly JavaScriptBundleLoader _bundleLoader;
        private readonly JavaScriptModulesConfig _jsModulesConfig;
        private readonly Action<Exception> _nativeModuleCallExceptionHandler;

        private IReactBridge _bridge;

        private bool _initialized;

        private int _pendingJsCalls;

        private ReactInstance(
            ReactQueueConfigurationSpec reactQueueConfigurationSpec,
            Func<IJavaScriptExecutor> jsExecutorFactory,
            NativeModuleRegistry registry,
            JavaScriptModulesConfig jsModulesConfig,
            JavaScriptBundleLoader bundleLoader,
            Action<Exception> nativeModuleCallExceptionHandler)
        {
            _registry = registry;
            _jsExecutorFactory = jsExecutorFactory;
            _jsModulesConfig = jsModulesConfig;
            _nativeModuleCallExceptionHandler = nativeModuleCallExceptionHandler;
            _bundleLoader = bundleLoader;
            _jsRegistry = new JavaScriptModuleRegistry(this, _jsModulesConfig);

            QueueConfiguration = ReactQueueConfiguration.Create(
                reactQueueConfigurationSpec,
                HandleException);
        }

        public event EventHandler<BridgeBusyEventArgs> BridgeBusy;

        public event EventHandler<BridgeIdleEventArgs> BridgeIdle;

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

        public IReactQueueConfiguration QueueConfiguration
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
                throw new InvalidOperationException("This react instance has already been initialized.");
            }

            _initialized = true;
            _registry.NotifyReactInstanceInitialize();
        }

        public async Task InitializeBridgeAsync()
        {
            await _bundleLoader.InitializeAsync();

            await QueueConfiguration.JavaScriptQueueThread.CallOnQueue(() =>
            {
                QueueConfiguration.JavaScriptQueueThread.AssertOnThread();

                var jsExecutor = _jsExecutorFactory();

                using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "ReactBridgeCtor"))
                {
                    _bridge = new ReactBridge(
                        jsExecutor,
                        new NativeModulesReactCallback(this),
                        QueueConfiguration.NativeModulesQueueThread);
                }

                using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "setBatchedBridgeConfig"))
                {
                    _bridge.SetGlobalVariable("__fbBatchedBridgeConfig", BuildModulesConfig());
                }

                _bundleLoader.LoadScript(_bridge);

                return _bridge;
            });
        }

        public void InvokeCallback(int callbackId, JArray arguments)
        {
            if (IsDisposed)
            {
                Tracer.Write(ReactConstants.Tag, "Invoking JS callback after bridge has been destroyed.");
                return;
            }

            QueueConfiguration.JavaScriptQueueThread.RunOnQueue(() =>
            {
                QueueConfiguration.JavaScriptQueueThread.AssertOnThread();
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
            QueueConfiguration.JavaScriptQueueThread.RunOnQueue(() =>
            {
                QueueConfiguration.JavaScriptQueueThread.AssertOnThread();

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
            _registry.NotifyReactInstanceDispose();

            _bridge?.Dispose();
            QueueConfiguration.Dispose();

            if (Interlocked.Exchange(ref _pendingJsCalls, 0) != 0)
            {
                OnBridgeIdle();
            }
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
            _nativeModuleCallExceptionHandler(ex);
            QueueConfiguration.DispatcherQueueThread.RunOnQueue(Dispose);
        }

        private void IncrementPendingJsCalls()
        {
            if (Interlocked.Increment(ref _pendingJsCalls) == 1)
            {
                OnBridgeBusy();
            }
        }

        private void DecrementPendingJsCalls()
        {
            if (Interlocked.Decrement(ref _pendingJsCalls) == 0)
            {
                OnBridgeIdle();
            }
        }

        private void OnBridgeIdle()
        {
            var bridgeIdle = BridgeIdle;
            if (bridgeIdle != null)
            {
                bridgeIdle(this, new BridgeIdleEventArgs());
            }
        }

        private void OnBridgeBusy()
        {
            var bridgeBusy = BridgeBusy;
            if (bridgeBusy != null)
            {
                bridgeBusy(this, new BridgeBusyEventArgs());
            }
        }

        public sealed class Builder
        {
            private ReactQueueConfigurationSpec _reactQueueConfigurationSpec;
            private NativeModuleRegistry _registry;
            private JavaScriptModulesConfig _jsModulesConfig;
            private Func<IJavaScriptExecutor> _jsExecutorFactory;
            private JavaScriptBundleLoader _bundleLoader;
            private Action<Exception> _nativeModuleCallExceptionHandler;

            public ReactQueueConfigurationSpec QueueConfigurationSpec
            {
                set
                {
                    _reactQueueConfigurationSpec = value;
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

            public Func<IJavaScriptExecutor> JavaScriptExecutorFactory
            {
                set
                {
                    _jsExecutorFactory = value;
                }
            }

            public JavaScriptBundleLoader BundleLoader
            {
                set
                {
                    _bundleLoader = value;
                }
            }

            public Action<Exception> NativeModuleCallExceptionHandler
            {
                set
                {
                    _nativeModuleCallExceptionHandler = value;
                }
            }

            public ReactInstance Build()
            {
                AssertNotNull(_reactQueueConfigurationSpec, nameof(QueueConfigurationSpec));
                AssertNotNull(_jsExecutorFactory, nameof(JavaScriptExecutorFactory));
                AssertNotNull(_registry, nameof(Registry));
                AssertNotNull(_jsModulesConfig, nameof(JavaScriptModulesConfig));
                AssertNotNull(_bundleLoader, nameof(BundleLoader));
                AssertNotNull(_nativeModuleCallExceptionHandler, nameof(NativeModuleCallExceptionHandler));
                 
                return new ReactInstance(
                    _reactQueueConfigurationSpec,
                    _jsExecutorFactory,
                    _registry,
                    _jsModulesConfig,
                    _bundleLoader,
                    _nativeModuleCallExceptionHandler);
            }

            private void AssertNotNull(object value, string name)
            {
                if (value == null)
                    throw new InvalidOperationException($"'{name}' has not been set.");
            }
        }

        class NativeModulesReactCallback : IReactCallback
        {
            private readonly ReactInstance _parent;

            public NativeModulesReactCallback(ReactInstance parent)
            {
                _parent = parent;
            }

            public void Invoke(int moduleId, int methodId, JArray parameters)
            {
                _parent.QueueConfiguration.NativeModulesQueueThread.AssertOnThread();

                if (_parent.IsDisposed)
                {
                    return;
                }

                _parent._registry.Invoke(_parent, moduleId, methodId, parameters);
            }

            public void OnBatchComplete()
            {
                _parent.QueueConfiguration.NativeModulesQueueThread.AssertOnThread();

                // The bridge may have been destroyed due to an exception
                // during the batch. In that case native modules could be in a
                // bad state so we don't want to call anything on them.
                if (!_parent.IsDisposed)
                {
                    using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "OnBatchComplete"))
                    {
                        _parent._registry.OnBatchComplete();
                    }
                }

                _parent.DecrementPendingJsCalls();
            }
        }
    }
}