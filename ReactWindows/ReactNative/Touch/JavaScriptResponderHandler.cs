using System;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml;

namespace ReactNative.Touch
{
    /// <summary>
    /// This class coordinates JSResponder commands for <see cref="ReactNative.UIManager.UIManagerModule"/>.
    /// It should be set as the <see cref="IOnInterceptTouchEventListener"/>
    /// for all newly created native views that implement
    /// <see cref="IReactInterceptingViewParent"/> and will dispatch touch
    /// events to the JavaScript gesture recognizer when the JavaScript
    /// responder is set to be enabled.
    /// </summary>
    public class JavaScriptResponderHandler : IOnInterceptTouchEventListener
    {
        private const int JavaScriptResponderUnset = -1;

        private int _currentJSResponder = JavaScriptResponderUnset;
        private FrameworkElement _viewParentBlockingNativeResponder;

        public void SetJavaScriptResponder(int tag, FrameworkElement viewParentBlockingNativeResponder)
        {
            _currentJSResponder = tag;
            _viewParentBlockingNativeResponder = viewParentBlockingNativeResponder;
        }

        public void ClearJavaScriptResponder()
        {
            _currentJSResponder = JavaScriptResponderUnset;
            _viewParentBlockingNativeResponder = null;
        }

        public bool OnInterceptTouchEvent(object sender, PointerRoutedEventArgs ev)
        {
            throw new NotImplementedException();
        }
    }
}
