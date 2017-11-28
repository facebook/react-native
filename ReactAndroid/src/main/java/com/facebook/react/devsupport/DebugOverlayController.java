/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import javax.annotation.Nullable;

import android.content.Context;
import android.graphics.PixelFormat;
import android.view.WindowManager;
import android.widget.FrameLayout;

import com.facebook.react.bridge.ReactContext;

/**
 * Helper class for controlling overlay view with FPS and JS FPS info
 * that gets added directly to @{link WindowManager} instance.
 */
/* package */ class DebugOverlayController {

  private final WindowManager mWindowManager;
  private final ReactContext mReactContext;

  private @Nullable FrameLayout mFPSDebugViewContainer;

  public DebugOverlayController(ReactContext reactContext) {
    mReactContext = reactContext;
    mWindowManager = (WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE);
  }

  public void setFpsDebugViewVisible(boolean fpsDebugViewVisible) {
    if (fpsDebugViewVisible && mFPSDebugViewContainer == null) {
      mFPSDebugViewContainer = new FpsView(mReactContext);
      WindowManager.LayoutParams params = new WindowManager.LayoutParams(
          WindowManager.LayoutParams.MATCH_PARENT,
          WindowManager.LayoutParams.MATCH_PARENT,
          WindowOverlayCompat.TYPE_SYSTEM_OVERLAY,
          WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
              | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
          PixelFormat.TRANSLUCENT);
      mWindowManager.addView(mFPSDebugViewContainer, params);
    } else if (!fpsDebugViewVisible && mFPSDebugViewContainer != null) {
      mFPSDebugViewContainer.removeAllViews();
      mWindowManager.removeView(mFPSDebugViewContainer);
      mFPSDebugViewContainer = null;
    }
  }
}
