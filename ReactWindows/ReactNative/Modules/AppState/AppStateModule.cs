using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Modules.Core;

namespace ReactNative.Modules.AppState
{
    /// <summary>
    /// Native module for monitoring the state of the application.
    /// </summary>
    public class AppStateModule : ReactContextNativeModuleBase, ILifecycleEventListener
    {
        private const string AppStateActive = "active";
        private const string AppStateBackground = "background";

        private string _appState = "uninitialized";

        /// <summary>
        /// Instantiates the <see cref="AppStateModule"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        public AppStateModule(ReactContext reactContext)
            : base(reactContext)
        {
        }

        /// <summary>
        /// The name of the module.
        /// </summary>
        public override string Name
        {
            get
            {
                return "AppState";
            }
        }

        /// <summary>
        /// Initializes the module.
        /// </summary>
        public override void Initialize()
        {
            Context.AddLifecycleEventListener(this);
        }

        /// <summary>
        /// Called when the application host suspends.
        /// </summary>
        public void OnSuspend()
        {
            _appState = AppStateBackground;
            SendAppStateChangeEvent();
        }

        /// <summary>
        /// Called when the application host resumes.
        /// </summary>
        public void OnResume()
        {
            _appState = AppStateActive;
            SendAppStateChangeEvent();
        }

        /// <summary>
        /// Called when the application host is shutdown.
        /// </summary>
        public void OnDestroy()
        {
        }

        /// <summary>
        /// Native method to retrieve the current application state.
        /// </summary>
        /// <param name="success">The success callback.</param>
        /// <param name="error">The error callback.</param>
        [ReactMethod]
        public void getCurrentAppState(ICallback success, ICallback error)
        {
            success.Invoke(CreateAppStateEventMap());
        }

        private JObject CreateAppStateEventMap()
        {
            return new JObject
            {
                { "app_state", _appState },
            };
        }

        private void SendAppStateChangeEvent()
        {
            Context.GetJavaScriptModule<RCTDeviceEventEmitter>()
                .emit("appStateDidChange", CreateAppStateEventMap());
        }
    }
}
