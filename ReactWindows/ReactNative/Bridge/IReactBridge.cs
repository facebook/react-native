using Newtonsoft.Json.Linq;
using System;

namespace ReactNative.Bridge
{
    public interface IReactBridge : IDisposable
    {
        void CallFunction(int moduleId, int methodId, JArray arguments);

        void InvokeCallback(int callbackID, JArray arguments);

        void SetGlobalVariable(string propertyName, string jsonEncodedArgument);
    }
}
