using ReactNative.Bridge;
using ReactNative.UIManager;
using System;
using Windows.Foundation.Metadata;
using Windows.Security.ExchangeActiveSyncProvisioning;
using Windows.UI;
using Windows.UI.Core;

namespace ReactNative.Modules.StatusBar
{
    /// <summary>
    /// A module that allows JS to set statusbar properties.
    /// </summary>
    class StatusBarModule : NativeModuleBase
    {
        private bool _hidden;
        private bool _translucent;
        private Color? _color;

        /// <summary>
        /// Instantiates the <see cref="StatusBarModule"/>.
        /// </summary>
        internal StatusBarModule()
        {
            //Mobile customization
            if (ApiInformation.IsTypePresent("Windows.UI.ViewManagement.StatusBar"))
            {
                var statusBar = Windows.UI.ViewManagement.StatusBar.GetForCurrentView();
                if (statusBar != null)
                {
                    _color = statusBar.BackgroundColor;
                    _translucent = statusBar.BackgroundOpacity == 1 ? false : true;
                }
            }

            //PC customization
            else if (!DeviceInfo.IsRunningOnEmulator && ApiInformation.IsTypePresent("Windows.UI.ViewManagement.ApplicationView"))
            {
                var titleBar = Windows.UI.ViewManagement.ApplicationView.GetForCurrentView().TitleBar;
                if (titleBar != null)
                {
                    _color = titleBar.BackgroundColor;
                }
            }
        }

        /// <summary>
        /// The name of the native module.
        /// </summary>
        public override string Name
        {
            get
            {
                return "StatusBarManager";
            }
        }

        /// <summary>
        /// Hide or show statusbar.
        /// </summary>
        /// <param name="hide">Hide or show statusbar.</param>
        [ReactMethod]
        public void setHidden(bool hide)
        {
            _hidden = hide;

            SetProperties(_hidden, _translucent, _color);
        }

        /// <summary>
        /// Set statusbar background color.
        /// </summary>
        /// <param name="color">RGB color.</param>
        [ReactMethod]
        public void setColor(uint? color)
        {
            if (color.HasValue)
            {
                _color = ColorHelpers.Parse(color.Value);

                SetProperties(_hidden, _translucent, _color);
            }
        }

        /// <summary>
        /// Set statusbar opacity.
        /// </summary>
        /// <param name="translucent">Is statusbar translucent.</param>
        [ReactMethod]
        public void setTranslucent(bool translucent)
        {
            _translucent = translucent;

            SetProperties(_hidden, _translucent, _color);
        }

        /// <summary>
        /// Update statusbar properties.
        /// </summary>
        /// <param name="hidden">Is statusbar hidden.</param>
        /// <param name="translucent">Is statusbar translucent.</param>
        /// <param name="color">Background color.</param>
        private void SetProperties(bool hidden, bool translucent, Color? color)
        {
            RunOnDispatcher(async () =>
            {
                try
                {
                    //Mobile customization
                    if (ApiInformation.IsTypePresent("Windows.UI.ViewManagement.StatusBar"))
                    {
                        var statusBar = Windows.UI.ViewManagement.StatusBar.GetForCurrentView();
                        if (statusBar != null)
                        {
                            statusBar.BackgroundOpacity = _translucent ? 0.5 : 1;
                            statusBar.BackgroundColor = color;
                            if (hidden)
                            {
                                await statusBar.HideAsync();
                            }
                            else
                            {
                                await statusBar.ShowAsync();
                            }
                        }
                    }

                    //PC customization
                    else if (!DeviceInfo.IsRunningOnEmulator && ApiInformation.IsTypePresent("Windows.UI.ViewManagement.ApplicationView"))
                    {
                        var titleBar = Windows.UI.ViewManagement.ApplicationView.GetForCurrentView().TitleBar;
                        if (titleBar != null)
                        {
                            titleBar.BackgroundColor = color;
                        }
                    }        
                }
                catch (Exception)
                {

                }
            });
        }

        /// <summary>
        /// Run action on UI thread.
        /// </summary>
        /// <param name="action">The action.</param>
        private static async void RunOnDispatcher(DispatchedHandler action)
        {
            await Windows.ApplicationModel.Core.CoreApplication.MainView.CoreWindow.Dispatcher.RunAsync(CoreDispatcherPriority.Normal, action);
        }

        private static class DeviceInfo
        {
            private static EasClientDeviceInformation deviceInfo = new EasClientDeviceInformation();

            public static bool IsRunningOnEmulator
            {
                get
                {
                    return (deviceInfo.SystemProductName == "Virtual");
                }
            }
        }
    }
}
