using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Common;
using ReactNative.Modules.Core;
using ReactNative.Tracing;
using System;
using System.IO;
using System.Reactive.Disposables;
using System.Runtime.ExceptionServices;
using System.Threading;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Storage;

namespace ReactNative.DevSupport
{
    class DevSupportManager : IDevSupportManager
    {
        private const int NativeErrorCookie = -1;
        private const string JSBundleFileName = "ReactNativeDevBundle.js";

        private readonly ShakeAccelerometer _accelerometer = ShakeAccelerometer.GetDefault();
        private readonly SerialDisposable _pollingDisposable = new SerialDisposable();

        private readonly IReactInstanceDevCommandsHandler _reactInstanceCommandsHandler;
        private readonly string _jsBundleFile;
        private readonly string _jsAppBundleName;
        private readonly DevInternalSettings _devSettings;
        private readonly DevServerHelper _devServerHelper;

        private bool _isDevSupportEnabled = true;
        private bool _isShakeDetectorRegistered;

        private RedBoxDialog _redBoxDialog;
        private Action _dismissRedBoxDialog;
        private bool _redBoxDialogOpen;
        private DevOptionDialog _devOptionDialog;

        public DevSupportManager(
            IReactInstanceDevCommandsHandler reactInstanceCommandsHandler,
            string jsBundleFile,
            string jsAppBundleName)
        {
            _reactInstanceCommandsHandler = reactInstanceCommandsHandler;
            _jsBundleFile = jsBundleFile;
            _jsAppBundleName = jsAppBundleName;
            _devSettings = new DevInternalSettings(this);
            _devServerHelper = new DevServerHelper(_devSettings);
            ReloadSettings();
        }

        public string CachedJavaScriptBundleFile
        {
            get
            {
                return JSBundleFileName;
            }
        }

        public bool IsEnabled
        {
            get
            {
                return _isDevSupportEnabled;
            }
            set
            {
                _isDevSupportEnabled = value;
                ReloadSettings();
            }
        }

        public string SourceMapUrl
        {
            get
            {
                if (_jsAppBundleName == null)
                {
                    return "";
                }

                return _devServerHelper.GetSourceMapUrl(_jsAppBundleName);
            }
        }

        public string SourceUrl
        {
            get
            {
                if (_jsAppBundleName == null)
                {
                    return "";
                }

                return _devServerHelper.GetSourceUrl(_jsAppBundleName);
            }
        }

        public void HandleException(Exception exception)
        {
#if DEBUG
            if (System.Diagnostics.Debugger.IsAttached) System.Diagnostics.Debugger.Break();
#endif

            if (IsEnabled)
            {
                var javaScriptException = exception as JavaScriptException;
                if (javaScriptException != null)
                {
                    var stackTrace = StackTraceHelper.ConvertChakraStackTrace(javaScriptException.StackTrace);
                    ShowNewError(exception.Message, stackTrace, NativeErrorCookie);
                }
                else
                {
                    Tracer.Write(ReactConstants.Tag, "Exception in native call from JavaScript. Error: " + exception);
                    ShowNewNativeError(exception.Message, exception);
                }
            }
            else
            {
                ExceptionDispatchInfo.Capture(exception).Throw();
            }
        }

        public async void HandleReloadJavaScript()
        {
            DispatcherHelpers.AssertOnDispatcher();

            HideRedboxDialog();

            var progressDialog = new ProgressDialog("Please wait...", "Fetching JavaScript bundle.");
            var dialogOperation = progressDialog.ShowAsync();

            if (_jsBundleFile == null)
            {
                await ReloadJavaScriptFromServerAsync(dialogOperation.Cancel, progressDialog.Token);
            }
            else
            {
                await ReloadJavaScriptFromFileAsync(progressDialog.Token);
                dialogOperation.Cancel();
            }
        }

        public void HideRedboxDialog()
        {
            var dismissRedBoxDialog = _dismissRedBoxDialog;
            if (_redBoxDialogOpen && dismissRedBoxDialog != null)
            {
                dismissRedBoxDialog();
            }
        }

        public void ReloadSettings()
        {
            if (_isDevSupportEnabled)
            {
                RegisterDevOptionsMenuTriggers();
                if (_devSettings.IsJavaScriptDevModeEnabled)
                {
                    _pollingDisposable.Disposable =
                        _devServerHelper.StartPollingOnChangeEndpoint(HandleReloadJavaScript);
                }
                else
                {
                    // Disposes any existing poller
                    _pollingDisposable.Disposable = Disposable.Empty;
                }
            }
            else
            {
                UnregisterDevOptionsMenuTriggers();
                _pollingDisposable.Disposable = Disposable.Empty;
            }
        }

