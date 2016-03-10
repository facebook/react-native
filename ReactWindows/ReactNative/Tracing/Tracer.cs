using System;

namespace ReactNative.Tracing
{
    /// <summary>
    /// Tracing helpers for the application.
    /// </summary>
    static class Tracer
    {
        /// <summary>
        /// Trace ID for bridge events.
        /// </summary>
        public const int TRACE_TAG_REACT_BRIDGE = 0; 
        
        /// <summary>
        /// Trace ID for application events.
        /// </summary>
        public const int TRACE_TAG_REACT_APPS = 1; 

        /// <summary>
        /// Trace ID for view events.
        /// </summary>
        public const int TRACE_TAG_REACT_VIEW = 2;

        /// <summary>
        /// Creates a disposable to trace an operation from start to finish.
        /// </summary>
        /// <param name="traceId">The trace ID.</param>
        /// <param name="title">The event title.</param>
        /// <returns>
        /// The instance to dispose when the operation is finished.
        /// </returns>
        public static TraceDisposable Trace(int traceId, string title)
        {
            return new TraceDisposable(traceId, title);
        }

        /// <summary>
        /// Writes a trace.
        /// </summary>
        /// <param name="tag">The trace tag.</param>
        /// <param name="message">The trace message.</param>
        public static void Write(string tag, string message)
        {
            EventSourceManager.Instance.Write(tag, message);
        }

        /// <summary>
        /// Write an error.
        /// </summary>
        /// <param name="tag">The trace tag.</param>
        /// <param name="message">The trace message.</param>
        /// <param name="exception">The exception.</param>
        public static void Error(string tag, string message, Exception exception)
        {
            EventSourceManager.Instance.Write(tag, message);
            EventSourceManager.Instance.Write(tag, exception);
        }
    }
}
