using System.Threading;
using Windows.Storage;

namespace ReactNative.DevSupport
{
    class DevInternalSettings
    {
        private const string JSDevModeDebugKey = "js_dev_mode_debug";
        private const string DebugServerHostKey = "debug_http_host";
        private const string ReloadOnJSChangeKey = "reload_on_js_change";
        private const string HotModuleReplacementKey = "hot_module_replacement";

        private readonly IDevSupportManager _debugManager;

        public DevInternalSettings(IDevSupportManager debugManager)
        {
            _debugManager = debugManager;
        }

        public bool IsJavaScriptDevModeEnabled
        {
            get
            {
#if DEBUG
                return GetSetting(JSDevModeDebugKey, true);
#else
                return GetSetting(JSDevModeDebugKey, false);
#endif
            }
            set
            {
                SetSetting(JSDevModeDebugKey, value);
            }
        }

        public string DebugServerHost
        {
            get
            {
                return GetSetting(DebugServerHostKey, default(string));
            }
            set
            {
                SetSetting(DebugServerHostKey, value);
            }
        }

        public bool IsHotModuleReplacementEnabled
        {
            get
            {
                return GetSetting(HotModuleReplacementKey, false);
            }
            set
            {
                SetSetting(HotModuleReplacementKey, value);
            }
        }

        public bool IsReloadOnJavaScriptChangeEnabled
        {
            get
            {
                return GetSetting(ReloadOnJSChangeKey, false);
            }
            set
            {
                SetSetting(ReloadOnJSChangeKey, value);
            }
        }

        private T GetSetting<T>(string key, T defaultValue)
        {
            var values = ApplicationData.Current.LocalSettings.Values;
            if (values.ContainsKey(key))
            {
                var data = values[key];
                if (data is T)
                {
                    return (T)data;
                }
            }

            return defaultValue;
        }

        private void SetSetting<T>(string key, T value)
        {
            var values = ApplicationData.Current.LocalSettings.Values;
            values[key] = value;
            _debugManager.ReloadSettings();
        }
    }
}
