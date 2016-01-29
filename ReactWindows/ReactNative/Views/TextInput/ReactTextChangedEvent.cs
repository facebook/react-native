using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// Event emitted by <see cref="TextBox"/> native view when text changes.
    /// </summary>
    class ReactTextChangedEvent : Event
    {
        private readonly string _text;
        private readonly double _contextWidth;
        private readonly double _contentHeight;

        public ReactTextChangedEvent(int viewId, string text, double contentWidth, double contentHeight) 
            : base(viewId, TimeSpan.FromTicks(Environment.TickCount))
        {
            _text = text;
            _contextWidth = contentWidth;
            _contentHeight = contentHeight;
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
            rctEventEmitter.receiveEvent(this.ViewTag, this.EventName, this.GetEventJavascriptProperties);
        }

        private JObject GetEventJavascriptProperties
        {
            get
            {
                return new JObject()
                {
                    { "width", _contextWidth },
                    { "height", _contentHeight },
                    { "text", _text },
                    { "target", ViewTag }
                };
            }
        }
    }
}
