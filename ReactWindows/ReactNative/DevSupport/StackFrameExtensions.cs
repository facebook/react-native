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
                    .Append(frame.FileName)
                    .Append(":")
                    .Append(frame.Line);

                var column = frame.Column;
                if (column > 0)
                {
                    stringBuilder
                        .Append(":")
                        .Append(column);
                }

                stringBuilder.AppendLine();
            }

            return stringBuilder.ToString(); 
        }
    }
}
