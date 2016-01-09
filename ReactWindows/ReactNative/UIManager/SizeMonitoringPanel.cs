using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    /// <summary>
    /// allows registering for size change events. The main purpose for this class is to hide complexity of ReactRootView
    /// </summary>
    public class SizeMonitoringPanel : Grid
    {
        private ISizeChangedListener _onSizeChangedListener;
        /// <summary>
        /// Gets or sets the size change listener for the control
        /// </summary>
        public ISizeChangedListener SizeChangedListener
        {
            get { return _onSizeChangedListener; }
            set { _onSizeChangedListener = value; }
        }

        public SizeMonitoringPanel()
        {
            SizeChanged += SizeMonitoringPanel_SizeChanged;
        }

        private void SizeMonitoringPanel_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            _onSizeChangedListener?.OnSizeChanged(this, e);
        }
    }
}
