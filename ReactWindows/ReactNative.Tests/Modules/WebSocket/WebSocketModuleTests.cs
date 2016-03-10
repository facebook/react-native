using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Modules.Core;
using ReactNative.Modules.WebSocket;
using System.Threading;

namespace ReactNative.Tests.Modules.WebSocket
{
    [TestClass]
    public class WebSocketModuleTests
    {
        [TestMethod]
        [TestCategory("Network")]
        public void WebSocketModule_OpenClosedEvent()
        {
            var waitHandle = new AutoResetEvent(false);
            var openParams = default(JObject);
            var closeParams = default(JObject);
            var context = CreateReactContext(new MockInvocationHandler((name, args) =>
            {
                if (name == "emit" && args.Length == 2)
                {
                    var eventName = (string)args[0];
                    switch (eventName)
                    {
                        case "websocketClosed":
                            closeParams = (JObject)args[1];
                            waitHandle.Set();
                            break;
                        case "websocketOpen":
                            openParams = (JObject)args[1];
                            waitHandle.Set();
                            break;
                    }
                }
            }));

            var module = new WebSocketModule(context);
            try
            {
                module.connect("ws://echo.websocket.org", null, null, 1);
                Assert.IsTrue(waitHandle.WaitOne());
            }
            finally
            {
                module.close(1000, "None", 1);
                Assert.IsTrue(waitHandle.WaitOne());
            }

            Assert.AreEqual(1, openParams["id"]);
            Assert.AreEqual(1, closeParams["id"]);
            Assert.AreEqual(1000, closeParams["code"]);
            Assert.AreEqual("None", closeParams["reason"]);
        }

        [TestMethod]
        public void WebSocketModule_FailedEvent()
        {
            var waitHandle = new AutoResetEvent(false);
            var json = default(JObject);
            var context = CreateReactContext(new MockInvocationHandler((name, args) =>
            {
                if (name == "emit" && args.Length == 2)
                {
                    var eventName = (string)args[0];
                    switch (eventName)
                    {
                        case "websocketFailed":
                            json = (JObject)args[1];
                            waitHandle.Set();
                            break;
                    }
                }
            }));

            var module = new WebSocketModule(context);
            try
            {
                module.connect("ws://invalid.websocket.address", null, null, 1);
                Assert.IsTrue(waitHandle.WaitOne());
            }
            finally
            {
                module.close(1000, "None", 1);
            }

            Assert.AreEqual(1, json["id"]);
        }

        [TestMethod]
        [TestCategory("Network")]
        public void WebSocketModule_DataEvent()
        {
            var waitHandle = new AutoResetEvent(false);
            var json = default(JObject);
            var context = CreateReactContext(new MockInvocationHandler((name, args) =>
            {
                var eventName = (string)args[0];
                switch (eventName)
                {
                    case "websocketOpen":
                    case "websocketClosed":
                        waitHandle.Set();
                        break;
                    case "websocketMessage":
                        json = (JObject)args[1];
                        waitHandle.Set();
                        break;
                    default:
                        break;
                }
            }));

            var module = new WebSocketModule(context);
            try
            {
                module.connect("ws://echo.websocket.org", null, null, 1);
                Assert.IsTrue(waitHandle.WaitOne());
                module.send("FooBarBaz", 1);
                Assert.IsTrue(waitHandle.WaitOne());
            }
            finally
            {
                module.close(1000, "None", 1);
                Assert.IsTrue(waitHandle.WaitOne());
            }

            Assert.AreEqual(1, json["id"]);
            Assert.AreEqual("FooBarBaz", json["data"]);
        }

        private ReactContext CreateReactContext(IInvocationHandler handler)
        {
            var eventEmitter = new RCTDeviceEventEmitter();
            eventEmitter.InvocationHandler = handler;
            var reactInstance = new TestReactInstance(eventEmitter);
            var reactContext = new ReactContext();
            reactContext.InitializeWithInstance(reactInstance);
            return reactContext;
        }

        class TestReactInstance : MockReactInstance
        {
            private readonly object _eventEmitter;

            public TestReactInstance(RCTDeviceEventEmitter eventEmitter)
            {
                _eventEmitter = eventEmitter;
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
    }
}
