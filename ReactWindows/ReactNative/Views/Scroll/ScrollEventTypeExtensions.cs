using System;

namespace ReactNative.Views.Scroll
{
    static class ScrollEventTypeExtensions
    {
        public static string GetJavaScriptEventName(this ScrollEventType type)
        {
            switch (type)
            {
                case ScrollEventType.Scroll:
                    return "topScroll";
                default:
                    throw new ArgumentOutOfRangeException(nameof(type), $"Unknown scroll event type '{type}'.");
            }
        }
    }
}
