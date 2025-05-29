/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.content.Context
import android.os.Build
import android.text.Spannable
import androidx.annotation.Nullable
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.common.annotations.VisibleForTesting
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
import com.facebook.yoga.YogaMeasureMode
import java.util.HashMap

/**
 * Concrete class for [ReactTextAnchorViewManager] which represents view managers of anchor
 * `<Text>` nodes.
 */
@ReactModule(name = ReactTextViewManager.REACT_CLASS)
public class ReactTextViewManager @JvmOverloads public constructor(protected var reactTextViewManagerCallback: ReactTextViewManagerCallback? = null) :
  ReactTextAnchorViewManager<ReactTextShadowNode>(), IViewManagerWithChildren {
  init {
    if (ReactNativeFeatureFlags.enableViewRecyclingForText()) {
      setupViewRecycling()
    }
  }

  override fun prepareToRecycleView(
      reactContext: ThemedReactContext, view: ReactTextView
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
      view, view.isFocusable(), view.getImportantForAccessibility()
    )
  }

  public override fun createViewInstance(context: ThemedReactContext): ReactTextView = ReactTextView(context)

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
      val accessibilityLinks: ReactTextViewAccessibilityDelegate.AccessibilityLinks = ReactTextViewAccessibilityDelegate.AccessibilityLinks(spannable)
      view.setTag(
        R.id.accessibility_links,
        if (accessibilityLinks.size() > 0) accessibilityLinks else null
      )
      ReactTextViewAccessibilityDelegate.resetDelegate(
        view, view.isFocusable(), view.getImportantForAccessibility()
      )
    }
  }

  override fun createShadowNodeInstance(): ReactTextShadowNode = ReactTextShadowNode(reactTextViewManagerCallback)

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
    view: ReactTextView, props: ReactStylesDiffMap, stateWrapper: StateWrapper
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
    state: MapBuffer
  ): Any {
    val attributedString: MapBuffer = state.getMapBuffer(TX_STATE_KEY_ATTRIBUTED_STRING.toInt())
    val paragraphAttributes: MapBuffer = state.getMapBuffer(TX_STATE_KEY_PARAGRAPH_ATTRIBUTES.toInt())
    val spanned: Spannable =
      TextLayoutManager.getOrCreateSpannableForText(
        view.getContext(), attributedString, reactTextViewManagerCallback
      )
    view.setSpanned(spanned)

    try {
      val minimumFontSize: Float =
          paragraphAttributes.getDouble(TextLayoutManager.PA_KEY_MINIMUM_FONT_SIZE.toInt())
              .toFloat()
      view.setMinimumFontSize(minimumFontSize)
    } catch (e: IllegalArgumentException) {
      // T190482857: We see rare crash with MapBuffer without PA_KEY_MINIMUM_FONT_SIZE entry
      FLog.e(
        TAG,
        "Paragraph Attributes: %s",
        // if (paragraphAttributes != null) paragraphAttributes.toString() else "<empty>"
        paragraphAttributes.toString()
      )
      throw e
    }

    val textBreakStrategy =
      TextAttributeProps.getTextBreakStrategy(
        paragraphAttributes.getString(TextLayoutManager.PA_KEY_TEXT_BREAK_STRATEGY.toInt())
      )
    val currentJustificationMode =
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) 0 else view.getJustificationMode()

    return ReactTextUpdate(
      spanned,
      -1,  // UNUSED FOR TEXT
      false,  // TODO add this into local Data
      TextLayoutManager.getTextGravity(attributedString, spanned, view.gravityHorizontal),
      textBreakStrategy,
      TextAttributeProps.getJustificationMode(props, currentJustificationMode)
    )
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? {
    val baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants()
    val eventTypeConstants = baseEventTypeConstants ?: HashMap()
    eventTypeConstants.putAll(
      mapOf("topTextLayout" to mapOf("registrationName" to "onTextLayout"))
    )
    return eventTypeConstants
  }

  override fun measure(
    context: Context,
    localData: MapBuffer,
    props: MapBuffer,
    state: MapBuffer?,
    width: Float,
    widthMode: YogaMeasureMode,
    height: Float,
    heightMode: YogaMeasureMode,
    attachmentsPositions: FloatArray?
  ): Long {
      return TextLayoutManager.measureText(
        context,
        localData,
        props,
        width,
        widthMode,
        height,
        heightMode,
        reactTextViewManagerCallback,
        attachmentsPositions
      )
  }

  override fun setPadding(view: ReactTextView, left: Int, top: Int, right: Int, bottom: Int) {
    view.setPadding(left, top, right, bottom)
  }

  @ReactProp(name = "overflow")
  public fun setOverflow(view: ReactTextView, overflow: String?) {
    view.setOverflow(overflow)
  }

  public companion object {
    private const val TAG = "ReactTextViewManager"

    private const val TX_STATE_KEY_ATTRIBUTED_STRING: Short = 0
    private const val TX_STATE_KEY_PARAGRAPH_ATTRIBUTES: Short = 1

    // used for text input
    private const val TX_STATE_KEY_HASH: Short = 2
    private const val TX_STATE_KEY_MOST_RECENT_EVENT_COUNT: Short = 3

    @VisibleForTesting
    public const val REACT_CLASS: String = "RCTText"
  }
}
