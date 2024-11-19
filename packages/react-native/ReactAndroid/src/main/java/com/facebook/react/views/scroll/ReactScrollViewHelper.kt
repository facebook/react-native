/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.animation.Animator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Point
import android.view.View
import android.view.ViewGroup
import android.widget.OverScroller
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.common.ReactConstants
import com.facebook.react.uimanager.PixelUtil.toDIPFromPixel
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.common.ViewUtil
import java.lang.ref.WeakReference
import java.util.concurrent.CopyOnWriteArrayList

/** Helper class that deals with emitting Scroll Events. */
public object ReactScrollViewHelper {
  private val TAG = ReactScrollView::class.java.simpleName
  private val DEBUG_MODE = false // ReactBuildConfig.DEBUG

  private const val CONTENT_OFFSET_LEFT = "contentOffsetLeft"
  private const val CONTENT_OFFSET_TOP = "contentOffsetTop"
  private const val SCROLL_AWAY_PADDING_TOP = "scrollAwayPaddingTop"

  public const val MOMENTUM_DELAY: Long = 20
  public const val OVER_SCROLL_ALWAYS: String = "always"
  public const val AUTO: String = "auto"
  public const val OVER_SCROLL_NEVER: String = "never"
  public const val SNAP_ALIGNMENT_DISABLED: Int = 0
  public const val SNAP_ALIGNMENT_START: Int = 1
  public const val SNAP_ALIGNMENT_CENTER: Int = 2
  public const val SNAP_ALIGNMENT_END: Int = 3

  // Support global native listeners for scroll events
  private val scrollListeners = CopyOnWriteArrayList<WeakReference<ScrollListener>>()
  private val layoutChangeListeners = CopyOnWriteArrayList<WeakReference<LayoutChangeListener>>()

  // If all else fails, this is the hardcoded value in OverScroller.java, in AOSP.
  // The default is defined here (as of this diff):
  // https://android.googlesource.com/platform/frameworks/base/+/ae5bcf23b5f0875e455790d6af387184dbd009c1/core/java/android/widget/OverScroller.java#44
  private var SMOOTH_SCROLL_DURATION = 250
  private var smoothScrollDurationInitialized = false

  /** Shared by [ReactScrollView] and [ReactHorizontalScrollView]. */
  @JvmStatic
  public fun <T> emitScrollEvent(scrollView: T, xVelocity: Float, yVelocity: Float) where
  T : HasScrollEventThrottle?,
  T : ViewGroup {
    emitScrollEvent(scrollView, ScrollEventType.SCROLL, xVelocity, yVelocity)
  }

  @JvmStatic
  public fun <T> emitScrollBeginDragEvent(scrollView: T) where
  T : HasScrollEventThrottle?,
  T : ViewGroup {
    emitScrollEvent(scrollView, ScrollEventType.BEGIN_DRAG)
  }

  @JvmStatic
  public fun <T> emitScrollEndDragEvent(scrollView: T, xVelocity: Float, yVelocity: Float) where
  T : HasScrollEventThrottle?,
  T : ViewGroup {
    emitScrollEvent(scrollView, ScrollEventType.END_DRAG, xVelocity, yVelocity)
  }

  @JvmStatic
  public fun <T> emitScrollMomentumBeginEvent(scrollView: T, xVelocity: Int, yVelocity: Int) where
  T : HasScrollEventThrottle?,
  T : ViewGroup {
    emitScrollEvent(
        scrollView, ScrollEventType.MOMENTUM_BEGIN, xVelocity.toFloat(), yVelocity.toFloat())
  }

  @JvmStatic
  public fun <T> emitScrollMomentumEndEvent(scrollView: T) where
  T : HasScrollEventThrottle?,
  T : ViewGroup {
    emitScrollEvent(scrollView, ScrollEventType.MOMENTUM_END)
  }

  private fun <T> emitScrollEvent(scrollView: T, scrollEventType: ScrollEventType) where
  T : HasScrollEventThrottle?,
  T : ViewGroup {
    emitScrollEvent(scrollView, scrollEventType, 0f, 0f)
  }

