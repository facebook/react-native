using System;
using System.Collections;
using System.Collections.Generic;
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
        private readonly Dictionary<string, object> _properties;

        /// <summary>
        /// Instantiates the <see cref="TraceDisposable"/>.
        /// </summary>
        /// <param name="traceId">The trace ID.</param>
        /// <param name="title">The event title.</param>
        public TraceDisposable(int traceId, string title)
            : this(traceId, title, s_stopwatch.ElapsedTicks, null)
        {
        }

        private TraceDisposable(int traceId, string title, long timestamp, Dictionary<string, object> properties)
        {
            _traceId = traceId;
            _title = title;
            _timestamp = timestamp;
            _properties = properties;
        }

        /// <summary>
        /// Add a property to the <see cref="TraceDisposable"/>.
        /// </summary>
        /// <param name="key">The property key.</param>
        /// <param name="value">The property value.</param>
        /// <returns>The disposable instance.</returns>
        public TraceDisposable With(string key, object value)
        {
            var properties = _properties;
            if (properties == null)
            {
                properties = new Dictionary<string, object>();
            }

            properties[key] = value;
            return new TraceDisposable(_traceId, _title, _timestamp, properties);
        }

        /// <summary>
        /// Disposed the instance, capturing the trace.
        /// </summary>
        public void Dispose()
        {
            EventSourceManager.Instance.Write(
                _title, 
                new EventData(
                    _traceId, 
                    TimeSpan.FromTicks(s_stopwatch.ElapsedTicks - _timestamp),
                    _properties));
        }

        [EventData]
        struct EventData
        {
            public EventData(int source, TimeSpan elapsed, Dictionary<string, object> properties)
            {
                Source = source;
                Elapsed = elapsed;
                Properties = properties;
            }

            public int Source { get; }

            public TimeSpan Elapsed { get; }

            public Dictionary<string, object> Properties { get; }
        }
    }
}
