using System;
using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Modules.NetInfo;
using Windows.Networking.Connectivity;
using ReactNative.Modules.Core;
using ReactNative.Bridge;
using System.Collections.Generic;
using System.Threading;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

namespace ReactNative.Tests.Modules.NetInfo
{
    [TestClass]
    public class NetInfoModuleTests
    {
        [TestMethod]
        public void NetInfoModule_JsonResponse()
        {
            var networkInfo = new MockNetworkInformation();
            var context = CreateReactContext();
            var netInfo = new NetInfoModule(networkInfo, context);

            var state = default(JObject);
            var promise = new MockPromise(value => state = (JObject)value);

            netInfo.getCurrentConnectivity(promise);
            Assert.AreEqual(CreateNetworkInfo("none").ToString(Formatting.None), state.ToString(Formatting.None));

            networkInfo.CurrentConnectionProfile = new MockConnectionProfile(true, false);
            netInfo.getCurrentConnectivity(promise);
            Assert.AreEqual(CreateNetworkInfo("wifi").ToString(Formatting.None), state.ToString(Formatting.None));

            networkInfo.CurrentConnectionProfile = new MockConnectionProfile(false, true);
            netInfo.getCurrentConnectivity(promise);
            Assert.AreEqual(CreateNetworkInfo("cell").ToString(Formatting.None), state.ToString(Formatting.None));

            networkInfo.CurrentConnectionProfile = new MockConnectionProfile(false, false);
            netInfo.getCurrentConnectivity(promise);
            Assert.AreEqual(CreateNetworkInfo("unknown").ToString(Formatting.None), state.ToString(Formatting.None));
        }

        [Microsoft.VisualStudio.TestPlatform.UnitTestFramework.AppContainer.UITestMethod]
        public void NetInfoModule_Event()
        {
            var networkInfo = new MockNetworkInformation();

            var emitted = new AutoResetEvent(false);
            var state = default(JObject);
            var context = CreateReactContext(new MockInvocationHandler((name, args) =>
            {
                if (name == "emit" && args.Length == 2 && ((string)args[0]) == "networkStatusDidChange")
                {
                    state = (JObject)args[1];
                    emitted.Set();
                }
            }));

            var netInfo = new NetInfoModule(networkInfo, context);
            netInfo.Initialize();
            context.OnResume();

            networkInfo.CurrentConnectionProfile = new MockConnectionProfile(true, false);
            networkInfo.OnNetworkStatusChanged();
            Assert.IsTrue(emitted.WaitOne());
            Assert.AreEqual(CreateNetworkInfo("wifi").ToString(Formatting.None), state.ToString(Formatting.None));
        }

        [Microsoft.VisualStudio.TestPlatform.UnitTestFramework.AppContainer.UITestMethod]
        public void NetInfoModule_LifecycleChecks()
        {
            var started = new AutoResetEvent(false);
            var stopped = new AutoResetEvent(false);

            var networkInfo = new MockNetworkInformation(
                () => started.Set(),
                () => stopped.Set());

            var context = CreateReactContext();
            var netInfo = new NetInfoModule(networkInfo, context);
            netInfo.Initialize();

            context.OnResume();
            Assert.IsTrue(started.WaitOne());

            context.OnSuspend();
            Assert.IsTrue(stopped.WaitOne());
        }

        private static JObject CreateNetworkInfo(string status)
        {
            return new JObject
            {
                { "network_info", status },
            };
        }

        private static ReactContext CreateReactContext()
        {
            return CreateReactContext(new MockInvocationHandler());
        }

        private static ReactContext CreateReactContext(IInvocationHandler handler)
        {
            var context = new ReactContext();
            var eventEmitter = new RCTDeviceEventEmitter();
            eventEmitter.InvocationHandler = handler;

            var reactInstance = new TestReactInstance(eventEmitter);
            context.InitializeWithInstance(reactInstance);
            return context;
        }

        class TestReactInstance : MockReactInstance
        {
            private readonly object _eventEmitter;

            public TestReactInstance(RCTDeviceEventEmitter eventEmitter)
                : base()
            {
                _eventEmitter = eventEmitter;
            }

            public override T GetJavaScriptModule<T>()
            {
                if (typeof(RCTDeviceEventEmitter) == typeof(T))
                {
                    return (T)_eventEmitter;
                }

                return base.GetJavaScriptModule<T>();
            }
        }

        class MockNetworkInformation : INetworkInformation
        {
            private readonly Action _onStart;
            private readonly Action _onStop;

            public MockNetworkInformation()
                : this(() => { }, () => { })
            {
            }

            public MockNetworkInformation(Action onStart, Action onStop)
            {
                _onStart = onStart;
                _onStop = onStop;
            }

            public event NetworkStatusChangedEventHandler NetworkStatusChanged;

            public IConnectionProfile CurrentConnectionProfile
            {
                get;
                set;
            }

            public IConnectionProfile GetInternetConnectionProfile()
            {
                return CurrentConnectionProfile;
            }

            public void Start()
            {
                _onStart();
            }

            public void Stop()
            {
                _onStop();
            }

            public void OnNetworkStatusChanged()
            {
                var networkStatusChanged = NetworkStatusChanged;
                if (networkStatusChanged != null)
                {
                    networkStatusChanged(this);
                }
            }
        }

        class MockConnectionProfile : IConnectionProfile
        {
            public MockConnectionProfile(bool isWlan, bool isWwan)
            {
                IsWlanConnectionProfile = isWlan;
                IsWwanConnectionProfile = isWwan;
            }

            public bool IsWlanConnectionProfile
            {
                get;
            }

            public bool IsWwanConnectionProfile
            {
                get;
            }
        }
    }
}
