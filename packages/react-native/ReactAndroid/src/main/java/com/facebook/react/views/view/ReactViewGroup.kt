/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.view

import android.annotation.SuppressLint
import android.annotation.TargetApi
import android.content.Context
import android.graphics.BlendMode
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.drawable.Drawable
import android.os.Build
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.ReactSoftExceptionLogger.logSoftException
import com.facebook.react.bridge.UiThreadUtil.assertOnUiThread
import com.facebook.react.bridge.UiThreadUtil.runOnUiThread
import com.facebook.react.common.ReactConstants.TAG
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.touch.OnInterceptTouchEventListener
import com.facebook.react.touch.ReactHitSlopView
import com.facebook.react.touch.ReactInterceptingViewGroup
import com.facebook.react.uimanager.BackgroundStyleApplicator.clipToPaddingBox
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBackgroundColor
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderColor
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderRadius
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderStyle
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderWidth
import com.facebook.react.uimanager.BackgroundStyleApplicator.setFeedbackUnderlay
import com.facebook.react.uimanager.BlendModeHelper.needsIsolatedLayer
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.MeasureSpecAssertions.assertExplicitMeasureSpec
import com.facebook.react.uimanager.PixelUtil.toDIPFromPixel
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.PointerEvents.Companion.canBeTouchTarget
import com.facebook.react.uimanager.PointerEvents.Companion.canChildrenBeTouchTarget
import com.facebook.react.uimanager.ReactClippingProhibitedView
import com.facebook.react.uimanager.ReactClippingViewGroup
import com.facebook.react.uimanager.ReactClippingViewGroupHelper.calculateClippingRect
import com.facebook.react.uimanager.ReactOverflowViewWithInset
import com.facebook.react.uimanager.ReactPointerEventsView
import com.facebook.react.uimanager.ReactZIndexedViewGroup
import com.facebook.react.uimanager.ViewGroupDrawingOrderHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.common.ViewUtil.getUIManagerType
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.uimanager.style.Overflow
import com.facebook.react.views.view.CanvasUtil.enableZ
import kotlin.concurrent.Volatile
import kotlin.math.max

/**
 * Backing for a React View. Has support for borders, but since borders aren't common, lazy
 * initializes most of the storage needed for them.
 *
 * @param context A [Context] instance. It's Nullable to not break compatibility with OSS users
 *   (could be made non-null in the future but requires proper comms).
 */
