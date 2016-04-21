using ReactNative.Bridge;

namespace ReactNative.Modules.Core
{
    /// <summary>
    /// JavaScript module for emitting device events.
    /// </summary>
    public sealed class RCTDeviceEventEmitter : JavaScriptModuleBase
    {
        /// <summary>
        /// Emits an event to the JavaScript instance.
        /// </summary>
        /// <param name="eventName">The event name.</param>
        /// <param name="data">The event data.</param>
        public void emit(string eventName, object data)
        {
            Invoke(eventName, data);
        }
    }
}
