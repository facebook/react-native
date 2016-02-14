using Windows.UI.Xaml.Input;

namespace ReactNative.Touch
{
    /// <summary>
    /// A listener for intercepting touch events.
    /// </summary>
    public interface IOnInterceptTouchEventListener
    {
        /// <summary>
        /// Called to evaluate touch interception occurs on a view parent.
        /// </summary>
        /// <param name="sender">The sender of the event.</param>
        /// <param name="event">
        /// The motion event being dispatched down the hierarchy.
        /// </param>
        /// <returns>
        /// <code>true</code> to steal the motion event from the children and 
        /// dispatch to this view, or <code>false</code> to allow the motion 
        /// event to be delivered to the child view.
        /// </returns>
        bool OnInterceptTouchEvent(object sender, PointerRoutedEventArgs @event);
    }
}
