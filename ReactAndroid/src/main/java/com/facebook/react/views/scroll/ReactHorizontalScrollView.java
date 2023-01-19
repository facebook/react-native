/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import static com.facebook.react.views.scroll.ReactScrollViewHelper.SNAP_ALIGNMENT_CENTER;
import static com.facebook.react.views.scroll.ReactScrollViewHelper.SNAP_ALIGNMENT_DISABLED;
import static com.facebook.react.views.scroll.ReactScrollViewHelper.SNAP_ALIGNMENT_END;
import static com.facebook.react.views.scroll.ReactScrollViewHelper.SNAP_ALIGNMENT_START;

import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
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
import android.view.ViewGroup;
import android.widget.HorizontalScrollView;
import android.widget.OverScroller;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.FabricViewStateManager;
import com.facebook.react.uimanager.MeasureSpecAssertions;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ReactClippingViewGroup;
import com.facebook.react.uimanager.ReactClippingViewGroupHelper;
import com.facebook.react.uimanager.ReactOverflowViewWithInset;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.events.NativeGestureUtil;
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasFlingAnimator;
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasScrollEventThrottle;
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasScrollState;
import com.facebook.react.views.scroll.ReactScrollViewHelper.ReactScrollViewScrollState;
import com.facebook.react.views.view.ReactViewBackgroundManager;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