  private fun <T> emitScrollEvent(
      scrollView: T,
      scrollEventType: ScrollEventType,
      xVelocity: Float,
      yVelocity: Float,
  ) where T : HasScrollEventThrottle?, T : ViewGroup {
    val now = System.currentTimeMillis()
    // Throttle the scroll event if scrollEventThrottle is set to be equal or more than 17 ms.
    // We limit the delta to 17ms so that small throttles intended to enable 60fps updates will not
    // inadvertently filter out any scroll events.
    if (scrollView.scrollEventThrottle >= Math.max(17, now - scrollView.lastScrollDispatchTime)) {
      // Scroll events are throttled.
      return
    }
    val contentView = scrollView.getChildAt(0) ?: return
    for (scrollListener in scrollListeners) {
      scrollListener.get()?.onScroll(scrollView, scrollEventType, xVelocity, yVelocity)
    }
    val reactContext = scrollView.context as ReactContext
    val surfaceId = UIManagerHelper.getSurfaceId(reactContext)

    // It's possible for the EventDispatcher to go away - for example,
    // if there's a crash initiated from JS and we tap on a ScrollView
    // around teardown of RN, this will cause a NPE. We can safely ignore
    // this since the crash is usually a red herring.
    val eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, scrollView.id)
    if (eventDispatcher != null) {
      eventDispatcher.dispatchEvent(
          ScrollEvent.obtain(
              surfaceId,
              scrollView.id,
              scrollEventType,
              scrollView.scrollX.toFloat(),
              scrollView.scrollY.toFloat(),
              xVelocity,
              yVelocity,
              contentView.width,
              contentView.height,
              scrollView.width,
              scrollView.height))
      scrollView.lastScrollDispatchTime = now
    }
  }

  /** This is only for Java listeners. onLayout events emitted to JS are handled elsewhere. */
  @JvmStatic
  public fun emitLayoutEvent(scrollView: ViewGroup) {
    for (scrollListener in scrollListeners) {
      scrollListener.get()?.onLayout(scrollView)
    }
  }

  @JvmStatic
  public fun emitLayoutChangeEvent(scrollView: ViewGroup) {
    for (listener in layoutChangeListeners) {
      listener.get()?.onLayoutChange(scrollView)
    }
  }

  @JvmStatic
  public fun parseOverScrollMode(jsOverScrollMode: String?): Int {
    return if (jsOverScrollMode == null || jsOverScrollMode == AUTO) {
      View.OVER_SCROLL_IF_CONTENT_SCROLLS
    } else if (jsOverScrollMode == OVER_SCROLL_ALWAYS) {
      View.OVER_SCROLL_ALWAYS
    } else if (jsOverScrollMode == OVER_SCROLL_NEVER) {
      View.OVER_SCROLL_NEVER
    } else {
      FLog.w(ReactConstants.TAG, "wrong overScrollMode: $jsOverScrollMode")
      View.OVER_SCROLL_IF_CONTENT_SCROLLS
    }
  }

  @JvmStatic
  public fun parseSnapToAlignment(alignment: String?): Int {
    return if (alignment == null) {
      SNAP_ALIGNMENT_DISABLED
    } else if ("start".equals(alignment, ignoreCase = true)) {
      SNAP_ALIGNMENT_START
    } else if ("center".equals(alignment, ignoreCase = true)) {
      SNAP_ALIGNMENT_CENTER
    } else if ("end" == alignment) {
      SNAP_ALIGNMENT_END
    } else {
      FLog.w(ReactConstants.TAG, "wrong snap alignment value: $alignment")
      SNAP_ALIGNMENT_DISABLED
    }
  }

  @JvmStatic
  public fun getDefaultScrollAnimationDuration(context: Context?): Int {
    if (!smoothScrollDurationInitialized) {
      smoothScrollDurationInitialized = true
      try {
        val overScrollerDurationGetter = OverScrollerDurationGetter(context)
        SMOOTH_SCROLL_DURATION = overScrollerDurationGetter.scrollAnimationDuration
      } catch (e: Throwable) {}
    }
    return SMOOTH_SCROLL_DURATION
  }

  /**
   * Adds a scroll listener.
   *
   * Note that you must keep a reference to this scroll listener because this class only keeps a
   * weak reference to it (to prevent memory leaks). This means that code like `
   * addScrollListener(new ScrollListener() {...})` won't work, you need to do this instead: `
   * mScrollListener = new ScrollListener() {...};
   * ReactScrollViewHelper.addScrollListener(mScrollListener); ` * instead.
   *
   * @param listener
   */
  @JvmStatic
  public fun addScrollListener(listener: ScrollListener) {
    scrollListeners.add(WeakReference(listener))
  }

  @JvmStatic
  public fun removeScrollListener(listener: ScrollListener) {
    scrollListeners.remove(WeakReference(listener))
  }

  @JvmStatic
  public fun addLayoutChangeListener(listener: LayoutChangeListener) {
    layoutChangeListeners.add(WeakReference(listener))
  }

  @JvmStatic
  public fun removeLayoutChangeListener(listener: LayoutChangeListener) {
    layoutChangeListeners.remove(WeakReference(listener))
  }

  /**
   * Scroll the given view to the location (x, y), with provided initial velocity. This method works
   * by calculate the "would be" initial velocity with internal friction to move to the point (x,
   * y), then apply that to the animator.
   */
  @JvmStatic
  public fun <T> smoothScrollTo(scrollView: T, x: Int, y: Int) where
  T : HasFlingAnimator?,
  T : HasScrollState?,
  T : HasStateWrapper?,
  T : ViewGroup {
    if (DEBUG_MODE) {
      FLog.i(TAG, "smoothScrollTo[%d] x %d y %d", scrollView.id, x, y)
    }

    // Register the listeners for the fling animator if there isn't any
    val flingAnimator = scrollView.getFlingAnimator()
    if (flingAnimator.listeners == null || flingAnimator.listeners.size == 0) {
      registerFlingAnimator<T>(scrollView)
    }
    val scrollState = scrollView.reactScrollViewScrollState
    scrollState.setFinalAnimatedPositionScroll(x, y)
    val scrollX = scrollView.scrollX
    val scrollY = scrollView.scrollY
    // Only one fling animator will be started. For the horizontal scroll view, scrollY will always
    // be the same to y. This is the same to the vertical scroll view.
    if (scrollX != x) {
      scrollView.startFlingAnimator(scrollX, x)
    }
    if (scrollY != y) {
      scrollView.startFlingAnimator(scrollY, y)
    }
  }

  /** Get current position or position after current animation finishes, if any. */
  @JvmStatic
  public fun <T> getNextFlingStartValue(
      scrollView: T,
      currentValue: Int,
      postAnimationValue: Int,
      velocity: Int
  ): Int where T : HasFlingAnimator?, T : HasScrollState?, T : ViewGroup {
    val scrollState = scrollView.reactScrollViewScrollState
    val velocityDirectionMask = if (velocity != 0) velocity / Math.abs(velocity) else 0
    val isMovingTowardsAnimatedValue =
        velocityDirectionMask * (postAnimationValue - currentValue) > 0

    // When the fling animation is not finished, or it was canceled and now we are moving towards
    // the final animated value, we will return the final animated value. This is because follow up
    // animation should consider the "would be" animated location, so that previous quick small
    // scrolls are still working.
    return if (!scrollState.isFinished ||
        (scrollState.isCanceled && isMovingTowardsAnimatedValue)) {
      postAnimationValue
    } else {
      currentValue
    }
  }

  @JvmStatic
  public fun <T> updateFabricScrollState(scrollView: T) where
  T : HasFlingAnimator?,
  T : HasScrollState?,
  T : HasStateWrapper?,
  T : ViewGroup {
    updateFabricScrollState(scrollView, scrollView.scrollX, scrollView.scrollY)
  }

  /**
   * Called on any stabilized onScroll change to propagate content offset value to a Shadow Node.
   */
  public fun <T> updateFabricScrollState(scrollView: T, scrollX: Int, scrollY: Int) where
  T : HasScrollState?,
  T : HasStateWrapper?,
  T : ViewGroup {
    if (DEBUG_MODE) {
      FLog.i(
          TAG, "updateFabricScrollState[%d] scrollX %d scrollY %d", scrollView.id, scrollX, scrollY)
    }
    if (ViewUtil.getUIManagerType(scrollView.id) == UIManagerType.DEFAULT) {
      return
    }
    val scrollState = scrollView.reactScrollViewScrollState
    // Dedupe events to reduce JNI traffic
    if (scrollState.lastStateUpdateScroll.equals(scrollX, scrollY)) {
      return
    }
    scrollState.setLastStateUpdateScroll(scrollX, scrollY)
    forceUpdateState(scrollView)
  }

  @JvmStatic
  public fun <T> forceUpdateState(scrollView: T) where
  T : HasScrollState?,
  T : HasStateWrapper?,
  T : ViewGroup {
    val scrollState = scrollView.reactScrollViewScrollState
    val scrollAwayPaddingTop = scrollState.scrollAwayPaddingTop
    val scrollPos = scrollState.lastStateUpdateScroll
    val scrollX = scrollPos.x
    val scrollY = scrollPos.y
    val layoutDirection = scrollState.layoutDirection
    val fabricScrollX =
        if (layoutDirection == View.LAYOUT_DIRECTION_RTL) {
          // getScrollX returns offset from left even when layout direction is RTL.
          // The following line calculates offset from right.
          val child = scrollView.getChildAt(0)
          val contentWidth = child?.width ?: 0
          -(contentWidth - scrollX - scrollView.width)
        } else {
          scrollX
        }
    if (DEBUG_MODE) {
      FLog.i(
          TAG,
          "updateFabricScrollState[%d] scrollX %d scrollY %d fabricScrollX %d",
          scrollView.id,
          scrollX,
          scrollY,
          fabricScrollX)
    }
    val stateWrapper = scrollView.stateWrapper
    if (stateWrapper != null) {
      val newStateData: WritableMap = WritableNativeMap()
      newStateData.putDouble(CONTENT_OFFSET_LEFT, toDIPFromPixel(scrollX.toFloat()).toDouble())
      newStateData.putDouble(CONTENT_OFFSET_TOP, toDIPFromPixel(scrollY.toFloat()).toDouble())
      newStateData.putDouble(
          SCROLL_AWAY_PADDING_TOP, toDIPFromPixel(scrollAwayPaddingTop.toFloat()).toDouble())
      stateWrapper.updateState(newStateData)
    }
  }

  @JvmStatic
  public fun <T> updateStateOnScrollChanged(
      scrollView: T,
      xVelocity: Float,
      yVelocity: Float
  ) where
  T : HasFlingAnimator?,
  T : HasScrollEventThrottle?,
  T : HasScrollState?,
  T : HasStateWrapper?,
  T : ViewGroup {
    // Race an UpdateState with every onScroll. This makes it more likely that, in Fabric,
    // when JS processes the scroll event, the C++ ShadowNode representation will have a
    // "more correct" scroll position. It will frequently be /incorrect/ but this decreases
    // the error as much as possible.
    updateFabricScrollState(scrollView, scrollView.scrollX, scrollView.scrollY)
    emitScrollEvent(scrollView, xVelocity, yVelocity)
  }

  public fun <T> registerFlingAnimator(scrollView: T) where
  T : HasFlingAnimator?,
  T : HasScrollState?,
  T : HasStateWrapper?,
  T : ViewGroup {
    scrollView
        .getFlingAnimator()
        .addListener(
            object : Animator.AnimatorListener {
              override fun onAnimationStart(animator: Animator) {
                val scrollState = scrollView.reactScrollViewScrollState
                scrollState.isCanceled = false
                scrollState.isFinished = false
              }

              override fun onAnimationEnd(animator: Animator) {
                scrollView.reactScrollViewScrollState.isFinished = true
                updateFabricScrollState<T>(scrollView)
              }

              override fun onAnimationCancel(animator: Animator) {
                scrollView.reactScrollViewScrollState.isCanceled = true
              }

              override fun onAnimationRepeat(animator: Animator) = Unit
            })
  }

  @JvmStatic
  public fun <T> dispatchMomentumEndOnAnimationEnd(scrollView: T) where
  T : HasFlingAnimator?,
  T : HasScrollEventThrottle?,
  T : ViewGroup {
    scrollView
        .getFlingAnimator()
        .addListener(
            object : Animator.AnimatorListener {
              override fun onAnimationStart(animator: Animator) = Unit

              override fun onAnimationEnd(animator: Animator) {
                emitScrollMomentumEndEvent(scrollView)
                animator.removeListener(this)
              }

              override fun onAnimationCancel(animator: Animator) {
                emitScrollMomentumEndEvent(scrollView)
                animator.removeListener(this)
              }

              override fun onAnimationRepeat(animator: Animator) = Unit
            })
  }

  @JvmStatic
  public fun <T> predictFinalScrollPosition(
      scrollView: T,
      velocityX: Int,
      velocityY: Int,
      maximumOffsetX: Int,
      maximumOffsetY: Int
  ): Point where T : HasFlingAnimator?, T : HasScrollState?, T : ViewGroup {
    val scrollState = scrollView.reactScrollViewScrollState
    // ScrollView can *only* scroll for 250ms when using smoothScrollTo and there's
    // no way to customize the scroll duration. So, we create a temporary OverScroller
    // so we can predict where a fling would land and snap to nearby that point.
    val scroller = OverScroller(scrollView.context)
    scroller.setFriction(1.0f - scrollState.decelerationRate)

    // predict where a fling would end up so we can scroll to the nearest snap offset
    val width = scrollView.width - scrollView.getPaddingStart() - scrollView.getPaddingEnd()
    val height = scrollView.height - scrollView.paddingBottom - scrollView.paddingTop
    val finalAnimatedPositionScroll = scrollState.finalAnimatedPositionScroll
    scroller.fling(
        getNextFlingStartValue<T>(
            scrollView, scrollView.scrollX, finalAnimatedPositionScroll.x, velocityX), // startX
        getNextFlingStartValue<T>(
            scrollView, scrollView.scrollY, finalAnimatedPositionScroll.y, velocityY), // startY
        velocityX, // velocityX
        velocityY, // velocityY
        0, // minX
        maximumOffsetX, // maxX
        0, // minY
        maximumOffsetY, // maxY
        width / 2, // overX
        height / 2 // overY
        )
    return Point(scroller.finalX, scroller.finalY)
  }

  public interface ScrollListener {
    public fun onScroll(
        scrollView: ViewGroup?,
        scrollEventType: ScrollEventType?,
        xVelocity: Float,
        yVelocity: Float
    )

    public fun onLayout(scrollView: ViewGroup?)
  }

  public interface LayoutChangeListener {
    public fun onLayoutChange(scrollView: ViewGroup)
  }

  public interface HasStateWrapper {
    public val stateWrapper: StateWrapper?
  }

  private class OverScrollerDurationGetter internal constructor(context: Context?) :
      OverScroller(context) {
    // This is the default in AOSP, hardcoded in OverScroller.java.
    private var currentScrollAnimationDuration = 250
    val scrollAnimationDuration: Int
      get() {
        // If startScroll is called without a duration, OverScroller will call `startScroll(x, y,
        // dx,
        // dy, duration)` with the default duration.
        super.startScroll(0, 0, 0, 0)
        return currentScrollAnimationDuration
      }

    override fun startScroll(startX: Int, startY: Int, dx: Int, dy: Int, duration: Int) {
      currentScrollAnimationDuration = duration
    }
  }

  public class ReactScrollViewScrollState(
      /**
       * Get the layout direction. Can be either scrollView.LAYOUT_DIRECTION_RTL (1) or
       * scrollView.LAYOUT_DIRECTION_LTR (0). If the value is -1, it means unknown layout.
       */
      public val layoutDirection: Int
  ) {

    /** Get the position after current animation is finished */
    public val finalAnimatedPositionScroll: Point = Point()
    /** Get the padding on the top for nav bar */
    public var scrollAwayPaddingTop: Int = 0
    /** Get the Fabric state of last scroll position */
    public val lastStateUpdateScroll: Point = Point(-1, -1)
    /** Get true if the previous animation was canceled */
    public var isCanceled: Boolean = false
    /** Get true if previous animation was finished */
    public var isFinished: Boolean = true
    /** Get true if previous animation was finished */
    public var decelerationRate: Float = 0.985f

    /** Set the final scroll position after scrolling animation is finished */
    public fun setFinalAnimatedPositionScroll(
        finalAnimatedPositionScrollX: Int,
        finalAnimatedPositionScrollY: Int
    ): ReactScrollViewScrollState {
      finalAnimatedPositionScroll.set(finalAnimatedPositionScrollX, finalAnimatedPositionScrollY)
      return this
    }

    /** Set the Fabric state of last scroll position */
    public fun setLastStateUpdateScroll(
        lastStateUpdateScrollX: Int,
        lastStateUpdateScrollY: Int
    ): ReactScrollViewScrollState {
      lastStateUpdateScroll.set(lastStateUpdateScrollX, lastStateUpdateScrollY)
      return this
    }
  }

  public interface HasScrollState {
    /** Get the scroll state for the current ScrollView */
    public val reactScrollViewScrollState: ReactScrollViewScrollState
  }

  public interface HasFlingAnimator {
    /**
     * Start the fling animator that the ScrollView has to go from the start position to end
     * position.
     */
    public fun startFlingAnimator(start: Int, end: Int)

    /** Get the fling animator that is reused for the ScrollView to handle fling animation. */
    public fun getFlingAnimator(): ValueAnimator

    /** Get the fling distance with current velocity for prediction */
    public fun getFlingExtrapolatedDistance(velocity: Int): Int
  }

  public interface HasScrollEventThrottle {
    /**
     * The scroll event throttle in ms. This number is used to throttle the scroll events. The
     * default value is zero, which means the scroll events are sent with no throttle.
     */
    public var scrollEventThrottle: Int

    /** The scroll view's last dispatch time for throttling */
    public var lastScrollDispatchTime: Long
  }

  public interface HasSmoothScroll {
    public fun reactSmoothScrollTo(x: Int, y: Int)

    public fun scrollToPreservingMomentum(x: Int, y: Int)
  }
}
