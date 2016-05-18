namespace ReactNative.Chakra
{
    using System;
    using System.Runtime.Serialization;

    /// <summary>
    ///     An exception that occurred in the workings of the JavaScript engine itself.
    /// </summary>
    public sealed class JavaScriptEngineException : JavaScriptException
    {
        /// <summary>
        ///     Initializes a new instance of the <see cref="JavaScriptEngineException"/> class. 
        /// </summary>
        /// <param name="code">The error code returned.</param>
        public JavaScriptEngineException(JavaScriptErrorCode code) :
            this(code, "A fatal exception has occurred in a JavaScript runtime")
        {
        }

        /// <summary>
        ///     Initializes a new instance of the <see cref="JavaScriptEngineException"/> class. 
        /// </summary>
        /// <param name="code">The error code returned.</param>
        /// <param name="message">The error message.</param>
        public JavaScriptEngineException(JavaScriptErrorCode code, string message) :
            base(code, message)
        {
        }
    }
}