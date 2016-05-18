using System;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.UI;

namespace ReactNative.Modules.StatusBar
{
    class NopStatusBar : IStatusBar
    {
        public Color? BackgroundColor
        {
            get;
            set;
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
