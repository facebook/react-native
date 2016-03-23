using ReactNative.Bridge;
using ReactNative.UIManager;
using System;
using Windows.Foundation.Metadata;
using Windows.UI.Core;
using Windows.ApplicationModel.Core;

namespace ReactNative.Modules.StatusBar
{
    /// <summary>
    /// A module that allows JS to set StatusBar properties.
    /// </summary>
    public class StatusBarModule : NativeModuleBase
    {
        /// <summary>
        /// Runtime platform.
        /// </summary>
        public enum PlatformType
        {
            /// <summary>
            /// Mobile.
            /// </summary>
            Mobile,
            /// <summary>
            /// Desktop.
            /// </summary>
            Desktop,
            /// <summary>
            /// Other.
            /// </summary>
            Other,
        };

        private PlatformType _platformType;
        private IStatusBar _statusBar;

        /// <summary>
        /// Instantiates the <see cref="StatusBarModule"/>.
        /// </summary>
        internal StatusBarModule() : this(DetectPlatform(), CreateDefaultStatusBar())
        {
        }

        /// <summary>
        /// Instantiates the <see cref="StatusBarModule"/>.
        /// </summary>
        internal StatusBarModule(PlatformType platformType, IStatusBar statusBar)
        {
            _platformType = platformType;
            _statusBar = statusBar;
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
        /// Hide or show StatusBar.
        /// </summary>
        /// <param name="hide">Hide or show StatusBar.</param>
        [ReactMethod]
        public void setHidden(bool hide)
        {
            if (_platformType == PlatformType.Mobile && _statusBar != null)
            {
                RunOnDispatcher(async () =>
                {
                    if (hide)
                    {
                        await _statusBar.HideAsync();
                    }
                    else
                    {
                        await _statusBar.ShowAsync();
                    }
                });
            }
        }

        /// <summary>
        /// Set StatusBar background color.
        /// </summary>
        /// <param name="color">RGB color.</param>
        [ReactMethod]
        public void setColor(uint? color)
        {
            if (color.HasValue && _statusBar != null)
            {
                var value = ColorHelpers.Parse(color.Value);

                RunOnDispatcher(() =>
                {
                    _statusBar.BackgroundColor = value;
                });
            }
        }

        /// <summary>
        /// Set StatusBar opacity.
        /// </summary>
        /// <param name="translucent">Is StatusBar translucent.</param>
        [ReactMethod]
        public void setTranslucent(bool translucent)
        {
            if (_platformType == PlatformType.Mobile && _statusBar != null)
            {
                RunOnDispatcher(() =>
                {
                    _statusBar.BackgroundOpacity = translucent ? 0.5 : 1;
                });
            }
        }

        /// <summary>
        /// Detect running platform.
        /// </summary>
        private static PlatformType DetectPlatform()
        {
            //Mobile customization
            if (ApiInformation.IsTypePresent("Windows.UI.ViewManagement.StatusBar"))
            {
                return PlatformType.Mobile;
            }

            //PC customization
            if (ApiInformation.IsTypePresent("Windows.UI.ViewManagement.ApplicationView"))
            {
                return PlatformType.Desktop;
            }

            return PlatformType.Other;
        }

        /// <summary>
        /// Create default StatusBar.
        /// </summary>
        private static IStatusBar CreateDefaultStatusBar()
        {
            var platformType = DetectPlatform();

            if (platformType == PlatformType.Mobile)
            {
                return new DefaultStatusBar(Windows.UI.ViewManagement.StatusBar.GetForCurrentView());
            }
            else if (platformType == PlatformType.Desktop)
            {
                return new DefaultStatusBar(Windows.UI.ViewManagement.ApplicationView.GetForCurrentView().TitleBar);
            }

            return null;
        }

        /// <summary>
        /// Run action on UI thread.
        /// </summary>
        /// <param name="action">The action.</param>
        private static async void RunOnDispatcher(DispatchedHandler action)
        {
            await CoreApplication.MainView.CoreWindow.Dispatcher.RunAsync(CoreDispatcherPriority.Normal, action);
        }
    }
}
