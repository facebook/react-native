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
                    .AppendLine(frame.Method)
                    .Append("    ")
                    .AppendLine(frame.SourceInfo);
            }

            return stringBuilder.ToString(); 
        }
    }
}
