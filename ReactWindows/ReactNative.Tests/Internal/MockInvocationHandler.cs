using ReactNative.Bridge;
using System;

namespace ReactNative.Tests
{
    class MockInvocationHandler : IInvocationHandler
    {
        private readonly Action<string, object[]> _onInvoke;

        public MockInvocationHandler()
            : this((_, __) => { })
        {
        }

        public MockInvocationHandler(Action<string, object[]> onInvoke)
        {
            _onInvoke = onInvoke;
        }

        public void Invoke(string name, object[] args)
        {
            _onInvoke(name, args);
        }
    }
}
