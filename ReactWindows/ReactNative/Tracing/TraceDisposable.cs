using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.Tracing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.Tracing
{
    public struct TraceDisposable : IDisposable
    {
        private static readonly EventSource s_eventSource = new EventSource("ReactNative");
        private static readonly Stopwatch s_stopwatch = Stopwatch.StartNew();

        private readonly int _source;
        private readonly string _title;
        private readonly long _timestamp;

        public TraceDisposable(int source, string title)
        {
            _source = source;
            _title = title;
            _timestamp = s_stopwatch.ElapsedTicks;
        }

        public void Dispose()
        {
            s_eventSource.Write(_title, new EventData(_source, TimeSpan.FromTicks(s_stopwatch.ElapsedTicks - _timestamp)));
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
