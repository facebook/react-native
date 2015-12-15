namespace ReactNative.Hosting
{
    using System;
    using System.Runtime.Serialization;

    /// <summary>
    ///     An API usage exception occurred.
    /// </summary>
    public sealed class JavaScriptUsageException : JavaScriptException
    {
        /// <summary>
        ///     Initializes a new instance of the <see cref="JavaScriptUsageException"/> class. 
        /// </summary>
        /// <param name="code">The error code returned.</param>
        public JavaScriptUsageException(JavaScriptErrorCode code) :
            this(code, "A fatal exception has occurred in a JavaScript runtime")
        {
        }

        /// <summary>
        ///     Initializes a new instance of the <see cref="JavaScriptUsageException"/> class. 
        /// </summary>
        /// <param name="code">The error code returned.</param>
        /// <param name="message">The error message.</param>
        public JavaScriptUsageException(JavaScriptErrorCode code, string message) :
            base(code, message)
        {
        }
    }
}