using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// Emits events to <see cref="RCTEventEmitter"/> for focus changes to 
    /// <see cref="Windows.UI.Xaml.TextBox"/>.
    /// </summary>
    class ReactTextInputFocusEvent : Event
    {
        public ReactTextInputFocusEvent(int viewId) 
            : base(viewId, TimeSpan.FromTicks(Environment.TickCount))
        {
        }

        public override string EventName
        {
            get
            {
                return "topFocus";
            }
        }

        /// <summary>
        /// Disabling event coalescing.
        /// </summary>
        /// <remarks>
        /// Return false if the event can never be coalesced.
        /// </remarks>
        public override bool CanCoalesce
        {
            get
            {
                return false;
            }
        }

        /// <summary>
        /// Dispatch this event to JavaScript using the given event emitter.
        /// </summary>
        /// <param name="eventEmitter">The event emitter.</param>
        public override void Dispatch(RCTEventEmitter eventEmitter)
        {
            var eventData = new JObject()
            {
                { "target", ViewTag },
            };

            eventEmitter.receiveEvent(ViewTag, EventName, eventData);
        }
    }
}
