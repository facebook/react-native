
namespace ReactNative.touch
{
    using Windows.UI.Xaml;
    using Windows.UI.Xaml.Input;
    public interface OnInterceptTouchEventListener
    {
        /// <summary>
        /// Called when a onInterceptTouch is invoked on a view group
        /// </summary>
        /// <param name="event"> The motion event being dispatched down the hierarchy.</param>
        /// <returns>Return true to steal motion event from the children and have the dispatched to this view, or return false to allow motion event to be delivered to children view</returns>
        void onInterceptTouchEvent(object sender, PointerRoutedEventArgs ev);
    }
}