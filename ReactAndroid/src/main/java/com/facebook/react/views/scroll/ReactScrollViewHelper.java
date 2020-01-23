/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import android.view.View;
import android.view.ViewGroup;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerHelper;

/** Helper class that deals with emitting Scroll Events. */
public class ReactScrollViewHelper {

  public static final long MOMENTUM_DELAY = 20;
  public static final String OVER_SCROLL_ALWAYS = "always";
  public static final String AUTO = "auto";
  public static final String OVER_SCROLL_NEVER = "never";

  /** Shared by {@link ReactScrollView} and {@link ReactHorizontalScrollView}. */
  public static void emitScrollEvent(ViewGroup scrollView, float xVelocity, float yVelocity) {
    emitScrollEvent(scrollView, ScrollEventType.SCROLL, xVelocity, yVelocity);
  }

  public static void emitScrollBeginDragEvent(ViewGroup scrollView) {
    emitScrollEvent(scrollView, ScrollEventType.BEGIN_DRAG);
  }

  public static void emitScrollEndDragEvent(
      ViewGroup scrollView, float xVelocity, float yVelocity) {
    emitScrollEvent(scrollView, ScrollEventType.END_DRAG, xVelocity, yVelocity);
  }

  public static void emitScrollMomentumBeginEvent(
      ViewGroup scrollView, int xVelocity, int yVelocity) {
    emitScrollEvent(scrollView, ScrollEventType.MOMENTUM_BEGIN, xVelocity, yVelocity);
  }

  public static void emitScrollMomentumEndEvent(ViewGroup scrollView) {
    emitScrollEvent(scrollView, ScrollEventType.MOMENTUM_END);
  }

  private static void emitScrollEvent(ViewGroup scrollView, ScrollEventType scrollEventType) {
    emitScrollEvent(scrollView, scrollEventType, 0, 0);
  }

  private static void emitScrollEvent(
      ViewGroup scrollView, ScrollEventType scrollEventType, float xVelocity, float yVelocity) {
    View contentView = scrollView.getChildAt(0);

    if (contentView == null) {
      return;
    }

    ReactContext reactContext = (ReactContext) scrollView.getContext();
    UIManagerHelper.getEventDispatcherForReactTag(reactContext, scrollView.getId())
        .dispatchEvent(
            ScrollEvent.obtain(
                scrollView.getId(),
                scrollEventType,
                scrollView.getScrollX(),
                scrollView.getScrollY(),
                xVelocity,
                yVelocity,
                contentView.getWidth(),
                contentView.getHeight(),
                scrollView.getWidth(),
                scrollView.getHeight()));
  }

  public static int parseOverScrollMode(String jsOverScrollMode) {
    if (jsOverScrollMode == null || jsOverScrollMode.equals(AUTO)) {
      return View.OVER_SCROLL_IF_CONTENT_SCROLLS;
    } else if (jsOverScrollMode.equals(OVER_SCROLL_ALWAYS)) {
      return View.OVER_SCROLL_ALWAYS;
    } else if (jsOverScrollMode.equals(OVER_SCROLL_NEVER)) {
      return View.OVER_SCROLL_NEVER;
    } else {
      throw new JSApplicationIllegalArgumentException("wrong overScrollMode: " + jsOverScrollMode);
    }
  }
}