        public void ShowDevOptionsDialog()
        {
            DispatcherHelpers.RunOnDispatcher(() =>
            {
                if (_devOptionDialog != null || !IsEnabled)
                {
                    return;
                }

                _devOptionDialog = new DevOptionDialog();
                _devOptionDialog.Closed += (_, __) =>
                {
                    _devOptionDialog = null;
                };

                var liveReloadEnabled = _devSettings.IsReloadOnJavaScriptChangeEnabled;
                var liveReloadSettingName = liveReloadEnabled
                    ? "Disable Live Reload"
                    : "Enable Live Reload";

                var options = new[]
                {
                    new DevOptionHandler("Reload JavaScript", HandleReloadJavaScript),
                    new DevOptionHandler(liveReloadSettingName, () => 
                        _devSettings.IsReloadOnJavaScriptChangeEnabled = !liveReloadEnabled),
                };

                foreach (var option in options)
                {
                    _devOptionDialog.Add(option.Name, option.OnSelect);
                }

                var asyncInfo = _devOptionDialog.ShowAsync();

                foreach (var option in options)
                {
                    option.AsyncInfo = asyncInfo;
                }
            });
        }

        public void ShowNewJavaScriptError(string title, JArray details, int exceptionId)
        {
            ShowNewError(title, StackTraceHelper.ConvertJavaScriptStackTrace(details), exceptionId);
        }

        public void ShowNewNativeError(string message, Exception exception)
        {
            ShowNewError(message, StackTraceHelper.ConvertNativeStackTrace(exception), NativeErrorCookie);
        }

        public void UpdateJavaScriptError(string title, JArray details, int errorCookie)
        {
            DispatcherHelpers.RunOnDispatcher(() =>
            {
                if (_redBoxDialog == null
                    || !_redBoxDialogOpen
                    || errorCookie != _redBoxDialog.ErrorCookie)
                {
                    return;
                }

                _redBoxDialog.Title = title;
                _redBoxDialog.StackTrace = StackTraceHelper.ConvertJavaScriptStackTrace(details);
            });
        }

        private void ShowNewError(string title, IStackFrame[] stack, int errorCookie)
        {
            DispatcherHelpers.RunOnDispatcher(() =>
            {
                if (_redBoxDialog == null)
                {
                    _redBoxDialog = new RedBoxDialog();
                }

                if (_redBoxDialogOpen)
                {
                    return;
                }

                _redBoxDialogOpen = true;
                _redBoxDialog.ErrorCookie = errorCookie;
                _redBoxDialog.Title = title;
                _redBoxDialog.StackTrace = stack;
                _redBoxDialog.Closed += (_, __) =>
                {
                    _redBoxDialogOpen = false;
                    _dismissRedBoxDialog = null;
                    _redBoxDialog = null;
                };

                var asyncInfo = _redBoxDialog.ShowAsync();
                _dismissRedBoxDialog = asyncInfo.Cancel;
            });
        }

        private async Task ReloadJavaScriptFromServerAsync(Action dismissProgress, CancellationToken token)
        {
            var localFolder = ApplicationData.Current.LocalFolder;
            var localFile = await localFolder.CreateFileAsync(JSBundleFileName, CreationCollisionOption.ReplaceExisting);
            using (var stream = await localFile.OpenStreamForWriteAsync())
            {
                try
                {
                    await _devServerHelper.DownloadBundleFromUrlAsync(_jsAppBundleName, stream, token);
                    dismissProgress();
                    DispatcherHelpers.RunOnDispatcher(_reactInstanceCommandsHandler.OnJavaScriptBundleLoadedFromServer);
                }
                catch (DebugServerException ex)
                {
                    dismissProgress();
                    ShowNewNativeError(ex.Message, ex);
                }
                catch (Exception ex)
                {
                    dismissProgress();
                    ShowNewNativeError(
                        "Unable to download JS bundle. Did you forget to " +
                        "start the development server or connect your device?",
                        ex);
                }
            }
        }

        private Task ReloadJavaScriptFromFileAsync(CancellationToken token)
        {
            _reactInstanceCommandsHandler.OnBundleFileReloadRequest();
            return Task.FromResult(true);
        }

        private void RegisterDevOptionsMenuTriggers()
        {
            if (!_isShakeDetectorRegistered && _accelerometer != null)
            {
                _isShakeDetectorRegistered = true;
                _accelerometer.Shaken += OnAccelerometerShake;
            }
        }

        private void UnregisterDevOptionsMenuTriggers()
        {
            if (_isShakeDetectorRegistered && _accelerometer != null)
            {
                _accelerometer.Shaken -= OnAccelerometerShake;
                _isShakeDetectorRegistered = false;
            }
        }

        private void OnAccelerometerShake(object sender, EventArgs args)
        {
            ShowDevOptionsDialog();
        }

        class DevOptionHandler
        {
            private readonly Action _onSelect;

            public DevOptionHandler(string name, Action onSelect)
            {
                Name = name;
                _onSelect = onSelect;
            }

            public string Name { get; }

            public IAsyncInfo AsyncInfo { get; set; }

            public void OnSelect()
            {
                var asyncInfo = AsyncInfo;
                if (asyncInfo != null)
                {
                    asyncInfo.Cancel();
                }

                _onSelect();
            }
        }
    }
}
