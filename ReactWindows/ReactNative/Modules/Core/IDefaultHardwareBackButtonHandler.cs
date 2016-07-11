namespace ReactNative.Modules.Core
{
    /// <summary>
    /// Interface used by <see cref="DeviceEventManagerModule"/> to delegate 
    /// hardware back button events. It is suppose to provide a default
    /// behavior since it would be triggered in the case when the JavaScript
    /// side does not want to handle back press events.
    /// </summary>
    public interface IDefaultHardwareBackButtonHandler
    {
        /// <summary>
        /// By default, all back press calls should not execute the default
        /// backpress handler and should instead propagate it to the JavaScript
        /// instance. If JavaScript doesn't want to handle the back press 
        /// itself, it shall call back into native to invoke this function,
        /// which should execute the default handler.
        /// </summary>
        void InvokeDefaultOnBackPressed();
    }
}
