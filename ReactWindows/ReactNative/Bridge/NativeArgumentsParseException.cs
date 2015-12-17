using System;

namespace ReactNative.Bridge
{
    /// <summary>
    /// An exception thrown when converting between JavaScript and native arguments.
    /// </summary>
    public class NativeArgumentsParseException : ArgumentException
    {
        /// <summary>
        /// Instantiates the <see cref="NativeArgumentsParseException"/>.
        /// </summary>
        /// <param name="message">The exception message.</param>
        /// <param name="paramName">The parameter name.</param>
        public NativeArgumentsParseException(string message, string paramName)
            : base(message, paramName)
        {
        }

        /// <summary>
        /// Instantiates the <see cref="NativeArgumentsParseException"/>.
        /// </summary>
        /// <param name="message">The exception message.</param>
        /// <param name="paramName">The parameter name.</param>
        /// <param name="innerException">The inner exception.</param>
        public NativeArgumentsParseException(string message, string paramName, Exception innerException)
            : base(message, paramName, innerException)
        {
        }
    }
}
