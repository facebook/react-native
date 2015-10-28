/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.scroll;

import android.os.SystemClock;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerModule;

/**
 * Helper class that deals with emitting Scroll Events.
 */
public class ReactScrollViewHelper {

  /**
   * Shared by {@link ReactScrollView} and {@link ReactHorizontalScrollView}.
   */
  /* package */ static void emitScrollEvent(ViewGroup scrollView, int scrollX, int scrollY) {
    View contentView = scrollView.getChildAt(0);
    ReactContext reactContext = (ReactContext) scrollView.getContext();
    reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(
        ScrollEvent.obtain(
            scrollView.getId(),
            SystemClock.uptimeMillis(),
            scrollX,
            scrollY,
            contentView.getWidth(),
            contentView.getHeight(),
            scrollView.getWidth(),
            scrollView.getHeight()));
  }
}
