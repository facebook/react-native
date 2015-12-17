
namespace ReactNative.Core
{
    using ReactNative.Bridge;

    /// <summary>
    /// This class is managing instances of {@link CatalystInstance}. It expose a way to configure
    /// catalyst instance using {@link ReactPackage} and keeps track of the lifecycle of that
    /// instance.It also sets up connection between the instance and developers support functionality
    /// of the framework.
    ///
    /// An instance of this manager is required to start JS application in { @link ReactRootView} (see
    /// {@link ReactRootView#startReactApplication} for more info).
    ///
    /// The lifecycle of the instance of {@link ReactInstanceManager} should be bound to the activity
    /// that owns the { @link ReactRootView } that is used to render react application using this
    /// instance manager (see {@link ReactRootView#startReactApplication}). It's required to pass
    /// owning activity's lifecycle events to the instance manager (see {@link #onPause},
    /// {@link #onDestroy} and {@link #onResume}).
    /// </summary>
    public abstract class ReactInstanceManager
    {
        public interface ReactInstanceEventListener
        {
            /**
             * Called when the react context is initialized (all modules registered). Always called on the
             * UI thread.
             */
            void onReactContextInitialized(ReactContext context);
        }

        /// <summary>
        /// Trigger react context initialization asynchronously in a background async task.
        /// </summary>
        public abstract void createReactContextInBackground();

        /// <summary>
        /// return whether createReactContextInBackground has been called
        /// </summary>
        /// <returns></returns>
        public abstract bool hasStartedCreatingInitialContext();

        public abstract void onBackPressed();
        public abstract void onPause();

        public abstract void onResume(DefaultHardwareBackBtnHandler defaultBackButtonImpl);

        public abstract void onDestroy();
        
        /// <summary>
        /// Gets the URL where the last bundle was loaded from.
        /// </summary>
        /// <returns>URL where the last bundle was loaded from.</returns>
        public abstract string getSourceUrl();

        /// <summary>
        /// Attach given {@param rootView} to a catalyst instance manager and start JS application
        /// </summary>
        /// <param name="rootView"></param>
        public abstract void attachMeasuredRootView(ReactRootView rootView);

        /// <summary>
        /// Detach given rootView from current catalyst instance. 
        /// </summary>
        /// <param name="rootView"></param>
        public abstract void detachRootView(ReactRootView rootView);
    }
}
    