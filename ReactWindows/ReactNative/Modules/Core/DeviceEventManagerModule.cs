using ReactNative.Bridge;
using System;

namespace ReactNative.Modules.Core
{
    /// <summary>
    /// Native module that handles device hardware events like hardware back presses.
    /// </summary>
    public class DeviceEventManagerModule : ReactContextNativeModuleBase
    {
        private readonly Action _invokeDefaultBackPressAction;

        /// <summary>
        /// Instantiates the <see cref="DeviceEventManagerModule"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="backButtonHandler">The back button handler.</param>
        public DeviceEventManagerModule(
            ReactApplicationContext reactContext,
            IDefaultHardwareBackButtonHandler backButtonHandler)
          : base(reactContext)
        {
            _invokeDefaultBackPressAction = () =>
            {
                DispatcherHelpers.AssertOnDispatcher();
                backButtonHandler.InvokeDefaultOnBackPressed();
            };
        }

        /// <summary>
        /// The name of the module.
        /// </summary>
        /// <remarks>
        /// This will be the name used to <code>require()</code> this module
        /// from JavaScript.
        /// </remarks>
        public override string Name
        {
            get
            {
                return "DeviceEventManager";
            }
        }

        /// <summary>
        /// Sends an event to the JavaScript instance that the hardware back
        /// has been pressed.
        /// </summary>
        public void EmitHardwareBackPressed()
        {
            Context.GetJavaScriptModule<RCTDeviceEventEmitter>()
                .emit("hardwareBackPress", null);
        }

        /// <summary>
        /// Invokes the default back handler for the host of this catalyst 
        /// instance. This should be invoked if JavaScript does not want to
        /// handle the back press itself.
        /// </summary>
        [ReactMethod]
        public void invokeDefaultBackPressHandler()
        {
            Context.RunOnDispatcherQueueThread(_invokeDefaultBackPressAction);
        }
    }
}


