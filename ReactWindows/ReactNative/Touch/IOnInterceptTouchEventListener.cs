using Windows.UI.Xaml.Input;

namespace ReactNative.Touch
{
    public interface IOnInterceptTouchEventListener
    {
        /// <summary>
        /// Called when a touch intercept occurs on a view group.
        /// </summary>
        /// <param name="event">The motion event being dispatched down the hierarchy.</param>
        /// <returns>
        /// <code>true</code> if the touch event should be intercepted from the
        /// children and dispatched to this view, or <code>false</code> to
        /// allow the event to be delivered to the child view.
        /// </returns>
        bool OnInterceptTouchEvent(object sender, PointerRoutedEventArgs @event);
    }
}