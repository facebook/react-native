using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    /// <summary>
    /// allows registering for size change events. The main purpose for this class is to hide complexity of ReactRootView
    /// </summary>
    public class SizeMonitoringPanel : Canvas
    {
        private SizeChangedEventHandler _sizeChangedEventHandler;

        /// <summary>
        /// Sets and registers the event handler responsible for monitoring
        /// size change events.
        /// </summary>
        /// <param name="sizeChangedEventHandler">The event handler.</param>
        public void SetOnSizeChangedListener(SizeChangedEventHandler sizeChangedEventHandler)
        {
            _sizeChangedEventHandler = sizeChangedEventHandler;
            SizeChanged += _sizeChangedEventHandler;
        }

        /// <summary>
        /// Unsets the size changed event handler.
        /// </summary>
        public void RemoveSizeChanged()
        {
            SizeChanged -= _sizeChangedEventHandler;
        }
    }
}
