namespace ReactNative.Tracing
{
    static class Tracer
    {
        public const int TRACE_TAG_REACT_BRIDGE = 0; 
        public const int TRACE_TAG_REACT_FRESCO = 1; 
        public const int TRACE_TAG_REACT_APPS = 2; 
        public const int TRACE_TAG_REACT_VIEW = 3;

        public static TraceDisposable Trace(int kind, string title)
        {
            return new TraceDisposable(kind, title);
        }

        public static void Write(string tag, string message)
        {
            EventSourceManager.Instance.Write(tag, message);
        }
    }
}
