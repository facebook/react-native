using ReactNative.Bridge;
using System;

namespace ReactNative
{
    /// <summary>
    /// Event arguments for the <see cref="IReactInstanceManager.ReactContextInitialized"/>
    /// event.
    /// </summary>
    public sealed class ReactContextInitializedEventArgs : EventArgs
    {
        /// <summary>
        /// Instantiates the <see cref="ReactContextInitializedEventArgs"/>.
        /// </summary>
        /// <param name="context">The react context.</param>
        internal ReactContextInitializedEventArgs(ReactContext context)
        {
            Context = context;
        }

        /// <summary>
        /// The react context.
        /// </summary>
        public ReactContext Context { get; }
    }
}
