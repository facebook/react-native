using System.Diagnostics.Tracing;

namespace ReactNative.Tracing
{
    /// <summary>
    /// Static <see cref="EventSource"/> for the application.
    /// </summary>
    static class EventSourceManager
    {
        /// <summary>
        /// The <see cref="EventSource"/> instance.
        /// </summary>
        public static EventSource Instance { get; } = new EventSource("ReactNative");
    }
}
