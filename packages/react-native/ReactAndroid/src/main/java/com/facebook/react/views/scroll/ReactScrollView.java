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
import android.os.Build;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.OverScroller;
import android.widget.ScrollView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.R;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.MeasureSpecAssertions;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ReactClippingViewGroup;
import com.facebook.react.uimanager.ReactClippingViewGroupHelper;
import com.facebook.react.uimanager.ReactOverflowViewWithInset;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.events.NativeGestureUtil;
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasFlingAnimator;
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasScrollEventThrottle;
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasScrollState;
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasSmoothScroll;
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasStateWrapper;
import com.facebook.react.views.scroll.ReactScrollViewHelper.ReactScrollViewScrollState;
import com.facebook.react.views.view.ReactViewBackgroundManager;
import java.lang.reflect.Field;
import java.util.List;

/**
 * A simple subclass of ScrollView that doesn't dispatch measure and layout to its children and has
 * a scroll listener to send scroll events to JS.
 *
 * <p>ReactScrollView only supports vertical scrolling. For horizontal scrolling, use {@link
 * ReactHorizontalScrollView}.
 */
public class ReactScrollView extends ScrollView
    implements ReactClippingViewGroup,
        ViewGroup.OnHierarchyChangeListener,
        View.OnLayoutChangeListener,
        ReactOverflowViewWithInset,
        HasScrollState,
        HasStateWrapper,
        HasFlingAnimator,
        HasScrollEventThrottle,
        HasSmoothScroll {

  private static @Nullable Field sScrollerField;
  private static boolean sTriedToGetScrollerField = false;

  private static final int UNSET_CONTENT_OFFSET = -1;

  private final OnScrollDispatchHelper mOnScrollDispatchHelper = new OnScrollDispatchHelper();
  private final @Nullable OverScroller mScroller;
  private final VelocityHelper mVelocityHelper = new VelocityHelper();
  private final Rect mRect = new Rect(); // for reuse to avoid allocation
  private final Rect mTempRect = new Rect();
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
  private @Nullable View mContentView;
  private ReactViewBackgroundManager mReactBackgroundManager;
  private @Nullable ReadableMap mCurrentContentOffset = null;
  private int pendingContentOffsetX = UNSET_CONTENT_OFFSET;
  private int pendingContentOffsetY = UNSET_CONTENT_OFFSET;
  private StateWrapper mStateWrapper = null;
  private final ReactScrollViewScrollState mReactScrollViewScrollState =
      new ReactScrollViewScrollState(ViewCompat.LAYOUT_DIRECTION_LTR);
  private final ValueAnimator DEFAULT_FLING_ANIMATOR = ObjectAnimator.ofInt(this, "scrollY", 0, 0);
  private PointerEvents mPointerEvents = PointerEvents.AUTO;
  private long mLastScrollDispatchTime = 0;
  private int mScrollEventThrottle = 0;
  private @Nullable MaintainVisibleScrollPositionHelper mMaintainVisibleContentPositionHelper =
      null;

  public ReactScrollView(Context context) {
    this(context, null);
  }

  public ReactScrollView(Context context, @Nullable FpsListener fpsListener) {
    super(context);
    mFpsListener = fpsListener;
    mReactBackgroundManager = new ReactViewBackgroundManager(this);

    mScroller = getOverScrollerFromParent();
    setOnHierarchyChangeListener(this);
    setScrollBarStyle(SCROLLBARS_OUTSIDE_OVERLAY);

    ViewCompat.setAccessibilityDelegate(this, new ReactScrollViewAccessibilityDelegate());
  }

  @Override
  public void onInitializeAccessibilityNodeInfo(AccessibilityNodeInfo info) {
    super.onInitializeAccessibilityNodeInfo(info);

    // Expose the testID prop as the resource-id name of the view. Black-box E2E/UI testing
    // frameworks, which interact with the UI through the accessibility framework, do not have
    // access to view tags. This allows developers/testers to avoid polluting the
    // content-description with test identifiers.
    final String testId = (String) this.getTag(R.id.react_test_id);
    if (testId != null) {
      info.setViewIdResourceName(testId);
    }
  }

  @Nullable
  private OverScroller getOverScrollerFromParent() {
    OverScroller scroller;

    if (!sTriedToGetScrollerField) {
      sTriedToGetScrollerField = true;
      try {
        sScrollerField = ScrollView.class.getDeclaredField("mScroller");
        sScrollerField.setAccessible(true);
      } catch (NoSuchFieldException e) {
        FLog.w(
            ReactConstants.TAG,
            "Failed to get mScroller field for ScrollView! "
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
              "Failed to cast mScroller field in ScrollView (probably due to OEM changes to AOSP)! "
                  + "This app will exhibit the bounce-back scrolling bug :(");
          scroller = null;
        }
      } catch (IllegalAccessException e) {
        throw new RuntimeException("Failed to get mScroller from ScrollView!", e);
      }
    } else {
      scroller = null;
    }

    return scroller;
  }

  public void setDisableIntervalMomentum(boolean disableIntervalMomentum) {
    mDisableIntervalMomentum = disableIntervalMomentum;
  }

  public void setSendMomentumEvents(boolean sendMomentumEvents) {
    mSendMomentumEvents = sendMomentumEvents;
  }

  public void setScrollPerfTag(@Nullable String scrollPerfTag) {
    mScrollPerfTag = scrollPerfTag;
  }

  public void setScrollEnabled(boolean scrollEnabled) {
    mScrollEnabled = scrollEnabled;
  }

  public boolean getScrollEnabled() {
    return mScrollEnabled;
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

  public void abortAnimation() {
    if (mScroller != null && !mScroller.isFinished()) {
      mScroller.abortAnimation();
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

  public void setMaintainVisibleContentPosition(
      @Nullable MaintainVisibleScrollPositionHelper.Config config) {
    if (config != null && mMaintainVisibleContentPositionHelper == null) {
      mMaintainVisibleContentPositionHelper = new MaintainVisibleScrollPositionHelper(this, false);
      mMaintainVisibleContentPositionHelper.start();
    } else if (config == null && mMaintainVisibleContentPositionHelper != null) {
      mMaintainVisibleContentPositionHelper.stop();
      mMaintainVisibleContentPositionHelper = null;
    }
    if (mMaintainVisibleContentPositionHelper != null) {
      mMaintainVisibleContentPositionHelper.setConfig(config);
    }
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
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    MeasureSpecAssertions.assertExplicitMeasureSpec(widthMeasureSpec, heightMeasureSpec);

    setMeasuredDimension(
        MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec));
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    // Apply pending contentOffset in case it was set before the view was laid out.
    if (isContentReady()) {
      // If a "pending" content offset value has been set, we restore that value.
      // Upon call to scrollTo, the "pending" values will be re-set.
      int scrollToX =
          pendingContentOffsetX != UNSET_CONTENT_OFFSET ? pendingContentOffsetX : getScrollX();
      int scrollToY =
          pendingContentOffsetY != UNSET_CONTENT_OFFSET ? pendingContentOffsetY : getScrollY();
      scrollTo(scrollToX, scrollToY);
    }

    ReactScrollViewHelper.emitLayoutEvent(this);
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
    if (mMaintainVisibleContentPositionHelper != null) {
      mMaintainVisibleContentPositionHelper.start();
    }
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    if (mMaintainVisibleContentPositionHelper != null) {
      mMaintainVisibleContentPositionHelper.stop();
    }
  }

  /**
   * Since ReactScrollView handles layout changes on JS side, it does not call super.onlayout due to
   * which mIsLayoutDirty flag in ScrollView remains true and prevents scrolling to child when
   * requestChildFocus is called. Overriding this method and scrolling to child without checking any
   * layout dirty flag. This will fix focus navigation issue for KeyEvents which are not handled by
   * ScrollView, for example: KEYCODE_TAB.
   */
  @Override
  public void requestChildFocus(View child, View focused) {
    if (focused != null) {
      scrollToChild(focused);
    }
    super.requestChildFocus(child, focused);
  }

  private int getScrollDelta(View descendent) {
    descendent.getDrawingRect(mTempRect);
    offsetDescendantRectToMyCoords(descendent, mTempRect);
    return computeScrollDeltaToGetChildRectOnScreen(mTempRect);
  }

  /** Returns whether the given descendent is partially scrolled in view */
  boolean isPartiallyScrolledInView(View descendent) {
    int scrollDelta = getScrollDelta(descendent);
    descendent.getDrawingRect(mTempRect);
    return scrollDelta != 0 && Math.abs(scrollDelta) < mTempRect.width();
  }

  private void scrollToChild(View child) {
    Rect tempRect = new Rect();
    child.getDrawingRect(tempRect);

    /* Offset from child's local coordinates to ScrollView coordinates */
    offsetDescendantRectToMyCoords(child, tempRect);

    int scrollDelta = computeScrollDeltaToGetChildRectOnScreen(tempRect);

    if (scrollDelta != 0) {
      scrollBy(0, scrollDelta);
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
        && (eventKeyCode == KeyEvent.KEYCODE_DPAD_UP
            || eventKeyCode == KeyEvent.KEYCODE_DPAD_DOWN)) {
      return false;
    }
    return super.executeKeyEvent(event);
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

  @Override
  public void fling(int velocityY) {
    final int correctedVelocityY = correctFlingVelocityY(velocityY);

    if (mPagingEnabled) {
      flingAndSnap(correctedVelocityY);
    } else if (mScroller != null) {
      // FB SCROLLVIEW CHANGE

      // We provide our own version of fling that uses a different call to the standard OverScroller
      // which takes into account the possibility of adding new content while the ScrollView is
      // animating. Because we give essentially no max Y for the fling, the fling will continue as
      // long
      // as there is content. See #onOverScrolled() to see the second part of this change which
      // properly
      // aborts the scroller animation when we get to the bottom of the ScrollView content.

      int scrollWindowHeight = getHeight() - getPaddingBottom() - getPaddingTop();

      mScroller.fling(
          getScrollX(), // startX
          getScrollY(), // startY
          0, // velocityX
          correctedVelocityY, // velocityY
          0, // minX
          0, // maxX
          0, // minY
          Integer.MAX_VALUE, // maxY
          0, // overX
          scrollWindowHeight / 2 // overY
          );

      ViewCompat.postInvalidateOnAnimation(this);

      // END FB SCROLLVIEW CHANGE
    } else {
      super.fling(correctedVelocityY);
    }
    handlePostTouchScrolling(0, correctedVelocityY);
  }

  private int correctFlingVelocityY(int velocityY) {
    if (Build.VERSION.SDK_INT != Build.VERSION_CODES.P) {
      return velocityY;
    }

    // Workaround.
    // On Android P if a ScrollView is inverted, we will get a wrong sign for
    // velocityY (see https://issuetracker.google.com/issues/112385925).
    // At the same time, mOnScrollDispatchHelper tracks the correct velocity direction.
    //
    // Hence, we can use the absolute value from whatever the OS gives
    // us and use the sign of what mOnScrollDispatchHelper has tracked.
    float signum = Math.signum(mOnScrollDispatchHelper.getYFlingVelocity());
    if (signum == 0) {
      signum = Math.signum(velocityY);
    }
    return (int) (Math.abs(velocityY) * signum);
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

  private int getMaxScrollY() {
    int contentHeight = mContentView.getHeight();
    int viewportHeight = getHeight() - getPaddingBottom() - getPaddingTop();
    return Math.max(0, contentHeight - viewportHeight);
  }

  @Nullable
  public StateWrapper getStateWrapper() {
    return mStateWrapper;
  }

  public void setStateWrapper(StateWrapper stateWrapper) {
    mStateWrapper = stateWrapper;
  }

  @Override
  public void draw(Canvas canvas) {
    if (mEndFillColor != Color.TRANSPARENT) {
      final View contentView = getContentView();
      if (mEndBackground != null && contentView != null && contentView.getBottom() < getHeight()) {
        mEndBackground.setBounds(0, contentView.getBottom(), getWidth(), getHeight());
        mEndBackground.draw(canvas);
      }
    }
    getDrawingRect(mRect);

    if (!ViewProps.VISIBLE.equals(mOverflow)) {
      canvas.clipRect(mRect);
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
    // Check if we are already handling this which may occur if this is called by both the touch up
    // and a fling call
    if (mPostTouchRunnable != null) {
      return;
    }

    if (mSendMomentumEvents) {
      enableFpsListener();
      ReactScrollViewHelper.emitScrollMomentumBeginEvent(this, velocityX, velocityY);
    }

    mActivelyScrolling = false;
    mPostTouchRunnable =
        new Runnable() {

          private boolean mSnappingToPage = false;
          private int mStableFrames = 0;

          @Override
          public void run() {
            if (mActivelyScrolling) {
              // We are still scrolling.
              mActivelyScrolling = false;
              mStableFrames = 0;
              ViewCompat.postOnAnimationDelayed(
                  ReactScrollView.this, this, ReactScrollViewHelper.MOMENTUM_DELAY);
            } else {
              // There has not been a scroll update since the last time this Runnable executed.
              ReactScrollViewHelper.updateFabricScrollState(ReactScrollView.this);

              // We keep checking for updates until the ScrollView has "stabilized" and hasn't
              // scrolled for N consecutive frames. This number is arbitrary: big enough to catch
              // a number of race conditions, but small enough to not cause perf regressions, etc.
              // In anecdotal testing, it seemed like a decent number.
              // Without this check, sometimes this Runnable stops executing too soon - it will
              // fire before the first scroll event of an animated scroll/fling, and stop
              // immediately.
              mStableFrames++;

              if (mStableFrames >= 3) {
                mPostTouchRunnable = null;
                if (mSendMomentumEvents) {
                  ReactScrollViewHelper.emitScrollMomentumEndEvent(ReactScrollView.this);
                }
                disableFpsListener();
              } else {
                if (mPagingEnabled && !mSnappingToPage) {
                  // If we have pagingEnabled and we have not snapped to the page
                  // we need to cause that scroll by asking for it
                  mSnappingToPage = true;
                  flingAndSnap(0);
                }
                // The scrollview has not "stabilized" so we just post to check again a frame later
                ViewCompat.postOnAnimationDelayed(
                    ReactScrollView.this, this, ReactScrollViewHelper.MOMENTUM_DELAY);
              }
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

  private int predictFinalScrollPosition(int velocityY) {
    // predict where a fling would end up so we can scroll to the nearest snap offset
    // TODO(T106335409): Existing prediction still uses overscroller. Consider change this to use
    // fling animator instead.
    return getFlingAnimator() == DEFAULT_FLING_ANIMATOR
        ? ReactScrollViewHelper.predictFinalScrollPosition(this, 0, velocityY, 0, getMaxScrollY()).y
        : ReactScrollViewHelper.getNextFlingStartValue(
                this,
                getScrollY(),
                getReactScrollViewScrollState().getFinalAnimatedPositionScroll().y,
                velocityY)
            + getFlingExtrapolatedDistance(velocityY);
  }

  private View getContentView() {
    return getChildAt(0);
  }

  /**
   * This will smooth scroll us to the nearest snap offset point It currently just looks at where
   * the content is and slides to the nearest point. It is intended to be run after we are done
   * scrolling, and handling any momentum scrolling.
   */
  private void smoothScrollAndSnap(int velocity) {
    double interval = (double) getSnapInterval();
    double currentOffset =
        (double)
            (ReactScrollViewHelper.getNextFlingStartValue(
                this,
                getScrollY(),
                getReactScrollViewScrollState().getFinalAnimatedPositionScroll().y,
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
      reactSmoothScrollTo(getScrollX(), (int) targetOffset);
    }
  }

  private void flingAndSnap(int velocityY) {
    if (getChildCount() <= 0) {
      return;
    }

    // pagingEnabled only allows snapping one interval at a time
    if (mSnapInterval == 0 && mSnapOffsets == null && mSnapToAlignment == SNAP_ALIGNMENT_DISABLED) {
      smoothScrollAndSnap(velocityY);
      return;
    }

    boolean hasCustomizedFlingAnimator = getFlingAnimator() != DEFAULT_FLING_ANIMATOR;
    int maximumOffset = getMaxScrollY();
    int targetOffset = predictFinalScrollPosition(velocityY);
    if (mDisableIntervalMomentum) {
      targetOffset = getScrollY();
    }

    int smallerOffset = 0;
    int largerOffset = maximumOffset;
    int firstOffset = 0;
    int lastOffset = maximumOffset;
    int height = getHeight() - getPaddingBottom() - getPaddingTop();

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

    } else if (mSnapToAlignment != SNAP_ALIGNMENT_DISABLED) {
      if (mSnapInterval > 0) {
        double ratio = (double) targetOffset / mSnapInterval;
        smallerOffset =
            Math.max(
                getItemStartOffset(
                    mSnapToAlignment,
                    (int) (Math.floor(ratio) * mSnapInterval),
                    mSnapInterval,
                    height),
                0);
        largerOffset =
            Math.min(
                getItemStartOffset(
                    mSnapToAlignment,
                    (int) (Math.ceil(ratio) * mSnapInterval),
                    mSnapInterval,
                    height),
                maximumOffset);
      } else {
        ViewGroup contentView = (ViewGroup) getContentView();
        int smallerChildOffset = largerOffset;
        int largerChildOffset = smallerOffset;
        for (int i = 0; i < contentView.getChildCount(); i++) {
          View item = contentView.getChildAt(i);
          int itemStartOffset;
          switch (mSnapToAlignment) {
            case SNAP_ALIGNMENT_CENTER:
              itemStartOffset = item.getTop() - (height - item.getHeight()) / 2;
              break;
            case SNAP_ALIGNMENT_START:
              itemStartOffset = item.getTop();
              break;
            case SNAP_ALIGNMENT_END:
              itemStartOffset = item.getTop() - (height - item.getHeight());
              break;
            default:
              throw new IllegalStateException("Invalid SnapToAlignment value: " + mSnapToAlignment);
          }
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
      double interval = (double) getSnapInterval();
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
    if (!mSnapToEnd && targetOffset >= lastOffset) {
      if (getScrollY() >= lastOffset) {
        // free scrolling
      } else {
        // snap to end
        targetOffset = lastOffset;
      }
    } else if (!mSnapToStart && targetOffset <= firstOffset) {
      if (getScrollY() <= firstOffset) {
        // free scrolling
      } else {
        // snap to beginning
        targetOffset = firstOffset;
      }
    } else if (velocityY > 0) {
      if (!hasCustomizedFlingAnimator) {
        // The default animator requires boost on initial velocity as when snapping velocity can
        // feel sluggish for slow swipes
        velocityY += (int) ((largerOffset - targetOffset) * 10.0);
      }

      targetOffset = largerOffset;
    } else if (velocityY < 0) {
      if (!hasCustomizedFlingAnimator) {
        // The default animator requires boost on initial velocity as when snapping velocity can
        // feel sluggish for slow swipes
        velocityY -= (int) ((targetOffset - smallerOffset) * 10.0);
      }

      targetOffset = smallerOffset;
    } else {
      targetOffset = nearestOffset;
    }

    // Make sure the new offset isn't out of bounds
    targetOffset = Math.min(Math.max(0, targetOffset), maximumOffset);

    if (hasCustomizedFlingAnimator || mScroller == null) {
      reactSmoothScrollTo(getScrollX(), targetOffset);
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
          0, // velocityX
          velocityY != 0 ? velocityY : targetOffset - getScrollY(), // velocityY
          0, // minX
          0, // maxX
          // setting both minY and maxY to the same value will guarantee that we scroll to it
          // but using the standard fling-style easing rather than smoothScrollTo's 250ms animation
          targetOffset, // minY
          targetOffset, // maxY
          0, // overX
          // we only want to allow overscrolling if the final offset is at the very edge of the view
          (targetOffset == 0 || targetOffset == maximumOffset) ? height / 2 : 0 // overY
          );

      postInvalidateOnAnimation();
    }
  }

  private int getItemStartOffset(
      int snapToAlignment, int itemStartPosition, int itemHeight, int viewPortHeight) {
    int itemStartOffset;
    switch (snapToAlignment) {
      case SNAP_ALIGNMENT_CENTER:
        itemStartOffset = itemStartPosition - (viewPortHeight - itemHeight) / 2;
        break;
      case SNAP_ALIGNMENT_START:
        itemStartOffset = itemStartPosition;
        break;
      case SNAP_ALIGNMENT_END:
        itemStartOffset = itemStartPosition - (viewPortHeight - itemHeight);
        break;
      default:
        throw new IllegalStateException("Invalid SnapToAlignment value: " + mSnapToAlignment);
    }
    return itemStartOffset;
  }

  private int getSnapInterval() {
    if (mSnapInterval != 0) {
      return mSnapInterval;
    }
    return getHeight();
  }

  public void setEndFillColor(int color) {
    if (color != mEndFillColor) {
      mEndFillColor = color;
      mEndBackground = new ColorDrawable(mEndFillColor);
    }
  }

  @Override
  protected void onOverScrolled(int scrollX, int scrollY, boolean clampedX, boolean clampedY) {
    if (mScroller != null && mContentView != null) {
      // FB SCROLLVIEW CHANGE

      // This is part two of the reimplementation of fling to fix the bounce-back bug. See #fling()
      // for
      // more information.

      if (!mScroller.isFinished() && mScroller.getCurrY() != mScroller.getFinalY()) {
        int scrollRange = getMaxScrollY();
        if (scrollY >= scrollRange) {
          mScroller.abortAnimation();
          scrollY = scrollRange;
        }
      }

      // END FB SCROLLVIEW CHANGE
    }

    super.onOverScrolled(scrollX, scrollY, clampedX, clampedY);
  }

  @Override
  public void onChildViewAdded(View parent, View child) {
    mContentView = child;
    mContentView.addOnLayoutChangeListener(this);
  }

  @Override
  public void onChildViewRemoved(View parent, View child) {
    if (mContentView != null) {
      mContentView.removeOnLayoutChangeListener(this);
      mContentView = null;
    }
  }

  public void setContentOffset(ReadableMap value) {
    // When contentOffset={{x:0,y:0}} with lazy load items, setContentOffset
    // is repeatedly called, causing an unexpected scroll to top behavior.
    // Avoid updating contentOffset if the value has not changed.
    if (mCurrentContentOffset == null || !mCurrentContentOffset.equals(value)) {
      mCurrentContentOffset = value;

      if (value != null) {
        double x = value.hasKey("x") ? value.getDouble("x") : 0;
        double y = value.hasKey("y") ? value.getDouble("y") : 0;
        scrollTo((int) PixelUtil.toPixelFromDIP(x), (int) PixelUtil.toPixelFromDIP(y));
      } else {
        scrollTo(0, 0);
      }
    }
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
    if (isContentReady()) {
      pendingContentOffsetX = UNSET_CONTENT_OFFSET;
      pendingContentOffsetY = UNSET_CONTENT_OFFSET;
    } else {
      pendingContentOffsetX = x;
      pendingContentOffsetY = y;
    }
  }

  /**
   * Called when a mContentView's layout has changed. Fixes the scroll position if it's too large
   * after the content resizes. Without this, the user would see a blank ScrollView when the scroll
   * position is larger than the ScrollView's max scroll position after the content shrinks.
   */
  @Override
  public void onLayoutChange(
      View v,
      int left,
      int top,
      int right,
      int bottom,
      int oldLeft,
      int oldTop,
      int oldRight,
      int oldBottom) {
    if (mContentView == null) {
      return;
    }

    if (mMaintainVisibleContentPositionHelper != null) {
      mMaintainVisibleContentPositionHelper.updateScrollPosition();
    }

    if (isShown() && isContentReady()) {
      int currentScrollY = getScrollY();
      int maxScrollY = getMaxScrollY();
      if (currentScrollY > maxScrollY) {
        scrollTo(getScrollX(), maxScrollY);
      }
    }
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
   * ScrollAway: This enables a natively-controlled navbar that optionally obscures the top content
   * of the ScrollView. Whether or not the navbar is obscuring the React Native surface is
   * determined outside of React Native.
   *
   * <p>Note: all ScrollViews and HorizontalScrollViews in React have exactly one child: the
   * "content" View (see ScrollView.js). That View is non-collapsable so it will never be
   * View-flattened away. However, it is possible to pass custom styles into that View.
   *
   * <p>If you are using this feature it is assumed that you have full control over this ScrollView
   * and that you are **not** overriding the ScrollView content view to pass in a `translateY`
   * style. `translateY` must never be set from ReactJS while using this feature!
   */
  public void setScrollAwayTopPaddingEnabledUnstable(int topPadding) {
    int count = getChildCount();

    Assertions.assertCondition(
        count <= 1,
        "React Native ScrollView should not have more than one child, it should have exactly 1 child; a content View");

    if (count > 0) {
      for (int i = 0; i < count; i++) {
        View childView = getChildAt(i);
        childView.setTranslationY(topPadding);
      }

      // Add the topPadding value as the bottom padding for the ScrollView.
      // Otherwise, we'll push down the contents of the scroll view down too
      // far off screen.
      setPadding(0, 0, 0, topPadding);
    }

    updateScrollAwayState(topPadding);
    setRemoveClippedSubviews(mRemoveClippedSubviews);
  }

  private void updateScrollAwayState(int scrollAwayPaddingTop) {
    getReactScrollViewScrollState().setScrollAwayPaddingTop(scrollAwayPaddingTop);
    ReactScrollViewHelper.forceUpdateState(this);
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

  @NonNull
  @Override
  public ValueAnimator getFlingAnimator() {
    return DEFAULT_FLING_ANIMATOR;
  }

  @Override
  public int getFlingExtrapolatedDistance(int velocityY) {
    // The DEFAULT_FLING_ANIMATOR uses AccelerateDecelerateInterpolator, which is not depending on
    // the init velocity. We use the overscroller to decide the fling distance.
    return ReactScrollViewHelper.predictFinalScrollPosition(this, 0, velocityY, 0, getMaxScrollY())
        .y;
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
