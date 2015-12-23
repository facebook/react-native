using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Bridge.Queue;
using System;
using System.Threading;
using System.Threading.Tasks;
using Windows.System.Threading;

namespace ReactNative.Tests.Bridge
{
    [TestClass]
    public class CatalystInstanceTests
    {
        [TestMethod]
        public async Task CatalystInstance_GetModules()
        {
            var module = new TestNativeModule();

            var registry = new NativeModuleRegistry.Builder()
                .Add(module)
                .Build();

            var jsConfig = new JavaScriptModulesConfig.Builder()
                .Add<TestJavaScriptModule>()
                .Build();

            var executor = new MockJavaScriptExecutor((p0, p1, p2) => JValue.CreateNull());
            var builder = new CatalystInstance.Builder()
            {
                QueueConfigurationSpec = CatalystQueueConfigurationSpec.Default,
                Registry = registry,
                JavaScriptModulesConfig = jsConfig,
                JavaScriptExecutor = executor,
                BundleLoader = JavaScriptBundleLoader.CreateFileLoader("ms-appx:///Resources/test.js"),
                NativeModuleCallExceptionHandler = _ => { }
            };

            var instance = await DispatcherHelpers.CallOnDispatcherAsync(() => builder.Build());

            var actualModule = instance.GetNativeModule<TestNativeModule>();
            Assert.AreSame(module, actualModule);

            var firstJSModule = instance.GetJavaScriptModule<TestJavaScriptModule>();
            var secondJSModule = instance.GetJavaScriptModule<TestJavaScriptModule>();
            Assert.AreSame(firstJSModule, secondJSModule);
        }

        [TestMethod]
        public async Task CatalystInstance_Initialize_Dispose()
        {
            var module = new TestNativeModule();

            var registry = new NativeModuleRegistry.Builder()
                .Add(module)
                .Build();

            var jsConfig = new JavaScriptModulesConfig.Builder().Build();

            var executor = new MockJavaScriptExecutor((p0, p1, p2) => JValue.CreateNull());
            var builder = new CatalystInstance.Builder()
            {
                QueueConfigurationSpec = CatalystQueueConfigurationSpec.Default,
                Registry = registry,
                JavaScriptModulesConfig = jsConfig,
                JavaScriptExecutor = executor,
                BundleLoader = JavaScriptBundleLoader.CreateFileLoader("ms-appx:///Resources/test.js"),
                NativeModuleCallExceptionHandler = _ => { },
            };

            var instance = await DispatcherHelpers.CallOnDispatcherAsync(() => builder.Build());
            await DispatcherHelpers.RunOnDispatcherAsync(() => instance.Initialize());
            await AssertEx.ThrowsAsync<InvalidOperationException>(() =>
                DispatcherHelpers.RunOnDispatcherAsync(() => instance.Initialize()));

            Assert.AreEqual(1, module.InitializeCalls);

            await DispatcherHelpers.RunOnDispatcherAsync(() => instance.Dispose());
            Assert.AreEqual(1, module.OnCatalystInstanceDisposeCalls);

            // Dispose is idempotent
            await DispatcherHelpers.RunOnDispatcherAsync(() => instance.Dispose());
            Assert.AreEqual(1, module.OnCatalystInstanceDisposeCalls);

            Assert.IsTrue(instance.IsDisposed);
        }

        [TestMethod]
        public async Task CatalystInstance_ExceptionHandled_Disposes()
        {
            var eventHandler = new AutoResetEvent(false);
            var module = new OnDisposeNativeModule(() => eventHandler.Set());
            var registry = new NativeModuleRegistry.Builder()
                .Add(module)
                .Build();

            var jsConfig = new JavaScriptModulesConfig.Builder().Build();
            var executor = new MockJavaScriptExecutor((p0, p1, p2) => JValue.CreateNull());

            var exception = new Exception();
            var tcs = new TaskCompletionSource<Exception>();
            var handler = new Action<Exception>(ex =>
            {
                Task.Run(() => tcs.SetResult(ex));
            });

            var builder = new CatalystInstance.Builder()
            {
                QueueConfigurationSpec = CatalystQueueConfigurationSpec.Default,
                Registry = registry,
                JavaScriptModulesConfig = jsConfig,
                JavaScriptExecutor = executor,
                BundleLoader = JavaScriptBundleLoader.CreateFileLoader("ms-appx:///Resources/test.js"),
                NativeModuleCallExceptionHandler = handler,
            };

            var instance = await DispatcherHelpers.CallOnDispatcherAsync(() => builder.Build());
            instance.QueueConfiguration.JSQueueThread.RunOnQueue(() =>
            {
                throw exception;
            });

            var actualException = await tcs.Task;
            Assert.AreSame(exception, actualException);

            Assert.IsTrue(eventHandler.WaitOne());
            Assert.IsTrue(instance.IsDisposed);
        }


        class TestNativeModule : NativeModuleBase
        {
            public int InitializeCalls
            {
                get;
                set;
            }

            public int OnCatalystInstanceDisposeCalls
            {
                get;
                set;
            }

            public override string Name
            {
                get
                {
                    return "Test";
                }
            }

            public override void Initialize()
            {
                InitializeCalls++;
            }

            public override void OnCatalystInstanceDispose()
            {
                OnCatalystInstanceDisposeCalls++;
            }
        }

        class OnDisposeNativeModule : NativeModuleBase
        {
            private readonly Action _onDispose;

            public OnDisposeNativeModule(Action onDispose)
            {
                _onDispose = onDispose;
            }

            public override string Name
            {
                get
                {
                    return "Test";
                }
            }

            public override void OnCatalystInstanceDispose()
            {
                _onDispose();
            }
        }

        class TestJavaScriptModule : JavaScriptModuleBase
        {
        }
    }
}
