using Newtonsoft.Json.Linq;
using ReactNative.Bridge;

namespace ReactNative.Modules.Core
{
    public class RCTEventEmitter : JavaScriptModuleBase
    {
        public void receiveEvent(int targetTag, string eventName, JObject @event)
        {
            Invoke(nameof(receiveEvent), targetTag, eventName, @event);
        }

        public void receiveTouches(string eventName, JArray touches, JArray changedIndices)
        {
            Invoke(nameof(receiveTouches), touches, changedIndices);
        }
    }
}
