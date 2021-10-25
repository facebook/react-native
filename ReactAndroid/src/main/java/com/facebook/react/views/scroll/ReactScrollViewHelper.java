/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.OverScroller;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import java.util.Collections;
import java.util.Set;
import java.util.WeakHashMap;

/** Helper class that deals with emitting Scroll Events. */
public class ReactScrollViewHelper {

  public static final long MOMENTUM_DELAY = 20;
  public static final String OVER_SCROLL_ALWAYS = "always";
  public static final String AUTO = "auto";
  public static final String OVER_SCROLL_NEVER = "never";

  public static final int SNAP_ALIGNMENT_DISABLED = 0;
  public static final int SNAP_ALIGNMENT_START = 1;
  public static final int SNAP_ALIGNMENT_CENTER = 2;
  public static final int SNAP_ALIGNMENT_END = 3;

  public interface ScrollListener {
    void onScroll(
        ViewGroup scrollView, ScrollEventType scrollEventType, float xVelocity, float yVelocity);

    void onLayout(ViewGroup scrollView);
  }

  // Support global native listeners for scroll events
  private static final Set<ScrollListener> sScrollListeners =
      Collections.newSetFromMap(new WeakHashMap<ScrollListener, Boolean>());

  // If all else fails, this is the hardcoded value in OverScroller.java, in AOSP.
  // The default is defined here (as of this diff):
  // https://android.googlesource.com/platform/frameworks/base/+/ae5bcf23b5f0875e455790d6af387184dbd009c1/core/java/android/widget/OverScroller.java#44
  private static int SMOOTH_SCROLL_DURATION = 250;
  private static boolean mSmoothScrollDurationInitialized = false;

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

    for (ScrollListener scrollListener : sScrollListeners) {
      scrollListener.onScroll(scrollView, scrollEventType, xVelocity, yVelocity);
    }

    ReactContext reactContext = (ReactContext) scrollView.getContext();
    int surfaceId = UIManagerHelper.getSurfaceId(reactContext);
    UIManagerHelper.getEventDispatcherForReactTag(reactContext, scrollView.getId())
        .dispatchEvent(
            ScrollEvent.obtain(
                surfaceId,
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

  /** This is only for Java listeners. onLayout events emitted to JS are handled elsewhere. */
  public static void emitLayoutEvent(ViewGroup scrollView) {
    for (ScrollListener scrollListener : sScrollListeners) {
      scrollListener.onLayout(scrollView);
    }
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

  public static int parseSnapToAlignment(@Nullable String alignment) {
    if (alignment == null) {
      return SNAP_ALIGNMENT_DISABLED;
    } else if ("start".equalsIgnoreCase(alignment)) {
      return SNAP_ALIGNMENT_START;
    } else if ("center".equalsIgnoreCase(alignment)) {
      return SNAP_ALIGNMENT_CENTER;
    } else if ("end".equals(alignment)) {
      return SNAP_ALIGNMENT_END;
    } else {
      throw new JSApplicationIllegalArgumentException("wrong snap alignment value: " + alignment);
    }
  }

  public static int getDefaultScrollAnimationDuration(Context context) {
    if (!mSmoothScrollDurationInitialized) {
      mSmoothScrollDurationInitialized = true;

      try {
        OverScrollerDurationGetter overScrollerDurationGetter =
            new OverScrollerDurationGetter(context);
        SMOOTH_SCROLL_DURATION = overScrollerDurationGetter.getScrollAnimationDuration();
      } catch (Throwable e) {
      }
    }

    return SMOOTH_SCROLL_DURATION;
  }

  private static class OverScrollerDurationGetter extends OverScroller {
    // This is the default in AOSP, hardcoded in OverScroller.java.
    private int mScrollAnimationDuration = 250;

    OverScrollerDurationGetter(Context context) {
      // We call with a null context because OverScroller does not use the context
      // in the execution path we're interested in, unless heavily modified in an AOSP fork.
      super(context);
    }

    public int getScrollAnimationDuration() {
      // If startScroll is called without a duration, OverScroller will call `startScroll(x, y, dx,
      // dy, duration)` with the default duration.
      super.startScroll(0, 0, 0, 0);

      return mScrollAnimationDuration;
    }

    @Override
    public void startScroll(int startX, int startY, int dx, int dy, int duration) {
      mScrollAnimationDuration = duration;
    }
  }

  /**
   * Adds a scroll listener.
   *
   * <p>Note that you must keep a reference to this scroll listener because this class only keeps a
   * weak reference to it (to prevent memory leaks). This means that code like <code>
   * addScrollListener(new ScrollListener() {...})</code> won't work, you need to do this instead:
   * <code>
   *   mScrollListener = new ScrollListener() {...};
   *   ReactScrollViewHelper.addScrollListener(mScrollListener);
   * </code> instead.
   *
   * @param listener
   */
  public static void addScrollListener(ScrollListener listener) {
    sScrollListeners.add(listener);
  }

  public static void removeScrollListener(ScrollListener listener) {
    sScrollListeners.remove(listener);
  }
}
