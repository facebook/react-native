using System;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml;

namespace ReactNative.Touch
{
    /// <summary>
    /// This class coordinates JavaScript responder commands for the 
    /// <see cref="ReactNative.UIManager.UIManagerModule"/>. It should be set 
    /// as the <see cref="IOnInterceptTouchEventListener"/> for all newly 
    /// created native views that implement 
    /// <see cref="IReactInterceptingViewParent"/> and will dispatch touch
    /// events to the JavaScript gesture recognizer when the JavaScript
    /// responder is set to be enabled.
    /// </summary>
    public class JavaScriptResponderHandler : IOnInterceptTouchEventListener
    {
        private const int JavaScriptResponderUnset = -1;

        private int _currentJSResponder = JavaScriptResponderUnset;
        private FrameworkElement _viewParentBlockingNativeResponder;

        /// <summary>
        /// Sets the JavaScript responder to the given view.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="viewParentBlockingNativeResponder">
        /// The view instance.
        /// </param>
        public void SetJavaScriptResponder(int tag, FrameworkElement viewParentBlockingNativeResponder)
        {
            _currentJSResponder = tag;
            _viewParentBlockingNativeResponder = viewParentBlockingNativeResponder;
        }

        /// <summary>
        /// Clears the JavaScript responder.
        /// </summary>
        public void ClearJavaScriptResponder()
        {
            _currentJSResponder = JavaScriptResponderUnset;
            _viewParentBlockingNativeResponder = null;
        }

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
        public bool OnInterceptTouchEvent(object sender, PointerRoutedEventArgs ev)
        {
            throw new NotImplementedException();
        }
    }
}
