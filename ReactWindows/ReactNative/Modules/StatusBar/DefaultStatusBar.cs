using Windows.Foundation;
using Windows.UI;

namespace ReactNative.Modules.StatusBar
{
    class DefaultStatusBar : IStatusBar
    {
        private Windows.UI.ViewManagement.StatusBar _statusBar;
        private Windows.UI.ViewManagement.ApplicationViewTitleBar _titleBar;

        private StatusBarModule.PlatformType _platformType;

        public DefaultStatusBar(Windows.UI.ViewManagement.StatusBar statusBar)
        {
            _statusBar = statusBar;
        }

        public DefaultStatusBar(Windows.UI.ViewManagement.ApplicationViewTitleBar titleBar)
        {
            _titleBar = titleBar;
        }

        public double BackgroundOpacity
        {
            get
            {
                return _statusBar.BackgroundOpacity;
            }
            set
            {
                _statusBar.BackgroundOpacity = value;
            }
        }

        public Color? BackgroundColor
        {
            get
            {
                if (_statusBar != null)
                {
                    return _statusBar.BackgroundColor;
                }
                else
                {
                    return _titleBar.BackgroundColor;
                }
            }
            set
            {
                if (_statusBar != null)
                {
                    _statusBar.BackgroundColor = value;
                }
                else
                {
                    _titleBar.BackgroundColor = value;
                }
            }
        }

        public IAsyncAction HideAsync()
        {
            return _statusBar.HideAsync();
        }

        public IAsyncAction ShowAsync()
        {
            return _statusBar.HideAsync();
        }
    }
}
