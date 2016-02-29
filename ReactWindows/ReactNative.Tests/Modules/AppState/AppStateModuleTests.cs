using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Modules.AppState;
using ReactNative.Modules.Core;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ReactNative.Tests.Modules.AppState
{
    [TestClass]
    public class AppStateModuleTests
    {
        [TestMethod]
        public async Task AppStateModule_StateChecks()
        {
            var uninitializedState = CreateExpectedState("uninitialized");
            var activeState = CreateExpectedState("active");
            var backgroundState = CreateExpectedState("background");

            var context = CreateReactContext();
            var module = context.GetNativeModule<AppStateModule>();

            var args = default(object[]);
            var callback = new MockCallback(a => args = a);

            module.getCurrentAppState(callback, new MockCallback(_ => { }));
            Assert.AreEqual(uninitializedState.ToString(), args[0].ToString());

            await DispatcherHelpers.RunOnDispatcherAsync(context.OnResume);

            module.getCurrentAppState(callback, new MockCallback(_ => { }));
            Assert.AreEqual(activeState.ToString(), args[0].ToString());

            await DispatcherHelpers.RunOnDispatcherAsync(context.OnSuspend);

            module.getCurrentAppState(callback, new MockCallback(_ => { }));
            Assert.AreEqual(backgroundState.ToString(), args[0].ToString());
        }

        [TestMethod]
        public async Task AppStateModule_Events()
        {
            var activeState = CreateExpectedState("active");
            var backgroundState = CreateExpectedState("background");

            var lastState = default(JObject);
            var waitHandle = new AutoResetEvent(false);
            var context = CreateReactContext(new MockInvocationHandler((name, args) =>
            {
                if (name == "emit" && args.Length == 2 && ((string)args[0]) == "appStateDidChange")
                {
                    lastState = args[1] as JObject;
                    waitHandle.Set();
                }
            }));

            await DispatcherHelpers.RunOnDispatcherAsync(context.OnResume);

            waitHandle.WaitOne();
            Assert.AreEqual(activeState.ToString(), lastState.ToString());
            lastState = null;

            await DispatcherHelpers.RunOnDispatcherAsync(context.OnSuspend);

            waitHandle.WaitOne();
            Assert.AreEqual(backgroundState.ToString(), lastState.ToString());
        }

        private static ReactContext CreateReactContext()
        {
            return CreateReactContext(new MockInvocationHandler());
        }

        private static ReactContext CreateReactContext(IInvocationHandler handler)
        {
            var context = new ReactContext();

            var ids = new List<int>();
            var appStateModule = new AppStateModule(context);
            appStateModule.Initialize();

            var eventEmitter = new RCTDeviceEventEmitter
            {
                InvocationHandler = handler,
            };

            var reactInstance = new TestReactInstance(appStateModule, eventEmitter);
            context.InitializeWithInstance(reactInstance);

            return context;
        }

        class TestReactInstance : MockReactInstance
        {
            private readonly object _appStateModule;
            private readonly object _eventEmitter;

            public TestReactInstance(AppStateModule appStateModule, RCTDeviceEventEmitter eventEmitter)
            {
                _appStateModule = appStateModule;
                _eventEmitter = eventEmitter;
            }

            public override T GetNativeModule<T>()
            {
                if (typeof(T) == typeof(AppStateModule))
                {
                    return (T)_appStateModule;
                }

                return base.GetNativeModule<T>();
            }

            public override T GetJavaScriptModule<T>()
            {
                if (typeof(T) == typeof(RCTDeviceEventEmitter))
                {
                    return (T)_eventEmitter;
                }

                return base.GetJavaScriptModule<T>();
            }
        }

        private static JObject CreateExpectedState(string state)
        {
            return new JObject
            {
                { "app_state", state }
            };
        }
    }
}
