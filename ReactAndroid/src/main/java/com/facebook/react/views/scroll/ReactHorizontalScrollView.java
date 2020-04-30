/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.view.FocusFinder;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.widget.HorizontalScrollView;
import android.widget.OverScroller;
import androidx.annotation.Nullable;
import androidx.core.text.TextUtilsCompat;
import androidx.core.view.ViewCompat;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.uimanager.MeasureSpecAssertions;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactClippingViewGroup;
import com.facebook.react.uimanager.ReactClippingViewGroupHelper;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.events.NativeGestureUtil;
import com.facebook.react.views.view.ReactViewBackgroundManager;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Similar to {@link ReactScrollView} but only supports horizontal scrolling. */
public class ReactHorizontalScrollView extends HorizontalScrollView
    implements ReactClippingViewGroup {

  private static @Nullable Field sScrollerField;
  private static boolean sTriedToGetScrollerField = false;
  private static final String CONTENT_OFFSET_LEFT = "contentOffsetLeft";
  private static final String CONTENT_OFFSET_TOP = "contentOffsetTop";

  private static final int UNSET_CONTENT_OFFSET = -1;

  private final OnScrollDispatchHelper mOnScrollDispatchHelper = new OnScrollDispatchHelper();
  private final @Nullable OverScroller mScroller;
  private final VelocityHelper mVelocityHelper = new VelocityHelper();
  private final Rect mRect = new Rect();

  private boolean mActivelyScrolling;
  private @Nullable Rect mClippingRect;
  private @Nullable String mOverflow = ViewProps.HIDDEN;
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
  private boolean mDisableIntervalMomentum = false;
  private int mSnapInterval = 0;
  private float mDecelerationRate = 0.985f;
  private @Nullable List<Integer> mSnapOffsets;
  private boolean mSnapToStart = true;
  private boolean mSnapToEnd = true;
  private ReactViewBackgroundManager mReactBackgroundManager;
  private boolean mPagedArrowScrolling = false;
  private int pendingContentOffsetX = UNSET_CONTENT_OFFSET;
  private int pendingContentOffsetY = UNSET_CONTENT_OFFSET;
  private @Nullable StateWrapper mStateWrapper;

  private final Rect mTempRect = new Rect();

  public ReactHorizontalScrollView(Context context) {
    this(context, null);
  }

  public ReactHorizontalScrollView(Context context, @Nullable FpsListener fpsListener) {
    super(context);
    mReactBackgroundManager = new ReactViewBackgroundManager(this);
    mFpsListener = fpsListener;

    mScroller = getOverScrollerFromParent();
  }

  @Nullable
  private OverScroller getOverScrollerFromParent() {
    OverScroller scroller;

    if (!sTriedToGetScrollerField) {
      sTriedToGetScrollerField = true;
      try {
        sScrollerField = HorizontalScrollView.class.getDeclaredField("mScroller");
        sScrollerField.setAccessible(true);
      } catch (NoSuchFieldException e) {
        FLog.w(
            ReactConstants.TAG,
            "Failed to get mScroller field for HorizontalScrollView! "
                + "This app will exhibit the bounce-back scrolling bug :(");
      }
    }

    if (sScrollerField != null) {
      try {
        Object scrollerValue = sScrollerField.get(this);
        if (scrollerValue instanceof OverScroller) {
          scroller = (OverScroller) scrollerValue;
        } else {
          FLog.w(
              ReactConstants.TAG,
              "Failed to cast mScroller field in HorizontalScrollView (probably due to OEM changes to AOSP)! "
                  + "This app will exhibit the bounce-back scrolling bug :(");
          scroller = null;
        }
      } catch (IllegalAccessException e) {
        throw new RuntimeException("Failed to get mScroller from HorizontalScrollView!", e);
      }
    } else {
      scroller = null;
    }

    return scroller;
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

  public void setDisableIntervalMomentum(boolean disableIntervalMomentum) {
    mDisableIntervalMomentum = disableIntervalMomentum;
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

  public void setDecelerationRate(float decelerationRate) {
    mDecelerationRate = decelerationRate;

    if (mScroller != null) {
      mScroller.setFriction(1.0f - mDecelerationRate);
    }
  }

  public void setSnapInterval(int snapInterval) {
    mSnapInterval = snapInterval;
  }

  public void setSnapOffsets(List<Integer> snapOffsets) {
    mSnapOffsets = snapOffsets;
  }

  public void setSnapToStart(boolean snapToStart) {
    mSnapToStart = snapToStart;
  }

  public void setSnapToEnd(boolean snapToEnd) {
    mSnapToEnd = snapToEnd;
  }

  public void flashScrollIndicators() {
    awakenScrollBars();
  }

  public void setOverflow(String overflow) {
    mOverflow = overflow;
    invalidate();
  }

  @Override
  protected void onDraw(Canvas canvas) {
    getDrawingRect(mRect);

    switch (mOverflow) {
      case ViewProps.VISIBLE:
        break;
      default:
        canvas.clipRect(mRect);
        break;
    }

    super.onDraw(canvas);
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    MeasureSpecAssertions.assertExplicitMeasureSpec(widthMeasureSpec, heightMeasureSpec);

    setMeasuredDimension(
        MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec));
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    // Call with the present values in order to re-layout if necessary
    // If a "pending" value has been set, we restore that value.
    // That value gets cleared by reactScrollTo.
    int scrollToX =
        pendingContentOffsetX != UNSET_CONTENT_OFFSET ? pendingContentOffsetX : getScrollX();
    int scrollToY =
        pendingContentOffsetY != UNSET_CONTENT_OFFSET ? pendingContentOffsetY : getScrollY();
    reactScrollTo(scrollToX, scrollToY);
  }

  /**
   * Since ReactHorizontalScrollView handles layout changes on JS side, it does not call
   * super.onlayout due to which mIsLayoutDirty flag in HorizontalScrollView remains true and
   * prevents scrolling to child when requestChildFocus is called. Overriding this method and
   * scrolling to child without checking any layout dirty flag. This will fix focus navigation issue
   * for KeyEvents which are not handled in HorizontalScrollView, for example: KEYCODE_TAB.
   */
  @Override
  public void requestChildFocus(View child, View focused) {
    if (focused != null && !mPagingEnabled) {
      scrollToChild(focused);
    }
    super.requestChildFocus(child, focused);
  }

  @Override
  public void addFocusables(ArrayList<View> views, int direction, int focusableMode) {
    if (mPagingEnabled && !mPagedArrowScrolling) {
      // Only add elements within the current page to list of focusables
      ArrayList<View> candidateViews = new ArrayList<View>();
      super.addFocusables(candidateViews, direction, focusableMode);
      for (View candidate : candidateViews) {
        // We must also include the currently focused in the focusables list or focus search will
        // always
        // return the first element within the focusables list
        if (isScrolledInView(candidate)
            || isPartiallyScrolledInView(candidate)
            || candidate.isFocused()) {
          views.add(candidate);
        }
      }
    } else {
      super.addFocusables(views, direction, focusableMode);
    }
  }

  /** Calculates the x delta required to scroll the given descendent into view */
  private int getScrollDelta(View descendent) {
    descendent.getDrawingRect(mTempRect);
    offsetDescendantRectToMyCoords(descendent, mTempRect);
    return computeScrollDeltaToGetChildRectOnScreen(mTempRect);
  }

  /** Returns whether the given descendent is scrolled fully in view */
  private boolean isScrolledInView(View descendent) {
    return getScrollDelta(descendent) == 0;
  }

  /** Returns whether the given descendent is partially scrolled in view */
  private boolean isPartiallyScrolledInView(View descendent) {
    int scrollDelta = getScrollDelta(descendent);
    descendent.getDrawingRect(mTempRect);
    return scrollDelta != 0 && Math.abs(scrollDelta) < mTempRect.width();
  }

  /** Returns whether the given descendent is "mostly" (>50%) scrolled in view */
  private boolean isMostlyScrolledInView(View descendent) {
    int scrollDelta = getScrollDelta(descendent);
    descendent.getDrawingRect(mTempRect);
    return scrollDelta != 0 && Math.abs(scrollDelta) < (mTempRect.width() / 2);
  }

  private void scrollToChild(View child) {
    int scrollDelta = getScrollDelta(child);

    if (scrollDelta != 0) {
      scrollBy(scrollDelta, 0);
    }
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

    try {
      if (super.onInterceptTouchEvent(ev)) {
        NativeGestureUtil.notifyNativeGestureStarted(this, ev);
        ReactScrollViewHelper.emitScrollBeginDragEvent(this);
        mDragging = true;
        enableFpsListener();
        return true;
      }
    } catch (IllegalArgumentException e) {
      // Log and ignore the error. This seems to be a bug in the android SDK and
      // this is the commonly accepted workaround.
      // https://tinyurl.com/mw6qkod (Stack Overflow)
      FLog.w(ReactConstants.TAG, "Error intercepting touch event.", e);
    }

    return false;
  }

  @Override
  public boolean pageScroll(int direction) {
    boolean handled = super.pageScroll(direction);

    if (mPagingEnabled && handled) {
      handlePostTouchScrolling(0, 0);
    }

    return handled;
  }

  @Override
  public boolean arrowScroll(int direction) {
    boolean handled = false;

    if (mPagingEnabled) {
      mPagedArrowScrolling = true;

      if (getChildCount() > 0) {
        View currentFocused = findFocus();
        View nextFocused = FocusFinder.getInstance().findNextFocus(this, currentFocused, direction);
        View rootChild = getChildAt(0);
        if (rootChild != null && nextFocused != null && nextFocused.getParent() == rootChild) {
          if (!isScrolledInView(nextFocused) && !isMostlyScrolledInView(nextFocused)) {
            smoothScrollToNextPage(direction);
          }
          nextFocused.requestFocus();
          handled = true;
        } else {
          smoothScrollToNextPage(direction);
          handled = true;
        }
      }

      mPagedArrowScrolling = false;
    } else {
      handled = super.arrowScroll(direction);
    }

    return handled;
  }

  @Override
  public boolean onTouchEvent(MotionEvent ev) {
    if (!mScrollEnabled) {
      return false;
    }

    mVelocityHelper.calculateVelocity(ev);
    int action = ev.getAction() & MotionEvent.ACTION_MASK;
    if (action == MotionEvent.ACTION_UP && mDragging) {
      updateStateOnScroll(getScrollX(), getScrollY());

      float velocityX = mVelocityHelper.getXVelocity();
      float velocityY = mVelocityHelper.getYVelocity();
      ReactScrollViewHelper.emitScrollEndDragEvent(this, velocityX, velocityY);
      mDragging = false;
      // After the touch finishes, we may need to do some scrolling afterwards either as a result
      // of a fling or because we need to page align the content
      handlePostTouchScrolling(Math.round(velocityX), Math.round(velocityY));
    }

    return super.onTouchEvent(ev);
  }

  @Override
  public boolean executeKeyEvent(KeyEvent event) {
    int eventKeyCode = event.getKeyCode();
    if (!mScrollEnabled
        && (eventKeyCode == KeyEvent.KEYCODE_DPAD_LEFT
            || eventKeyCode == KeyEvent.KEYCODE_DPAD_RIGHT)) {
      return false;
    }
    return super.executeKeyEvent(event);
  }

  @Override
  public void fling(int velocityX) {

    // Workaround.
    // On Android P if a ScrollView is inverted, we will get a wrong sign for
    // velocityX (see https://issuetracker.google.com/issues/112385925).
    // At the same time, mOnScrollDispatchHelper tracks the correct velocity direction.
    //
    // Hence, we can use the absolute value from whatever the OS gives
    // us and use the sign of what mOnScrollDispatchHelper has tracked.
    final int correctedVelocityX =
        (int) (Math.abs(velocityX) * Math.signum(mOnScrollDispatchHelper.getXFlingVelocity()));

    if (mPagingEnabled) {
      flingAndSnap(correctedVelocityX);
    } else if (mScroller != null) {
      // FB SCROLLVIEW CHANGE

      // We provide our own version of fling that uses a different call to the standard OverScroller
      // which takes into account the possibility of adding new content while the ScrollView is
      // animating. Because we give essentially no max X for the fling, the fling will continue as
      // long
      // as there is content. See #onOverScrolled() to see the second part of this change which
      // properly
      // aborts the scroller animation when we get to the bottom of the ScrollView content.

      int scrollWindowWidth =
          getWidth() - ViewCompat.getPaddingStart(this) - ViewCompat.getPaddingEnd(this);

      mScroller.fling(
          getScrollX(), // startX
          getScrollY(), // startY
          correctedVelocityX, // velocityX
          0, // velocityY
          0, // minX
          Integer.MAX_VALUE, // maxX
          0, // minY
          0, // maxY
          scrollWindowWidth / 2, // overX
          0 // overY
          );

      ViewCompat.postInvalidateOnAnimation(this);

      // END FB SCROLLVIEW CHANGE
    } else {
      super.fling(correctedVelocityX);
    }
    handlePostTouchScrolling(correctedVelocityX, 0);
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

  @Override
  public boolean getChildVisibleRect(View child, Rect r, android.graphics.Point offset) {
    return ReactFeatureFlags.clipChildRectsIfOverflowIsHidden
        ? ReactClippingViewGroupHelper.getChildVisibleRectHelper(child, r, offset, this, mOverflow)
        : super.getChildVisibleRect(child, r, offset);
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

  @Override
  protected void onOverScrolled(int scrollX, int scrollY, boolean clampedX, boolean clampedY) {
    if (mScroller != null) {
      // FB SCROLLVIEW CHANGE

      // This is part two of the reimplementation of fling to fix the bounce-back bug. See #fling()
      // for
      // more information.

      if (!mScroller.isFinished() && mScroller.getCurrX() != mScroller.getFinalX()) {
        int scrollRange = computeHorizontalScrollRange() - getWidth();
        if (scrollX >= scrollRange) {
          mScroller.abortAnimation();
          scrollX = scrollRange;
        }
      }

      // END FB SCROLLVIEW CHANGE
    }

    super.onOverScrolled(scrollX, scrollY, clampedX, clampedY);
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
   * This handles any sort of scrolling that may occur after a touch is finished. This may be
   * momentum scrolling (fling) or because you have pagingEnabled on the scroll view. Because we
   * don't get any events from Android about this lifecycle, we do all our detection by creating a
   * runnable that checks if we scrolled in the last frame and if so assumes we are still scrolling.
   */
  private void handlePostTouchScrolling(int velocityX, int velocityY) {
    // If we aren't going to do anything (send events or snap to page), we can early exit out.
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
    mPostTouchRunnable =
        new Runnable() {

          private boolean mSnappingToPage = false;

          @Override
          public void run() {
            if (mActivelyScrolling) {
              // We are still scrolling so we just post to check again a frame later
              mActivelyScrolling = false;
              ViewCompat.postOnAnimationDelayed(
                  ReactHorizontalScrollView.this, this, ReactScrollViewHelper.MOMENTUM_DELAY);
            } else {
              updateStateOnScroll(getScrollX(), getScrollY());

              if (mPagingEnabled && !mSnappingToPage) {
                // Only if we have pagingEnabled and we have not snapped to the page do we
                // need to continue checking for the scroll.  And we cause that scroll by asking for
                // it
                mSnappingToPage = true;
                flingAndSnap(0);
                ViewCompat.postOnAnimationDelayed(
                    ReactHorizontalScrollView.this, this, ReactScrollViewHelper.MOMENTUM_DELAY);
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
    ViewCompat.postOnAnimationDelayed(
        ReactHorizontalScrollView.this, mPostTouchRunnable, ReactScrollViewHelper.MOMENTUM_DELAY);
  }

  private int predictFinalScrollPosition(int velocityX) {
    // ScrollView can *only* scroll for 250ms when using smoothScrollTo and there's
    // no way to customize the scroll duration. So, we create a temporary OverScroller
    // so we can predict where a fling would land and snap to nearby that point.
    OverScroller scroller = new OverScroller(getContext());
    scroller.setFriction(1.0f - mDecelerationRate);

    // predict where a fling would end up so we can scroll to the nearest snap offset
    int maximumOffset = Math.max(0, computeHorizontalScrollRange() - getWidth());
    int width = getWidth() - ViewCompat.getPaddingStart(this) - ViewCompat.getPaddingEnd(this);
    scroller.fling(
        getScrollX(), // startX
        getScrollY(), // startY
        velocityX, // velocityX
        0, // velocityY
        0, // minX
        maximumOffset, // maxX
        0, // minY
        0, // maxY
        width / 2, // overX
        0 // overY
        );
    return scroller.getFinalX();
  }

  /**
   * This will smooth scroll us to the nearest snap offset point It currently just looks at where
   * the content is and slides to the nearest point. It is intended to be run after we are done
   * scrolling, and handling any momentum scrolling.
   */
  private void smoothScrollAndSnap(int velocity) {
    double interval = (double) getSnapInterval();
    double currentOffset = (double) getScrollX();
    double targetOffset = (double) predictFinalScrollPosition(velocity);

    int previousPage = (int) Math.floor(currentOffset / interval);
    int nextPage = (int) Math.ceil(currentOffset / interval);
    int currentPage = (int) Math.round(currentOffset / interval);
    int targetPage = (int) Math.round(targetOffset / interval);

    if (velocity > 0 && nextPage == previousPage) {
      nextPage++;
    } else if (velocity < 0 && previousPage == nextPage) {
      previousPage--;
    }

    if (
    // if scrolling towards next page
    velocity > 0
        &&
        // and the middle of the page hasn't been crossed already
        currentPage < nextPage
        &&
        // and it would have been crossed after flinging
        targetPage > previousPage) {
      currentPage = nextPage;
    } else if (
    // if scrolling towards previous page
    velocity < 0
        &&
        // and the middle of the page hasn't been crossed already
        currentPage > previousPage
        &&
        // and it would have been crossed after flinging
        targetPage < nextPage) {
      currentPage = previousPage;
    }

    targetOffset = currentPage * interval;
    if (targetOffset != currentOffset) {
      mActivelyScrolling = true;
      reactSmoothScrollTo((int) targetOffset, getScrollY());
    }
  }

  private void flingAndSnap(int velocityX) {
    if (getChildCount() <= 0) {
      return;
    }

    // pagingEnabled only allows snapping one interval at a time
    if (mSnapInterval == 0 && mSnapOffsets == null) {
      smoothScrollAndSnap(velocityX);
      return;
    }

    int maximumOffset = Math.max(0, computeHorizontalScrollRange() - getWidth());
    int targetOffset = predictFinalScrollPosition(velocityX);
    if (mDisableIntervalMomentum) {
      targetOffset = getScrollX();
    }

    int smallerOffset = 0;
    int largerOffset = maximumOffset;
    int firstOffset = 0;
    int lastOffset = maximumOffset;
    int width = getWidth() - ViewCompat.getPaddingStart(this) - ViewCompat.getPaddingEnd(this);

    // offsets are from the right edge in RTL layouts
    boolean isRTL =
        TextUtilsCompat.getLayoutDirectionFromLocale(Locale.getDefault())
            == ViewCompat.LAYOUT_DIRECTION_RTL;
    if (isRTL) {
      targetOffset = maximumOffset - targetOffset;
      velocityX = -velocityX;
    }

    // get the nearest snap points to the target offset
    if (mSnapOffsets != null) {
      firstOffset = mSnapOffsets.get(0);
      lastOffset = mSnapOffsets.get(mSnapOffsets.size() - 1);

      for (int i = 0; i < mSnapOffsets.size(); i++) {
        int offset = mSnapOffsets.get(i);

        if (offset <= targetOffset) {
          if (targetOffset - offset < targetOffset - smallerOffset) {
            smallerOffset = offset;
          }
        }

        if (offset >= targetOffset) {
          if (offset - targetOffset < largerOffset - targetOffset) {
            largerOffset = offset;
          }
        }
      }
    } else {
      double interval = (double) getSnapInterval();
      double ratio = (double) targetOffset / interval;
      smallerOffset = (int) (Math.floor(ratio) * interval);
      largerOffset = Math.min((int) (Math.ceil(ratio) * interval), maximumOffset);
    }

    // Calculate the nearest offset
    int nearestOffset =
        targetOffset - smallerOffset < largerOffset - targetOffset ? smallerOffset : largerOffset;

    // if scrolling after the last snap offset and snapping to the
    // end of the list is disabled, then we allow free scrolling
    int currentOffset = getScrollX();
    if (isRTL) {
      currentOffset = maximumOffset - currentOffset;
    }
    if (!mSnapToEnd && targetOffset >= lastOffset) {
      if (currentOffset >= lastOffset) {
        // free scrolling
      } else {
        // snap to end
        targetOffset = lastOffset;
      }
    } else if (!mSnapToStart && targetOffset <= firstOffset) {
      if (currentOffset <= firstOffset) {
        // free scrolling
      } else {
        // snap to beginning
        targetOffset = firstOffset;
      }
    } else if (velocityX > 0) {
      // when snapping velocity can feel sluggish for slow swipes
      velocityX += (int) ((largerOffset - targetOffset) * 10.0);

      targetOffset = largerOffset;
    } else if (velocityX < 0) {
      // when snapping velocity can feel sluggish for slow swipes
      velocityX -= (int) ((targetOffset - smallerOffset) * 10.0);

      targetOffset = smallerOffset;
    } else {
      targetOffset = nearestOffset;
    }

    // Make sure the new offset isn't out of bounds
    targetOffset = Math.min(Math.max(0, targetOffset), maximumOffset);

    if (isRTL) {
      targetOffset = maximumOffset - targetOffset;
      velocityX = -velocityX;
    }

    // smoothScrollTo will always scroll over 250ms which is often *waaay*
    // too short and will cause the scrolling to feel almost instant
    // try to manually interact with OverScroller instead
    // if velocity is 0 however, fling() won't work, so we want to use smoothScrollTo
    if (mScroller != null) {
      mActivelyScrolling = true;

      mScroller.fling(
          getScrollX(), // startX
          getScrollY(), // startY
          // velocity = 0 doesn't work with fling() so we pretend there's a reasonable
          // initial velocity going on when a touch is released without any movement
          velocityX != 0 ? velocityX : targetOffset - getScrollX(), // velocityX
          0, // velocityY
          // setting both minX and maxX to the same value will guarantee that we scroll to it
          // but using the standard fling-style easing rather than smoothScrollTo's 250ms animation
          targetOffset, // minX
          targetOffset, // maxX
          0, // minY
          0, // maxY
          // we only want to allow overscrolling if the final offset is at the very edge of the view
          (targetOffset == 0 || targetOffset == maximumOffset) ? width / 2 : 0, // overX
          0 // overY
          );

      postInvalidateOnAnimation();
    } else {
      reactSmoothScrollTo(targetOffset, getScrollY());
    }
  }

  private void smoothScrollToNextPage(int direction) {
    int width = getWidth();
    int currentX = getScrollX();

    int page = currentX / width;
    if (currentX % width != 0) {
      page++;
    }

    if (direction == View.FOCUS_LEFT) {
      page = page - 1;
    } else {
      page = page + 1;
    }

    if (page < 0) {
      page = 0;
    }

    reactSmoothScrollTo(page * width, getScrollY());
    handlePostTouchScrolling(0, 0);
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

  /**
   * Calls `smoothScrollTo` and updates state.
   *
   * <p>`smoothScrollTo` changes `contentOffset` and we need to keep `contentOffset` in sync between
   * scroll view and state. Calling raw `smoothScrollTo` doesn't update state.
   */
  public void reactSmoothScrollTo(int x, int y) {
    smoothScrollTo(x, y);
    updateStateOnScroll(x, y);
    setPendingContentOffsets(x, y);
  }

  /**
   * Calls `reactScrollTo` and updates state.
   *
   * <p>`reactScrollTo` changes `contentOffset` and we need to keep `contentOffset` in sync between
   * scroll view and state. Calling raw `reactScrollTo` doesn't update state.
   */
  public void reactScrollTo(int x, int y) {
    scrollTo(x, y);
    updateStateOnScroll(x, y);
    setPendingContentOffsets(x, y);
  }

  /**
   * If contentOffset is set before the View has been laid out, store the values and set them when
   * `onLayout` is called.
   *
   * @param x
   * @param y
   */
  private void setPendingContentOffsets(int x, int y) {
    View child = getChildAt(0);
    if (child != null && child.getWidth() != 0 && child.getHeight() != 0) {
      pendingContentOffsetX = UNSET_CONTENT_OFFSET;
      pendingContentOffsetY = UNSET_CONTENT_OFFSET;
    } else {
      pendingContentOffsetX = x;
      pendingContentOffsetY = y;
    }
  }

  public void updateState(@Nullable StateWrapper stateWrapper) {
    mStateWrapper = stateWrapper;
  }

  /**
   * Called on any stabilized onScroll change to propagate content offset value to a Shadow Node.
   */
  private void updateStateOnScroll(int scrollX, int scrollY) {
    if (mStateWrapper == null) {
      return;
    }

    WritableMap map = new WritableNativeMap();
    map.putDouble(CONTENT_OFFSET_LEFT, PixelUtil.toDIPFromPixel(scrollX));
    map.putDouble(CONTENT_OFFSET_TOP, PixelUtil.toDIPFromPixel(scrollY));

    mStateWrapper.updateState(map);
  }
}
