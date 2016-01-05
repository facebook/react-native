using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    /// <summary>
    /// allows registering for size change events. The main purpose for this class is to hide complexity of ReactRootView
    /// </summary>
    public partial class SizeMonitoringPanel : Panel
    {
        private ISizeChangedListener _onSizeChangedListener;

        /// <summary>
        /// Sets and registers the size change listener for the XAML panel control
        /// </summary>
        /// <param name="sizeChangedListener">The <see cref="ISizeChangedListener"/> listener</param>
        public void SetOnSizeChangedListener(ISizeChangedListener sizeChangedListener)
        {
            _onSizeChangedListener = sizeChangedListener;
            this.SizeChanged += _onSizeChangedListener.OnSizeChanged;
        }
    }
}
