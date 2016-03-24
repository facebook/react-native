using Windows.Foundation;
using Windows.UI;
using static Windows.UI.ViewManagement.StatusBar;

namespace ReactNative.Modules.StatusBar
{
    class MobileStatusBar : IStatusBar
    {
        public Color? BackgroundColor
        {
            get
            {
                return GetForCurrentView().BackgroundColor;
            }
            set
            {
                GetForCurrentView().BackgroundColor = value;
            }
        }

        public double BackgroundOpacity
        {
            get
            {
                return GetForCurrentView().BackgroundOpacity;
            }
            set
            {
                GetForCurrentView().BackgroundOpacity = value;
            }
        }

        public IAsyncAction HideAsync()
        {
            return GetForCurrentView().HideAsync();
        }

        public IAsyncAction ShowAsync()
        {
            return GetForCurrentView().ShowAsync();
        }
    }
}
