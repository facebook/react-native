using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// Event emitted by <see cref="TextBox"/> native view when text changes.
    /// </summary>
    class ReactTextChangedEvent : Event
    {
        public static readonly String EVENT_NAME = "topChange";
        private String _Text;
        private double _ContentWidth;
        private double _ContentHeight;

        public ReactTextChangedEvent(int viewId, string text, double contentSizeWidth,
                                     double contentSizeHeight) : base(viewId, TimeSpan.FromTicks(Environment.TickCount))
        {
            _Text = text;
            _ContentWidth = contentSizeWidth;
            _ContentHeight = contentSizeHeight;
        }

        /// <summary>
        /// Gets the name of the Event
        /// </summary>
        public override string EventName
        {
            get
            {
                return EVENT_NAME;
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
        /// Push the event up to the event emitter.
        /// </summary>
        /// <param name="rctEventEmitter">The event emitter to dispatch the event to.</param>
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
                    { "width", _ContentWidth },
                    { "height", _ContentHeight },
                    { "text", _Text },
                    {"target", this.ViewTag }
                };
            }
        }
    }
}
