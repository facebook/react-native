using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.UIManager.Events
{
    /// <summary>
    /// Base class implementation for React Native UWP event handlers.
    /// </summary>
    public abstract class EventBase : Event
    {
        protected EventBase(int viewId) : base(viewId, TimeSpan.FromTicks(Environment.TickCount))
        {

        }
        /// <summary>
        /// Push the on focus event up to the event emitter.
        /// </summary>
        /// <param name="rctEventEmitter">The event emitter to dispatch the event to.</param>
        public override void Dispatch(RCTEventEmitter eventEmitter)
        {
            eventEmitter.receiveEvent(this.ViewTag, this.EventName, this.GetEventJavascriptProperties);
        }

        protected virtual JObject GetEventJavascriptProperties
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
