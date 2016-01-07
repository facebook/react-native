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
    /// Event emitted by <see cref="TextBox"/> native view when the control gains focus.
    /// </summary>
    class ReactTextInputBlurEvent : Event
    {
        public static readonly String EVENT_NAME = "topBlur";

        public ReactTextInputBlurEvent(int viewId) : base(viewId, TimeSpan.FromTicks(Environment.TickCount))
        {
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
        public override void Dispatch(RCTEventEmitter eventEmitter)
        {
            eventEmitter.receiveEvent(this.ViewTag, this.EventName, this.GetEventJavascriptProperties);
        }

        private JObject GetEventJavascriptProperties
        {
            get
            {
                return new JObject()
                {
                    {"target", this.ViewTag }
                };
            }
        }
    }
}
