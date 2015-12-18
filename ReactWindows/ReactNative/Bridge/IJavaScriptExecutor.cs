using Newtonsoft.Json.Linq;
using System;

namespace ReactNative.Bridge
{
    public interface IJavaScriptExecutor : IDisposable
    {
        JToken Call(string moduleName, string methodName, JArray arguments);

        void SetGlobalVariable(string propertyName, JToken value);
    }
}
