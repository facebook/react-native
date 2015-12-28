using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Bridge.Queue;
using ReactNative.UIManager.Events;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ReactNative.Tests.UIManager.Events
{
    [TestClass]
    public class EventDispatcherTests
    {
        [TestMethod]
        public void EventDispatcher_ArgumentChecks()
        {
            AssertEx.Throws<ArgumentNullException>(() => new EventDispatcher(null), ex => Assert.AreEqual("reactContext", ex.ParamName));

            var context = new ReactApplicationContext();
            var dispatcher = new EventDispatcher(context);
            AssertEx.Throws<ArgumentNullException>(() => dispatcher.DispatchEvent(null), ex => Assert.AreEqual("event", ex.ParamName));
        }

        [TestMethod]
        public void EventDispatcher_IncorrectThreadCalls()
        {
            var context = new ReactApplicationContext();
            var dispatcher = new EventDispatcher(context);

            AssertEx.Throws<InvalidOperationException>(() => dispatcher.OnResume());
            AssertEx.Throws<InvalidOperationException>(() => dispatcher.OnSuspend());
            AssertEx.Throws<InvalidOperationException>(() => dispatcher.OnSuspend());
            AssertEx.Throws<InvalidOperationException>(() => dispatcher.OnCatalystInstanceDispose());
        }

        [TestMethod]
        public async Task EventDispatcher_EventDispatches()
        {
            var eventHandler = new AutoResetEvent(false);
            var executor = new MockJavaScriptExecutor((p0, p1, p2) =>
            {
                eventHandler.Set();
                return default(JToken);
            });

            var context = await CreateContextAsync(executor);
            var dispatcher = new EventDispatcher(context);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);

            var testEvent = new MockEvent(42, TimeSpan.Zero, "Foo", new JObject());
            dispatcher.DispatchEvent(testEvent);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnBatchComplete);

            Assert.IsTrue(eventHandler.WaitOne());
        }

        [TestMethod]
        public async Task EventDispatcher_OnSuspend_EventDoesNotDispatch()
        {
            var eventHandler = new AutoResetEvent(false);
            var executor = new MockJavaScriptExecutor((p0, p1, p2) =>
            {
                eventHandler.Set();
                return default(JToken);
            });

            var context = await CreateContextAsync(executor);
            var dispatcher = new EventDispatcher(context);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);

            var testEvent = new MockEvent(42, TimeSpan.Zero, "Foo", new JObject());
            dispatcher.DispatchEvent(testEvent);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnSuspend);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnBatchComplete);

            Assert.IsFalse(eventHandler.WaitOne(500));
        }

        [TestMethod]
        public async Task EventDispatcher_OnShutdown_EventDoesNotDispatch()
        {
            var eventHandler = new AutoResetEvent(false);
            var executor = new MockJavaScriptExecutor((p0, p1, p2) =>
            {
                eventHandler.Set();
                return default(JToken);
            });

            var context = await CreateContextAsync(executor);
            var dispatcher = new EventDispatcher(context);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);

            var testEvent = new MockEvent(42, TimeSpan.Zero, "Foo", new JObject());
            dispatcher.DispatchEvent(testEvent);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnShutdown);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnBatchComplete);

            Assert.IsFalse(eventHandler.WaitOne(500));
        }

        [TestMethod]
        public async Task EventDispatcher_OnCatalystInstanceDispose_EventDoesNotDispatch()
        {
            var eventHandler = new AutoResetEvent(false);
            var executor = new MockJavaScriptExecutor((p0, p1, p2) =>
            {
                eventHandler.Set();
                return default(JToken);
            });

            var context = await CreateContextAsync(executor);
            var dispatcher = new EventDispatcher(context);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);

            var testEvent = new MockEvent(42, TimeSpan.Zero, "Foo", new JObject());
            dispatcher.DispatchEvent(testEvent);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnCatalystInstanceDispose);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnBatchComplete);

            Assert.IsFalse(eventHandler.WaitOne(500));
        }

        private static async Task<ReactApplicationContext> CreateContextAsync(IJavaScriptExecutor executor)
        {
            var catalystInstance = await DispatcherHelpers.CallOnDispatcherAsync(() => CreateCatalystInstance(executor));
            await InitializeCatalystInstanceAsync(catalystInstance);
            var context = new ReactApplicationContext();
            context.InitializeWithInstance(catalystInstance);
            return context;
        }

        private static CatalystInstance CreateCatalystInstance(IJavaScriptExecutor executor)
        {
            var registry = new NativeModuleRegistry.Builder().Build();
            var jsModules = new JavaScriptModulesConfig.Builder()
                .Add<RCTEventEmitter>()
                .Build();

            var instance = new CatalystInstance.Builder
            {
                QueueConfigurationSpec = CatalystQueueConfigurationSpec.Default,
                BundleLoader = JavaScriptBundleLoader.CreateFileLoader("ms-appx:///Resources/test.js"),
                JavaScriptModulesConfig = jsModules,
                Registry = registry,
                JavaScriptExecutor = executor,
                NativeModuleCallExceptionHandler = ex => Assert.Fail(ex.ToString()),
            }.Build();

            instance.Initialize();

            return instance;
        }

        private static Task InitializeCatalystInstanceAsync(CatalystInstance catalystInstance)
        {
            return catalystInstance.InitializeBridgeAsync();
        }
    }
}
