using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Bridge.Queue;
using ReactNative.UIManager.Events;
using System;
using System.Reactive.Disposables;
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

            var context = new ReactContext();
            var dispatcher = new EventDispatcher(context);
            AssertEx.Throws<ArgumentNullException>(() => dispatcher.DispatchEvent(null), ex => Assert.AreEqual("event", ex.ParamName));
        }

        [TestMethod]
        public void EventDispatcher_IncorrectThreadCalls()
        {
            var context = new ReactContext();
            var dispatcher = new EventDispatcher(context);

            AssertEx.Throws<InvalidOperationException>(() => dispatcher.OnResume());
            AssertEx.Throws<InvalidOperationException>(() => dispatcher.OnSuspend());
            AssertEx.Throws<InvalidOperationException>(() => dispatcher.OnSuspend());
            AssertEx.Throws<InvalidOperationException>(() => dispatcher.OnCatalystInstanceDispose());
        }

        [TestMethod]
        public async Task EventDispatcher_EventDispatches()
        {
            var dispatched = new AutoResetEvent(false);
            var executor = new MockJavaScriptExecutor((p0, p1, p2) =>
            {
                dispatched.Set();
                return default(JToken);
            });

            var context = await CreateContextAsync(executor);
            var dispatcher = new EventDispatcher(context);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);

            var testEvent = new MockEvent(42, TimeSpan.Zero, "Foo");
            dispatcher.DispatchEvent(testEvent);

            Assert.IsTrue(dispatched.WaitOne());
        }

        [TestMethod]
        public async Task EventDispatcher_NonCoalesced()
        {
            var waitDispatched = new AutoResetEvent(false);
            var executor = new MockJavaScriptExecutor((p0, p1, p2) =>
            {
                waitDispatched.Set();
                return default(JToken);
            });

            var context = await CreateContextAsync(executor);
            var dispatcher = new EventDispatcher(context);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);

            var e1 = new NonCoalescedEvent(42, TimeSpan.Zero, "Foo");
            var e2 = new NonCoalescedEvent(42, TimeSpan.Zero, "Foo");

            using (BlockJavaScriptThread(context))
            {
                dispatcher.DispatchEvent(e1);
                dispatcher.DispatchEvent(e2);
            }

            Assert.IsTrue(waitDispatched.WaitOne());
            Assert.IsTrue(waitDispatched.WaitOne());
        }

        [TestMethod]
        public async Task EventDispatcher_MultipleDispatches()
        {
            var waitDispatched = new AutoResetEvent(false);
            var executor = new MockJavaScriptExecutor((p0, p1, p2) =>
            {
                waitDispatched.Set();
                return default(JToken);
            });

            var context = await CreateContextAsync(executor);
            var dispatcher = new EventDispatcher(context);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);

            var count = 100;
            for (var i = 0; i < count; ++i)
            {
                var testEvent = new MockEvent(42, TimeSpan.Zero, "Foo");
                dispatcher.DispatchEvent(testEvent);
                Assert.IsTrue(waitDispatched.WaitOne());
            }
        }

        [TestMethod]
        public async Task EventDispatcher_EventsCoalesced1()
        {
            var waitDispatched = new AutoResetEvent(false);
            var executor = new MockJavaScriptExecutor((p0, p1, p2) =>
            {
                waitDispatched.Set();
                return default(JToken);
            });

            var context = await CreateContextAsync(executor);
            var dispatcher = new EventDispatcher(context);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);

            var winner = default(int);
            var disposed = new AutoResetEvent(false);

            var firstEvent = new TestEvent(42, TimeSpan.Zero, "foo", 1, () => winner = 1, () => disposed.Set());
            var secondEvent = new TestEvent(42, TimeSpan.MaxValue, "foo", 1, () => winner = 2, () => disposed.Set());

            using (BlockJavaScriptThread(context))
            {
                dispatcher.DispatchEvent(firstEvent);
                dispatcher.DispatchEvent(secondEvent);

                // First event is disposed after coalesce
                Assert.IsTrue(disposed.WaitOne());
            }

            Assert.IsTrue(waitDispatched.WaitOne());
            Assert.AreEqual(2, winner);
            Assert.IsFalse(waitDispatched.WaitOne(500));

            // Second event is disposed after dispatch
            Assert.IsTrue(disposed.WaitOne()); 
        }

        [TestMethod]
        public async Task EventDispatcher_EventsCoalesced2()
        {
            var waitDispatched = new AutoResetEvent(false);
            var executor = new MockJavaScriptExecutor((p0, p1, p2) =>
            {
                waitDispatched.Set();
                return default(JToken);
            });

            var context = await CreateContextAsync(executor);
            var dispatcher = new EventDispatcher(context);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);

            var winner = default(int);
            var disposed = new AutoResetEvent(false);

            var firstEvent = new TestEvent(42, TimeSpan.MaxValue, "foo", 1, () => winner = 1, () => disposed.Set());
            var secondEvent = new TestEvent(42, TimeSpan.Zero, "foo", 1, () => winner = 2, () => disposed.Set());

            using (BlockJavaScriptThread(context))
            {
                dispatcher.DispatchEvent(firstEvent);
                dispatcher.DispatchEvent(secondEvent);

                // First event is disposed after coalesce
                Assert.IsTrue(disposed.WaitOne());
            }

            Assert.IsTrue(waitDispatched.WaitOne());
            Assert.AreEqual(1, winner);
            Assert.IsFalse(waitDispatched.WaitOne(500));

            // Second event is disposed after dispatch
            Assert.IsTrue(disposed.WaitOne());
        }


        [TestMethod]
        public async Task EventDispatcher_EventsNotCoalesced()
        {
            var waitDispatched = new AutoResetEvent(false);
            var executor = new MockJavaScriptExecutor((p0, p1, p2) =>
            {
                waitDispatched.Set();
                return default(JToken);
            });

            var context = await CreateContextAsync(executor);
            var dispatcher = new EventDispatcher(context);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);

            var disposed = new AutoResetEvent(false);

            var diffTag1 = new TestEvent(42, TimeSpan.Zero, "foo", 1);
            var diffTag2 = new TestEvent(43, TimeSpan.Zero, "foo", 1);

            var diffName1 = new TestEvent(42, TimeSpan.Zero, "foo", 1);
            var diffName2 = new TestEvent(42, TimeSpan.Zero, "bar", 1);

            var diffKey1 = new TestEvent(42, TimeSpan.Zero, "foo", 1);
            var diffKey2 = new TestEvent(42, TimeSpan.Zero, "foo", 2);

            var pairs = new[]
            {
                new[] { diffTag1, diffTag2 },
                new[] { diffName1, diffName2 },
                new[] { diffKey1, diffKey2 },
            };

            foreach (var pair in pairs)
            {
                using (BlockJavaScriptThread(context))
                {
                    dispatcher.DispatchEvent(pair[0]);
                    dispatcher.DispatchEvent(pair[1]);
                }

                Assert.IsTrue(waitDispatched.WaitOne());
                Assert.IsTrue(waitDispatched.WaitOne());
            }
        }

        [TestMethod]
        public async Task EventDispatcher_OnSuspend_EventDoesNotDispatch()
        {
            var waitDispatched = new AutoResetEvent(false);
            var executor = new MockJavaScriptExecutor((p0, p1, p2) =>
            {
                waitDispatched.Set();
                return default(JToken);
            });

            var context = await CreateContextAsync(executor);
            var dispatcher = new EventDispatcher(context);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);

            var testEvent = new MockEvent(42, TimeSpan.Zero, "Foo");

            using (BlockJavaScriptThread(context))
            {
                dispatcher.DispatchEvent(testEvent);
                await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnSuspend);
            }

            Assert.IsFalse(waitDispatched.WaitOne(500));
        }

        [TestMethod]
        public async Task EventDispatcher_OnShutdown_EventDoesNotDispatch()
        {
            var waitDispatched = new AutoResetEvent(false);
            var executor = new MockJavaScriptExecutor((p0, p1, p2) =>
            {
                waitDispatched.Set();
                return default(JToken);
            });

            var context = await CreateContextAsync(executor);
            var dispatcher = new EventDispatcher(context);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);

            var testEvent = new MockEvent(42, TimeSpan.Zero, "Foo");

            using (BlockJavaScriptThread(context))
            {
                dispatcher.DispatchEvent(testEvent);
                await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnDestroy);
            }

            Assert.IsFalse(waitDispatched.WaitOne(500));
        }

        [TestMethod]
        public async Task EventDispatcher_OnCatalystInstanceDispose_EventDoesNotDispatch()
        {
            var waitDispatched = new AutoResetEvent(false);
            var executor = new MockJavaScriptExecutor((p0, p1, p2) =>
            {
                waitDispatched.Set();
                return default(JToken);
            });

            var context = await CreateContextAsync(executor);
            var dispatcher = new EventDispatcher(context);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);

            var testEvent = new MockEvent(42, TimeSpan.Zero, "Foo");

            using (BlockJavaScriptThread(context))
            {
                dispatcher.DispatchEvent(testEvent);
                await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnCatalystInstanceDispose);
            }

            Assert.IsFalse(waitDispatched.WaitOne(500));
        }

        [TestMethod]
        public async Task EventDispatcher_DispatchedAfterSuspend_ThenResume()
        {
            var waitDispatched = new AutoResetEvent(false);
            var executor = new MockJavaScriptExecutor((p0, p1, p2) =>
            {
                waitDispatched.Set();
                return default(JToken);
            });

            var context = await CreateContextAsync(executor);
            var dispatcher = new EventDispatcher(context);
            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);

            var testEvent = new MockEvent(42, TimeSpan.Zero, "Foo");

            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnSuspend);
            dispatcher.DispatchEvent(testEvent);

            Assert.IsFalse(waitDispatched.WaitOne(500));

            await DispatcherHelpers.RunOnDispatcherAsync(dispatcher.OnResume);
            Assert.IsTrue(waitDispatched.WaitOne());
        }

        private static async Task<ReactContext> CreateContextAsync(IJavaScriptExecutor executor)
        {
            var catalystInstance = await DispatcherHelpers.CallOnDispatcherAsync(() => CreateCatalystInstance(executor));
            await InitializeCatalystInstanceAsync(catalystInstance);
            var context = new ReactContext();
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
                JavaScriptExecutorFactory = () => executor,
                NativeModuleCallExceptionHandler = ex => Assert.Fail(ex.ToString()),
            }.Build();

            instance.Initialize();

            return instance;
        }

        private static Task InitializeCatalystInstanceAsync(CatalystInstance catalystInstance)
        {
            return catalystInstance.InitializeBridgeAsync();
        }

        private static IDisposable BlockJavaScriptThread(ReactContext reactContext)
        {
            var enter = new AutoResetEvent(false);
            var exit = new AutoResetEvent(false);

            reactContext.RunOnJSQueueThread(() =>
            {
                enter.Set();
                exit.WaitOne();
            });

            enter.WaitOne();
            return Disposable.Create(() => exit.Set());
        }

        class NonCoalescedEvent : MockEvent
        {
            public NonCoalescedEvent(int viewTag, TimeSpan timestamp, string eventName)
                : base(viewTag, timestamp, eventName)
            {
            }

            public override bool CanCoalesce
            {
                get
                {
                    return false;
                }
            }
        }

        class TestEvent : MockEvent
        {
            private readonly Action _onDispatched;

            public TestEvent(
                int viewTag,
                TimeSpan timestamp,
                string eventName,
                short coalescingKey)
                : this(viewTag, timestamp, eventName, coalescingKey, () => { }, () => { })
            {
            }

            public TestEvent(
                int viewTag, 
                TimeSpan timestamp,
                string eventName, 
                short coalescingKey,
                Action onDispatched,
                Action onDispose)
                : base(viewTag, timestamp, eventName, new JObject(), onDispose)
            {
                _onDispatched = onDispatched;

                CoalescingKey = coalescingKey;
            }

            public override short CoalescingKey { get; }

            public override void Dispatch(RCTEventEmitter eventEmitter)
            {
                _onDispatched();

                base.Dispatch(eventEmitter);
            }
        }
    }
}
