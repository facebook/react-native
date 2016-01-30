using Windows.UI.Xaml;

namespace ReactNative.UIManager.Events
{
    /// <summary>
    /// The interface for defining the methods for receiving and losing <see cref="TextBox"/> control focus.
    /// </summary>
    public interface IOnInterceptTextFocusEventListener
    {
        void OnInterceptLostFocusEvent(object sender, RoutedEventArgs @event);

        void OnInterceptGotFocusEvent(object sender, RoutedEventArgs @event);
    }
}
