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
        private String mText;
        private int mContentWidth;
        private int mContentHeight;

        public ReactTextChangedEvent(int viewId, TimeSpan timestamp,
                                     string text, int contentSizeWidth,
                                     int contentSizeHeight) : base(viewId, timestamp)
        {
            mText = text;
            mContentWidth = contentSizeWidth;
            mContentHeight = contentSizeHeight;
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
                    { "width", mContentWidth },
                    { "height", mContentWidth },
                    { "text", mText },
                    { "width", mContentWidth },
                    {"target", this.ViewTag }
                };
            }
        }
    }
}
