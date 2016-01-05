using System;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Touch
{
    /// <summary>
    /// This class coordinates JSResponder commands for <see cref="ReactNative.UIManager.UIManagerModule"/>.
    /// It should be set as the <see cref="IOnInterceptTouchEventListener"/>
    /// for all newly created native views that implement
    /// <see cref="ICatalystInterceptingViewGroup"/> and will dispatch touch
    /// events to the JavaScript gesture recognizer when the JavaScript
    /// responder is set to be enabled.
    /// </summary>
    public class JavaScriptResponderHandler : IOnInterceptTouchEventListener
    {
        private const int JavaScriptResponderUnset = -1;

        public void SetJavaScriptResponder(int tag, Panel viewParentBlockingNativeResponder)
        {
            throw new NotImplementedException(); 
        }

        public void ClearJavaScriptResponder()
        {
            throw new NotImplementedException();
        }

        public bool OnInterceptTouchEvent(object sender, PointerRoutedEventArgs ev)
        {
            throw new NotImplementedException();
        }

        private void MaybeUnblockNativeResponder()
        {
            throw new NotImplementedException();
        }
    }
}
