using ReactNative.Bridge;
using ReactNative.UIManager;
using System;
using Windows.Foundation.Metadata;
using Windows.UI;
using Windows.UI.Core;
using Windows.ApplicationModel.Core;

namespace ReactNative.Modules.StatusBar
{
    /// <summary>
    /// A module that allows JS to set statusbar properties.
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
        private ITitleBar _titleBar;

        private bool _hidden;
        private bool _translucent;
        private Color? _color;

        /// <summary>
        /// Instantiates the <see cref="StatusBarModule"/>.
        /// </summary>
        internal StatusBarModule() : this(DetectPlatform(), CreateDefaultIStatusBar(), CreateDefaultITitleBar())
        {
        }

        /// <summary>
        /// Instantiates the <see cref="StatusBarModule"/>.
        /// </summary>
        internal StatusBarModule(PlatformType platformType, IStatusBar statusBar, ITitleBar titleBar)
        {
            switch (platformType)
            {
                case PlatformType.Mobile:                 
                    if (statusBar != null)
                    {
                        _color = statusBar.BackgroundColor;
                        _translucent = statusBar.BackgroundOpacity == 1 ? false : true;
                    }
                    break;

                case PlatformType.Desktop:
                    if (titleBar != null)
                    {
                        _color = titleBar.BackgroundColor;
                    }
                    break;

                default: break;        
            }

            _platformType = platformType;
            _statusBar = statusBar;
            _titleBar = titleBar;
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
                switch (_platformType)
                {
                    case PlatformType.Mobile:
                        if (_statusBar != null)
                        {
                            _statusBar.BackgroundOpacity = _translucent ? 0.5 : 1;
                            _statusBar.BackgroundColor = color;
                            if (hidden)
                            {
                                await _statusBar.HideAsync();
                            }
                            else
                            {
                                await _statusBar.ShowAsync();
                            }
                        }

                        break;

                    case PlatformType.Desktop:
                        if (_titleBar != null)
                        {
                            _titleBar.BackgroundColor = color;
                        }

                        break;

                    default: break;
                }        
            });
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
        /// Create default statusbar.
        /// </summary>
        private static IStatusBar CreateDefaultIStatusBar()
        {
            if (DetectPlatform() == PlatformType.Mobile)
            {
                return new DefaultStatusBar(Windows.UI.ViewManagement.StatusBar.GetForCurrentView());
            }

            return null;
        }

        /// <summary>
        /// Create default titlebar.
        /// </summary>
        private static ITitleBar CreateDefaultITitleBar()
        {
            if (DetectPlatform() == PlatformType.Desktop)
            {
                return new DefaultTitleBar(Windows.UI.ViewManagement.ApplicationView.GetForCurrentView().TitleBar);
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
