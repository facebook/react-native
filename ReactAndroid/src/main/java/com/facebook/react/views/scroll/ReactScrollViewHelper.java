/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import android.animation.Animator;
import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Point;
import android.view.View;
import android.view.ViewGroup;
import android.widget.OverScroller;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.uimanager.FabricViewStateManager;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.events.EventDispatcher;
import java.util.Collections;
import java.util.Set;
import java.util.WeakHashMap;

/** Helper class that deals with emitting Scroll Events. */
public class ReactScrollViewHelper {
  private static String TAG = ReactHorizontalScrollView.class.getSimpleName();
  private static boolean DEBUG_MODE = false && ReactBuildConfig.DEBUG;
  private static final String CONTENT_OFFSET_LEFT = "contentOffsetLeft";
  private static final String CONTENT_OFFSET_TOP = "contentOffsetTop";
  private static final String SCROLL_AWAY_PADDING_TOP = "scrollAwayPaddingTop";

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
  public static <T extends ViewGroup & HasScrollEventThrottle> void emitScrollEvent(
      T scrollView, float xVelocity, float yVelocity) {
    emitScrollEvent(scrollView, ScrollEventType.SCROLL, xVelocity, yVelocity);
  }

  public static <T extends ViewGroup & HasScrollEventThrottle> void emitScrollBeginDragEvent(
      T scrollView) {
    emitScrollEvent(scrollView, ScrollEventType.BEGIN_DRAG);
  }

  public static <T extends ViewGroup & HasScrollEventThrottle> void emitScrollEndDragEvent(
      T scrollView, float xVelocity, float yVelocity) {
    emitScrollEvent(scrollView, ScrollEventType.END_DRAG, xVelocity, yVelocity);
  }

  public static <T extends ViewGroup & HasScrollEventThrottle> void emitScrollMomentumBeginEvent(
      T scrollView, int xVelocity, int yVelocity) {
    emitScrollEvent(scrollView, ScrollEventType.MOMENTUM_BEGIN, xVelocity, yVelocity);
  }

  public static <T extends ViewGroup & HasScrollEventThrottle> void emitScrollMomentumEndEvent(
      T scrollView) {
    emitScrollEvent(scrollView, ScrollEventType.MOMENTUM_END);
  }

  private static <T extends ViewGroup & HasScrollEventThrottle> void emitScrollEvent(
      T scrollView, ScrollEventType scrollEventType) {
    emitScrollEvent(scrollView, scrollEventType, 0, 0);
  }

