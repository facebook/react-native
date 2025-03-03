/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import android.graphics.Rect;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.UIManagerListener;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasSmoothScroll;
import com.facebook.react.views.view.ReactViewGroup;
import java.lang.ref.WeakReference;

/**
 * Manage state for the maintainVisibleContentPosition prop.
 *
 * <p>This uses UIManager to listen to updates and capture position of items before and after
 * layout.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
class MaintainVisibleScrollPositionHelper<ScrollViewT extends ViewGroup & HasSmoothScroll>
    implements UIManagerListener {

  private final ScrollViewT mScrollView;
  private final boolean mHorizontal;
  private @Nullable Config mConfig;
  private @Nullable WeakReference<View> mFirstVisibleView = null;
  private @Nullable Rect mPrevFirstVisibleFrame = null;
  private boolean mListening = false;

  public static class Config {

    public final int minIndexForVisible;
    public final @Nullable Integer autoScrollToTopThreshold;

    Config(int minIndexForVisible, @Nullable Integer autoScrollToTopThreshold) {
      this.minIndexForVisible = minIndexForVisible;
      this.autoScrollToTopThreshold = autoScrollToTopThreshold;
    }

    static Config fromReadableMap(ReadableMap value) {
      int minIndexForVisible = value.getInt("minIndexForVisible");
      Integer autoScrollToTopThreshold =
          value.hasKey("autoscrollToTopThreshold")
              ? value.getInt("autoscrollToTopThreshold")
              : null;
      return new Config(minIndexForVisible, autoScrollToTopThreshold);
    }
  }

  public MaintainVisibleScrollPositionHelper(ScrollViewT scrollView, boolean horizontal) {
    mScrollView = scrollView;
    mHorizontal = horizontal;
  }

  public void setConfig(@Nullable Config config) {
    mConfig = config;
  }

  /** Start listening to view hierarchy updates. Should be called when this is created. */
  public void start() {
    if (mListening) {
      return;
    }
    mListening = true;
    getUIManagerModule().addUIManagerEventListener(this);
  }

  /** Stop listening to view hierarchy updates. Should be called before this is destroyed. */
  public void stop() {
    if (!mListening) {
      return;
    }
    mListening = false;
    mFirstVisibleView = null;
    getUIManagerModule().removeUIManagerEventListener(this);
  }

  /**
   * Update the scroll position of the managed ScrollView. This should be called after layout has
   * been updated.
   */
  public void onLayout() {
    // On Fabric this will be called internally in `didMountItems`.
    if (ViewUtil.getUIManagerType(mScrollView.getId()) != UIManagerType.FABRIC) {
      didMountItemsInternal();
    }
  }

  private void didMountItemsInternal() {
    if (mConfig == null || mPrevFirstVisibleFrame == null) {
      return;
    }

    View firstVisibleView = getFirstVisibleView();
    if (firstVisibleView == null) {
      return;
    }

    Rect newFrame = new Rect();
    firstVisibleView.getHitRect(newFrame);

    if (mHorizontal) {
      int deltaX = newFrame.left - mPrevFirstVisibleFrame.left;
      if (deltaX != 0) {
        int scrollX = mScrollView.getScrollX();
        mScrollView.scrollToPreservingMomentum(scrollX + deltaX, mScrollView.getScrollY());
        mPrevFirstVisibleFrame = newFrame;
        if (mConfig.autoScrollToTopThreshold != null
            && scrollX <= mConfig.autoScrollToTopThreshold) {
          mScrollView.reactSmoothScrollTo(0, mScrollView.getScrollY());
        }
      }
    } else {
      int deltaY = newFrame.top - mPrevFirstVisibleFrame.top;
      if (deltaY != 0) {
        int scrollY = mScrollView.getScrollY();
        mScrollView.scrollToPreservingMomentum(mScrollView.getScrollX(), scrollY + deltaY);
        mPrevFirstVisibleFrame = newFrame;
        if (mConfig.autoScrollToTopThreshold != null
            && scrollY <= mConfig.autoScrollToTopThreshold) {
          mScrollView.reactSmoothScrollTo(mScrollView.getScrollX(), 0);
        }
      }
    }
  }

  private @Nullable ReactViewGroup getContentView() {
    return (ReactViewGroup) mScrollView.getChildAt(0);
  }

  private UIManager getUIManagerModule() {
    return Assertions.assertNotNull(
        UIManagerHelper.getUIManager(
            (ReactContext) mScrollView.getContext(),
            ViewUtil.getUIManagerType(mScrollView.getId())));
  }

  public void onScroll() {
    if (mConfig == null) {
      return;
    }
    ReactViewGroup contentView = getContentView();
    if (contentView == null) {
      return;
    }

    int currentScroll = mHorizontal ? mScrollView.getScrollX() : mScrollView.getScrollY();
    View firstVisibleView = null;
    // We cannot assume that the views will be in position order because of things like z-index
    // which will change the order of views in their parent. This means we need to iterate through
    // the full children array and find the view with the smallest position that is bigger than
    // the scroll position.
    float firstVisibleViewPosition = Float.MAX_VALUE;
    for (int i = mConfig.minIndexForVisible; i < contentView.getChildCount(); i++) {
      View child = contentView.getChildAt(i);

      // Compute the position of the end of the child
      float position =
          mHorizontal ? child.getX() + child.getWidth() : child.getY() + child.getHeight();

      // If the child is partially visible or this is the last child, select it as the anchor.
      if ((position > currentScroll && position < firstVisibleViewPosition) ||
              (firstVisibleView == null && i == contentView.getChildCount() - 1)) {
        firstVisibleView = child;
        firstVisibleViewPosition = position;
      }
    }
    mFirstVisibleView = new WeakReference<>(firstVisibleView);
  }

  private View getFirstVisibleView() {
    return mFirstVisibleView != null ? mFirstVisibleView.get() : null;
  }

  private void willMountItemsInternal() {
    View firstVisibleView = getFirstVisibleView();

    // If we don't have a first visible view because no scroll happened call onScroll
    // to update it.
    if (firstVisibleView == null) {
      onScroll();
      firstVisibleView = getFirstVisibleView();

      // There are cases where it is possible for this to still be null so just bail out.
      if (firstVisibleView == null) {
        return;
      }
    }
    Rect frame = new Rect();
    firstVisibleView.getHitRect(frame);
    mPrevFirstVisibleFrame = frame;
  }

  // UIManagerListener

  @Override
  public void willDispatchViewUpdates(final UIManager uiManager) {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            willMountItemsInternal();
          }
        });
  }

  @Override
  public void willMountItems(UIManager uiManager) {
    willMountItemsInternal();
  }

  @Override
  public void didMountItems(UIManager uiManager) {
    didMountItemsInternal();
  }

  @Override
  public void didDispatchMountItems(UIManager uiManager) {
    // noop
  }

  @Override
  public void didScheduleMountItems(UIManager uiManager) {
    // noop
  }
}
