using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Interface for the root native view of a React native application.
    /// </summary>
    public interface IRootView
    {
        /// <summary>
        /// Called when a child starts a native gesture (e.g. a scroll in a ScrollView).
        /// </summary>
        /// <param name="androidEvent"></param>
        void OnChildStartedNativeGesture(RoutedEventArgs ev);
    }
}
