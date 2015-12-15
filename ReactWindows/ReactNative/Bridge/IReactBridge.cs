using Newtonsoft.Json.Linq;

namespace ReactNative.Bridge
{
    public interface IReactBridge
    {
        void CallFunction(int moduleId, int methodId, JArray arguments);

        void InvokeCallback(int callbackID, JArray arguments);

        void SetGlobalVariable(string propertyName, string jsonEncodedArgument);
    }
}