  private static <T extends ViewGroup & HasScrollEventThrottle> void emitScrollEvent(
      T scrollView, ScrollEventType scrollEventType, float xVelocity, float yVelocity) {
    long now = System.currentTimeMillis();
    View contentView = scrollView.getChildAt(0);

    if (contentView == null) {
      return;
    }

    for (ScrollListener scrollListener : sScrollListeners) {
      scrollListener.onScroll(scrollView, scrollEventType, xVelocity, yVelocity);
    }

    ReactContext reactContext = (ReactContext) scrollView.getContext();
    int surfaceId = UIManagerHelper.getSurfaceId(reactContext);

    // It's possible for the EventDispatcher to go away - for example,
    // if there's a crash initiated from JS and we tap on a ScrollView
    // around teardown of RN, this will cause a NPE. We can safely ignore
    // this since the crash is usually a red herring.
    EventDispatcher eventDispatcher =
        UIManagerHelper.getEventDispatcherForReactTag(reactContext, scrollView.getId());
    if (eventDispatcher != null) {
      eventDispatcher.dispatchEvent(
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
      scrollView.setLastScrollDispatchTime(now);
    }
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

  public static class ReactScrollViewScrollState {
    private final int mLayoutDirection;
    private final Point mFinalAnimatedPositionScroll = new Point();
    private int mScrollAwayPaddingTop = 0;
    private final Point mLastStateUpdateScroll = new Point(-1, -1);
    private boolean mIsCanceled = false;
    private boolean mIsFinished = true;
    private float mDecelerationRate = 0.985f;

    public ReactScrollViewScrollState(final int layoutDirection) {
      mLayoutDirection = layoutDirection;
    }

    /**
     * Get the layout direction. Can be either scrollView.LAYOUT_DIRECTION_RTL (1) or
     * scrollView.LAYOUT_DIRECTION_LTR (0). If the value is -1, it means unknown layout.
     */
    public int getLayoutDirection() {
      return mLayoutDirection;
    }

    /** Get the position after current animation is finished */
    public Point getFinalAnimatedPositionScroll() {
      return mFinalAnimatedPositionScroll;
    }

    /** Set the final scroll position after scrolling animation is finished */
    public ReactScrollViewScrollState setFinalAnimatedPositionScroll(
        int finalAnimatedPositionScrollX, int finalAnimatedPositionScrollY) {
      mFinalAnimatedPositionScroll.set(finalAnimatedPositionScrollX, finalAnimatedPositionScrollY);
      return this;
    }

    /** Get the Fabric state of last scroll position */
    public Point getLastStateUpdateScroll() {
      return mLastStateUpdateScroll;
    }

    /** Set the Fabric state of last scroll position */
    public ReactScrollViewScrollState setLastStateUpdateScroll(
        int lastStateUpdateScrollX, int lastStateUpdateScrollY) {
      mLastStateUpdateScroll.set(lastStateUpdateScrollX, lastStateUpdateScrollY);
      return this;
    }

    /** Get the padding on the top for nav bar */
    public int getScrollAwayPaddingTop() {
      return mScrollAwayPaddingTop;
    }

    /** Set the padding on the top for nav bar */
    public ReactScrollViewScrollState setScrollAwayPaddingTop(int scrollAwayPaddingTop) {
      mScrollAwayPaddingTop = scrollAwayPaddingTop;
      return this;
    }

    /** Get true if the previous animation was canceled */
    public boolean getIsCanceled() {
      return mIsCanceled;
    }

    /** Set the state of current animation is canceled or not */
    public ReactScrollViewScrollState setIsCanceled(boolean isCanceled) {
      mIsCanceled = isCanceled;
      return this;
    }

    /** Get true if previous animation was finished */
    public boolean getIsFinished() {
      return mIsFinished;
    }

    /** Set the state of current animation is finished or not */
    public ReactScrollViewScrollState setIsFinished(boolean isFinished) {
      mIsFinished = isFinished;
      return this;
    }

    /** Get true if previous animation was finished */
    public float getDecelerationRate() {
      return mDecelerationRate;
    }

    /** Set the state of current animation is finished or not */
    public ReactScrollViewScrollState setDecelerationRate(float decelerationRate) {
      mDecelerationRate = decelerationRate;
      return this;
    }
  }

  /**
   * Scroll the given view to the location (x, y), with provided initial velocity. This method works
   * by calculate the "would be" initial velocity with internal friction to move to the point (x,
   * y), then apply that to the animator.
   */
  public static <
          T extends
              ViewGroup & FabricViewStateManager.HasFabricViewStateManager & HasScrollState
                  & HasFlingAnimator>
      void smoothScrollTo(final T scrollView, final int x, final int y) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "smoothScrollTo[%d] x %d y %d", scrollView.getId(), x, y);
    }

    // Register the listeners for the fling animator if there isn't any
    final ValueAnimator flingAnimator = scrollView.getFlingAnimator();
    if (flingAnimator.getListeners() == null || flingAnimator.getListeners().size() == 0) {
      registerFlingAnimator(scrollView);
    }

    final ReactScrollViewScrollState scrollState = scrollView.getReactScrollViewScrollState();
    scrollState.setFinalAnimatedPositionScroll(x, y);

    final int scrollX = scrollView.getScrollX();
    final int scrollY = scrollView.getScrollY();
    // Only one fling animator will be started. For the horizontal scroll view, scrollY will always
    // be the same to y. This is the same to the vertical scroll view.
    if (scrollX != x) {
      scrollView.startFlingAnimator(scrollX, x);
    }
    if (scrollY != y) {
      scrollView.startFlingAnimator(scrollY, y);
    }

