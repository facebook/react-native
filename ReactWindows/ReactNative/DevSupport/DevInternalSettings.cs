using ReactNative.Modules.DevSupport;
using System.Collections.Generic;
using Windows.Storage;

namespace ReactNative.DevSupport
{
    class DevInternalSettings : IDeveloperSettings
    {
        private const string FpsDebugKey = "fps_debug";
        private const string DebugServerHostKey = "debug_http_host";
        private const string JsDevModeDebugKey = "js_dev_mode_debug";
        private const string AnimationsDebugKey = "animations_debug";
        private const string JsMinifyDebugKey = "js_minify_debug";
        private const string ElementInspectorKey = "inspector_debug";
        private const string ReloadOnJSChangeKey = "reload_on_js_change";
        private const string HotModuleReplacementKey = "hot_module_replacement";

        private static readonly HashSet<string> s_triggerReload = new HashSet<string>
        {
            FpsDebugKey,
            ReloadOnJSChangeKey,
            JsDevModeDebugKey,
            JsMinifyDebugKey,
        };

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
                return GetSetting(JsDevModeDebugKey, true);
#else
                return GetSetting(JSDevModeDebugKey, false);
#endif
            }
            set
            {
                SetSetting(JsDevModeDebugKey, value);
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

        public bool IsAnimationFpsDebugEnabled
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

        public bool IsElementInspectorEnabled
        {
            get
            {
                return GetSetting(ElementInspectorKey, false);
            }
            set
            {
                SetSetting(ElementInspectorKey, value);
            }
        }

        public bool IsFpsDebugEnabled
        {
            get
            {
                return GetSetting(FpsDebugKey, false);
            }
            set
            {
                SetSetting(FpsDebugKey, value);
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

        public bool IsJavaScriptMinifyEnabled
        {
            get
            {
                return GetSetting(JsMinifyDebugKey, false);
            }
            set
            {
                SetSetting(JsMinifyDebugKey, value);
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

            if (s_triggerReload.Contains(key))
            {
                _debugManager.ReloadSettings();
            }
        }
    }
}
