using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;

namespace ReactNative.Views.Split.Events
{
    class SplitViewOpenedEvent : Event
    {
        public const string EventNameValue = "topSplitViewOpened";

        public SplitViewOpenedEvent(int viewTag)
            : base(viewTag, TimeSpan.FromTicks(Environment.TickCount))
        {
        }

        public override string EventName
        {
            get
            {
                return EventNameValue;
            }
        }

        public override void Dispatch(RCTEventEmitter eventEmitter)
        {
            eventEmitter.receiveEvent(ViewTag, EventName, new JObject());
        }
    }
}
