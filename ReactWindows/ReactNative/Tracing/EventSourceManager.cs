using System.Diagnostics.Tracing;

namespace ReactNative.Tracing
{
    static class EventSourceManager
    {
        public static EventSource Instance { get; } = new EventSource("ReactNative");
    }
}
