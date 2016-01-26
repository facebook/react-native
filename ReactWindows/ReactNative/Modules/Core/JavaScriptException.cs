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
        }

        private static string GetMessage(string message, string stackTrace)
        {
            return message + Environment.NewLine + stackTrace;
        }
    }
}
