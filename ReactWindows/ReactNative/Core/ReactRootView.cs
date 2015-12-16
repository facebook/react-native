
namespace ReactNative.Core
{
    using Newtonsoft.Json.Linq;
    using ReactNative.UIManager;
    using System;

    /// <summary>
    /// Default root view for catalyst apps. Provides the ability to listen for size changes so that a UI manager can re-layout its elements
    /// </summary>
    public class ReactRootView : SizeMonitoringFrameLayout, RootView
    {
        private ReactInstanceManager mReactInstanceManager;
        private string mJSModuleName;
        private bool mIsAttachedToWindow = false;
        private bool mIsAttachedToInstance = false;

        public void startReactApplication(ReactInstanceManager reactInstanceManager, string moduleName)
        {
            //TODO: Add thread queue impl hook
            //UiThreadUtil.assertOnUiThread();

            mReactInstanceManager = reactInstanceManager;
            mJSModuleName = moduleName;

            if (!mReactInstanceManager.hasStartedCreatingInitialContext())
            {
                mReactInstanceManager.createReactContextInBackground();
            }
        }

        //TODO: Implement this method for emitting events
        private void sendEvent(string eventName, JArray parameters)
        {
            throw new NotImplementedException();

            if (mReactInstanceManager != null)
            {
               // mReactInstanceManager.getCurrentReactContext()
               //     .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            //.emit(eventName, params);
            }
        }
    }
}
