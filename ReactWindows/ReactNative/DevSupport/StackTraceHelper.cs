using Newtonsoft.Json.Linq;
using System;
using System.Diagnostics;
using System.Text.RegularExpressions;

namespace ReactNative.DevSupport
{
    static class StackTraceHelper
    {
        public static IStackFrame[] ConvertChakraStackTrace(string stackTrace)
        {
            var lines = stackTrace.Split('\n');
            var frames = new IStackFrame[lines.Length - 1];
            for (var i = 1; i < lines.Length; ++i)
            {
                frames[i - 1] = new ChakraStackFrame(lines[i]);
            }

            return frames;
        }

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

        abstract class StackFrameBase : IStackFrame
        {
            private const string UnknownFileName = "<filename unknown>";

            public abstract int Column { get; }

            public abstract string FileName { get; }

            public abstract int Line { get; }

            public abstract string Method { get; }

            public string SourceInfo
            {
                get
                {
                    return $"{FileName ?? UnknownFileName}:{Line}:{Column}";
                }
            }
        }

        class ChakraStackFrame : StackFrameBase
        {
            private static readonly Regex s_regex = new Regex(@"\s*at (.*) \((.*):(\d+):(\d+)\)");

            public ChakraStackFrame(string line)
            {
                var match = s_regex.Match(line);
                if (match.Success)
                {
                    Method = match.Groups[1].Value;
                    FileName = match.Groups[2].Value;
                    Line = int.Parse(match.Groups[3].Value);
                    Column = int.Parse(match.Groups[4].Value);
                }
            }

            public override int Column
            {
                get;
            }

            public override string FileName
            {
                get;
            }

            public override int Line
            {
                get;
            }

            public override string Method
            {
                get;
            }
        }

        class JavaScriptStackFrame : StackFrameBase
        {
            private readonly JObject _map;

            public JavaScriptStackFrame(JObject map)
            {
                _map = map;
            }

            public override int Column
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

            public override string FileName
            {
                get
                {
                    return _map.Value<string>("file");
                }
            }

            public override int Line
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

            public override string Method
            {
                get
                {
                    return _map.Value<string>("methodName");
                }
            }
        }

        class SystemStackFrame : StackFrameBase
        {
            private readonly StackFrame _stackFrame;

            public SystemStackFrame(StackFrame stackFrame)
            {
                _stackFrame = stackFrame;
            }

            public override int Column
            {
                get
                {
                    return _stackFrame.GetFileColumnNumber();
                }
            }

            public override string FileName
            {
                get
                {
                    return _stackFrame.GetFileName();
                }
            }

            public override int Line
            {
                get
                {
                    return _stackFrame.GetFileLineNumber();
                }
            }

            public override string Method
            {
                get
                {
                    return _stackFrame.GetMethod().Name;
                }
            }
        }
    }
}
