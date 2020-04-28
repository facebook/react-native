/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.uimanager.events;

import android.view.MotionEvent;
import android.view.View;
import com.facebook.react.uimanager.RootViewUtil;

/** Utilities for native Views that interpret native gestures (e.g. ScrollView, ViewPager, etc.). */
public class NativeGestureUtil {

  /**
   * Helper method that should be called when a native view starts a native gesture (e.g. a native
   * ScrollView takes control of a gesture stream and starts scrolling). This will handle
   * dispatching the appropriate events to JS to make sure the gesture in JS is canceled.
   *
   * @param view the View starting the native gesture
   * @param event the MotionEvent that caused the gesture to be started
   */
  public static void notifyNativeGestureStarted(View view, MotionEvent event) {
    RootViewUtil.getRootView(view).onChildStartedNativeGesture(event);
  }
}
