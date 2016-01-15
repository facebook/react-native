using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;

namespace ReactNative.Tests
{
    class MockJavaScriptExecutor : IJavaScriptExecutor
    {
        private readonly Func<string, string, JArray, JToken> _onCall;
        private readonly Action<string> _runScript;
        private readonly Action<string, JToken> _onSetGlobalVariable;
        private readonly Action _onDispose;

        public MockJavaScriptExecutor(
            Func<string, string, JArray, JToken> onCall)
            : this(onCall, _ => { }, (_, __) => { }, () => { })
        {
        }

        public MockJavaScriptExecutor(
            Func<string, string, JArray, JToken> onCall,
            Action<string> runScript,
            Action<string, JToken> onSetGlobalVariable,
            Action onDispose)
        {
            _onCall = onCall;
            _runScript = runScript;
            _onSetGlobalVariable = onSetGlobalVariable;
            _onDispose = onDispose;
        }

        public void Initialize() { }

        public JToken Call(string moduleName, string methodName, JArray arguments)
        {
            return _onCall(moduleName, methodName, arguments);
        }

        public void RunScript(string script)
        {
            _runScript(script);
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
