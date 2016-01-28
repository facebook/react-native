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
    /// Emits events to <see cref="RCTEventEmitter"/> for onfocus changes to <see cref="TextBox"/>.
    /// </summary>
    public class ReactTextInputFocusEvent : Event
    {
        public static readonly String EVENT_NAME = "topFocus";

        public ReactTextInputFocusEvent(int viewId) : base(viewId, TimeSpan.FromTicks(Environment.TickCount))
        {
        }

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
        /// Push the on focus event up to the event emitter.
        /// </summary>
        /// <param name="rctEventEmitter">The event emitter to dispatch the event to.</param>
        public override void Dispatch(RCTEventEmitter eventEmitter)
        {
            eventEmitter.receiveEvent(ViewTag, EventName, this.GetEventJavascriptProperties);
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
