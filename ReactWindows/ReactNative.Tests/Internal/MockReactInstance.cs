using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Bridge.Queue;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ReactNative.Tests
{
    class MockReactInstance : IReactInstance
    {
        private readonly Action<int, JArray> _callback;
        private readonly Action<int, int, JArray, string> _function;

        public MockReactInstance()
            : this((_, __) => { }, (p0, p1, p2, p3) => { })
        {
        }

        public MockReactInstance(Action<int, JArray> callback)
            : this(callback, (p0, p1, p2, p3) => { })
        {
        }

        public MockReactInstance(Action<int, int, JArray, string> function)
            : this((_, __) => { }, function)
        {
        }

        public MockReactInstance(Action<int, JArray> callback, Action<int, int, JArray, string> function)
        {
            _callback = callback;
            _function = function;
        }

        public bool IsDisposed
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public IEnumerable<INativeModule> NativeModules
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public IReactQueueConfiguration QueueConfiguration
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public virtual T GetNativeModule<T>() where T : INativeModule
        {
            throw new NotImplementedException();
        }

        public virtual T GetJavaScriptModule<T>() where T : IJavaScriptModule
        {
            throw new NotImplementedException();
        }

        public void Initialize()
        {
            throw new NotImplementedException();
        }

        public void InvokeCallback(int callbackId, JArray arguments)
        {
            _callback(callbackId, arguments);
        }

        public void InvokeFunction(int moduleId, int methodId, JArray arguments, string tracingName)
        {
            _function(moduleId, methodId, arguments, tracingName);
        }

        public void Dispose()
        {
            throw new NotImplementedException();
        }
    }
}
