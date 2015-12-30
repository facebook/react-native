using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    /// <summary>
    /// allows registering for size change events. The main purpose for this class is to hide complexity of ReactRootView
    /// </summary>
    public partial class SizeMonitoringFrameLayout : Panel
    {
        public SizeMonitoringFrameLayout() : base()
        {
        }

        private ISizeChangedListener _OnSizeChangedListener;

        /// <summary>
        /// Sets and registers the size change listener for the XAML panel control
        /// </summary>
        /// <param name="onSizeChangedListener">The <see cref="ISizeChangedListener"/> listener</param>
        public void setOnSizeChangedListener(ISizeChangedListener onSizeChangedListener)
        {
            _OnSizeChangedListener = onSizeChangedListener;
            this.SizeChanged += _OnSizeChangedListener.onSizeChanged;
        }
    }
}
