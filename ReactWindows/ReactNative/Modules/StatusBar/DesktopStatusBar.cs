using System;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.UI;
using Windows.UI.ViewManagement;
using static Windows.UI.ViewManagement.ApplicationView;

namespace ReactNative.Modules.StatusBar
{
    class DesktopStatusBar : IStatusBar
    {
        public Color? BackgroundColor
        {
            get
            {
                return GetForCurrentView().TitleBar.BackgroundColor;
            }
            set
            {
                GetForCurrentView().TitleBar.BackgroundColor = value;
            }
        }

        public double BackgroundOpacity
        {
            get;
            set;
        }

        public IAsyncAction HideAsync()
        {
            return Task.FromResult(false).AsAsyncAction();
        }

        public IAsyncAction ShowAsync()
        {
            return Task.FromResult(false).AsAsyncAction();
        }
    }
}
