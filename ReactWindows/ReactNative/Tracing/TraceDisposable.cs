using System;
using System.Diagnostics;
using System.Diagnostics.Tracing;

namespace ReactNative.Tracing
{
    /// <summary>
    /// Disposable implementation for tracing operations.
    /// </summary>
    /// <remarks>
    /// This implementation is created as a struct to minimize the heap impact
    /// for tracing operations.
    /// </remarks>
    struct /* do not make class */ TraceDisposable : IDisposable
    {
        private static readonly Stopwatch s_stopwatch = Stopwatch.StartNew();

        private readonly int _traceId;
        private readonly string _title;
        private readonly long _timestamp;

        /// <summary>
        /// Instantiates the <see cref="TraceDisposable"/>.
        /// </summary>
        /// <param name="traceId">The trace ID.</param>
        /// <param name="title">The event title.</param>
        public TraceDisposable(int traceId, string title)
        {
            _traceId = traceId;
            _title = title;
            _timestamp = s_stopwatch.ElapsedTicks;
        }

        /// <summary>
        /// Disposed the instance, capturing the trace.
        /// </summary>
        public void Dispose()
        {
            EventSourceManager.Instance.Write(_title, new EventData(_traceId, TimeSpan.FromTicks(s_stopwatch.ElapsedTicks - _timestamp)));
        }

        [EventData]
        struct EventData
        {
            public EventData(int source, TimeSpan elapsed)
            {
                Source = source;
                Elapsed = elapsed;
            }

            public int Source { get; } 
            public TimeSpan Elapsed { get; }
        }
    }
}
