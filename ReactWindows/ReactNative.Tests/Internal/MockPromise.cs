using ReactNative.Bridge;
using System;

namespace ReactNative.Tests
{
    class MockPromise : IPromise
    {
        private readonly Action<object> _resolve;
        private readonly Action<string> _reject;
        
        public MockPromise(Action<object> resolve)
            : this(resolve, _ => { })
        {
        }

        public MockPromise(Action<object> resolve, Action<string> reject)
        {
            _resolve = resolve;
            _reject = reject;
        }

        public void Reject(string reason)
        {
            _reject(reason);
        }

        public void Reject(Exception exception)
        {
            Reject(exception.Message);
        }

        public void Resolve(object value)
        {
            _resolve(value);
        }
    }
}
