using System;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Base class for react native modules that require access to the 
    /// <see cref="ReactContext"/>.
    /// </summary>
    public abstract class ReactContextNativeModuleBase : NativeModuleBase
    {
        /// <summary>
        /// Instantiates the <see cref="ReactContextNativeModuleBase"/>.
        /// </summary>
        /// <param name="reactContext">The React context.</param>
        protected ReactContextNativeModuleBase(ReactContext reactContext)
        {
            if (reactContext == null)
                throw new ArgumentNullException(nameof(reactContext));

            Context = reactContext;
        }

        /// <summary>
        /// The React context.
        /// </summary>
        public ReactContext Context { get; }
    }
}
