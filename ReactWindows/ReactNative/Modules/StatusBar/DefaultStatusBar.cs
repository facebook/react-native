using Windows.Foundation;
using Windows.UI;

namespace ReactNative.Modules.StatusBar
{
    class DefaultStatusBar : IStatusBar
    {
        private Windows.UI.ViewManagement.StatusBar _statusBar;

        public DefaultStatusBar(Windows.UI.ViewManagement.StatusBar statusBar)
        {
            _statusBar = statusBar;
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
                return _statusBar.BackgroundColor;
            }
            set
            {
                _statusBar.BackgroundColor = value;
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
