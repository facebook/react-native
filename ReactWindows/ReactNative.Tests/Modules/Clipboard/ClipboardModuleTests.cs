using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge;
using ReactNative.Modules.Core;
using ReactNative.Modules.Clipboard;
using System;
using System.Threading;

namespace ReactNative.Tests.Modules.Clipboard
{
    [TestClass]
    public class ClipboardModuleTests
    {
        [TestMethod]
        public void ClipboardModule_ArgumentChecks()
        {
            var module = CreateClipboardModule(new MockInvocationHandler());

            AssertEx.Throws<ArgumentNullException>(
                () => module.getString(null),
                ex => Assert.AreEqual("promise", ex.ParamName));
        }

        [TestMethod]
        public void ClipboardModule_GetString_Method()
        {
            var module = CreateClipboardModule(new MockInvocationHandler());

            var waitHandle = new AutoResetEvent(false);
            Promise promise = new Promise(waitHandle);
            string str = "test string";

            module.setString(str);
            module.getString(promise);

            waitHandle.WaitOne();
            Assert.AreEqual(str, promise.value);

            module.setString(null);
            module.getString(promise);

            waitHandle.WaitOne();
            Assert.AreEqual("", promise.value);
        }

        private static ClipboardModule CreateClipboardModule(IInvocationHandler handler)
        {
            var context = new ReactContext();

            var eventEmitter = new RCTDeviceEventEmitter();
            eventEmitter.InvocationHandler = handler;

            var reactInstance = new TestReactInstance(eventEmitter);
            context.InitializeWithInstance(reactInstance);
            return new ClipboardModule(context);
        }

        class Promise : IPromise
        {
            private AutoResetEvent _handler = null;
            private string _value = null;
            public string value
            {
                get
                {
                    return _value;
                }
            }

            public Promise(AutoResetEvent handler)
            {
                _handler = handler;
            }

            void IPromise.Resolve(object value)
            {
                if (value.GetType() == typeof(string))
                {
                    _value = (string)value;
                }
                _handler.Set();
            }

            void IPromise.Reject(Exception exception)
            {
                _handler.Set();
            }

            void IPromise.Reject(string reason)
            {
                _handler.Set();
            }
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
    }
}
