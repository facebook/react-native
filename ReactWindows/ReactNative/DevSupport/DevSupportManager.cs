using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Common;
using ReactNative.Tracing;
using System;
using System.Runtime.ExceptionServices;
using Windows.Foundation;

namespace ReactNative.DevSupport
{
    class DevSupportManager : IDevSupportManager
    {
        private const int NativeErrorCookie = -1;

        private readonly string _jsAppBundleName;
        private readonly ShakeAccelerometer _accelerometer;

        private RedBoxDialog _redBoxDialog;
        private bool _redBoxDialogOpen;
        private DevOptionDialog _devOptionDialog;

        public DevSupportManager(string jsAppBundleName)
        {
            _jsAppBundleName = jsAppBundleName;

            _accelerometer = ShakeAccelerometer.GetDefault();
            if (_accelerometer != null)
            {
                _accelerometer.Shaken += (sender, args) =>
                {
                    ShowDevOptionsDialog();
                };
            }
        }

        public bool IsEnabled { get; set; } = true;

        public string SourceMapUrl
        {
            get
            {
                if (_jsAppBundleName == null)
                {
                    return "";
                }

                // TODO: use dev server helpers
                throw new NotImplementedException();
            }
        }

        public void HandleException(Exception exception)
        {
#if DEBUG
            if (System.Diagnostics.Debugger.IsAttached) System.Diagnostics.Debugger.Break();
#endif

            if (IsEnabled)
            {
                Tracer.Write(ReactConstants.Tag, "Exception in native call from JavaScript. Error: " + exception);
                ShowNewNativeError(exception.Message, exception);
            }
            else
            {
                ExceptionDispatchInfo.Capture(exception).Throw();
            }
        }

        public void HandleReloadJavaScript()
        {
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

                var options = new[]
                {
                    new DevOptionHandler("Reload JavaScript", HandleReloadJavaScript),
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
            DispatcherHelpers.RunOnDispatcher(async () =>
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
                    _redBoxDialog = null;
                };

                await _redBoxDialog.ShowAsync();
            });
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
                _onSelect();
                var asyncInfo = AsyncInfo;
                if (asyncInfo != null)
                {
                    asyncInfo.Cancel();
                }
            }
        }
    }
}
