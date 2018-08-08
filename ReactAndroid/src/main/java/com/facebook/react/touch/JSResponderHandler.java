/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.touch;

import javax.annotation.Nullable;

import android.view.MotionEvent;
import android.view.ViewGroup;
import android.view.ViewParent;

/**
 * This class coordinates JSResponder commands for {@link UIManagerModule}. It should be set as
 * OnInterceptTouchEventListener for all newly created native views that implements
 * {@link ReactInterceptingViewGroup} and thanks to the information whether JSResponder is set
 * and to which view it will correctly coordinate the return values of
 * {@link OnInterceptTouchEventListener} such that touch events will be dispatched to the view
 * selected by JS gesture recognizer.
 *
 * Single {@link CatalystInstance} should reuse same instance of this class.
 */
public class JSResponderHandler implements OnInterceptTouchEventListener {

  private static final int JS_RESPONDER_UNSET = -1;

  private volatile int mCurrentJSResponder = JS_RESPONDER_UNSET;
  // We're holding on to the ViewParent that blocked native responders so that we can clear it
  // when we change or clear the current JS responder.
  private @Nullable ViewParent mViewParentBlockingNativeResponder;

  public void setJSResponder(int tag, @Nullable ViewParent viewParentBlockingNativeResponder) {
    mCurrentJSResponder = tag;
    // We need to unblock the native responder first, otherwise we can get in a bad state: a
    // ViewParent sets requestDisallowInterceptTouchEvent to true, which sets this setting to true
    // to all of its ancestors. Now, if one of its ancestors sets requestDisallowInterceptTouchEvent
    // to false, it unsets the setting for itself and all of its ancestors, which means that they
    // can intercept events again.
    maybeUnblockNativeResponder();
    if (viewParentBlockingNativeResponder != null) {
      viewParentBlockingNativeResponder.requestDisallowInterceptTouchEvent(true);
      mViewParentBlockingNativeResponder = viewParentBlockingNativeResponder;
    }
  }

  public void clearJSResponder() {
    mCurrentJSResponder = JS_RESPONDER_UNSET;
    maybeUnblockNativeResponder();
  }

  private void maybeUnblockNativeResponder() {
    if (mViewParentBlockingNativeResponder != null) {
      mViewParentBlockingNativeResponder.requestDisallowInterceptTouchEvent(false);
      mViewParentBlockingNativeResponder = null;
    }
  }

  @Override
  public boolean onInterceptTouchEvent(ViewGroup v, MotionEvent event) {
    int currentJSResponder = mCurrentJSResponder;
    if (currentJSResponder != JS_RESPONDER_UNSET && event.getAction() != MotionEvent.ACTION_UP) {
      // Don't intercept ACTION_UP events. If we return true here than UP event will not be
      // delivered. That is because intercepted touch events are converted into CANCEL events
      // and make all further events to be delivered to the view that intercepted the event.
      // Therefore since "UP" event is the last event in a gesture, we should just let it reach the
      // original target that is a child view of {@param v}.
      // http://developer.android.com/reference/android/view/ViewGroup.html#onInterceptTouchEvent(android.view.MotionEvent)
      return v.getId() == currentJSResponder;
    }
    return false;
  }
}
