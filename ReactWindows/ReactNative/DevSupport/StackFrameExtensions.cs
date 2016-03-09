using System.Text;

namespace ReactNative.DevSupport
{
    static class StackFrameExtensions
    {
        public static string PrettyPrint(this IStackFrame[] stackTrace)
        {
            var stringBuilder = new StringBuilder();
            foreach (var frame in stackTrace)
            {
                stringBuilder
                    .AppendLine(frame.Method);

                var fileName = frame.FileName ?? "<filename unknown>";
                stringBuilder
                    .Append("    ")
                    .Append(fileName)
                    .Append(":")
                    .Append(frame.Line)
                    .Append(":")
                    .Append(frame.Column);

                stringBuilder.AppendLine();
            }

            return stringBuilder.ToString(); 
        }
    }
}
