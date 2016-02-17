using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Common;
using ReactNative.DevSupport;
using ReactNative.Tracing;
using System;

namespace ReactNative.Modules.Core
{
    /// <summary>
    /// Native module for managing exceptions from the JavaScript runtime.
    /// </summary>
    public class ExceptionsManagerModule : NativeModuleBase
    {
        private readonly IDevSupportManager _devSupportManager;

        /// <summary>
        /// Instantiates the <see cref="ExceptionsManagerModule"/>.
        /// </summary>
        /// <param name="devSupportManager">
        /// The developer support manager instance.
        /// </param>
        public ExceptionsManagerModule(IDevSupportManager devSupportManager)
        {
            _devSupportManager = devSupportManager;
        }

        /// <summary>
        /// The name of the module.
        /// </summary>
        public override string Name
        {
            get
            {
                return "ExceptionsManager";
            }
        }

        /// <summary>
        /// Report a fatal exception from JavaScript.
        /// </summary>
        /// <param name="title">The exception message.</param>
        /// <param name="details">The exception stack trace.</param>
        /// <param name="exceptionId">An identifier for the exception.</param>
        /// <remarks>
        /// Will either trigger a red box dialog or a runtime exception.
        /// </remarks>
        [ReactMethod]
        public void reportFatalException(string title, JArray details, int exceptionId)
        {
            ShowOrThrowError(title, details, exceptionId);
        }

        /// <summary>
        /// Reports a non-fatal exception from JavaScript.
        /// </summary>
        /// <param name="title">The exception message.</param>
        /// <param name="details">The exception stack trace.</param>
        /// <param name="exceptionId">An identifier for the exception.</param>
        /// <remarks>
        /// Should not trigger a red box dialog or runtime exception.
        /// </remarks>
        [ReactMethod]
        public void reportSoftException(string title, JArray details, int exceptionId)
        {
            var stackTrace = StackTraceHelper.ConvertJavaScriptStackTrace(details);
            Tracer.Write(ReactConstants.Tag, title + Environment.NewLine + stackTrace.PrettyPrint());
        }

        /// <summary>
        /// Updates the exception details for a JavaScript error with the given
        /// exception identifier.
        /// </summary>
        /// <param name="title">The exception message.</param>
        /// <param name="details">The exception stack trace.</param>
        /// <param name="exceptionId">An identifier for the exception.</param>
        [ReactMethod]
        public void updateExceptionMessage(string title, JArray details, int exceptionId)
        {
            if (_devSupportManager.IsEnabled)
            {
                _devSupportManager.UpdateJavaScriptError(title, details, exceptionId);
            }
        }

        [ReactMethod]
        public void dismissRedbox()
        {
            if (_devSupportManager.IsEnabled)
            {
                _devSupportManager.HideRedboxDialog();
            }
        }

        private void ShowOrThrowError(string title, JArray details, int exceptionId)
        {
            if (_devSupportManager.IsEnabled)
            {
                _devSupportManager.ShowNewJavaScriptError(title, details, exceptionId);
            }
            else
            {
                var stackTrace = StackTraceHelper.ConvertJavaScriptStackTrace(details);
                throw new JavaScriptException(title, stackTrace.PrettyPrint());
            }
        }

        private static int GetInt(JObject map, string propertyName, int defaultValue)
        {
            var value = default(JToken);
            if (map.TryGetValue(propertyName, out value) && value.Type == JTokenType.Integer)
            {
                return value.Value<int>();
            }

            return defaultValue;
        }
    }
}
