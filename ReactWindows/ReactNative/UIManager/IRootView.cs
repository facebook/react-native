using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Interface for the root native view of a react native application.
    /// </summary>
    public interface IRootView
    {
        /// <summary>
        /// Called when a child starts a native gesture.
        /// </summary>
        /// <param name="e">The event.</param>
        void OnChildStartedNativeGesture(RoutedEventArgs e);
    }
}
