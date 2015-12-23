
namespace ReactNative.touch
{
    using Windows.UI.Xaml;

    /// <summary>
    /// This class coordinates JSResponder commands for UIManagerModule
    /// </summary>
    public class JSResponderHandler
    {
        /*private static readonly int JS_RESPONDER_UNSET = -1;

        private volatile int mCurrentJSResponder = JS_RESPONDER_UNSET;

        public void setJSResponder(int tag) {
            mCurrentJSResponder = tag;
            // We need to unblock the native responder first, otherwise we can get in a bad state: a
            // ViewParent sets requestDisallowInterceptTouchEvent to true, which sets this setting to true
            // to all of its ancestors. Now, if one of its ancestors sets requestDisallowInterceptTouchEvent
            // to false, it unsets the setting for itself and all of its ancestors, which means that they
            // can intercept events again.
            maybeUnblockNativeResponder();
            if (viewParentBlockingNativeResponder != null)
            {
                viewParentBlockingNativeResponder.requestDisallowInterceptTouchEvent(true);
                mViewParentBlockingNativeResponder = viewParentBlockingNativeResponder;
            }
        }

        public void clearJSResponder() {
            mCurrentJSResponder = JS_RESPONDER_UNSET;
            maybeUnblockNativeResponder();
        }

        private void maybeUnblockNativeResponder() {
            if (mViewParentBlockingNativeResponder != null)
            {
                mViewParentBlockingNativeResponder.requestDisallowInterceptTouchEvent(false);
                mViewParentBlockingNativeResponder = null;
            }
        }
        
        public override bool onInterceptTouchEvent(RoutedEventArgs ev) {
            int currentJSResponder = mCurrentJSResponder;
            if (currentJSResponder != JS_RESPONDER_UNSET && ev.getAction() != MotionEvent.ACTION_UP) {
                // Don't intercept ACTION_UP events. If we return true here than UP event will not be
                // delivered. That is because intercepted touch events are converted into CANCEL events
                // and make all further events to be delivered to the view that intercepted the event.
                // Therefore since "UP" event is the last event in a gesture, we should just let it reach the
                // original target that is a child view of {@param v}.
                // http://developer.android.com/reference/android/view/ViewGroup.html#onInterceptTouchEvent(android.view.MotionEvent)
                return v.getId() == currentJSResponder;
            }
            return false;
        }*/
    }
}
