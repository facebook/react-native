/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.graphics.Rect
import android.view.View
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.ReactConstants
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.style.BackgroundImageLayer
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.LogicalEdge

/** View manager for AndroidViews (plain React Views). */
@ReactModule(name = ReactViewManager.REACT_CLASS)
public open class ReactViewManager : ReactClippingViewManager<ReactViewGroup>() {

  public companion object {
    public const val REACT_CLASS: String = ViewProps.VIEW_CLASS_NAME

    private val SPACING_TYPES =
        intArrayOf(
            Spacing.ALL,
            Spacing.LEFT,
            Spacing.RIGHT,
            Spacing.TOP,
            Spacing.BOTTOM,
            Spacing.START,
            Spacing.END,
            Spacing.BLOCK,
            Spacing.BLOCK_END,
            Spacing.BLOCK_START,
        )
    private const val CMD_HOTSPOT_UPDATE = 1
    private const val CMD_SET_PRESSED = 2
    private const val HOTSPOT_UPDATE_KEY = "hotspotUpdate"
  }

  init {
    if (ReactNativeFeatureFlags.enableViewRecyclingForView()) {
      setupViewRecycling()
    }
  }

  override fun prepareToRecycleView(
      reactContext: ThemedReactContext,
      view: ReactViewGroup
  ): ReactViewGroup {
    // BaseViewManager
    val preparedView = super.prepareToRecycleView(reactContext, view)
    preparedView?.recycleView()
    return view
  }

  @ReactProp(name = "accessible")
  public open fun setAccessible(view: ReactViewGroup, accessible: Boolean) {
    view.isFocusable = accessible
  }

  @ReactProp(name = "hasTVPreferredFocus")
  public open fun setTVPreferredFocus(view: ReactViewGroup, hasTVPreferredFocus: Boolean) {
    if (hasTVPreferredFocus) {
      view.isFocusable = true
      view.isFocusableInTouchMode = true
      view.requestFocus()
    }
  }

  @ReactProp(name = ViewProps.BACKGROUND_IMAGE, customType = "BackgroundImage")
  public open fun setBackgroundImage(view: ReactViewGroup, backgroundImage: ReadableArray?) {
    if (ViewUtil.getUIManagerType(view) == UIManagerType.FABRIC) {
      if (backgroundImage != null && backgroundImage.size() > 0) {
        val backgroundImageLayers = ArrayList<BackgroundImageLayer>(backgroundImage.size())
        for (i in 0 until backgroundImage.size()) {
          val backgroundImageMap = backgroundImage.getMap(i)
          val layer = BackgroundImageLayer(backgroundImageMap, view.context)
          backgroundImageLayers.add(layer)
        }
        BackgroundStyleApplicator.setBackgroundImage(view, backgroundImageLayers)
      } else {
        BackgroundStyleApplicator.setBackgroundImage(view, null)
      }
    }
  }

  @ReactProp(name = "nextFocusDown", defaultInt = View.NO_ID)
  public open fun nextFocusDown(view: ReactViewGroup, viewId: Int) {
    view.nextFocusDownId = viewId
  }

  @ReactProp(name = "nextFocusForward", defaultInt = View.NO_ID)
  public open fun nextFocusForward(view: ReactViewGroup, viewId: Int) {
    view.nextFocusForwardId = viewId
  }

  @ReactProp(name = "nextFocusLeft", defaultInt = View.NO_ID)
  public open fun nextFocusLeft(view: ReactViewGroup, viewId: Int) {
    view.nextFocusLeftId = viewId
  }

  @ReactProp(name = "nextFocusRight", defaultInt = View.NO_ID)
  public open fun nextFocusRight(view: ReactViewGroup, viewId: Int) {
    view.nextFocusRightId = viewId
  }

