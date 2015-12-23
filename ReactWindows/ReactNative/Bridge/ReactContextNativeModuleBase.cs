namespace ReactNative.Bridge
{
    /// <summary>
    /// Base class for catalyst native modules that require access to the 
    /// <see cref="ReactContext"/>.
    /// </summary>
    public abstract class ReactContextNativeModuleBase : NativeModuleBase
    {
        /// <summary>
        /// Instantiates the <see cref="ReactContextNativeModuleBase"/>.
        /// </summary>
        /// <param name="context">The context.</param>
        protected ReactContextNativeModuleBase(ReactContext context)
        {
            Context = context;
        }

        /// <summary>
        /// The React context.
        /// </summary>
        public ReactContext Context { get; }
    }
}
