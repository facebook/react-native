/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.os.Build
import android.text.Spannable
import com.facebook.react.R
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.internal.SystraceSection
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.IViewManagerWithChildren
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.text.internal.span.TextInlineImageSpan
import java.util.HashMap

/**
 * Concrete class for [ReactTextAnchorViewManager] which represents view managers of anchor `<Text>`
 * nodes.
 */
@Suppress("DEPRECATION")
@ReactModule(name = ReactTextViewManager.REACT_CLASS)
@OptIn(UnstableReactNativeAPI::class)
public class ReactTextViewManager
@JvmOverloads
public constructor(
    protected var reactTextViewManagerCallback: ReactTextViewManagerCallback? = null
) :
    ReactTextAnchorViewManager<ReactTextShadowNode>(),
    IViewManagerWithChildren,
    ReactTextViewManagerCallback {
  init {
    if (ReactNativeFeatureFlags.enableViewRecyclingForText()) {
      setupViewRecycling()
    }
  }

  override fun prepareToRecycleView(
      reactContext: ThemedReactContext,
      view: ReactTextView,
  ): ReactTextView? {
    // BaseViewManager
    val preparedView = super.prepareToRecycleView(reactContext, view)
    if (preparedView != null) {
      // Resets background and borders
      preparedView.recycleView()
      // Defaults from ReactTextAnchorViewManager
      setSelectionColor(preparedView, null)
    }
    return preparedView
  }

  override fun getName(): String = REACT_CLASS

  override fun updateViewAccessibility(view: ReactTextView) {
    ReactTextViewAccessibilityDelegate.setDelegate(
        view,
        view.isFocusable,
        view.importantForAccessibility,
    )
  }

  public override fun createViewInstance(context: ThemedReactContext): ReactTextView =
      ReactTextView(context)

  override fun updateExtraData(view: ReactTextView, extraData: Any) {
    SystraceSection("ReactTextViewManager.updateExtraData").use { s ->
      val update = extraData as ReactTextUpdate
      val spannable: Spannable = update.text
      @Suppress("DEPRECATION")
      if (update.containsImages()) {
        TextInlineImageSpan.possiblyUpdateInlineImageSpans(spannable, view)
      }
      view.setText(update)

      // If this text view contains any clickable spans, set a view tag and reset the accessibility
      // delegate so that these can be picked up by the accessibility system.
      val accessibilityLinks: ReactTextViewAccessibilityDelegate.AccessibilityLinks =
          ReactTextViewAccessibilityDelegate.AccessibilityLinks(spannable)
      view.setTag(
          R.id.accessibility_links,
          if (accessibilityLinks.size() > 0) accessibilityLinks else null,
      )
      ReactTextViewAccessibilityDelegate.resetDelegate(
          view,
          view.isFocusable,
          view.importantForAccessibility,
      )
    }
  }

  override fun createShadowNodeInstance(): ReactTextShadowNode =
      ReactTextShadowNode(reactTextViewManagerCallback)

  public fun createShadowNodeInstance(
      reactTextViewManagerCallback: ReactTextViewManagerCallback?
  ): ReactTextShadowNode = ReactTextShadowNode(reactTextViewManagerCallback)

  override fun getShadowNodeClass(): Class<ReactTextShadowNode> = ReactTextShadowNode::class.java

  override fun onAfterUpdateTransaction(view: ReactTextView) {
    super.onAfterUpdateTransaction(view)
    view.updateView()
  }

  override fun needsCustomLayoutForChildren(): Boolean = true

  override fun updateState(
      view: ReactTextView,
      props: ReactStylesDiffMap,
      stateWrapper: StateWrapper,
  ): Any? {
    SystraceSection("ReactTextViewManager.updateState").use { s ->
      val stateMapBuffer = stateWrapper.stateDataMapBuffer
      return if (stateMapBuffer != null) {
        getReactTextUpdate(view, props, stateMapBuffer)
      } else {
        null
      }
    }
  }

  private fun getReactTextUpdate(
      view: ReactTextView,
      props: ReactStylesDiffMap,
      state: MapBuffer,
  ): Any {
    val attributedString: MapBuffer = state.getMapBuffer(TX_STATE_KEY_ATTRIBUTED_STRING.toInt())
    val paragraphAttributes: MapBuffer =
        state.getMapBuffer(TX_STATE_KEY_PARAGRAPH_ATTRIBUTES.toInt())
    val spanned: Spannable =
        TextLayoutManager.getOrCreateSpannableForText(
            view.context,
            attributedString,
            reactTextViewManagerCallback,
        )
    view.setSpanned(spanned)

    val minimumFontSize: Float =
        paragraphAttributes.getDouble(TextLayoutManager.PA_KEY_MINIMUM_FONT_SIZE).toFloat()
    view.setMinimumFontSize(minimumFontSize)

    val textBreakStrategy =
        TextAttributeProps.getTextBreakStrategy(
            paragraphAttributes.getString(TextLayoutManager.PA_KEY_TEXT_BREAK_STRATEGY)
        )
    val currentJustificationMode =
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) 0 else view.justificationMode

    return ReactTextUpdate(
        spanned,
        -1, // UNUSED FOR TEXT
        false, // TODO add this into local Data
        TextLayoutManager.getTextGravity(attributedString, spanned),
        textBreakStrategy,
        TextAttributeProps.getJustificationMode(props, currentJustificationMode),
    )
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? {
    val baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants()
    val eventTypeConstants = baseEventTypeConstants ?: HashMap()
    eventTypeConstants.putAll(mapOf("topTextLayout" to mapOf("registrationName" to "onTextLayout")))
    return eventTypeConstants
  }

  override fun onPostProcessSpannable(text: Spannable) {
    reactTextViewManagerCallback?.onPostProcessSpannable(text)
  }

  override fun setPadding(view: ReactTextView, left: Int, top: Int, right: Int, bottom: Int) {
    view.setPadding(left, top, right, bottom)
  }

  @ReactProp(name = "overflow")
  public fun setOverflow(view: ReactTextView, overflow: String?) {
    view.setOverflow(overflow)
  }

  public companion object {
    private const val TX_STATE_KEY_ATTRIBUTED_STRING: Short = 0
    private const val TX_STATE_KEY_PARAGRAPH_ATTRIBUTES: Short = 1

    public const val REACT_CLASS: String = "RCTText"
  }
}
