using System;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Interface that represents a JavaScript Promise which can be passed to 
    /// the native module as a method parameter.
    /// </summary>
    /// <remarks>
    /// Methods annotated with <see cref="ReactMethodAttribute"/> that use 
    /// <see cref="IPromise"/> as type of the last parameter will be marked as
    /// "remoteAsync" and will return a promise when invoked from JavaScript.
    /// </remarks>
    public interface IPromise
    {
        /// <summary>
        /// Resolve the promise with the given value.
        /// </summary>
        /// <param name="value">The value.</param>
        void Resolve(object value);

        /// <summary>
        /// Reject the promise with the given exception.
        /// </summary>
        /// <param name="exception">The exception.</param>
        void Reject(Exception exception);

        /// <summary>
        /// Reject the promise with the given reason.
        /// </summary>
        /// <param name="reason">The reason.</param>
        void Reject(string reason);
    }
}
