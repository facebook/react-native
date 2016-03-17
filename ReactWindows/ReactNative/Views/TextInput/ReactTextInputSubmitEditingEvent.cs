using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;

namespace ReactNative.Views.TextInput
{
    class ReactTextInputSubmitEditingEvent : Event
    {
        private readonly string _text;

        public ReactTextInputSubmitEditingEvent(int viewTag, string text)
            : base(viewTag, TimeSpan.FromTicks(Environment.TickCount))
        {
            _text = text;
        }

        public override string EventName
        {
            get
            {
                return "topSubmitEditing";
            }
        }

        public override bool CanCoalesce
        {
            get
            {
                return false;
            }
        }

        public override void Dispatch(RCTEventEmitter eventEmitter)
        {
            var eventData = new JObject
            {
                { "target", ViewTag },
                { "text", _text },
            };

            eventEmitter.receiveEvent(ViewTag, EventName, eventData);
        }
    }
}