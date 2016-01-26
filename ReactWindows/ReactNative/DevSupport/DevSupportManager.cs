using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Common;
using ReactNative.Tracing;
using System;
using System.Runtime.ExceptionServices;

namespace ReactNative.DevSupport
{
    class DevSupportManager : IDevSupportManager
    {
        private const int NativeErrorCookie = -1;

        private readonly string _jsAppBundleName;

        private RedBoxDialog _redBoxDialog;
        private bool _redBoxDialogOpen;

        public DevSupportManager(string jsAppBundleName)
        {
            _jsAppBundleName = jsAppBundleName;
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

                _redBoxDialog.ErrorCookie = errorCookie;
                _redBoxDialog.Title = title;
                _redBoxDialog.StackTrace = stack;
                _redBoxDialog.Opened += (_, __) => _redBoxDialogOpen = true;
                _redBoxDialog.Closed += (_, __) => _redBoxDialogOpen = false;
                await _redBoxDialog.ShowAsync();
            });
        }
    }
}
