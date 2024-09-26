/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // ReactFeatureFlags

package com.facebook.react.views.view

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.BlendMode
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.drawable.Drawable
import android.os.Build
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.react.R
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.touch.OnInterceptTouchEventListener
import com.facebook.react.touch.ReactHitSlopView
import com.facebook.react.touch.ReactInterceptingViewGroup
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.MeasureSpecAssertions
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ReactClippingProhibitedView
import com.facebook.react.uimanager.ReactClippingViewGroup
import com.facebook.react.uimanager.ReactClippingViewGroupHelper
import com.facebook.react.uimanager.ReactOverflowViewWithInset
import com.facebook.react.uimanager.ReactPointerEventsView
import com.facebook.react.uimanager.ReactZIndexedViewGroup
import com.facebook.react.uimanager.ViewGroupDrawingOrderHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.uimanager.style.Overflow
import kotlin.math.max

/**
 * Backing for a React View. Has support for borders, but since borders aren't common, lazy
 * initializes most of the storage needed for them.
 */
@OptIn(UnstableReactNativeAPI::class)
public open class ReactViewGroup(context: Context) :
    ViewGroup(context),
    ReactInterceptingViewGroup,
    ReactClippingViewGroup,
    ReactPointerEventsView,
    ReactHitSlopView,
    ReactZIndexedViewGroup,
    ReactOverflowViewWithInset {

  private companion object {
    private const val ARRAY_CAPACITY_INCREMENT = 12
    private const val DEFAULT_BACKGROUND_COLOR = Color.TRANSPARENT
    private val defaultLayoutParam = LayoutParams(0, 0)
  }

  private val _overflowInset = Rect()

  /**
   * This listener will be set for child views when removeClippedSubview property is enabled. When
   * children layout is updated, it will call [updateSubviewClipStatus] to notify parent view about
   * that fact so that view can be attached/detached if necessary.
   *
   * TODO(7728005): Attach/detach views in batch - once per frame in case when multiple children
   *   update their layout.
   */
  private class ChildrenLayoutChangeListener(private val parent: ReactViewGroup) :
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
      if (parent.removeClippedSubviews) {
        parent.updateSubviewClipStatus(v)
      }
    }
  }

  // Following properties are here to support the option {@code removeClippedSubviews}. This is a
  // temporary optimization/hack that is mainly applicable to the large list of images. The way
  // it's implemented is that we store an additional array of children in view node. We selectively
  // remove some of the views (detach) from it while still storing them in that additional array.
  // We override all possible add methods for [ViewGroup] so that we can control this process
  // whenever the option is set. We also override [ViewGroup#getChildAt] and
  // [ViewGroup#getChildCount] so those methods may return views that are not attached.
  // This is risky but allows us to perform a correct cleanup in [NativeViewHierarchyManager].
  private var _removeClippedSubviews = false

  private var allChildren: Array<View?>? = null
  internal var allChildrenCount: Int = 0
    private set

  private var _clippingRect: Rect? = null
  public override var hitSlopRect: Rect? = null
  private var _overflow: Overflow = Overflow.VISIBLE
  private var _pointerEvents: PointerEvents = PointerEvents.AUTO
  private var childrenLayoutChangeListener: ChildrenLayoutChangeListener? = null
  private var onInterceptTouchEventListener: OnInterceptTouchEventListener? = null
  private var needsOffscreenAlphaCompositing = false
  private var _drawingOrderHelper: ViewGroupDrawingOrderHelper? = null
  private var backfaceOpacity = 1f
  private var backfaceVisibility: String? = "visible"

  /**
   * Set all default values here as opposed to in the constructor or field defaults. It is important
   * that these properties are set during the constructor, but also on-demand whenever an existing
   * ReactTextView is recycled.
   */
  private fun initView() {
    clipChildren = false
    _removeClippedSubviews = false
    allChildren = null
    allChildrenCount = 0
    _clippingRect = null
    hitSlopRect = null
    _overflow = Overflow.VISIBLE
    resetPointerEvents()
    childrenLayoutChangeListener = null
    onInterceptTouchEventListener = null
    needsOffscreenAlphaCompositing = false
    _drawingOrderHelper = null
    backfaceOpacity = 1f
    backfaceVisibility = "visible"
  }

  internal open fun recycleView(): Unit {
    // Remove dangling listeners
    val children = allChildren
    val listener = childrenLayoutChangeListener
    if (children != null && listener != null) {
      for (i in 0 until allChildrenCount) {
        children[i]?.removeOnLayoutChangeListener(listener)
      }
    }

    // Set default field values
    initView()
    _overflowInset.setEmpty()

    // Remove any children
    removeAllViews()

    // Reset background, borders
    updateBackgroundDrawable(null)
    resetPointerEvents()
  }

  private val drawingOrderHelper: ViewGroupDrawingOrderHelper
    get() {
      return _drawingOrderHelper
          ?: ViewGroupDrawingOrderHelper(this).also { _drawingOrderHelper = it }
    }

  init {
    initView()
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    MeasureSpecAssertions.assertExplicitMeasureSpec(widthMeasureSpec, heightMeasureSpec)
    setMeasuredDimension(
        MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec))
  }

  // No-op since UIManagerModule handles actually laying out children.
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int): Unit = Unit

  @SuppressLint("MissingSuperCall")
  // No-op, terminate `requestLayout` here, UIManagerModule handles laying out children and `layout`
  // is called on all RN-managed views by `NativeViewHierarchyManager`
  override fun requestLayout(): Unit = Unit

  override fun dispatchProvideStructure(structure: ViewStructure) {
    try {
      super.dispatchProvideStructure(structure)
    } catch (e: NullPointerException) {
      FLog.e(ReactConstants.TAG, "NullPointerException when executing dispatchProvideStructure", e)
    }
  }

  override fun setBackgroundColor(color: Int) {
    BackgroundStyleApplicator.setBackgroundColor(this, color)
  }

  @Deprecated(
      "Don't use setTranslucentBackgroundDrawable as it was deprecated in React Native 0.76.0.",
      ReplaceWith(
          "BackgroundStyleApplicator.setFeedbackUnderlay(this, background)",
          "com.facebook.react.uimanager.BackgroundStyleApplicator"))
  public open fun setTranslucentBackgroundDrawable(background: Drawable?): Unit {
    BackgroundStyleApplicator.setFeedbackUnderlay(this, background)
  }

  override fun setOnInterceptTouchEventListener(listener: OnInterceptTouchEventListener) {
    onInterceptTouchEventListener = listener
  }

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    if (onInterceptTouchEventListener?.onInterceptTouchEvent(this, ev) == true) {
      return true
    }
    // We intercept the touch event if the children are not supposed to receive it.
    return !PointerEvents.canChildrenBeTouchTarget(_pointerEvents) ||
        super.onInterceptTouchEvent(ev)
  }

  override fun onTouchEvent(ev: MotionEvent): Boolean {
    // We do not accept the touch event if this view is not supposed to receive it.
    // The root view always assumes any view that was tapped wants the touch
    // and sends the event to JS as such.
    // We don't need to do bubbling in native (it's already happening in JS).
    // For an explanation of bubbling and capturing, see
    // http://javascript.info/tutorial/bubbling-and-capturing#capturing
    return PointerEvents.canBeTouchTarget(_pointerEvents)
  }

  override fun onHoverEvent(event: MotionEvent): Boolean =
      if (ReactFeatureFlags.dispatchPointerEvents) {
        // Match the logic from onTouchEvent if pointer events are enabled
        PointerEvents.canBeTouchTarget(_pointerEvents)
      } else {
        super.onHoverEvent(event)
      }

  override fun dispatchGenericMotionEvent(ev: MotionEvent): Boolean =
      // We do not dispatch the motion event if its children are not supposed to receive it
      PointerEvents.canChildrenBeTouchTarget(_pointerEvents) || super.dispatchGenericMotionEvent(ev)

  /**
   * We override this to allow developers to determine whether they need offscreen alpha compositing
   * or not. See the documentation of needsOffscreenAlphaCompositing in View.js.
   */
  override fun hasOverlappingRendering(): Boolean = needsOffscreenAlphaCompositing

  /** See the documentation of needsOffscreenAlphaCompositing in View.js. */
  public open fun setNeedsOffscreenAlphaCompositing(needsOffscreenAlphaCompositing: Boolean): Unit {
    this.needsOffscreenAlphaCompositing = needsOffscreenAlphaCompositing
  }

  public open fun setBorderWidth(position: Int, width: Float): Unit {
    BackgroundStyleApplicator.setBorderWidth(this, LogicalEdge.entries[position], width.pxToDp())
  }

  public open fun setBorderColor(position: Int, color: Int?): Unit {
    BackgroundStyleApplicator.setBorderColor(this, LogicalEdge.entries[position], color)
  }

  @Deprecated(
      "Deprecated in React Native 0.75.0, in favor of setBorderRadius(BorderRadiusProp, Float)",
      ReplaceWith(
          "setBorderRadius(BorderRadiusProp.BORDER_RADIUS, borderRadius)",
          "com.facebook.react.uimanager.style.BorderRadiusProp",
      ))
  @Suppress("DEPRECATION")
  public open fun setBorderRadius(borderRadius: Float): Unit {
    this.setBorderRadius(borderRadius, BorderRadiusProp.BORDER_RADIUS.ordinal)
  }

  @Deprecated(
      "Deprecated in React Native 0.75.0, in favor of setBorderRadius(BorderRadiusProp, Float)",
      ReplaceWith(
          "setBorderRadius(BorderRadiusProp.entries[position], borderRadius)",
          "com.facebook.react.uimanager.style.BorderRadiusProp",
      ))
  public open fun setBorderRadius(borderRadius: Float, position: Int): Unit {
    val radius =
        when {
          borderRadius.isNaN() -> null
          else -> LengthPercentage(borderRadius, LengthPercentageType.POINT)
        }
    BackgroundStyleApplicator.setBorderRadius(this, BorderRadiusProp.entries[position], radius)
  }

  public open fun setBorderRadius(
      property: BorderRadiusProp,
      borderRadius: LengthPercentage?
  ): Unit {
    BackgroundStyleApplicator.setBorderRadius(this, property, borderRadius)
  }

  public open fun setBorderStyle(style: String?): Unit {
    BackgroundStyleApplicator.setBorderStyle(this, style?.let { BorderStyle.fromString(style) })
  }

  override fun setRemoveClippedSubviews(removeClippedSubviews: Boolean) {
    if (removeClippedSubviews == _removeClippedSubviews) {
      return
    }
    _removeClippedSubviews = removeClippedSubviews
    if (removeClippedSubviews) {
      val clippingRect = Rect()
      ReactClippingViewGroupHelper.calculateClippingRect(this, clippingRect)
      allChildrenCount = childCount
      val initialSize = max(12, allChildrenCount)
      val children = arrayOfNulls<View?>(initialSize)
      childrenLayoutChangeListener = ChildrenLayoutChangeListener(this)
      for (i in 0 until allChildrenCount) {
        children[i] =
            getChildAt(i).apply { addOnLayoutChangeListener(childrenLayoutChangeListener) }
      }
      _clippingRect = clippingRect
      allChildren = children
      updateClippingRect()
    } else {
      // Add all clipped views back, deallocate additional arrays, remove layoutChangeListener
      val clippingRect = checkNotNull(_clippingRect)
      val children = checkNotNull(allChildren)
      val listener = checkNotNull(childrenLayoutChangeListener)
      for (i in 0 until allChildrenCount) {
        children[i]?.removeOnLayoutChangeListener(listener)
      }
      getDrawingRect(clippingRect)
      updateClippingToRect(clippingRect)
      allChildren = null
      _clippingRect = null
      allChildrenCount = 0
      childrenLayoutChangeListener = null
    }
  }

  override fun getRemoveClippedSubviews(): Boolean = _removeClippedSubviews

  override fun getClippingRect(outClippingRect: Rect) {
    outClippingRect.set(
        checkNotNull(_clippingRect) { "getClippingRect called when removeClippedSubviews not set" })
  }

  override fun updateClippingRect() {
    if (!_removeClippedSubviews) {
      return
    }
    val clippingRect = checkNotNull(_clippingRect)
    checkNotNull(allChildren)
    ReactClippingViewGroupHelper.calculateClippingRect(this, clippingRect)
    updateClippingToRect(clippingRect)
  }

  private fun updateClippingToRect(clippingRect: Rect) {
    val children = checkNotNull(allChildren)
    var clippedSoFar = 0
    for (i in 0 until allChildrenCount) {
      updateSubviewClipStatus(clippingRect, i, clippedSoFar)
      if (children[i]?.parent == null) {
        clippedSoFar++
      }
    }
  }

  private fun updateSubviewClipStatus(clippingRect: Rect, idx: Int, clippedSoFar: Int) {
    UiThreadUtil.assertOnUiThread()
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
    val isAnimating = animation?.hasEnded() == false
    if (!intersects && child.parent != null && !isAnimating) {
      // We can try saving on invalidate call here as the view that we remove is out of visible
      // area
      // therefore invalidation is not necessary.
      removeViewInLayout(child)
      needUpdateClippingRecursive = true
    } else if (intersects && child.parent == null) {
      addViewInLayout(child, idx - clippedSoFar, defaultLayoutParam, true)
      invalidate()
      needUpdateClippingRecursive = true
    } else if (intersects) {
      // If there is any intersection we need to inform the child to update its clipping rect
      needUpdateClippingRecursive = true
    }
    if (needUpdateClippingRecursive &&
        child is ReactClippingViewGroup &&
        child.removeClippedSubviews) {
      child.updateClippingRect()
    }
  }

  private fun updateSubviewClipStatus(subview: View) {
    if (!_removeClippedSubviews || parent == null) {
      return
    }
    val clippingRect = checkNotNull(_clippingRect)
    val children = checkNotNull(allChildren)

    // do fast check whether intersect state changed
    val intersects =
        clippingRect.intersects(subview.left, subview.top, subview.right, subview.bottom)

    // If it was intersecting before, should be attached to the parent
    val oldIntersects = subview.parent != null
    if (intersects != oldIntersects) {
      var clippedSoFar = 0
      for (i in 0 until allChildrenCount) {
        if (children[i] === subview) {
          updateSubviewClipStatus(clippingRect, i, clippedSoFar)
          break
        }
        if (children[i]?.parent == null) {
          clippedSoFar++
        }
      }
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

  private fun customDrawOrderDisabled(): Boolean =
      // Custom draw order is disabled for Fabric.
      id != NO_ID && ViewUtil.getUIManagerType(id) == UIManagerType.FABRIC

  private fun handleAddView(view: View) {
    UiThreadUtil.assertOnUiThread()
    if (!customDrawOrderDisabled()) {
      drawingOrderHelper.handleAddView(view)
      isChildrenDrawingOrderEnabled = drawingOrderHelper.shouldEnableCustomDrawingOrder()
    } else {
      isChildrenDrawingOrderEnabled = false
    }
  }

  private fun handleRemoveView(view: View?) {
    UiThreadUtil.assertOnUiThread()
    if (!customDrawOrderDisabled()) {
      if (indexOfChild(view) == -1) {
        return
      }
      drawingOrderHelper.handleRemoveView(view)
      isChildrenDrawingOrderEnabled = drawingOrderHelper.shouldEnableCustomDrawingOrder()
    } else {
      isChildrenDrawingOrderEnabled = false
    }
  }

  private fun handleRemoveViews(start: Int, count: Int) {
    val endIndex = start + count
    for (index in start until endIndex) {
      if (index < childCount) {
        handleRemoveView(getChildAt(index))
      }
    }
  }

  override fun addView(child: View, index: Int, params: LayoutParams?) {
    // This will get called for every overload of addView so there is not need to override every
    // method.
    handleAddView(child)
    super.addView(child, index, params)
  }

  override fun addViewInLayout(
      child: View,
      index: Int,
      params: LayoutParams,
      preventRequestLayout: Boolean
  ): Boolean {
    handleAddView(child)
    return super.addViewInLayout(child, index, params, preventRequestLayout)
  }

  override fun removeView(view: View?) {
    handleRemoveView(view)
    super.removeView(view)
  }

  override fun removeViewAt(index: Int) {
    handleRemoveView(getChildAt(index))
    super.removeViewAt(index)
  }

  override fun removeViewInLayout(view: View) {
    handleRemoveView(view)
    super.removeViewInLayout(view)
  }

  override fun removeViewsInLayout(start: Int, count: Int) {
    handleRemoveViews(start, count)
    super.removeViewsInLayout(start, count)
  }

  override fun removeViews(start: Int, count: Int) {
    handleRemoveViews(start, count)
    super.removeViews(start, count)
  }

  override fun getChildDrawingOrder(childCount: Int, index: Int): Int {
    UiThreadUtil.assertOnUiThread()
    return if (!customDrawOrderDisabled()) {
      drawingOrderHelper.getChildDrawingOrder(childCount, index)
    } else {
      index
    }
  }

  override fun getZIndexMappedChildIndex(index: Int): Int {
    UiThreadUtil.assertOnUiThread()
    return if (!customDrawOrderDisabled() && drawingOrderHelper.shouldEnableCustomDrawingOrder()) {
      drawingOrderHelper.getChildDrawingOrder(childCount, index)
    } else {
      // Fabric behavior
      index
    }
  }

  override fun updateDrawingOrder() {
    if (customDrawOrderDisabled()) {
      return
    }
    drawingOrderHelper.update()
    isChildrenDrawingOrderEnabled = drawingOrderHelper.shouldEnableCustomDrawingOrder()
    invalidate()
  }

  override fun getPointerEvents(): PointerEvents = _pointerEvents

  override fun dispatchSetPressed(pressed: Boolean) {
    // Prevents the ViewGroup from dispatching the pressed state
    // to it's children.
  }

  public open fun setPointerEvents(pointerEvents: PointerEvents?): Unit {
    if (pointerEvents != null) {
      _pointerEvents = pointerEvents
    } else {
      resetPointerEvents()
    }
  }

  internal fun resetPointerEvents(): Unit {
    _pointerEvents = PointerEvents.AUTO
  }

  internal open fun getChildAtWithSubviewClippingEnabled(index: Int): View? =
      if (index in 0 until allChildrenCount) {
        checkNotNull(allChildren)[index]
      } else {
        null
      }

  internal open fun addViewWithSubviewClippingEnabled(child: View, index: Int): Unit {
    Assertions.assertCondition(_removeClippedSubviews)
    val clippingRect = checkNotNull(_clippingRect)
    val children = checkNotNull(allChildren)
    addInArray(child, index)
    // we add view as "clipped" and then run [updateSubviewClipStatus] to conditionally
    // attach it
    var clippedSoFar = 0
    for (i in 0 until index) {
      if (children[i]?.parent == null) {
        clippedSoFar++
      }
    }
    updateSubviewClipStatus(clippingRect, index, clippedSoFar)
    child.addOnLayoutChangeListener(childrenLayoutChangeListener)
    if (child is ReactClippingProhibitedView) {
      UiThreadUtil.runOnUiThread {
        if (!child.isShown) {
          ReactSoftExceptionLogger.logSoftException(
              ReactConstants.TAG,
              ReactNoCrashSoftException(
                  """
                    |Child view has been added to Parent view in which it is clipped and not 
                    |visible. This is not legal for this particular child view. Child: [${child.id}]
                    | $child Parent: [$id] $parent"""
                      .trimMargin()))
        }
      }
    }
  }

  internal open fun removeViewWithSubviewClippingEnabled(view: View): Unit {
    UiThreadUtil.assertOnUiThread()
    Assertions.assertCondition(_removeClippedSubviews)
    checkNotNull(_clippingRect)
    val children = checkNotNull(allChildren)
    view.removeOnLayoutChangeListener(childrenLayoutChangeListener)
    val index = indexOfChildInAllChildren(view)
    if (children[index]?.parent != null) {
      var clippedSoFar = 0
      for (i in 0 until index) {
        if (children[i]?.parent == null) {
          clippedSoFar++
        }
      }
      removeViewsInLayout(index - clippedSoFar, 1)
    }
    removeFromArray(index)
  }

  internal open fun removeAllViewsWithSubviewClippingEnabled(): Unit {
    Assertions.assertCondition(_removeClippedSubviews)
    val children = checkNotNull(allChildren)
    for (i in 0 until allChildrenCount) {
      children[i]?.removeOnLayoutChangeListener(childrenLayoutChangeListener)
    }
    removeAllViewsInLayout()
    allChildrenCount = 0
  }

  private fun indexOfChildInAllChildren(child: View): Int {
    val count = allChildrenCount
    val children = checkNotNull(allChildren)
    return (0 until count).firstOrNull { i -> children[i] === child } ?: -1
  }

  private fun addInArray(child: View, index: Int) {
    val children = growAllChildrenIfNeeded(index)
    children[index] = child
    allChildrenCount++
  }

  /**
   * Grow the [allChildren] array if it's run out of space
   *
   * @param insertIndex index where child is being inserted, must be <= [allChildrenCount]
   * @return the non-null array that's backing [allChildren] after any potential resize, with a null
   *   slot at [insertIndex]
   */
  private fun growAllChildrenIfNeeded(insertIndex: Int): Array<View?> {
    val children = checkNotNull(allChildren)
    val count = allChildrenCount
    if (insertIndex > count) {
      throw IndexOutOfBoundsException("index=$insertIndex count=$count")
    }
    if (children.size > count) {
      // no need to resize, ensure index is free
      if (insertIndex < count) {
        System.arraycopy(children, insertIndex, children, insertIndex + 1, count - insertIndex)
      }
      return children
    }
    // need to resize the array
    val newArray =
        if (insertIndex == count) {
          // inserting at the end of the array
          children.copyOf(children.size + ARRAY_CAPACITY_INCREMENT)
        } else {
          // inserting within the array
          arrayOfNulls<View?>(children.size + ARRAY_CAPACITY_INCREMENT).apply {
            System.arraycopy(children, 0, this, 0, insertIndex)
            System.arraycopy(children, insertIndex, this, insertIndex + 1, count - insertIndex)
          }
        }
    allChildren = newArray
    return newArray
  }

  private fun removeFromArray(index: Int) {
    val children = checkNotNull(allChildren)
    val count = allChildrenCount
    if (index == count - 1) {
      children[--allChildrenCount] = null
    } else if (index in 0 until count) {
      System.arraycopy(children, index + 1, children, index, count - index - 1)
      children[--allChildrenCount] = null
    } else {
      throw IndexOutOfBoundsException()
    }
  }

  private fun needsIsolatedLayer(): Boolean {
    if (!ReactNativeFeatureFlags.enableAndroidMixBlendModeProp()) {
      return false
    }
    return (0 until childCount).any { i -> getChildAt(i).getTag(R.id.mix_blend_mode) != null }
  }

  @VisibleForTesting
  protected open fun getBackgroundColor(): Int =
      BackgroundStyleApplicator.getBackgroundColor(this) ?: DEFAULT_BACKGROUND_COLOR

  // TODO: convert to val
  public open fun setOverflow(overflow: String?): Unit {
    _overflow =
        if (overflow == null) {
          Overflow.VISIBLE
        } else {
          Overflow.fromString(overflow) ?: Overflow.VISIBLE
        }
    invalidate()
  }

  override fun getOverflow(): String? =
      when (_overflow) {
        Overflow.HIDDEN -> "hidden"
        Overflow.SCROLL -> "scroll"
        Overflow.VISIBLE -> "visible"
      }

  override fun setOverflowInset(left: Int, top: Int, right: Int, bottom: Int) {
    if (needsIsolatedLayer() &&
        (_overflowInset.left != left ||
            _overflowInset.top != top ||
            _overflowInset.right != right ||
            _overflowInset.bottom != bottom)) {
      invalidate()
    }
    _overflowInset.set(left, top, right, bottom)
  }

  override fun getOverflowInset(): Rect = _overflowInset

  /**
   * Set the background for the view or remove the background. It calls [setBackground(Drawable)] or
   * [setBackgroundDrawable(Drawable)] based on the sdk version.
   *
   * @param drawable [Drawable] The Drawable to use as the background, or null to remove the
   *   background
   */
  internal fun updateBackgroundDrawable(drawable: Drawable?): Unit {
    super.setBackground(drawable)
  }

  override fun draw(canvas: Canvas) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
        ViewUtil.getUIManagerType(this) == UIManagerType.FABRIC &&
        needsIsolatedLayer()) {

      // Check if the view is a stacking context and has children, if it does, do the rendering
      // offscreen and then composite back. This follows the idea of group isolation on blending
      // https://www.w3.org/TR/compositing-1/#isolationblending
      val overflowInset = this.overflowInset
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
      BackgroundStyleApplicator.clipToPaddingBox(this, canvas)
    }
    super.dispatchDraw(canvas)
  }

  override fun drawChild(canvas: Canvas, child: View, drawingTime: Long): Boolean {
    val drawWithZ = child.elevation > 0
    if (drawWithZ) {
      CanvasUtil.enableZ(canvas, true)
    }
    var mixBlendMode: BlendMode? = null
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && needsIsolatedLayer()) {
      mixBlendMode = child.getTag(R.id.mix_blend_mode) as? BlendMode
      if (mixBlendMode != null) {
        val p = Paint()
        p.blendMode = mixBlendMode
        val overflowInset = this.overflowInset
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
      CanvasUtil.enableZ(canvas, false)
    }
    return result
  }

  public open fun setOpacityIfPossible(opacity: Float): Unit {
    backfaceOpacity = opacity
    setBackfaceVisibilityDependantOpacity()
  }

  public open fun setBackfaceVisibility(backfaceVisibility: String?): Unit {
    this.backfaceVisibility = backfaceVisibility
    setBackfaceVisibilityDependantOpacity()
  }

  public open fun setBackfaceVisibilityDependantOpacity(): Unit {
    val isBackfaceVisible = backfaceVisibility == "visible"
    if (isBackfaceVisible) {
      alpha = backfaceOpacity
      return
    }
    val rotationX = rotationX
    val rotationY = rotationY
    val isFrontfaceVisible =
        rotationX >= -90f && rotationX < 90f && rotationY >= -90f && rotationY < 90f
    if (isFrontfaceVisible) {
      alpha = backfaceOpacity
      return
    }
    alpha = 0f
  }
}
