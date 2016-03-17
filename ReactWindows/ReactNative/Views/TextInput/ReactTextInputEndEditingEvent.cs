using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;

namespace ReactNative.Views.TextInput
{
    class ReactTextInputEndEditingEvent : Event
    {
        private readonly string _text;

        public ReactTextInputEndEditingEvent(int viewTag, string text)
            : base(viewTag, TimeSpan.FromTicks(Environment.TickCount))
        {
            _text = text;
        }

        public override string EventName
        {
            get
            {
                return "topEndEditing";
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