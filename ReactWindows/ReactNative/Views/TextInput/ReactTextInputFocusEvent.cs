using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// Event emitted by <see cref="ReactTextInputManager"/> native view when 
    /// focus changes.
    /// </summary>
    class ReactTextInputFocusEvent : Event
    {
        /// <summary>
        /// Instantiates a <see cref="ReactTextInputFocusEvent"/>.
        /// </summary>
        /// <param name="viewTag">The view tag.</param>
        public ReactTextInputFocusEvent(int viewTag) 
            : base(viewTag, TimeSpan.FromTicks(Environment.TickCount))
        {
        }

        /// <summary>
        /// The event name.
        /// </summary>
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
