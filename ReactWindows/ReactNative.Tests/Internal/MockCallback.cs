using ReactNative.Bridge;
using System;

namespace ReactNative.Tests
{
    class MockCallback : ICallback
    {
        private readonly Action<object[]> _action;

        public MockCallback(Action<object[]> action)
        {
            _action = action;
        }

        public void Invoke(params object[] arguments)
        {
            _action(arguments);
        }
    }
}
