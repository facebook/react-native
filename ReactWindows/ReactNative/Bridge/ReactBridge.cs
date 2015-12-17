using Newtonsoft.Json.Linq;
using ReactNative.Bridge.Queue;
using System;

namespace ReactNative.Bridge
{
    public class ReactBridge : IReactBridge
    {
        private readonly IJavaScriptExecutor _jsExecutor;
        private readonly IReactCallback _reactCallback;
        private readonly IMessageQueueThread _nativeModulesQueueThread;

        public ReactBridge(
            IJavaScriptExecutor jsExecutor,
            IReactCallback reactCallback,
            IMessageQueueThread nativeModulesQueueThread)
        {
            _jsExecutor = jsExecutor;
            _reactCallback = reactCallback;
            _nativeModulesQueueThread = nativeModulesQueueThread;
        }

        public void CallFunction(int moduleId, int methodId, JArray arguments)
        {
            throw new NotImplementedException();
        }

        public void InvokeCallback(int callbackID, JArray arguments)
        {
            throw new NotImplementedException();
        }

        public void SetGlobalVariable(string propertyName, string jsonEncodedArgument)
        {
            throw new NotImplementedException();
        }

        public void Dispose()
        {
            throw new NotImplementedException();
        }
    }
}