public open class ReactViewGroup public constructor(context: Context?) :
    ViewGroup(context),
    ReactInterceptingViewGroup,
    ReactClippingViewGroup,
    ReactPointerEventsView,
    ReactHitSlopView,
    ReactZIndexedViewGroup,
    ReactOverflowViewWithInset {

  public override val overflowInset: Rect = Rect()

  /**
   * This listener will be set for child views when `removeClippedSubview` property is enabled. When
   * children layout is updated, it will call [updateSubviewClipStatus] to notify parent view about
   * that fact so that view can be attached/detached if necessary.
   *
   * TODO(7728005): Attach/detach views in batch - once per frame in case when multiple children
   *   update their layout.
   */
  private class ChildrenLayoutChangeListener(private var parent: ReactViewGroup?) :
      OnLayoutChangeListener {
    override fun onLayoutChange(
        v: View,
        left: Int,
        top: Int,
        right: Int,
        bottom: Int,
        oldLeft: Int,
        oldTop: Int,
        oldRight: Int,
        oldBottom: Int
    ) {
      if (parent?.removeClippedSubviews == true) {
        parent?.updateSubviewClipStatus(v)
      }
    }

    fun shutdown() {
      parent = null
    }
  }

  private var recycleCount = 0

  /**
   * Following properties are here to support the option [removeClippedSubviews]. This is a
   * temporary optimization/hack that is mainly applicable to the large list of images. The way it's
   * implemented is that we store an additional array of children in view node. We selectively
   * remove some of the views (detach) from it while still storing them in that additional array. We
   * override all possible add methods for [ViewGroup] so that we can control this process whenever
   * the option is set. We also override [ViewGroup#getChildAt] and [ViewGroup#getChildCount] so
   * those methods may return views that are not attached. This is risky but allows us to perform a
   * correct cleanup in `NativeViewHierarchyManager`.
   */
  private var _removeClippedSubviews = false

  @Volatile private var inSubviewClippingLoop = false
  private var allChildren: Array<View?>? = null
  internal var allChildrenCount: Int = 0
    private set

  private var clippingRect: Rect? = null

  public override var hitSlopRect: Rect? = null
  public override var pointerEvents: PointerEvents = PointerEvents.AUTO

  private var childrenLayoutChangeListener: ChildrenLayoutChangeListener? = null
  private var onInterceptTouchEventListener: OnInterceptTouchEventListener? = null
  private var needsOffscreenAlphaCompositing = false
  private var backfaceOpacity = 0f
  private var backfaceVisible = false
  private var childrenRemovedWhileTransitioning: MutableSet<Int>? = null

  init {
    initView()
  }

  /**
   * Set all default values here as opposed to in the constructor or field defaults. It is important
   * that these properties are set during the constructor, but also on-demand whenever an existing
   * ReactViewGroup is recycled.
   */
  private fun initView() {
    clipChildren = false

    _removeClippedSubviews = false
    inSubviewClippingLoop = false
    allChildren = null
    allChildrenCount = 0
    clippingRect = null
    hitSlopRect = null
    _overflow = Overflow.VISIBLE
    pointerEvents = PointerEvents.AUTO
    childrenLayoutChangeListener = null
    onInterceptTouchEventListener = null
    needsOffscreenAlphaCompositing = false
    _drawingOrderHelper = null
    backfaceOpacity = 1f
    backfaceVisible = true
    childrenRemovedWhileTransitioning = null
  }

  internal open fun recycleView() {
    recycleCount++
    // Remove dangling listeners
    if (allChildren != null && childrenLayoutChangeListener != null) {
      childrenLayoutChangeListener?.shutdown()
      for (i in 0..<allChildrenCount) {
        allChildren?.get(i)?.removeOnLayoutChangeListener(childrenLayoutChangeListener)
      }
    }

    // Set default field values
    initView()
    overflowInset.setEmpty()

    // Remove any children
    removeAllViews()

    // If the view is still attached to a parent, we need to remove it from the parent
    // before we can recycle it.
    if (parent != null) {
      (parent as ViewGroup).removeView(this)
    }

    // Reset background, borders
    updateBackgroundDrawable(null)

    resetPointerEvents()
  }

  private var _drawingOrderHelper: ViewGroupDrawingOrderHelper? = null
  private val drawingOrderHelper: ViewGroupDrawingOrderHelper
    get() {
      if (_drawingOrderHelper == null) {
        _drawingOrderHelper = ViewGroupDrawingOrderHelper(this)
      }
      return requireNotNull(_drawingOrderHelper)
    }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    assertExplicitMeasureSpec(widthMeasureSpec, heightMeasureSpec)

    setMeasuredDimension(
        MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec))
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    // No-op since UIManager handles actually laying out children.
  }

  @SuppressLint("MissingSuperCall")
  override fun requestLayout() {
    // No-op, terminate `requestLayout` here, UIManager handles laying out children and
    // `layout` is called on all RN-managed views by `NativeViewHierarchyManager`
  }

  @TargetApi(23)
  override fun dispatchProvideStructure(structure: ViewStructure) {
    try {
      super.dispatchProvideStructure(structure)
    } catch (e: NullPointerException) {
      FLog.e(TAG, "NullPointerException when executing dispatchProvideStructure", e)
    }
  }

  override fun setBackgroundColor(color: Int) {
    setBackgroundColor(this, color)
  }

  @Deprecated(
      "setTranslucentBackgroundDrawable is deprecated since React Native 0.76.0 and will be removed in a future version")
  public fun setTranslucentBackgroundDrawable(background: Drawable?) {
    setFeedbackUnderlay(this, background)
  }

  public override fun setOnInterceptTouchEventListener(listener: OnInterceptTouchEventListener) {
    onInterceptTouchEventListener = listener
  }

  override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
    if (onInterceptTouchEventListener?.onInterceptTouchEvent(this, event) == true) {
      return true
    }
    // We intercept the touch event if the children are not supposed to receive it.
    if (!canChildrenBeTouchTarget(pointerEvents)) {
      return true
    }
    return super.onInterceptTouchEvent(event)
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    // We do not accept the touch event if this view is not supposed to receive it.
    if (!canBeTouchTarget(pointerEvents)) {
      return false
    }
    // The root view always assumes any view that was tapped wants the touch
    // and sends the event to JS as such.
    // We don't need to do bubbling in native (it's already happening in JS).
    // For an explanation of bubbling and capturing, see
    // http://javascript.info/tutorial/bubbling-and-capturing#capturing
    return true
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    @Suppress("DEPRECATION")
    if (ReactFeatureFlags.dispatchPointerEvents) {
      // Match the logic from onTouchEvent if pointer events are enabled
      return canBeTouchTarget(pointerEvents)
    }
    return super.onHoverEvent(event)
  }

  override fun dispatchGenericMotionEvent(ev: MotionEvent): Boolean {
    // We do not dispatch the motion event if its children are not supposed to receive it
    if (!canChildrenBeTouchTarget(pointerEvents)) {
      return false
    }

    return super.dispatchGenericMotionEvent(ev)
  }

  /**
   * We override this to allow developers to determine whether they need offscreen alpha compositing
   * or not. See the documentation of needsOffscreenAlphaCompositing in View.js.
   */
  override fun hasOverlappingRendering(): Boolean = needsOffscreenAlphaCompositing

  /** See the documentation of needsOffscreenAlphaCompositing in View.js. */
  public fun setNeedsOffscreenAlphaCompositing(needsOffscreenAlphaCompositing: Boolean) {
    this.needsOffscreenAlphaCompositing = needsOffscreenAlphaCompositing
  }

  public fun setBorderWidth(position: Int, width: Float) {
    setBorderWidth(this, LogicalEdge.entries[position], toDIPFromPixel(width))
  }

  public fun setBorderColor(position: Int, color: Int?) {
    setBorderColor(this, LogicalEdge.entries[position], color)
  }

  @Deprecated(
      message = "setBorderRadius(Float) is deprecated and will be removed in the future.",
      replaceWith = ReplaceWith("setBorderRadius(Float,LengthPercentage)"))
  public fun setBorderRadius(borderRadius: Float) {
    val radius =
        if (borderRadius.isNaN()) null
        else LengthPercentage(borderRadius, LengthPercentageType.POINT)
    setBorderRadius(this, BorderRadiusProp.BORDER_RADIUS, radius)
  }

  @Deprecated(
      message = "setBorderRadius(Float) is deprecated and will be removed in the future.",
      replaceWith = ReplaceWith("setBorderRadius(Float,LengthPercentage)"))
  public fun setBorderRadius(borderRadius: Float, position: Int) {
    val radius =
        if (borderRadius.isNaN()) null
        else LengthPercentage(borderRadius, LengthPercentageType.POINT)
    setBorderRadius(this, BorderRadiusProp.entries[position], radius)
  }

  public fun setBorderRadius(property: BorderRadiusProp?, borderRadius: LengthPercentage?) {
    setBorderRadius(this, checkNotNull(property), borderRadius)
  }

  public fun setBorderStyle(style: String?) {
    setBorderStyle(this, style?.let { BorderStyle.fromString(it) })
  }

  override var removeClippedSubviews: Boolean
    get() = _removeClippedSubviews
    set(newValue) {
      if (newValue == _removeClippedSubviews) {
        return
      }
      _removeClippedSubviews = newValue
      childrenRemovedWhileTransitioning = null
      if (newValue) {
        clippingRect = Rect()
        calculateClippingRect(this, checkNotNull(clippingRect))
        allChildrenCount = childCount
        val initialSize = max(12.0, allChildrenCount.toDouble()).toInt()
        allChildren = arrayOfNulls(initialSize)
        childrenLayoutChangeListener = ChildrenLayoutChangeListener(this)
        for (i in 0..<allChildrenCount) {
          val child = getChildAt(i)
          allChildren?.set(i, child)
          child.addOnLayoutChangeListener(childrenLayoutChangeListener)
          setViewClipped(child, false)
        }
        updateClippingRect()
      } else {
        // Add all clipped views back, deallocate additional arrays, remove layoutChangeListener
        checkNotNull(allChildren)
        checkNotNull(childrenLayoutChangeListener)
        for (i in 0..<allChildrenCount) {
          allChildren?.get(i)?.removeOnLayoutChangeListener(childrenLayoutChangeListener)
        }
        getDrawingRect(checkNotNull(clippingRect))
        updateClippingToRect(checkNotNull(clippingRect))
        allChildren = null
        clippingRect = null
        allChildrenCount = 0
        childrenLayoutChangeListener = null
      }
    }

  override fun getClippingRect(outClippingRect: Rect) {
    outClippingRect.set(checkNotNull(clippingRect))
  }

  override fun updateClippingRect() {
    updateClippingRect(null)
  }

  override fun updateClippingRect(excludedView: Set<Int>?) {
    if (!_removeClippedSubviews) {
      return
    }

    checkNotNull(allChildren)

    calculateClippingRect(this, checkNotNull(clippingRect))
    updateClippingToRect(checkNotNull(clippingRect), excludedView)
  }

  override fun endViewTransition(view: View) {
    super.endViewTransition(view)
    childrenRemovedWhileTransitioning?.remove(view.id)
  }

  private fun trackChildViewTransition(childId: Int) {
    if (childrenRemovedWhileTransitioning == null) {
      childrenRemovedWhileTransitioning = mutableSetOf()
    }
    childrenRemovedWhileTransitioning?.add(childId)
  }

  private fun isChildRemovedWhileTransitioning(child: View): Boolean =
      childrenRemovedWhileTransitioning?.contains(child.id) == true

  private fun updateClippingToRect(clippingRect: Rect, excludedViewsSet: Set<Int>? = null) {
    checkNotNull(allChildren)
    inSubviewClippingLoop = true
    var clippedSoFar = 0
    for (i in 0..<allChildrenCount) {
      try {
        updateSubviewClipStatus(clippingRect, i, clippedSoFar, excludedViewsSet)
      } catch (error: IndexOutOfBoundsException) {
        var realClippedSoFar = 0
        val uniqueViews: MutableSet<View?> = HashSet()
        var j = 0
        while (j < i) {
          realClippedSoFar += if (isViewClipped(checkNotNull(allChildren?.get(j)), null)) 1 else 0
          uniqueViews.add(allChildren?.get(j))
          j++
        }

        throw IllegalStateException(
            "Invalid clipping state. i=$i clippedSoFar=$clippedSoFar count=$childCount allChildrenCount=$allChildrenCount recycleCount=$recycleCount realClippedSoFar=$realClippedSoFar uniqueViewsCount=${uniqueViews.size}",
            error)
      }
      if (isViewClipped(checkNotNull(allChildren?.get(i)), i)) {
        clippedSoFar++
      }
    }
    inSubviewClippingLoop = false
  }

  private fun updateSubviewClipStatus(clippingRect: Rect?, idx: Int, clippedSoFar: Int) {
    val nonNullClippingRect = checkNotNull(clippingRect)
    updateSubviewClipStatus(nonNullClippingRect, idx, clippedSoFar, null)
  }

  private fun updateSubviewClipStatus(
      clippingRect: Rect,
      idx: Int,
      clippedSoFar: Int,
      excludedViewsSet: Set<Int>?
  ) {
    assertOnUiThread()

    val child = checkNotNull(allChildren?.get(idx))
    val intersects = clippingRect.intersects(child.left, child.top, child.right, child.bottom)
    var needUpdateClippingRecursive = false
    // We never want to clip children that are being animated, as this can easily break layout :
    // when layout animation changes size and/or position of views contained inside a listview that
    // clips offscreen children, we need to ensure that, when view exits the viewport, final size
    // and position is set prior to removing the view from its listview parent.
    // Otherwise, when view gets re-attached again, i.e when it re-enters the viewport after scroll,
    // it won't be size and located properly.
    val animation = child.animation
    val isAnimating = animation != null && !animation.hasEnded()
    val shouldSkipView = excludedViewsSet != null && excludedViewsSet.contains(child.id)
    if (excludedViewsSet != null) {
      needUpdateClippingRecursive = true
    }
    // We don't want to clip a view that is currently focused at that might break focus navigation
    if (!intersects &&
        !isViewClipped(child, idx) &&
        !isAnimating &&
        child !== focusedChild &&
        !shouldSkipView) {
      setViewClipped(child, true)
      // We can try saving on invalidate call here as the view that we remove is out of visible area
      // therefore invalidation is not necessary.
      removeViewInLayout(child)
      needUpdateClippingRecursive = true
    } else if ((shouldSkipView || intersects) && isViewClipped(child, idx)) {
      val adjustedIdx = idx - clippedSoFar
      check(adjustedIdx >= 0)
      setViewClipped(child, false)
      addViewInLayout(child, adjustedIdx, defaultLayoutParam, true)
      invalidate()
      needUpdateClippingRecursive = true
    } else if (intersects) {
      // If there is any intersection we need to inform the child to update its clipping rect
      needUpdateClippingRecursive = true
    }
    if (needUpdateClippingRecursive) {
      if (child is ReactClippingViewGroup) {
        val clippingChild = child as ReactClippingViewGroup
        if (clippingChild.removeClippedSubviews) {
          clippingChild.updateClippingRect(excludedViewsSet)
        }
      }
    }
  }

  private fun updateSubviewClipStatus(subview: View) {
    if (!_removeClippedSubviews || parent == null) {
      return
    }

    val nonNullClippingRect = checkNotNull(clippingRect)
    checkNotNull(allChildren)

    // do fast check whether intersect state changed
    val intersects =
        nonNullClippingRect.intersects(subview.left, subview.top, subview.right, subview.bottom)

    // If it was intersecting before, should be attached to the parent
    val oldIntersects = !isViewClipped(subview, null)

    if (intersects != oldIntersects) {
      inSubviewClippingLoop = true
      var clippedSoFar = 0
      for (i in 0..<allChildrenCount) {
        if (allChildren?.get(i) === subview) {
          updateSubviewClipStatus(clippingRect, i, clippedSoFar)
          break
        }
        if (isViewClipped(checkNotNull(allChildren?.get(i)), i)) {
          clippedSoFar++
        }
      }
      inSubviewClippingLoop = false
    }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    if (_removeClippedSubviews) {
      updateClippingRect()
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (_removeClippedSubviews) {
      updateClippingRect()
    }
  }

  private fun customDrawOrderDisabled(): Boolean {
    if (id == NO_ID) {
      return false
    }

    // Custom draw order is disabled for Fabric.
    return getUIManagerType(id) == UIManagerType.FABRIC
  }

  override fun onViewAdded(child: View) {
    assertOnUiThread()
    checkViewClippingTag(child, java.lang.Boolean.FALSE)
    if (!customDrawOrderDisabled()) {
      drawingOrderHelper.handleAddView(child)
      isChildrenDrawingOrderEnabled = drawingOrderHelper.shouldEnableCustomDrawingOrder()
    } else {
      isChildrenDrawingOrderEnabled = false
    }
    super.onViewAdded(child)
  }

  override fun onViewRemoved(child: View) {
    assertOnUiThread()
    checkViewClippingTag(child, java.lang.Boolean.TRUE)
    if (!customDrawOrderDisabled()) {
      drawingOrderHelper.handleRemoveView(child)
      isChildrenDrawingOrderEnabled = drawingOrderHelper.shouldEnableCustomDrawingOrder()
    } else {
      isChildrenDrawingOrderEnabled = false
    }

    // The parent might not be null in case the child is transitioning.
    if (child.parent != null) {
      trackChildViewTransition(child.id)
    }

    super.onViewRemoved(child)
  }

  private fun checkViewClippingTag(child: View, expectedTag: Boolean) {
    if (inSubviewClippingLoop) {
      val tag = child.getTag(R.id.view_clipped)
      if (expectedTag != tag) {
        logSoftException(
            ReactSoftExceptionLogger.Categories.RVG_ON_VIEW_REMOVED,
            ReactNoCrashSoftException("View clipping tag mismatch: tag=$tag expected=$expectedTag"))
      }
    }
    if (_removeClippedSubviews) {
      child.setTag(R.id.view_clipped, expectedTag)
    }
  }

  override fun getChildDrawingOrder(childCount: Int, index: Int): Int {
    assertOnUiThread()

    return if (!customDrawOrderDisabled()) {
      drawingOrderHelper.getChildDrawingOrder(childCount, index)
    } else {
      index
    }
  }

  override fun getZIndexMappedChildIndex(index: Int): Int {
    assertOnUiThread()

    if (!customDrawOrderDisabled() && drawingOrderHelper.shouldEnableCustomDrawingOrder()) {
      return drawingOrderHelper.getChildDrawingOrder(childCount, index)
    }

    // Fabric behavior
    return index
  }

  override fun updateDrawingOrder() {
    if (customDrawOrderDisabled()) {
      return
    }

    drawingOrderHelper.update()
    isChildrenDrawingOrderEnabled = drawingOrderHelper.shouldEnableCustomDrawingOrder()
    invalidate()
  }

  override fun dispatchSetPressed(pressed: Boolean) {
    // Prevents the ViewGroup from dispatching the pressed state
    // to it's children.
  }

  private fun resetPointerEvents() {
    pointerEvents = PointerEvents.AUTO
  }

  internal fun getChildAtWithSubviewClippingEnabled(index: Int): View? =
      if (index in 0..<allChildrenCount) checkNotNull(allChildren)[index] else null

  internal fun addViewWithSubviewClippingEnabled(
      child: View,
      index: Int,
  ) {
    check(_removeClippedSubviews)
    setViewClipped(child, true) // the view has not been added, so it is "clipped"
    addInArray(child, index)

    // we add view as "clipped" and then run {@link #updateSubviewClipStatus} to conditionally
    // attach it
    val clippingRect = checkNotNull(clippingRect)
    val childArray: Array<View?> = checkNotNull(allChildren)
    inSubviewClippingLoop = true
    var clippedSoFar = 0
    for (i in 0..<index) {
      if (isViewClipped(checkNotNull(childArray[i]), i)) {
        clippedSoFar++
      }
    }
    updateSubviewClipStatus(clippingRect, index, clippedSoFar)
    inSubviewClippingLoop = false
    child.addOnLayoutChangeListener(childrenLayoutChangeListener)

    if (child is ReactClippingProhibitedView) {
      runOnUiThread(
          object : Runnable {
            override fun run() {
              if (!child.isShown) {
                logSoftException(
                    ReactSoftExceptionLogger.Categories.CLIPPING_PROHIBITED_VIEW,
                    ReactNoCrashSoftException(
                        "Child view has been added to Parent view in which it is clipped and not visible. This is not legal for this particular child view. Child: [${child.id}] $child Parent: [$id] ${toString()}"))
              }
            }
          })
    }
  }

  internal fun removeViewWithSubviewClippingEnabled(view: View) {
    assertOnUiThread()

    check(_removeClippedSubviews)
    checkNotNull(clippingRect)
    val childArray: Array<View?> = checkNotNull(allChildren)
    view.removeOnLayoutChangeListener(childrenLayoutChangeListener)
    val index = indexOfChildInAllChildren(view)
    if (!isViewClipped(checkNotNull(childArray[index]), index)) {
      var clippedSoFar = 0
      for (i in 0..<index) {
        if (isViewClipped(checkNotNull(childArray[i]), i)) {
          clippedSoFar++
        }
      }
      removeViewsInLayout(index - clippedSoFar, 1)
      invalidate()
    }
    removeFromArray(index)
  }

  internal fun removeAllViewsWithSubviewClippingEnabled() {
    check(_removeClippedSubviews)
    val childArray = checkNotNull(allChildren)
    for (i in 0..<allChildrenCount) {
      childArray[i]?.removeOnLayoutChangeListener(childrenLayoutChangeListener)
    }
    removeAllViewsInLayout()
    allChildrenCount = 0
  }

  /**
   * @param index For logging - index of the view in `allChildren`, or `null` to skip logging.
   * @return `true` if the view has been removed from the ViewGroup.
   */
  private fun isViewClipped(view: View, index: Int?): Boolean {
    val tag = view.getTag(R.id.view_clipped)
    if (tag != null) {
      return tag as Boolean
    }
    val parent = view.parent
    val transitioning = isChildRemovedWhileTransitioning(view)
    if (index != null) {
      logSoftException(
          ReactSoftExceptionLogger.Categories.RVG_IS_VIEW_CLIPPED,
          ReactNoCrashSoftException(
              "View missing clipping tag: index=$index parentNull=${parent == null} parentThis=${parent === this} transitioning=$transitioning"))
    }
    // fallback - should be transitioning or have no parent if the view was removed
    if (parent == null || transitioning) {
      return true
    } else {
      check(parent === this)
      return false
    }
  }

  private fun indexOfChildInAllChildren(child: View): Int {
    val count = allChildrenCount
    val childArray = checkNotNull(allChildren)
    for (i in 0..<count) {
      if (childArray[i] === child) {
        return i
      }
    }
    return -1
  }

  private fun addInArray(child: View, index: Int) {
    var childArray = checkNotNull(allChildren) // TODO
    val count = allChildrenCount
    val size = childArray.size
    if (index == count) {
      if (size == count) {
        allChildren = arrayOfNulls(size + ARRAY_CAPACITY_INCREMENT)
        System.arraycopy(childArray, 0, checkNotNull(allChildren), 0, size)
        childArray = checkNotNull(allChildren)
      }
      childArray[allChildrenCount++] = child
    } else if (index < count) {
      if (size == count) {
        allChildren = arrayOfNulls(size + ARRAY_CAPACITY_INCREMENT)
        System.arraycopy(childArray, 0, checkNotNull(allChildren), 0, index)
        System.arraycopy(childArray, index, checkNotNull(allChildren), index + 1, count - index)
        childArray = checkNotNull(allChildren)
      } else {
        System.arraycopy(childArray, index, childArray, index + 1, count - index)
      }
      childArray[index] = child
      allChildrenCount++
    } else {
      throw IndexOutOfBoundsException("index=$index count=$count")
    }
  }

  private fun removeFromArray(index: Int) {
    val childArray = checkNotNull(allChildren)
    val count = allChildrenCount
    when (index) {
      count - 1 -> childArray[--allChildrenCount] = null
      in 0..<count -> {
        System.arraycopy(childArray, index + 1, childArray, index, count - index - 1)
        childArray[--allChildrenCount] = null
      }
      else -> throw IndexOutOfBoundsException()
    }
  }

  private var _overflow: Overflow? = null
  override var overflow: String?
    get() =
        when (_overflow) {
          Overflow.HIDDEN -> "hidden"
          Overflow.SCROLL -> "scroll"
          Overflow.VISIBLE -> "visible"
          else -> null
        }
    set(overflow) {
      _overflow =
          if (overflow == null) {
            Overflow.VISIBLE
          } else {
            Overflow.fromString(overflow)
          }
      invalidate()
    }

  override fun setOverflowInset(left: Int, top: Int, right: Int, bottom: Int) {
    if (needsIsolatedLayer(this) &&
        (overflowInset.left != left ||
            overflowInset.top != top ||
            overflowInset.right != right ||
            overflowInset.bottom != bottom)) {
      invalidate()
    }
    overflowInset[left, top, right] = bottom
  }

  /**
   * Set the background for the view or remove the background. It calls [setBackground].
   *
   * @param drawable The [Drawable] to use as the background, or null to remove the background
   */
  private fun updateBackgroundDrawable(drawable: Drawable?) {
    super.setBackground(drawable)
  }

  override fun draw(canvas: Canvas) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
        getUIManagerType(this) == UIManagerType.FABRIC &&
        needsIsolatedLayer(this)) {
      // Check if the view is a stacking context and has children, if it does, do the rendering
      // offscreen and then composite back. This follows the idea of group isolation on blending
      // https://www.w3.org/TR/compositing-1/#isolationblending

      val overflowInset = overflowInset
      canvas.saveLayer(
          overflowInset.left.toFloat(),
          overflowInset.top.toFloat(),
          (width + -overflowInset.right).toFloat(),
          (height + -overflowInset.bottom).toFloat(),
          null)
      super.draw(canvas)
      canvas.restore()
    } else {
      super.draw(canvas)
    }
  }

  override fun dispatchDraw(canvas: Canvas) {
    if (_overflow != Overflow.VISIBLE || getTag(R.id.filter) != null) {
      clipToPaddingBox(this, canvas)
    }
    super.dispatchDraw(canvas)
  }

  override fun drawChild(canvas: Canvas, child: View, drawingTime: Long): Boolean {
    val drawWithZ = child.elevation > 0

    if (drawWithZ) {
      enableZ(canvas, true)
    }

    var mixBlendMode: BlendMode? = null
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
        getUIManagerType(this) == UIManagerType.FABRIC &&
        needsIsolatedLayer(this)) {
      mixBlendMode = child.getTag(R.id.mix_blend_mode) as? BlendMode
      if (mixBlendMode != null) {
        val p = Paint()
        p.blendMode = mixBlendMode
        val overflowInset = overflowInset
        canvas.saveLayer(
            overflowInset.left.toFloat(),
            overflowInset.top.toFloat(),
            (width + -overflowInset.right).toFloat(),
            (height + -overflowInset.bottom).toFloat(),
            p)
      }
    }

    val result = super.drawChild(canvas, child, drawingTime)

    if (mixBlendMode != null) {
      canvas.restore()
    }

    if (drawWithZ) {
      enableZ(canvas, false)
    }
    return result
  }

  public fun setOpacityIfPossible(opacity: Float) {
    backfaceOpacity = opacity
    setBackfaceVisibilityDependantOpacity()
  }

  public fun setBackfaceVisibility(backfaceVisibility: String) {
    backfaceVisible = "visible" == backfaceVisibility
    setBackfaceVisibilityDependantOpacity()
  }

  public fun setBackfaceVisibilityDependantOpacity() {
    if (backfaceVisible) {
      alpha = backfaceOpacity
      return
    }

    val rotationX = rotationX
    val rotationY = rotationY

    val isFrontfaceVisible =
        (rotationX >= -90f && rotationX < 90f) && (rotationY >= -90f && rotationY < 90f)

    if (isFrontfaceVisible) {
      alpha = backfaceOpacity
      return
    }

    alpha = 0f
  }

  private companion object {
    private const val ARRAY_CAPACITY_INCREMENT = 12
    private val defaultLayoutParam = LayoutParams(0, 0)

    private fun setViewClipped(view: View, clipped: Boolean) {
      view.setTag(R.id.view_clipped, clipped)
    }
  }
}
