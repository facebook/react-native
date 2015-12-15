using System;
using Newtonsoft.Json.Linq;

namespace ReactNative.Bridge
{
    class ChakraReactBridge : IReactBridge
    {
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
    }
}