  @ReactProp(name = "nextFocusUp", defaultInt = View.NO_ID)
  public open fun nextFocusUp(view: ReactViewGroup, viewId: Int) {
    view.nextFocusUpId = viewId
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.BORDER_RADIUS,
              ViewProps.BORDER_TOP_LEFT_RADIUS,
              ViewProps.BORDER_TOP_RIGHT_RADIUS,
              ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
              ViewProps.BORDER_BOTTOM_LEFT_RADIUS,
              ViewProps.BORDER_TOP_START_RADIUS,
              ViewProps.BORDER_TOP_END_RADIUS,
              ViewProps.BORDER_BOTTOM_START_RADIUS,
              ViewProps.BORDER_BOTTOM_END_RADIUS,
              ViewProps.BORDER_END_END_RADIUS,
              ViewProps.BORDER_END_START_RADIUS,
              ViewProps.BORDER_START_END_RADIUS,
              ViewProps.BORDER_START_START_RADIUS,
          ])
  public open fun setBorderRadius(view: ReactViewGroup, index: Int, rawBorderRadius: Dynamic) {
    var borderRadius = LengthPercentage.setFromDynamic(rawBorderRadius)

    // We do not support percentage border radii on Paper in order to be consistent with iOS (to
    // avoid developer surprise if it works on one platform but not another).
    if (ViewUtil.getUIManagerType(view) != UIManagerType.FABRIC &&
        borderRadius != null &&
        borderRadius.type == LengthPercentageType.PERCENT) {
      borderRadius = null
    }

    BackgroundStyleApplicator.setBorderRadius(view, BorderRadiusProp.values()[index], borderRadius)
  }

  @Deprecated(
      "Don't use setBorderRadius(view, int, Float) as it was deprecated in React Native 0.75.0.",
      ReplaceWith("setBorderRadius(view, index, DynamicFromObject(borderRadius)"))
  public open fun setBorderRadius(view: ReactViewGroup, index: Int, borderRadius: Float) {
    setBorderRadius(view, index, DynamicFromObject(borderRadius))
  }

  @ReactProp(name = "borderStyle")
  public open fun setBorderStyle(view: ReactViewGroup, borderStyle: String?) {
    val parsedBorderStyle = if (borderStyle == null) null else BorderStyle.fromString(borderStyle)
    BackgroundStyleApplicator.setBorderStyle(view, parsedBorderStyle)
  }

  @ReactProp(name = "hitSlop")
  public open fun setHitSlop(view: ReactViewGroup, hitSlop: Dynamic) {
    when (hitSlop.type) {
      ReadableType.Map -> {
        val hitSlopMap = hitSlop.asMap()
        view.setHitSlopRect(
            Rect(
                hitSlopMap.px("left"),
                hitSlopMap.px("top"),
                hitSlopMap.px("right"),
                hitSlopMap.px("bottom"),
            ))
      }

      ReadableType.Number -> {
        val hitSlopValue = hitSlop.asDouble().dpToPx().toInt()
        view.setHitSlopRect(Rect(hitSlopValue, hitSlopValue, hitSlopValue, hitSlopValue))
      }

      ReadableType.Null -> view.setHitSlopRect(null)
      else -> {
        FLog.w(ReactConstants.TAG, "Invalid type for 'hitSlop' value ${hitSlop.type}")
        view.setHitSlopRect(null)
      }
    }
  }

  private fun ReadableMap.px(key: String) = if (hasKey(key)) getDouble(key).dpToPx().toInt() else 0

  @ReactProp(name = ViewProps.POINTER_EVENTS)
  public open fun setPointerEvents(view: ReactViewGroup, pointerEventsStr: String?) {
    view.setPointerEvents(PointerEvents.parsePointerEvents(pointerEventsStr))
  }

  @ReactProp(name = "nativeBackgroundAndroid")
  public open fun setNativeBackground(view: ReactViewGroup, background: ReadableMap?) {
    val bg =
        background?.let { ReactDrawableHelper.createDrawableFromJSDescription(view.context, it) }
    BackgroundStyleApplicator.setFeedbackUnderlay(view, bg)
  }

  @ReactProp(name = "nativeForegroundAndroid")
  public open fun setNativeForeground(view: ReactViewGroup, foreground: ReadableMap?) {
    view.foreground =
        foreground?.let { ReactDrawableHelper.createDrawableFromJSDescription(view.context, it) }
  }

  @ReactProp(name = ViewProps.NEEDS_OFFSCREEN_ALPHA_COMPOSITING)
  public open fun setNeedsOffscreenAlphaCompositing(
      view: ReactViewGroup,
      needsOffscreenAlphaCompositing: Boolean
  ) {
    view.setNeedsOffscreenAlphaCompositing(needsOffscreenAlphaCompositing)
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.BORDER_WIDTH,
              ViewProps.BORDER_LEFT_WIDTH,
              ViewProps.BORDER_RIGHT_WIDTH,
              ViewProps.BORDER_TOP_WIDTH,
              ViewProps.BORDER_BOTTOM_WIDTH,
              ViewProps.BORDER_START_WIDTH,
              ViewProps.BORDER_END_WIDTH,
          ],
      defaultFloat = Float.NaN)
  public open fun setBorderWidth(view: ReactViewGroup, index: Int, width: Float) {
    BackgroundStyleApplicator.setBorderWidth(view, LogicalEdge.values()[index], width)
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.BORDER_COLOR,
              ViewProps.BORDER_LEFT_COLOR,
              ViewProps.BORDER_RIGHT_COLOR,
              ViewProps.BORDER_TOP_COLOR,
              ViewProps.BORDER_BOTTOM_COLOR,
              ViewProps.BORDER_START_COLOR,
              ViewProps.BORDER_END_COLOR,
              ViewProps.BORDER_BLOCK_COLOR,
              ViewProps.BORDER_BLOCK_END_COLOR,
              ViewProps.BORDER_BLOCK_START_COLOR,
          ],
      customType = "Color")
  public open fun setBorderColor(view: ReactViewGroup, index: Int, color: Int?) {
    BackgroundStyleApplicator.setBorderColor(
        view, LogicalEdge.fromSpacingType(SPACING_TYPES[index]), color)
  }

  @ReactProp(name = ViewProps.COLLAPSABLE)
  @Suppress("UNUSED_PARAMETER")
  public open fun setCollapsable(view: ReactViewGroup, collapsable: Boolean) {
    // no-op: it's here only so that "collapsable" property is exported to JS. The value is actually
    // handled in NativeViewHierarchyOptimizer
  }

  @ReactProp(name = ViewProps.COLLAPSABLE_CHILDREN)
  @Suppress("UNUSED_PARAMETER")
  public open fun setCollapsableChildren(view: ReactViewGroup, collapsableChildren: Boolean) {
    // no-op: it's here only so that "collapsableChildren" property is exported to JS.
  }

  @ReactProp(name = "focusable")
  public open fun setFocusable(view: ReactViewGroup, focusable: Boolean) {
    if (focusable) {
      view.setOnClickListener {
        val eventDispatcher =
            UIManagerHelper.getEventDispatcherForReactTag((view.context as ReactContext), view.id)
        eventDispatcher?.dispatchEvent(
            ViewGroupClickEvent(UIManagerHelper.getSurfaceId(view.context), view.id))
      }

      // Clickable elements are focusable. On API 26, this is taken care by setClickable.
      // Explicitly calling setFocusable here for backward compatibility.
      view.isFocusable = true
    } else {
      view.setOnClickListener(null)
      view.isClickable = false
      // Don't set view.setFocusable(false) because we might still want it to be focusable for
      // accessibility reasons
    }
  }

  @ReactProp(name = ViewProps.OVERFLOW)
  public open fun setOverflow(view: ReactViewGroup, overflow: String?) {
    view.setOverflow(overflow)
  }

  @ReactProp(name = "backfaceVisibility")
  public open fun setBackfaceVisibility(view: ReactViewGroup, backfaceVisibility: String) {
    view.setBackfaceVisibility(backfaceVisibility)
  }

  override fun setOpacity(view: ReactViewGroup, opacity: Float) {
    view.setOpacityIfPossible(opacity)
  }

  override fun setTransformProperty(
      view: ReactViewGroup,
      transforms: ReadableArray?,
      transformOrigin: ReadableArray?
  ) {
    super.setTransformProperty(view, transforms, transformOrigin)
    view.setBackfaceVisibilityDependantOpacity()
  }

  override fun getName(): String = REACT_CLASS

  public override fun createViewInstance(context: ThemedReactContext): ReactViewGroup =
      ReactViewGroup(context)

  override fun getCommandsMap(): MutableMap<String, Int> =
      mutableMapOf(HOTSPOT_UPDATE_KEY to CMD_HOTSPOT_UPDATE, "setPressed" to CMD_SET_PRESSED)

  @Deprecated(
      "Use receiveCommand(View, String, ReadableArray)",
      ReplaceWith("receiveCommand(root, commandIdString, args)"))
  override fun receiveCommand(root: ReactViewGroup, commandId: Int, args: ReadableArray?) {
    when (commandId) {
      CMD_HOTSPOT_UPDATE -> handleHotspotUpdate(root, args)
      CMD_SET_PRESSED -> handleSetPressed(root, args)
      else -> {}
    }
  }

  override fun receiveCommand(root: ReactViewGroup, commandId: String, args: ReadableArray?) {
    when (commandId) {
      HOTSPOT_UPDATE_KEY -> handleHotspotUpdate(root, args)
      "setPressed" -> handleSetPressed(root, args)
      else -> {}
    }
  }

  private fun handleSetPressed(root: ReactViewGroup, args: ReadableArray?) {
    if (args == null || args.size() != 1) {
      throw JSApplicationIllegalArgumentException(
          "Illegal number of arguments for 'setPressed' command")
    }
    root.isPressed = args.getBoolean(0)
  }

  private fun handleHotspotUpdate(root: ReactViewGroup, args: ReadableArray?) {
    if (args == null || args.size() != 2) {
      throw JSApplicationIllegalArgumentException(
          "Illegal number of arguments for 'updateHotspot' command")
    }

    val x = args.getDouble(0).dpToPx()
    val y = args.getDouble(1).dpToPx()
    root.drawableHotspotChanged(x, y)
  }
}
