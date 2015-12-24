using System;

namespace ReactNative.UIManager.Events
{
    static class TouchEventTypeExtensions
    {
        public static string GetJavaScriptEventName(this TouchEventType eventType)
        {
            switch (eventType)
            {
                case TouchEventType.Start:
                    return "topTouchStart";
                case TouchEventType.End:
                    return "topTouchEnd";
                case TouchEventType.Move:
                    return "topTouchMove";
                case TouchEventType.Cancel:
                    return "topTouchCancel";
                default:
                    throw new NotSupportedException("Unsupported touch event type.");
            }
        }
    }
}
