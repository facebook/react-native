using Newtonsoft.Json.Linq;
using System;

namespace ReactNative.DevSupport
{
    class DisabledDevSupportManager : IDevSupportManager
    {
        public bool IsEnabled
        {
            get;
            set;
        }

        public string SourceUrl
        {
            get
            {
                return null;
            }
        }

        public string SourceMapUrl
        {
            get
            {
                return null;
            }
        }

        public string CachedJavaScriptBundle
        {
            get
            {
                return null;
            }
        }

        public void HandleException(Exception exception)
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
