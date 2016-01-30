using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager.Events
{
    public interface IOnInterceptTextInputEventListener
    {
        /// <summary>
        /// Called when a onInterceptTouch is invoked on a view group
        /// </summary>
        /// <param name="event"> The motion event being dispatched down the hierarchy.</param>
        /// <returns>Return true to steal motion event from the children and have the dispatched to this view, or return false to allow motion event to be delivered to children view</returns>
        void OnInterceptTextChangeEvent(object sender, TextChangedEventArgs @event);
    }
}
