using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;

namespace ReactNative.UIManager
{
    class OnLayoutEvent : Event
    {
        private int _x;
        private int _y;
        private int _width;
        private int _height;

        private OnLayoutEvent(int viewTag, int x, int y, int width, int height)
            : base(viewTag, TimeSpan.FromTicks(Environment.TickCount))
        {
            _x = x;
            _y = y;
            _width = width;
            _height = height;
        }

        public override string EventName
        {
            get
            {
                return "topLayout";
            }
        }

        public override void Dispatch(RCTEventEmitter eventEmitter)
        {
            var eventArgs = new JObject
            {
                { "target", ViewTag },
                { "layout", null /* TODO: create layout arguments */ },
            };

            eventEmitter.receiveEvent(ViewTag, EventName, eventArgs);
        }

        public static OnLayoutEvent Obtain(int viewTag, int x, int y, int width, int height)
        {
            // TODO: Introduce pooling mechanism
            return new OnLayoutEvent(viewTag, x, y, width, height);
        }
    }
}
