using Newtonsoft.Json.Linq;
using System;
using System.Diagnostics;

namespace ReactNative.DevSupport
{
    static class StackTraceHelper
    {
        public static IStackFrame[] ConvertJavaScriptStackTrace(JArray stack)
        {
            var n = stack.Count;
            var result = new IStackFrame[n];
            for (var i = 0; i < n; ++i)
            {
                var item = stack[i] as JObject;
                if (item != null)
                {
                    result[i] = new JavaScriptStackFrame(item);
                }
            }

            return result;
        }

        public static IStackFrame[] ConvertNativeStackTrace(Exception exception)
        {
            var stackTrace = new StackTrace(exception, true);
            var frames = stackTrace.GetFrames();
            var n = frames.Length;
            var results = new IStackFrame[n];
            for (var i = 0; i < n; ++i)
            {
                results[i] = new SystemStackFrame(frames[i]);
            }

            return results;
        }

        class JavaScriptStackFrame : IStackFrame
        {
            private readonly JObject _map;

            public JavaScriptStackFrame(JObject map)
            {
                _map = map;
            }

            public int Column
            {
                get
                {
                    var columnNumber = -1;
                    var token = default(JToken);
                    if (_map.TryGetValue("column", out token) && token.Type == JTokenType.Integer)
                    {
                        columnNumber = token.Value<int>();
                    }

                    return columnNumber;
                }
            }

            public string FileName
            {
                get
                {
                    return _map.Value<string>("fileName");
                }
            }

            public int Line
            {
                get
                {
                    var lineNumber = -1;
                    var token = default(JToken);
                    if (_map.TryGetValue("lineNumber", out token) && token.Type == JTokenType.Integer)
                    {
                        lineNumber = token.Value<int>();
                    }

                    return lineNumber;
                }
            }

            public string Method
            {
                get
                {
                    return _map.Value<string>("methodName");
                }
            }
        }

        class SystemStackFrame : IStackFrame
        {
            private readonly StackFrame _stackFrame;

            public SystemStackFrame(StackFrame stackFrame)
            {
                _stackFrame = stackFrame;
            }

            public int Column
            {
                get
                {
                    return _stackFrame.GetFileColumnNumber();
                }
            }

            public string FileName
            {
                get
                {
                    return _stackFrame.GetFileName();
                }
            }

            public int Line
            {
                get
                {
                    return _stackFrame.GetFileLineNumber();
                }
            }

            public string Method
            {
                get
                {
                    return _stackFrame.GetMethod().Name;
                }
            }
        }
    }
}
