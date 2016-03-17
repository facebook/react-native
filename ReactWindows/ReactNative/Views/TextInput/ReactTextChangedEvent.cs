using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// Event emitted by <see cref="ReactTextInputManager"/> native view when
    /// text changes.
    /// </summary>
    class ReactTextChangedEvent : Event
    {
        private readonly string _text;
        private readonly double _contextWidth;
        private readonly double _contentHeight;
        private readonly int _eventCount;

        /// <summary>
        /// Instantiates a <see cref="ReactTextChangedEvent"/>.
        /// </summary>
        /// <param name="viewTag">The view tag.</param>
        /// <param name="text">The text.</param>
        /// <param name="contentWidth">The content width.</param>
        /// <param name="contentHeight">The content height.</param>
        /// <param name="eventCount">The event count.</param>
        public ReactTextChangedEvent(int viewTag, string text, double contentWidth, double contentHeight, int eventCount) 
            : base(viewTag, TimeSpan.FromTicks(Environment.TickCount))
        {
            _text = text;
            _contextWidth = contentWidth;
            _contentHeight = contentHeight;
            _eventCount = eventCount;
        }

        /// <summary>
        /// The name of the event.
        /// </summary>
        public override string EventName
        {
            get
            {
                return "topChange";
            }
        }

        /// <summary>
        /// Text change events cannot be coalesced.
        /// </summary>
        /// <remarks>
        /// Return <code>false</code> if the event can never be coalesced.
        /// </remarks>
        public override bool CanCoalesce
        {
            get
            {
                return false;
            }
        }

        /// <summary>
        /// Push the event up to the event emitter.
        /// </summary>
        /// <param name="rctEventEmitter">The event emitter.</param>
        public override void Dispatch(RCTEventEmitter rctEventEmitter)
        {
            var contentSize = new JObject
            {
                { "width", _contextWidth },
                { "height", _contentHeight },
            };

            var eventData = new JObject
            {
                { "text", _text },
                { "contentSize", contentSize },
                { "eventCount", _eventCount },
                { "target", ViewTag },
            };

            rctEventEmitter.receiveEvent(ViewTag, EventName, eventData);
        }
    }
}
