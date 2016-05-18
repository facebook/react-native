using ReactNative.Bridge;
using System;

namespace ReactNative.DevSupport
{
    /// <summary>
    /// Interface used by <see cref="IDevSupportManager"/> for requesting React
    /// instance regeneration based on the option that the user selects in the
    /// developer options menu.
    /// </summary>
    public interface IReactInstanceDevCommandsHandler
    {
        /// <summary>
        /// Action to notify the <see cref="IReactInstanceManager"/> about the
        /// availability of a new JavaScript bundle downloaded from the server.
        /// </summary>
        void OnJavaScriptBundleLoadedFromServer();

        /// <summary>
        /// Action triggered when the user requests that the application be
        /// reloaded from the initially specified bundle file.
        /// </summary>
        void OnBundleFileReloadRequest();

        /// <summary>
        /// Action triggered when the user requests that the application be
        /// reloaded from the JavaScript debugger.
        /// </summary>
        /// <param name="javaScriptExecutorFactory">
        /// The JavaScript executor factory.
        /// </param>
        void OnReloadWithJavaScriptDebugger(Func<IJavaScriptExecutor> javaScriptExecutorFactory);

        /// <summary>
        /// Toggles the element inspector.
        /// </summary>
        void ToggleElementInspector();
    }
}
