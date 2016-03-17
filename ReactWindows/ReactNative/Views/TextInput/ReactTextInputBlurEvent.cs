using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// Event emitted by <see cref="Windows.UI.Xaml.Controls.TextBox"/> native 
    /// view when the control gains focus.
    /// </summary>
    class ReactTextInputBlurEvent : Event
    {
        /// <summary>
        /// Instantiate a <see cref="ReactTextInputBlurEvent"/>.
        /// </summary>
        /// <param name="viewTag">The view tag.</param>
        public ReactTextInputBlurEvent(int viewTag) 
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
                return "topBlur";
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
            var eventData = new JObject
            {
                { "target", ViewTag },
            };

            eventEmitter.receiveEvent(ViewTag, EventName, eventData);
        }
    }
}