/** Similar to {@link ReactScrollView} but only supports horizontal scrolling. */
public class ReactHorizontalScrollView extends HorizontalScrollView
    implements ReactClippingViewGroup,
        FabricViewStateManager.HasFabricViewStateManager,
        ReactOverflowViewWithInset,
        HasScrollState,
        HasFlingAnimator,
        HasScrollEventThrottle {

  private static boolean DEBUG_MODE = false && ReactBuildConfig.DEBUG;
  private static String TAG = ReactHorizontalScrollView.class.getSimpleName();

  private static int NO_SCROLL_POSITION = Integer.MIN_VALUE;

  private static @Nullable Field sScrollerField;
  private static boolean sTriedToGetScrollerField = false;

  private int mScrollXAfterMeasure = NO_SCROLL_POSITION;

  private static final int UNSET_CONTENT_OFFSET = -1;

  private final OnScrollDispatchHelper mOnScrollDispatchHelper = new OnScrollDispatchHelper();
  private final @Nullable OverScroller mScroller;
  private final VelocityHelper mVelocityHelper = new VelocityHelper();
  private final Rect mRect = new Rect();
  private final Rect mOverflowInset = new Rect();

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
  private @Nullable List<Integer> mSnapOffsets;
  private boolean mSnapToStart = true;
  private boolean mSnapToEnd = true;
  private int mSnapToAlignment = SNAP_ALIGNMENT_DISABLED;
  private ReactViewBackgroundManager mReactBackgroundManager;
  private boolean mPagedArrowScrolling = false;
  private int pendingContentOffsetX = UNSET_CONTENT_OFFSET;
  private int pendingContentOffsetY = UNSET_CONTENT_OFFSET;
  private final FabricViewStateManager mFabricViewStateManager = new FabricViewStateManager();
  private final ReactScrollViewScrollState mReactScrollViewScrollState;
  private final ValueAnimator DEFAULT_FLING_ANIMATOR = ObjectAnimator.ofInt(this, "scrollX", 0, 0);
  private PointerEvents mPointerEvents = PointerEvents.AUTO;
  private long mLastScrollDispatchTime = 0;
  private int mScrollEventThrottle = 0;

  private final Rect mTempRect = new Rect();

  public ReactHorizontalScrollView(Context context) {
    this(context, null);
  }

  public ReactHorizontalScrollView(Context context, @Nullable FpsListener fpsListener) {
    super(context);
    mReactBackgroundManager = new ReactViewBackgroundManager(this);
    mFpsListener = fpsListener;

    ViewCompat.setAccessibilityDelegate(this, new ReactScrollViewAccessibilityDelegate());

    mScroller = getOverScrollerFromParent();
    mReactScrollViewScrollState =
        new ReactScrollViewScrollState(
            I18nUtil.getInstance().isRTL(context)
                ? ViewCompat.LAYOUT_DIRECTION_RTL
                : ViewCompat.LAYOUT_DIRECTION_LTR);
  }

  public boolean getScrollEnabled() {
    return mScrollEnabled;
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
            TAG,
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
              TAG,
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
    getReactScrollViewScrollState().setDecelerationRate(decelerationRate);

    if (mScroller != null) {
      mScroller.setFriction(1.0f - decelerationRate);
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

  public void setSnapToAlignment(int snapToAlignment) {
    mSnapToAlignment = snapToAlignment;
  }

  public void flashScrollIndicators() {
    awakenScrollBars();
  }

  public void setOverflow(String overflow) {
    mOverflow = overflow;
    invalidate();
  }

  @Override
  public @Nullable String getOverflow() {
    return mOverflow;
  }

  @Override
  public void setOverflowInset(int left, int top, int right, int bottom) {
    mOverflowInset.set(left, top, right, bottom);
  }

  @Override
  public Rect getOverflowInset() {
    return mOverflowInset;
  }

  @Override
  protected void onDraw(Canvas canvas) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "onDraw[%d]", getId());
    }

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

    int measuredWidth = MeasureSpec.getSize(widthMeasureSpec);
    int measuredHeight = MeasureSpec.getSize(heightMeasureSpec);

    if (DEBUG_MODE) {
      FLog.i(
          TAG,
          "onMeasure[%d] measured width: %d measured height: %d",
          getId(),
          measuredWidth,
          measuredHeight);
    }

    boolean measuredHeightChanged = getMeasuredHeight() != measuredHeight;

    setMeasuredDimension(measuredWidth, measuredHeight);

    // See how `mScrollXAfterMeasure` is used in `onLayout`, and why we only enable the
    // hack if the height has changed.
    if (measuredHeightChanged && mScroller != null) {
      mScrollXAfterMeasure = mScroller.getCurrX();
    }
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "onLayout[%d] l %d t %d r %d b %d", getId(), l, t, r, b);
    }

    // Has the scrollX changed between the last onMeasure and this layout?
    // If so, cancel the animation.
    // Essentially, if the height changes (due to keyboard popping up, for instance) the
    // underlying View.layout method will in some cases scroll to an incorrect X position -
    // see also the hacks in `fling`. The order of layout is called in the order of: onMeasure,
    // layout, onLayout.
    // We cannot override `layout` but we can detect the sequence of events between onMeasure
    // and onLayout.
    if (mScrollXAfterMeasure != NO_SCROLL_POSITION
        && mScroller != null
        && mScrollXAfterMeasure != mScroller.getFinalX()
        && !mScroller.isFinished()) {
      if (DEBUG_MODE) {
        FLog.i(
            TAG,
            "onLayout[%d] scroll hack enabled: reset to previous scrollX position of %d",
            getId(),
            mScrollXAfterMeasure);
      }
      mScroller.startScroll(mScrollXAfterMeasure, mScroller.getFinalY(), 0, 0);
      mScroller.forceFinished(true);
      mScrollXAfterMeasure = NO_SCROLL_POSITION;
    }

    // Call with the present values in order to re-layout if necessary
    // If a "pending" value has been set, we restore that value.
    // That value gets cleared by reactScrollTo.
    int scrollToX =
        pendingContentOffsetX != UNSET_CONTENT_OFFSET ? pendingContentOffsetX : getScrollX();
    int scrollToY =
        pendingContentOffsetY != UNSET_CONTENT_OFFSET ? pendingContentOffsetY : getScrollY();
    scrollTo(scrollToX, scrollToY);
    ReactScrollViewHelper.emitLayoutEvent(this);
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
  public boolean isPartiallyScrolledInView(View descendent) {
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
    if (DEBUG_MODE) {
      FLog.i(TAG, "onScrollChanged[%d] x %d y %d oldx %d oldy %d", getId(), x, y, oldX, oldY);
    }

    super.onScrollChanged(x, y, oldX, oldY);

    mActivelyScrolling = true;

    if (mOnScrollDispatchHelper.onScrollChanged(x, y)) {
      if (mRemoveClippedSubviews) {
        updateClippingRect();
      }

      ReactScrollViewHelper.updateStateOnScrollChanged(
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

    // We intercept the touch event if the children are not supposed to receive it.
    if (!PointerEvents.canChildrenBeTouchTarget(mPointerEvents)) {
      return true;
    }

    try {
      if (super.onInterceptTouchEvent(ev)) {
        handleInterceptedTouchEvent(ev);
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

  protected void handleInterceptedTouchEvent(MotionEvent ev) {
    NativeGestureUtil.notifyNativeGestureStarted(this, ev);
    ReactScrollViewHelper.emitScrollBeginDragEvent(this);
    mDragging = true;
    enableFpsListener();
    getFlingAnimator().cancel();
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
        View rootChild = getContentView();
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

    // We do not accept the touch event if this view is not supposed to receive it.
    if (!PointerEvents.canBeTouchTarget(mPointerEvents)) {
      return false;
    }

    mVelocityHelper.calculateVelocity(ev);
    int action = ev.getActionMasked();
    if (action == MotionEvent.ACTION_UP && mDragging) {
      ReactScrollViewHelper.updateFabricScrollState(this);

      float velocityX = mVelocityHelper.getXVelocity();
      float velocityY = mVelocityHelper.getYVelocity();
      ReactScrollViewHelper.emitScrollEndDragEvent(this, velocityX, velocityY);
      NativeGestureUtil.notifyNativeGestureEnded(this, ev);
      mDragging = false;
      // After the touch finishes, we may need to do some scrolling afterwards either as a result
      // of a fling or because we need to page align the content
      handlePostTouchScrolling(Math.round(velocityX), Math.round(velocityY));
    }

    if (action == MotionEvent.ACTION_DOWN) {
      cancelPostTouchScrolling();
    }

    return super.onTouchEvent(ev);
  }

  @Override
  public boolean dispatchGenericPointerEvent(MotionEvent ev) {
    // We do not dispatch the pointer event if its children are not supposed to receive it
    if (!PointerEvents.canChildrenBeTouchTarget(mPointerEvents)) {
      return false;
    }

    return super.dispatchGenericPointerEvent(ev);
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
    if (DEBUG_MODE) {
      FLog.i(TAG, "fling[%d] velocityX %d", getId(), velocityX);
    }

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
    View contentView = getContentView();
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
    return super.getChildVisibleRect(child, r, offset);
  }

  private int getSnapInterval() {
    if (mSnapInterval != 0) {
      return mSnapInterval;
    }
    return getWidth();
  }

  private View getContentView() {
    return getChildAt(0);
  }

  public void setEndFillColor(int color) {
    if (color != mEndFillColor) {
      mEndFillColor = color;
      mEndBackground = new ColorDrawable(mEndFillColor);
    }
  }

  @Override
  protected void onOverScrolled(int scrollX, int scrollY, boolean clampedX, boolean clampedY) {
    if (DEBUG_MODE) {
      FLog.i(
          TAG,
          "onOverScrolled[%d] scrollX %d scrollY %d clampedX %b clampedY %b",
          getId(),
          scrollX,
          scrollY,
          clampedX,
          clampedY);
    }

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
      final View content = getContentView();
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
    if (DEBUG_MODE) {
      FLog.i(
          TAG,
          "handlePostTouchScrolling[%d] velocityX %d velocityY %d",
          getId(),
          velocityX,
          velocityY);
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
          private boolean mRunning = true;
          private int mStableFrames = 0;

          @Override
          public void run() {
            if (mActivelyScrolling) {
              // We are still scrolling.
              mActivelyScrolling = false;
              mStableFrames = 0;
              mRunning = true;
            } else {
              // There has not been a scroll update since the last time this Runnable executed.
              ReactScrollViewHelper.updateFabricScrollState(ReactHorizontalScrollView.this);

              // We keep checking for updates until the ScrollView has "stabilized" and hasn't
              // scrolled for N consecutive frames. This number is arbitrary: big enough to catch
              // a number of race conditions, but small enough to not cause perf regressions, etc.
              // In anecdotal testing, it seemed like a decent number.
              // Without this check, sometimes this Runnable stops executing too soon - it will
              // fire before the first scroll event of an animated scroll/fling, and stop
              // immediately.
              mStableFrames++;
              mRunning = (mStableFrames < 3);

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
                disableFpsListener();
              }
            }

            // We are still scrolling so we just post to check again a frame later
            if (mRunning) {
              ViewCompat.postOnAnimationDelayed(
                  ReactHorizontalScrollView.this, this, ReactScrollViewHelper.MOMENTUM_DELAY);
            } else {
              mPostTouchRunnable = null;
            }
          }
        };
    ViewCompat.postOnAnimationDelayed(
        this, mPostTouchRunnable, ReactScrollViewHelper.MOMENTUM_DELAY);
  }

  private void cancelPostTouchScrolling() {
    if (mPostTouchRunnable != null) {
      removeCallbacks(mPostTouchRunnable);
      mPostTouchRunnable = null;
      getFlingAnimator().cancel();
    }
  }

  private int predictFinalScrollPosition(int velocityX) {
    // predict where a fling would end up so we can scroll to the nearest snap offset
    final int maximumOffset = Math.max(0, computeHorizontalScrollRange() - getWidth());
    // TODO(T106335409): Existing prediction still uses overscroller. Consider change this to use
    // fling animator instead.
    return getFlingAnimator() == DEFAULT_FLING_ANIMATOR
        ? ReactScrollViewHelper.predictFinalScrollPosition(this, velocityX, 0, maximumOffset, 0).x
        : ReactScrollViewHelper.getNextFlingStartValue(
                this,
                getScrollX(),
                getReactScrollViewScrollState().getFinalAnimatedPositionScroll().x,
                velocityX)
            + getFlingExtrapolatedDistance(velocityX);
  }

  /**
   * This will smooth scroll us to the nearest snap offset point. It currently just looks at where
   * the content is and slides to the nearest point. It is intended to be run after we are done
   * scrolling, and handling any momentum scrolling.
   */
  private void smoothScrollAndSnap(int velocity) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "smoothScrollAndSnap[%d] velocity %d", getId(), velocity);
    }

    double interval = (double) getSnapInterval();
    double currentOffset =
        (double)
            (ReactScrollViewHelper.getNextFlingStartValue(
                this,
                getScrollX(),
                getReactScrollViewScrollState().getFinalAnimatedPositionScroll().x,
                velocity));
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
    if (DEBUG_MODE) {
      FLog.i(TAG, "smoothScrollAndSnap[%d] velocityX %d", getId(), velocityX);
    }

    if (getChildCount() <= 0) {
      return;
    }

    // pagingEnabled only allows snapping one interval at a time
    if (mSnapInterval == 0 && mSnapOffsets == null && mSnapToAlignment == SNAP_ALIGNMENT_DISABLED) {
      smoothScrollAndSnap(velocityX);
      return;
    }

    boolean hasCustomizedFlingAnimator = getFlingAnimator() != DEFAULT_FLING_ANIMATOR;
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
    int layoutDirection = getReactScrollViewScrollState().getLayoutDirection();

    // offsets are from the right edge in RTL layouts
    if (layoutDirection == LAYOUT_DIRECTION_RTL) {
      targetOffset = maximumOffset - targetOffset;
      velocityX = -velocityX;
    }

    // get the nearest snap points to the target offset
    if (mSnapOffsets != null && !mSnapOffsets.isEmpty()) {
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
    } else if (mSnapToAlignment != SNAP_ALIGNMENT_DISABLED) {
      if (mSnapInterval > 0) {
        double ratio = (double) targetOffset / mSnapInterval;
        smallerOffset =
            Math.max(
                getItemStartOffset(
                    mSnapToAlignment,
                    (int) (Math.floor(ratio) * mSnapInterval),
                    mSnapInterval,
                    width),
                0);
        largerOffset =
            Math.min(
                getItemStartOffset(
                    mSnapToAlignment,
                    (int) (Math.ceil(ratio) * mSnapInterval),
                    mSnapInterval,
                    width),
                maximumOffset);
      } else {
        ViewGroup contentView = (ViewGroup) getContentView();
        int smallerChildOffset = largerOffset;
        int largerChildOffset = smallerOffset;
        for (int i = 0; i < contentView.getChildCount(); i++) {
          View item = contentView.getChildAt(i);
          int itemStartOffset =
              getItemStartOffset(mSnapToAlignment, item.getLeft(), item.getWidth(), width);
          if (itemStartOffset <= targetOffset) {
            if (targetOffset - itemStartOffset < targetOffset - smallerOffset) {
              smallerOffset = itemStartOffset;
            }
          }

          if (itemStartOffset >= targetOffset) {
            if (itemStartOffset - targetOffset < largerOffset - targetOffset) {
              largerOffset = itemStartOffset;
            }
          }

          smallerChildOffset = Math.min(smallerChildOffset, itemStartOffset);
          largerChildOffset = Math.max(largerChildOffset, itemStartOffset);
        }

        // For Recycler ViewGroup, the maximumOffset can be much larger than the total heights of
        // items in the layout. In this case snapping is not possible beyond the currently rendered
        // children.
        smallerOffset = Math.max(smallerOffset, smallerChildOffset);
        largerOffset = Math.min(largerOffset, largerChildOffset);
      }
    } else {
      double interval = getSnapInterval();
      double ratio = (double) targetOffset / interval;
      smallerOffset = (int) (Math.floor(ratio) * interval);
      largerOffset = Math.min((int) (Math.ceil(ratio) * interval), maximumOffset);
    }

    // Calculate the nearest offset
    int nearestOffset =
        Math.abs(targetOffset - smallerOffset) < Math.abs(largerOffset - targetOffset)
            ? smallerOffset
            : largerOffset;

    // if scrolling after the last snap offset and snapping to the
    // end of the list is disabled, then we allow free scrolling
    int currentOffset = getScrollX();
    if (layoutDirection == LAYOUT_DIRECTION_RTL) {
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
      if (!hasCustomizedFlingAnimator) {
        // The default animator requires boost on initial velocity as when snapping velocity can
        // feel sluggish for slow swipes
        velocityX += (int) ((largerOffset - targetOffset) * 10.0);
      }

      targetOffset = largerOffset;
    } else if (velocityX < 0) {
      if (!hasCustomizedFlingAnimator) {
        // The default animator requires boost on initial velocity as when snapping velocity can
        // feel sluggish for slow swipes
        velocityX -= (int) ((targetOffset - smallerOffset) * 10.0);
      }

      targetOffset = smallerOffset;
    } else {
      targetOffset = nearestOffset;
    }

    // Make sure the new offset isn't out of bounds
    targetOffset = Math.min(Math.max(0, targetOffset), maximumOffset);

    if (layoutDirection == LAYOUT_DIRECTION_RTL) {
      targetOffset = maximumOffset - targetOffset;
      velocityX = -velocityX;
    }

    if (hasCustomizedFlingAnimator || mScroller == null) {
      reactSmoothScrollTo(targetOffset, getScrollY());
    } else {
      // smoothScrollTo will always scroll over 250ms which is often *waaay*
      // too short and will cause the scrolling to feel almost instant
      // try to manually interact with OverScroller instead
      // if velocity is 0 however, fling() won't work, so we want to use smoothScrollTo
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
    }
  }

  private int getItemStartOffset(
      int snapToAlignment, int itemStartPosition, int itemWidth, int viewPortWidth) {
    int itemStartOffset;
    switch (snapToAlignment) {
      case SNAP_ALIGNMENT_CENTER:
        itemStartOffset = itemStartPosition - (viewPortWidth - itemWidth) / 2;
        break;
      case SNAP_ALIGNMENT_START:
        itemStartOffset = itemStartPosition;
        break;
      case SNAP_ALIGNMENT_END:
        itemStartOffset = itemStartPosition - (viewPortWidth - itemWidth);
        break;
      default:
        throw new IllegalStateException("Invalid SnapToAlignment value: " + mSnapToAlignment);
    }
    return itemStartOffset;
  }

  private void smoothScrollToNextPage(int direction) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "smoothScrollToNextPage[%d] direction %d", getId(), direction);
    }

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
    ReactScrollViewHelper.smoothScrollTo(this, x, y);
    setPendingContentOffsets(x, y);
  }

  /**
   * Calls `super.scrollTo` and updates state.
   *
   * <p>`super.scrollTo` changes `contentOffset` and we need to keep `contentOffset` in sync between
   * scroll view and state.
   *
   * <p>Note that while we can override scrollTo, we *cannot* override `smoothScrollTo` because it
   * is final. See `reactSmoothScrollTo`.
   */
  @Override
  public void scrollTo(int x, int y) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "scrollTo[%d] x %d y %d", getId(), x, y);
    }

    super.scrollTo(x, y);
    ReactScrollViewHelper.updateFabricScrollState(this);
    setPendingContentOffsets(x, y);
  }

  private boolean isContentReady() {
    View child = getContentView();
    return child != null && child.getWidth() != 0 && child.getHeight() != 0;
  }

  /**
   * If contentOffset is set before the View has been laid out, store the values and set them when
   * `onLayout` is called.
   *
   * @param x
   * @param y
   */
  private void setPendingContentOffsets(int x, int y) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "setPendingContentOffsets[%d] x %d y %d", getId(), x, y);
    }

    if (isContentReady()) {
      pendingContentOffsetX = UNSET_CONTENT_OFFSET;
      pendingContentOffsetY = UNSET_CONTENT_OFFSET;
    } else {
      pendingContentOffsetX = x;
      pendingContentOffsetY = y;
    }
  }

  @Override
  public FabricViewStateManager getFabricViewStateManager() {
    return mFabricViewStateManager;
  }

  @Override
  public ReactScrollViewScrollState getReactScrollViewScrollState() {
    return mReactScrollViewScrollState;
  }

  @Override
  public void startFlingAnimator(int start, int end) {
    // Always cancel existing animator before starting the new one. `smoothScrollTo` contains some
    // logic that, if called multiple times in a short amount of time, will treat all calls as part
    // of the same animation and will not lengthen the duration of the animation. This means that,
    // for example, if the user is scrolling rapidly, multiple pages could be considered part of one
    // animation, causing some page animations to be animated very rapidly - looking like they're
    // not animated at all.
    DEFAULT_FLING_ANIMATOR.cancel();

    // Update the fling animator with new values
    DEFAULT_FLING_ANIMATOR
        .setDuration(ReactScrollViewHelper.getDefaultScrollAnimationDuration(getContext()))
        .setIntValues(start, end);

    // Start the animator
    DEFAULT_FLING_ANIMATOR.start();
  }

  @Override
  public ValueAnimator getFlingAnimator() {
    return DEFAULT_FLING_ANIMATOR;
  }

  @Override
  public int getFlingExtrapolatedDistance(int velocityX) {
    // The DEFAULT_FLING_ANIMATOR uses AccelerateDecelerateInterpolator, which is not depending on
    // the init velocity. We use the overscroller to decide the fling distance.
    return ReactScrollViewHelper.predictFinalScrollPosition(
            this, velocityX, 0, Math.max(0, computeHorizontalScrollRange() - getWidth()), 0)
        .x;
  }

  public void setPointerEvents(PointerEvents pointerEvents) {
    mPointerEvents = pointerEvents;
  }

  public PointerEvents getPointerEvents() {
    return mPointerEvents;
  }

  @Override
  public void setScrollEventThrottle(int scrollEventThrottle) {
    mScrollEventThrottle = scrollEventThrottle;
  }

  @Override
  public int getScrollEventThrottle() {
    return mScrollEventThrottle;
  }

  @Override
  public void setLastScrollDispatchTime(long lastScrollDispatchTime) {
    mLastScrollDispatchTime = lastScrollDispatchTime;
  }

  @Override
  public long getLastScrollDispatchTime() {
    return mLastScrollDispatchTime;
  }
}