    updateFabricScrollState(scrollView, x, y);
  }

  /** Get current position or position after current animation finishes, if any. */
  public static <
          T extends
              ViewGroup & FabricViewStateManager.HasFabricViewStateManager & HasScrollState
                  & HasFlingAnimator>
      int getNextFlingStartValue(
          final T scrollView,
          final int currentValue,
          final int postAnimationValue,
          final int velocity) {
    final ReactScrollViewScrollState scrollState = scrollView.getReactScrollViewScrollState();
    final int velocityDirectionMask = velocity != 0 ? velocity / Math.abs(velocity) : 0;
    final boolean isMovingTowardsAnimatedValue =
        velocityDirectionMask * (postAnimationValue - currentValue) > 0;

    // When the fling animation is not finished, or it was canceled and now we are moving towards
    // the final animated value, we will return the final animated value. This is because follow up
    // animation should consider the "would be" animated location, so that previous quick small
    // scrolls are still working.
    return !scrollState.getIsFinished()
            || (scrollState.getIsCanceled() && isMovingTowardsAnimatedValue)
        ? postAnimationValue
        : currentValue;
  }

  public static <
          T extends
              ViewGroup & FabricViewStateManager.HasFabricViewStateManager & HasScrollState
                  & HasFlingAnimator>
      boolean updateFabricScrollState(final T scrollView) {
    return updateFabricScrollState(scrollView, scrollView.getScrollX(), scrollView.getScrollY());
  }

  /**
   * Called on any stabilized onScroll change to propagate content offset value to a Shadow Node.
   */
  public static <
          T extends
              ViewGroup & FabricViewStateManager.HasFabricViewStateManager & HasScrollState
                  & HasFlingAnimator>
      boolean updateFabricScrollState(final T scrollView, final int scrollX, final int scrollY) {
    if (DEBUG_MODE) {
      FLog.i(
          TAG,
          "updateFabricScrollState[%d] scrollX %d scrollY %d",
          scrollView.getId(),
          scrollX,
          scrollY);
    }

    if (ViewUtil.getUIManagerType(scrollView.getId()) == UIManagerType.DEFAULT) {
      return false;
    }

    final ReactScrollViewScrollState scrollState = scrollView.getReactScrollViewScrollState();
    // Dedupe events to reduce JNI traffic
    if (scrollState.getLastStateUpdateScroll().equals(scrollX, scrollY)) {
      return false;
    }

    scrollState.setLastStateUpdateScroll(scrollX, scrollY);
    forceUpdateState(scrollView);
    return true;
  }

  public static <
          T extends
              ViewGroup & FabricViewStateManager.HasFabricViewStateManager & HasScrollState
                  & HasFlingAnimator>
      void forceUpdateState(final T scrollView) {
    final ReactScrollViewScrollState scrollState = scrollView.getReactScrollViewScrollState();
    final int scrollAwayPaddingTop = scrollState.getScrollAwayPaddingTop();
    final Point scrollPos = scrollState.getLastStateUpdateScroll();
    final int scrollX = scrollPos.x;
    final int scrollY = scrollPos.y;
    final int fabricScrollX;
    int layoutDirection = scrollState.getLayoutDirection();

    if (layoutDirection == scrollView.LAYOUT_DIRECTION_RTL) {
      // getScrollX returns offset from left even when layout direction is RTL.
      // The following line calculates offset from right.
      View child = scrollView.getChildAt(0);
      int contentWidth = child != null ? child.getWidth() : 0;
      fabricScrollX = -(contentWidth - scrollX - scrollView.getWidth());
    } else {
      fabricScrollX = scrollX;
    }

    if (DEBUG_MODE) {
      FLog.i(
          TAG,
          "updateFabricScrollState[%d] scrollX %d scrollY %d fabricScrollX",
          scrollView.getId(),
          scrollX,
          scrollY,
          fabricScrollX);
    }

    scrollView
        .getFabricViewStateManager()
        .setState(
            new FabricViewStateManager.StateUpdateCallback() {
              @Override
              public WritableMap getStateUpdate() {
                WritableMap map = new WritableNativeMap();
                map.putDouble(CONTENT_OFFSET_LEFT, PixelUtil.toDIPFromPixel(scrollX));
                map.putDouble(CONTENT_OFFSET_TOP, PixelUtil.toDIPFromPixel(scrollY));
                map.putDouble(
                    SCROLL_AWAY_PADDING_TOP, PixelUtil.toDIPFromPixel(scrollAwayPaddingTop));
                return map;
              }
            });
  }

  public static <
          T extends
              ViewGroup & FabricViewStateManager.HasFabricViewStateManager & HasScrollState
                  & HasFlingAnimator & HasScrollEventThrottle>
      void updateStateOnScrollChanged(
          final T scrollView, final float xVelocity, final float yVelocity) {
    // Race an UpdateState with every onScroll. This makes it more likely that, in Fabric,
    // when JS processes the scroll event, the C++ ShadowNode representation will have a
    // "more correct" scroll position. It will frequently be /incorrect/ but this decreases
    // the error as much as possible.
    updateFabricScrollState(scrollView);
    emitScrollEvent(scrollView, xVelocity, yVelocity);
  }

  public static <
          T extends
              ViewGroup & FabricViewStateManager.HasFabricViewStateManager & HasScrollState
                  & HasFlingAnimator>
      void registerFlingAnimator(final T scrollView) {
    scrollView
        .getFlingAnimator()
        .addListener(
            new Animator.AnimatorListener() {
              @Override
              public void onAnimationStart(Animator animator) {
                final ReactScrollViewScrollState scrollState =
                    scrollView.getReactScrollViewScrollState();
                scrollState.setIsCanceled(false);
                scrollState.setIsFinished(false);
              }

              @Override
              public void onAnimationEnd(Animator animator) {
                scrollView.getReactScrollViewScrollState().setIsFinished(true);
                updateFabricScrollState(scrollView);
              }

              @Override
              public void onAnimationCancel(Animator animator) {
                scrollView.getReactScrollViewScrollState().setIsCanceled(true);
              }

              @Override
              public void onAnimationRepeat(Animator animator) {}
            });
  }

  public static <
          T extends
              ViewGroup & FabricViewStateManager.HasFabricViewStateManager & HasScrollState
                  & HasFlingAnimator>
      Point predictFinalScrollPosition(
          final T scrollView,
          final int velocityX,
          final int velocityY,
          final int maximumOffsetX,
          final int maximumOffsetY) {
    final ReactScrollViewScrollState scrollState = scrollView.getReactScrollViewScrollState();
    // ScrollView can *only* scroll for 250ms when using smoothScrollTo and there's
    // no way to customize the scroll duration. So, we create a temporary OverScroller
    // so we can predict where a fling would land and snap to nearby that point.
    OverScroller scroller = new OverScroller(scrollView.getContext());
    scroller.setFriction(1.0f - scrollState.getDecelerationRate());

    // predict where a fling would end up so we can scroll to the nearest snap offset
    int width =
        scrollView.getWidth()
            - ViewCompat.getPaddingStart(scrollView)
            - ViewCompat.getPaddingEnd(scrollView);
    int height =
        scrollView.getHeight() - scrollView.getPaddingBottom() - scrollView.getPaddingTop();
    Point finalAnimatedPositionScroll = scrollState.getFinalAnimatedPositionScroll();
    scroller.fling(
        getNextFlingStartValue(
            scrollView,
            scrollView.getScrollX(),
            finalAnimatedPositionScroll.x,
            velocityX), // startX
        getNextFlingStartValue(
            scrollView,
            scrollView.getScrollY(),
            finalAnimatedPositionScroll.y,
            velocityY), // startY
        velocityX, // velocityX
        velocityY, // velocityY
        0, // minX
        maximumOffsetX, // maxX
        0, // minY
        maximumOffsetY, // maxY
        width / 2, // overX
        height / 2 // overY
        );
    return new Point(scroller.getFinalX(), scroller.getFinalY());
  }

  public interface HasScrollState {
    /** Get the scroll state for the current ScrollView */
    ReactScrollViewScrollState getReactScrollViewScrollState();
  }

  public interface HasFlingAnimator {
    /**
     * Start the fling animator that the ScrollView has to go from the start position to end
     * position.
     */
    void startFlingAnimator(int start, int end);

    /** Get the fling animator that is reused for the ScrollView to handle fling animation. */
    ValueAnimator getFlingAnimator();

    /** Get the fling distance with current velocity for prediction */
    int getFlingExtrapolatedDistance(int velocity);
  }

  public interface HasScrollEventThrottle {
    /**
     * Set the scroll event throttle in ms. This number is used to throttle the scroll events. The
     * default value is zero, which means the scroll events are sent with no throttle.
     */
    void setScrollEventThrottle(int scrollEventThrottle);

    /** Get the scroll event throttle in ms. */
    int getScrollEventThrottle();

    /** Set the scroll view's last dispatch time for throttling */
    void setLastScrollDispatchTime(long lastScrollDispatchTime);

    /** Get the scroll view dispatch time for throttling */
    long getLastScrollDispatchTime();
  }

  public interface HasSmoothScroll {
    void reactSmoothScrollTo(int x, int y);
  }
}
