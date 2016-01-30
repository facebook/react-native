using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Interface listener to hook into size change events for XAML components of type <see cref="FrameworkElement"/>
    /// </summary>
    public interface ISizeChangedListener
    {
        void OnSizeChanged(object sender, SizeChangedEventArgs e);
    }
}
