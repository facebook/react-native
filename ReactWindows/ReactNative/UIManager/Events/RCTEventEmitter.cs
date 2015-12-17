using Newtonsoft.Json.Linq;
using ReactNative.Bridge;

namespace ReactNative.Modules.Core
{
    /// <summary>
    /// JavaScript event emitter.
    /// </summary>
    public sealed class RCTEventEmitter : JavaScriptModuleBase
    {
        /// <summary>
        /// Receive an event.
        /// </summary>
        /// <param name="targetTag">The target tag.</param>
        /// <param name="eventName">The event name.</param>
        /// <param name="event">The event data.</param>
        public void receiveEvent(int targetTag, string eventName, JObject @event)
        {
            Invoke(nameof(receiveEvent), targetTag, eventName, @event);
        }

        /// <summary>
        /// Receives touches.
        /// </summary>
        /// <param name="eventName">The event name.</param>
        /// <param name="touches">The touches.</param>
        /// <param name="changedIndices">The changed indices.</param>
        public void receiveTouches(string eventName, JArray touches, JArray changedIndices)
        {
            Invoke(nameof(receiveTouches), touches, changedIndices);
        }
    }
}
