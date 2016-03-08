using System;

namespace ReactNative.Modules.Core
{
    /// <summary>
    /// A class for JavaScript exceptions.
    /// </summary>
    public class JavaScriptException : Exception
    {
        /// <summary>
        /// Instantiates the <see cref="JavaScriptException"/>.
        /// </summary>
        /// <param name="message">The exception message.</param>
        /// <param name="stackTrace">The JavaScript stack trace.</param>
        public JavaScriptException(string message, string stackTrace)
            : base(GetMessage(message, stackTrace))
        {
            StackTrace = stackTrace;
        }

        /// <summary>
        /// Instantiates the <see cref="JavaScriptException"/>.
        /// </summary>
        /// <param name="message">The exception message.</param>
        /// <param name="stackTrace">The JavaScript stack trace.</param>
        /// <param name="innerException">The inner exception.</param>
        public JavaScriptException(string message, string stackTrace, Exception innerException)
            : base(GetMessage(message, stackTrace), innerException)
        {
            StackTrace = stackTrace;
        }

        /// <summary>
        /// The exception stack trace.
        /// </summary>
        public string StackTrace
        {
            get;
        }

        private static string GetMessage(string message, string stackTrace)
        {
            return message + Environment.NewLine + stackTrace;
        }
    }
}
