using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;

namespace ReactNative.Tests
{
    class MockEvent : Event
    {
        private readonly string _eventName;
        private readonly JObject _eventArgs;

        public MockEvent(int viewTag, TimeSpan timestamp, string eventName, JObject eventArgs)
            : base(viewTag, timestamp)
        {
            _eventName = eventName;
            _eventArgs = eventArgs;
        }

        public override string EventName
        {
            get
            {
                return _eventName;
            }
        }

        public override void Dispatch(RCTEventEmitter eventEmitter)
        {
            eventEmitter.receiveEvent(ViewTag, EventName, _eventArgs);
        }
    }
}
