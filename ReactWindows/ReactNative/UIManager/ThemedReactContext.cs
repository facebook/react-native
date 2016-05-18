using ReactNative.Bridge;

namespace ReactNative.UIManager
{
    /// <summary>
    /// A wrapper <see cref="ReactContext"/> that delegates lifecycle events to
    /// the original instance of <see cref="ReactContext"/>.
    /// </summary>
    public class ThemedReactContext : ReactContext
    {
        private readonly ReactContext _reactContext;

        /// <summary>
        /// Instantiates the <see cref="ThemedReactContext"/>.
        /// </summary>
        /// <param name="reactContext">The inner context.</param>
        public ThemedReactContext(ReactContext reactContext)
        {
             InitializeWithInstance(reactContext.ReactInstance);
             _reactContext = reactContext;
        }

        /// <summary>
        /// Adds a lifecycle event listener to the context.
        /// </summary>
        /// <param name="listener">The listener.</param>
        public override void AddLifecycleEventListener(ILifecycleEventListener listener)
        {
            _reactContext.AddLifecycleEventListener(listener);
        }

        /// <summary>
        /// Removes a lifecycle event listener from the context.
        /// </summary>
        /// <param name="listener">The listener.</param>
        public override void RemoveLifecycleEventListener(ILifecycleEventListener listener)
        {
            _reactContext.RemoveLifecycleEventListener(listener);
        }
    }
}
