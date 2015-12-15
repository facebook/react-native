using System;

namespace ReactNative.Bridge
{
    public class NativeArgumentsParseException : ArgumentException
    {
        public NativeArgumentsParseException(string message, string paramName)
            : base(message, paramName)
        {
        }

        public NativeArgumentsParseException(string message, string paramName, Exception innerException)
            : base(message, paramName, innerException)
        {
        }
    }
}
