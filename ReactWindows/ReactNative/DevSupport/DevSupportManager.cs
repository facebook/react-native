using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Common;
using ReactNative.Modules.Core;
using ReactNative.Modules.DevSupport;
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
        private bool _isUsingJsProxy;

        private ReactContext _currentContext;
        private RedBoxDialog _redBoxDialog;
        private Action _dismissRedBoxDialog;
        private bool _redBoxDialogOpen;
        private DevOptionDialog _devOptionsDialog;

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

        public IDeveloperSettings DevSettings
        {
            get
            {
                return _devSettings;
            }
        }

        public string DownloadedJavaScriptBundleFile
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

        public string JavaScriptBundleUrlForRemoteDebugging
        {
            get
            {
                return _devServerHelper.GetJavaScriptBundleUrlForRemoteDebugging(_jsAppBundleName);
            }
        }

        public void HandleException(Exception exception)
        {
#if DEBUG
            if (System.Diagnostics.Debugger.IsAttached) System.Diagnostics.Debugger.Break();
#endif

            if (IsEnabled)
            {
                ShowNewNativeError(exception.Message, exception);
            }
            else
            {
                ExceptionDispatchInfo.Capture(exception).Throw();
            }
        }

        public void ShowNewNativeError(string message, Exception exception)
        {
            var javaScriptException = exception as JavaScriptException;
            if (javaScriptException != null && javaScriptException.JavaScriptStackTrace != null)
            {
                var stackTrace = StackTraceHelper.ConvertChakraStackTrace(javaScriptException.JavaScriptStackTrace);
                ShowNewError(exception.Message, stackTrace, NativeErrorCookie);
            }
            else
            {
                Tracer.Error(ReactConstants.Tag, "Exception in native call from JavaScript.", exception);
                ShowNewError(message, StackTraceHelper.ConvertNativeStackTrace(exception), NativeErrorCookie);
            }
        }

        public void ShowNewJavaScriptError(string title, JArray details, int errorCookie)
        {
            ShowNewError(title, StackTraceHelper.ConvertJavaScriptStackTrace(details), errorCookie);
        }

        public void UpdateJavaScriptError(string message, JArray details, int errorCookie)
        {
            DispatcherHelpers.RunOnDispatcher(() =>
            {
                if (_redBoxDialog == null
                    || !_redBoxDialogOpen
                    || errorCookie != _redBoxDialog.ErrorCookie)
                {
                    return;
                }

                _redBoxDialog.Message = message;
                _redBoxDialog.StackTrace = StackTraceHelper.ConvertJavaScriptStackTrace(details);
            });
        }

        public void HideRedboxDialog()
        {
            var dismissRedBoxDialog = _dismissRedBoxDialog;
            if (_redBoxDialogOpen && dismissRedBoxDialog != null)
            {
                dismissRedBoxDialog();
            }
        }

        public void ShowDevOptionsDialog()
        {
            if (_devOptionsDialog != null || !IsEnabled)
            {
                return;
            }

            DispatcherHelpers.RunOnDispatcher(() =>
            {
                var options = new[]
                {
                    new DevOptionHandler(
                        "Reload JavaScript",
                        HandleReloadJavaScript),
                    new DevOptionHandler(
                        _isUsingJsProxy
                            ? "Stop JS Remote Debugging"
                            : "Start JS Remote Debugging",
                        () =>
                        {
                            _isUsingJsProxy = !_isUsingJsProxy;
                            HandleReloadJavaScript();
                        }),
                    new DevOptionHandler(
                        _devSettings.IsHotModuleReplacementEnabled
                            ? "Disable Hot Reloading"
                            : "Enable Hot Reloading",
                        () =>
                        {
                            _devSettings.IsHotModuleReplacementEnabled = !_devSettings.IsHotModuleReplacementEnabled;
                            HandleReloadJavaScript();
                        }),
                    new DevOptionHandler(
                        _devSettings.IsReloadOnJavaScriptChangeEnabled
                            ? "Disable Live Reload"
                            : "Enable Live Reload",
                        () =>
                            _devSettings.IsReloadOnJavaScriptChangeEnabled =
                                !_devSettings.IsReloadOnJavaScriptChangeEnabled),
                    new DevOptionHandler(
                        "Toggle Inspector",
                        () =>
                        {
                            _devSettings.IsElementInspectorEnabled = !_devSettings.IsElementInspectorEnabled;
                            _reactInstanceCommandsHandler.ToggleElementInspector();
                        }),
                };

                _devOptionsDialog = new DevOptionDialog();
                _devOptionsDialog.Closed += (_, __) =>
                {
                    _devOptionsDialog = null;
                };

                foreach (var option in options)
                {
                    _devOptionsDialog.Add(option.Name, option.OnSelect);
                }

                var asyncInfo = _devOptionsDialog.ShowAsync();

                foreach (var option in options)
                {
                    option.AsyncInfo = asyncInfo;
                }
            });
        }

        public void OnNewReactContextCreated(ReactContext context)
        {
            ResetCurrentContext(context);
        }

        public void OnReactContextDestroyed(ReactContext context)
        {
            if (context == _currentContext)
            {
                ResetCurrentContext(null);
            }
        }

        public Task<bool> IsPackagerRunningAsync()
        {
            return _devServerHelper.IsPackagerRunningAsync();
        }

        public async void HandleReloadJavaScript()
        {
            DispatcherHelpers.AssertOnDispatcher();

            HideRedboxDialog();

            var message = !_isUsingJsProxy 
                ? "Fetching JavaScript bundle." 
                : "Connecting to remote debugger.";

            var progressDialog = new ProgressDialog("Please wait...", message);
            var dialogOperation = progressDialog.ShowAsync();

            if (_isUsingJsProxy)
            {
                await ReloadJavaScriptInProxyMode(dialogOperation.Cancel, progressDialog.Token);
            }
            else if (_jsBundleFile == null)
            {
                await ReloadJavaScriptFromServerAsync(dialogOperation.Cancel, progressDialog.Token);
            }
            else
            {
                await ReloadJavaScriptFromFileAsync(progressDialog.Token);
                dialogOperation.Cancel();
            }
        }

        public void ReloadSettings()
        {
            if (_isDevSupportEnabled)
            {
                RegisterDevOptionsMenuTriggers();
                if (_devSettings.IsReloadOnJavaScriptChangeEnabled)
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

                if (_redBoxDialog != null)
                {
                    _dismissRedBoxDialog();
                }

                _pollingDisposable.Disposable = Disposable.Empty;
            }
        }

        private void ResetCurrentContext(ReactContext context)
        {
            if (_currentContext == context)
            {
                return;
            }

            _currentContext = context;

            if (_devSettings.IsHotModuleReplacementEnabled && context != null)
            {
                try
                {
                    var uri = new Uri(SourceUrl);
                    var path = uri.LocalPath.Substring(1); // strip initial slash in path
                    var host = uri.Host;
                    var port = uri.Port;
                    context.GetJavaScriptModule<HMRClient>().enable("windows", path, host, port);
                }
                catch (Exception ex)
                {
                    HandleException(ex);
                }
            }
        }

        private void ShowNewError(string message, IStackFrame[] stack, int errorCookie)
        {
            DispatcherHelpers.RunOnDispatcher(() =>
            {
                if (_redBoxDialog == null)
                {
                    _redBoxDialog = new RedBoxDialog(HandleReloadJavaScript);
                }

                if (_redBoxDialogOpen)
                {
                    return;
                }

                _redBoxDialogOpen = true;
                _redBoxDialog.ErrorCookie = errorCookie;
                _redBoxDialog.Message = message;
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

        private async Task ReloadJavaScriptInProxyMode(Action dismissProgress, CancellationToken token)
        {
            try
            {
                await _devServerHelper.LaunchDevToolsAsync(token);
                var executor = new WebSocketJavaScriptExecutor();
                await executor.ConnectAsync(_devServerHelper.WebsocketProxyUrl, token);
                var factory = new Func<IJavaScriptExecutor>(() => executor);
                _reactInstanceCommandsHandler.OnReloadWithJavaScriptDebugger(factory);
                dismissProgress();
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
