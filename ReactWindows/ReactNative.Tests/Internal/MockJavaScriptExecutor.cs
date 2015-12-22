using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;

namespace ReactNative.Tests
{
    class MockJavaScriptExecutor : IJavaScriptExecutor
    {
        private readonly Func<string, string, JArray, JToken> _onCall;
        private readonly Action<string, JToken> _onSetGlobalVariable;
        private readonly Action _onDispose;

        public MockJavaScriptExecutor(
            Func<string, string, JArray, JToken> onCall)
            : this(onCall, (_, __) => { }, () => { })
        {
        }

        public MockJavaScriptExecutor(
            Func<string, string, JArray, JToken> onCall,
            Action<string, JToken> onSetGlobalVariable,
            Action onDispose)
        {
            _onCall = onCall;
            _onSetGlobalVariable = onSetGlobalVariable;
            _onDispose = onDispose;
        }

        public JToken Call(string moduleName, string methodName, JArray arguments)
        {
            return _onCall(moduleName, methodName, arguments);
        }

        public void SetGlobalVariable(string propertyName, JToken value)
        {
            _onSetGlobalVariable(propertyName, value);
        }

        public void Dispose()
        {
            _onDispose();
        }

    }
}
