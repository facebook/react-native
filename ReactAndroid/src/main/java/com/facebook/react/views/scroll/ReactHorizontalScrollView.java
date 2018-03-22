/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.scroll;

import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.support.v4.view.ViewCompat;
import android.view.MotionEvent;
import android.view.View;
import android.widget.HorizontalScrollView;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.uimanager.MeasureSpecAssertions;
import com.facebook.react.uimanager.ReactClippingViewGroup;
import com.facebook.react.uimanager.ReactClippingViewGroupHelper;
import com.facebook.react.uimanager.events.NativeGestureUtil;
import com.facebook.react.views.view.ReactViewBackgroundManager;
import javax.annotation.Nullable;

/**
 * Similar to {@link ReactScrollView} but only supports horizontal scrolling.
 */
@TargetApi(16)
public class ReactHorizontalScrollView extends HorizontalScrollView implements
    ReactClippingViewGroup {

  private final OnScrollDispatchHelper mOnScrollDispatchHelper = new OnScrollDispatchHelper();
  private final VelocityHelper mVelocityHelper = new VelocityHelper();

  private boolean mActivelyScrolling;
  private @Nullable Rect mClippingRect;
  private boolean mDragging;
  private boolean mPagingEnabled = false;
  private @Nullable Runnable mPostTouchRunnable;
  private boolean mRemoveClippedSubviews;
  private boolean mScrollEnabled = true;
  private boolean mSendMomentumEvents;
  private @Nullable FpsListener mFpsListener = null;
  private @Nullable String mScrollPerfTag;
  private @Nullable Drawable mEndBackground;
  private int mEndFillColor = Color.TRANSPARENT;
  private int mSnapInterval = 0;
  private ReactViewBackgroundManager mReactBackgroundManager;

  public ReactHorizontalScrollView(Context context) {
    this(context, null);
  }

  public ReactHorizontalScrollView(Context context, @Nullable FpsListener fpsListener) {
    super(context);
    mReactBackgroundManager = new ReactViewBackgroundManager(this);
    mFpsListener = fpsListener;
  }

  public void setScrollPerfTag(@Nullable String scrollPerfTag) {
    mScrollPerfTag = scrollPerfTag;
  }

  @Override
  public void setRemoveClippedSubviews(boolean removeClippedSubviews) {
    if (removeClippedSubviews && mClippingRect == null) {
      mClippingRect = new Rect();
    }
    mRemoveClippedSubviews = removeClippedSubviews;
    updateClippingRect();
  }

  @Override
  public boolean getRemoveClippedSubviews() {
    return mRemoveClippedSubviews;
  }

  public void setSendMomentumEvents(boolean sendMomentumEvents) {
    mSendMomentumEvents = sendMomentumEvents;
  }

  public void setScrollEnabled(boolean scrollEnabled) {
    mScrollEnabled = scrollEnabled;
  }

  public void setPagingEnabled(boolean pagingEnabled) {
    mPagingEnabled = pagingEnabled;
  }

  public void setSnapInterval(int snapInterval) {
    mSnapInterval = snapInterval;
  }

  public void flashScrollIndicators() {
    awakenScrollBars();
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    MeasureSpecAssertions.assertExplicitMeasureSpec(widthMeasureSpec, heightMeasureSpec);

    setMeasuredDimension(
        MeasureSpec.getSize(widthMeasureSpec),
        MeasureSpec.getSize(heightMeasureSpec));
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    // Call with the present values in order to re-layout if necessary
    scrollTo(getScrollX(), getScrollY());
  }

  @Override
  protected void onScrollChanged(int x, int y, int oldX, int oldY) {
    super.onScrollChanged(x, y, oldX, oldY);

    mActivelyScrolling = true;

    if (mOnScrollDispatchHelper.onScrollChanged(x, y)) {
      if (mRemoveClippedSubviews) {
        updateClippingRect();
      }

      ReactScrollViewHelper.emitScrollEvent(
        this,
        mOnScrollDispatchHelper.getXFlingVelocity(),
        mOnScrollDispatchHelper.getYFlingVelocity());
    }
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    if (!mScrollEnabled) {
      return false;
    }

    if (super.onInterceptTouchEvent(ev)) {
      NativeGestureUtil.notifyNativeGestureStarted(this, ev);
      ReactScrollViewHelper.emitScrollBeginDragEvent(this);
      mDragging = true;
      enableFpsListener();
      return true;
    }

    return false;
  }

  @Override
  public boolean onTouchEvent(MotionEvent ev) {
    if (!mScrollEnabled) {
      return false;
    }

    mVelocityHelper.calculateVelocity(ev);
    int action = ev.getAction() & MotionEvent.ACTION_MASK;
    if (action == MotionEvent.ACTION_UP && mDragging) {
      float velocityX = mVelocityHelper.getXVelocity();
      float velocityY = mVelocityHelper.getYVelocity();
      ReactScrollViewHelper.emitScrollEndDragEvent(
        this,
        velocityX,
        velocityY);
      mDragging = false;
      // After the touch finishes, we may need to do some scrolling afterwards either as a result
      // of a fling or because we need to page align the content
      handlePostTouchScrolling(Math.round(velocityX), Math.round(velocityY));
    }

    return super.onTouchEvent(ev);
  }

  @Override
  public void fling(int velocityX) {
    if (mPagingEnabled) {
      smoothScrollToPage(velocityX);
    } else {
      super.fling(velocityX);
    }
    handlePostTouchScrolling(velocityX, 0);
  }

  @Override
  protected void onSizeChanged(int w, int h, int oldw, int oldh) {
    super.onSizeChanged(w, h, oldw, oldh);
    if (mRemoveClippedSubviews) {
      updateClippingRect();
    }
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    if (mRemoveClippedSubviews) {
      updateClippingRect();
    }
  }

  @Override
  public void updateClippingRect() {
    if (!mRemoveClippedSubviews) {
      return;
    }

    Assertions.assertNotNull(mClippingRect);

    ReactClippingViewGroupHelper.calculateClippingRect(this, mClippingRect);
    View contentView = getChildAt(0);
    if (contentView instanceof ReactClippingViewGroup) {
      ((ReactClippingViewGroup) contentView).updateClippingRect();
    }
  }

  @Override
  public void getClippingRect(Rect outClippingRect) {
    outClippingRect.set(Assertions.assertNotNull(mClippingRect));
  }

  private int getSnapInterval() {
    if (mSnapInterval != 0) {
      return mSnapInterval;
    }
    return getWidth();
  }

  public void setEndFillColor(int color) {
    if (color != mEndFillColor) {
      mEndFillColor = color;
      mEndBackground = new ColorDrawable(mEndFillColor);
    }
  }

  private void enableFpsListener() {
    if (isScrollPerfLoggingEnabled()) {
      Assertions.assertNotNull(mFpsListener);
      Assertions.assertNotNull(mScrollPerfTag);
      mFpsListener.enable(mScrollPerfTag);
    }
  }

  private void disableFpsListener() {
    if (isScrollPerfLoggingEnabled()) {
      Assertions.assertNotNull(mFpsListener);
      Assertions.assertNotNull(mScrollPerfTag);
      mFpsListener.disable(mScrollPerfTag);
    }
  }

  private boolean isScrollPerfLoggingEnabled() {
    return mFpsListener != null && mScrollPerfTag != null && !mScrollPerfTag.isEmpty();
  }

  @Override
  public void draw(Canvas canvas) {
    if (mEndFillColor != Color.TRANSPARENT) {
      final View content = getChildAt(0);
      if (mEndBackground != null && content != null && content.getRight() < getWidth()) {
        mEndBackground.setBounds(content.getRight(), 0, getWidth(), getHeight());
        mEndBackground.draw(canvas);
      }
    }
    super.draw(canvas);
  }

  /**
   * This handles any sort of scrolling that may occur after a touch is finished.  This may be
   * momentum scrolling (fling) or because you have pagingEnabled on the scroll view.  Because we
   * don't get any events from Android about this lifecycle, we do all our detection by creating a
   * runnable that checks if we scrolled in the last frame and if so assumes we are still scrolling.
   */
  private void handlePostTouchScrolling(int velocityX, int velocityY) {
    // If we aren't going to do anything (send events or snap to page), we can early out.
    if (!mSendMomentumEvents && !mPagingEnabled && !isScrollPerfLoggingEnabled()) {
      return;
    }

    // Check if we are already handling this which may occur if this is called by both the touch up
    // and a fling call
    if (mPostTouchRunnable != null) {
      return;
    }

    if (mSendMomentumEvents) {
      ReactScrollViewHelper.emitScrollMomentumBeginEvent(this, velocityX, velocityY);
    }

    mActivelyScrolling = false;
    mPostTouchRunnable = new Runnable() {

      private boolean mSnappingToPage = false;

      @Override
      public void run() {
        if (mActivelyScrolling) {
          // We are still scrolling so we just post to check again a frame later
          mActivelyScrolling = false;
          ViewCompat.postOnAnimationDelayed(ReactHorizontalScrollView.this,
            this,
            ReactScrollViewHelper.MOMENTUM_DELAY);
        } else {
          if (mPagingEnabled && !mSnappingToPage) {
            // Only if we have pagingEnabled and we have not snapped to the page do we
            // need to continue checking for the scroll.  And we cause that scroll by asking for it
            mSnappingToPage = true;
            smoothScrollToPage(0);
            ViewCompat.postOnAnimationDelayed(ReactHorizontalScrollView.this,
              this,
              ReactScrollViewHelper.MOMENTUM_DELAY);
          } else {
            if (mSendMomentumEvents) {
              ReactScrollViewHelper.emitScrollMomentumEndEvent(ReactHorizontalScrollView.this);
            }
            ReactHorizontalScrollView.this.mPostTouchRunnable = null;
            disableFpsListener();
          }
        }
      }
    };
    ViewCompat.postOnAnimationDelayed(ReactHorizontalScrollView.this,
      mPostTouchRunnable,
      ReactScrollViewHelper.MOMENTUM_DELAY);
  }

  /**
   * This will smooth scroll us to the nearest page boundary
   * It currently just looks at where the content is relative to the page and slides to the nearest
   * page.  It is intended to be run after we are done scrolling, and handling any momentum
   * scrolling.
   */
  private void smoothScrollToPage(int velocity) {
    int width = getSnapInterval();
    int currentX = getScrollX();
    // TODO (t11123799) - Should we do anything beyond linear accounting of the velocity
    int predictedX = currentX + velocity;
    int page = currentX / width;
    if (predictedX > page * width + width / 2) {
      page = page + 1;
    }
    smoothScrollTo(page * width, getScrollY());
  }

  @Override
  public void setBackgroundColor(int color) {
    mReactBackgroundManager.setBackgroundColor(color);
  }

  public void setBorderWidth(int position, float width) {
    mReactBackgroundManager.setBorderWidth(position, width);
  }

  public void setBorderColor(int position, float color, float alpha) {
    mReactBackgroundManager.setBorderColor(position, color, alpha);
  }

  public void setBorderRadius(float borderRadius) {
    mReactBackgroundManager.setBorderRadius(borderRadius);
  }

  public void setBorderRadius(float borderRadius, int position) {
    mReactBackgroundManager.setBorderRadius(borderRadius, position);
  }

  public void setBorderStyle(@Nullable String style) {
    mReactBackgroundManager.setBorderStyle(style);
  }

}
