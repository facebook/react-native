using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Modules.DevSupport;
using System;
using System.Runtime.ExceptionServices;
using System.Threading.Tasks;
using Windows.ApplicationModel.Core;
using Windows.UI.Core;

namespace ReactNative.DevSupport
{
    class DisabledDevSupportManager : IDevSupportManager
    {
        public IDeveloperSettings DevSettings
        {
            get
            {
                return null;
            }
        }

        public string DownloadedJavaScriptBundleFile
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

        public Task<bool> IsPackagerRunningAsync()
        {
            return Task.FromResult(false);
        }

        public void OnNewReactContextCreated(ReactContext context)
        {
        }

        public void OnReactContextDestroyed(ReactContext context)
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
