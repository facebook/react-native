using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;

namespace ReactNative.Views.TextInput
{
    class ReactTextInputSelectionEvent : Event
    {
        private readonly int _end;
        private readonly int _start;

        public ReactTextInputSelectionEvent(int viewTag, int start, int end)
            : base(viewTag, TimeSpan.FromTicks(Environment.TickCount))
        {
            _start = start;
            _end = end;
        }

        public override string EventName
        {
            get
            {
                return "topSelectionChange";
            }
        }

        public override void Dispatch(RCTEventEmitter eventEmitter)
        {
            var selectionData = new JObject
            {
                { "start", _start },
                { "end", _end },
            };

            var eventData = new JObject
            {
                { "selection", selectionData },
            };

            eventEmitter.receiveEvent(ViewTag, EventName, eventData);
        }
    }
}
