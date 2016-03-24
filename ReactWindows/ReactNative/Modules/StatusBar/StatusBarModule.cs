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
        private readonly IStatusBar _statusBar;

        /// <summary>
        /// Instantiates the <see cref="StatusBarModule"/>.
        /// </summary>
        internal StatusBarModule() 
            : this(GetStatusBar())
        {
        }

        /// <summary>
        /// Instantiates the <see cref="StatusBarModule"/>.
        /// </summary>
        /// <param name="statusBar">The status bar instance.</param>
        internal StatusBarModule(IStatusBar statusBar)
        {
            if (statusBar == null)
                throw new ArgumentNullException(nameof(statusBar));

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

        /// <summary>
        /// Set StatusBar background color.
        /// </summary>
        /// <param name="color">RGB color.</param>
        [ReactMethod]
        public void setColor(uint? color)
        {
            if (color.HasValue)
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
            RunOnDispatcher(() =>
            {
                _statusBar.BackgroundOpacity = translucent ? 0.5 : 1;
            });
        }

        /// <summary>
        /// Create default StatusBar.
        /// </summary>
        private static IStatusBar GetStatusBar()
        {
            if (ApiInformation.IsTypePresent("Windows.UI.ViewManagement.StatusBar"))
            {
                return new MobileStatusBar();
            }
            else if (ApiInformation.IsTypePresent("Windows.UI.ViewManagement.ApplicationView"))
            {
                return new DesktopStatusBar();
            }
            else
            {
                return new NopStatusBar();
            }
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
