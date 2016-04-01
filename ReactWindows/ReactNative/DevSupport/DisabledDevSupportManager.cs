using Newtonsoft.Json.Linq;
using System;
using System.Runtime.ExceptionServices;
using Windows.ApplicationModel.Core;
using Windows.UI.Core;

namespace ReactNative.DevSupport
{
    class DisabledDevSupportManager : IDevSupportManager
    {
        public string CachedJavaScriptBundleFile
        {
            get
            {
                return null;
            }
        }

        public bool IsEnabled
        {
            get;
            set;
        }

        public string SourceMapUrl
        {
            get
            {
                return null;
            }
        }

        public string SourceUrl
        {
            get
            {
                return null;
            }
        }

        public string JavaScriptBundleUrlForRemoteDebugging
        {
            get
            {
                return null;
            }
        }

        public async void HandleException(Exception exception)
        {
            await CoreApplication.MainView.CoreWindow.Dispatcher.RunAsync(CoreDispatcherPriority.High, () =>
            {
                ExceptionDispatchInfo.Capture(exception).Throw();
            });
        }

        public void HandleReloadJavaScript()
        {
        }

        public void HideRedboxDialog()
        {
        }

        public void ReloadSettings()
        {
        }

        public void ShowDevOptionsDialog()
        {
        }

        public void ShowNewJavaScriptError(string title, JArray details, int exceptionId)
        {
        }

        public void ShowNewNativeError(string message, Exception ex)
        {
        }

        public void UpdateJavaScriptError(string title, JArray details, int exceptionId)
        {
        }
    }
}
