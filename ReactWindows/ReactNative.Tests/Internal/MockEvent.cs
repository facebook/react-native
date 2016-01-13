using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;

namespace ReactNative.Tests
{
    class MockEvent : Event
    {
        private readonly string _eventName;
        private readonly JObject _eventArgs;
        private readonly Action _onDispose;

        public MockEvent(int viewTag, TimeSpan timestamp, string eventName)
            : this(viewTag, timestamp, eventName, new JObject())
        {
        }

        public MockEvent(int viewTag, TimeSpan timestamp, string eventName, JObject eventArgs)
            : this(viewTag, timestamp, eventName, eventArgs, () => { })
        {
        }

        public MockEvent(int viewTag, TimeSpan timestamp, string eventName, JObject eventArgs, Action onDispose)
            : base(viewTag, timestamp)
        {
            _eventName = eventName;
            _eventArgs = eventArgs;
            _onDispose = onDispose;
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

        protected override void OnDispose()
        {
            _onDispose();
        }
    }
}
