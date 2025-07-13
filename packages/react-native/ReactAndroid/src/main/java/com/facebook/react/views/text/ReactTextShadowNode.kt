/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress(
    "DEPRECATION") // silents "interface RCTEventEmitter : JavaScriptModule' is deprecated."

package com.facebook.react.views.text

import android.os.Build
import android.text.BoringLayout
import android.text.Layout
import android.text.Spannable
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextPaint
import android.view.Gravity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger.logSoftException
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.uimanager.NativeViewHierarchyOptimizer
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.UIViewOperationQueue
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.views.text.FontMetricsUtil.getFontMetrics
import com.facebook.react.views.text.internal.span.ReactAbsoluteSizeSpan
import com.facebook.react.views.text.internal.span.TextInlineViewPlaceholderSpan
import com.facebook.yoga.YogaBaselineFunction
import com.facebook.yoga.YogaConstants
import com.facebook.yoga.YogaDirection
import com.facebook.yoga.YogaMeasureFunction
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min

/**
 * [ReactBaseTextShadowNode] concrete class for anchor `Text` node.
 *
 * The class measures text in `<Text>` view and feeds native [TextView] using [Spannable] object
 * constructed in superclass.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
public class ReactTextShadowNode
@JvmOverloads
public constructor(reactTextViewManagerCallback: ReactTextViewManagerCallback? = null) :
    ReactBaseTextShadowNode(reactTextViewManagerCallback) {
  private var preparedSpannableText: Spannable? = null

  private var shouldNotifyOnTextLayout = false

  private val textMeasureFunction = YogaMeasureFunction { _, width, widthMode, height, heightMode ->
    val text =
        requireNotNull(preparedSpannableText) {
          "Spannable element has not been prepared in onBeforeLayout"
        }
    var layout = measureSpannedText(text, width, widthMode)

    if (mAdjustsFontSizeToFit) {
      val initialFontSize = mTextAttributes.effectiveFontSize
      var currentFontSize = mTextAttributes.effectiveFontSize
      // Minimum font size is 4pts to match the iOS implementation.
      val minimumFontSize =
          max((mMinimumFontScale * initialFontSize), PixelUtil.toPixelFromDIP(4f)).toInt()
      while (currentFontSize > minimumFontSize &&
          (mNumberOfLines != ReactConstants.UNSET && layout.lineCount > mNumberOfLines ||
              heightMode != YogaMeasureMode.UNDEFINED && layout.height > height)) {
        // TODO: We could probably use a smarter algorithm here. This will require 0(n)
        // measurements
        // based on the number of points the font size needs to be reduced by.
        currentFontSize -= max(1, PixelUtil.toPixelFromDIP(1f).toInt())

        val ratio = currentFontSize.toFloat() / initialFontSize.toFloat()
        val sizeSpans = text.getSpans(0, text.length, ReactAbsoluteSizeSpan::class.java)
        for (span in sizeSpans) {
          text.setSpan(
              ReactAbsoluteSizeSpan(
                  max((span.size * ratio).toDouble(), minimumFontSize.toDouble()).toInt()),
              text.getSpanStart(span),
              text.getSpanEnd(span),
              text.getSpanFlags(span))
          text.removeSpan(span)
        }
        layout = measureSpannedText(text, width, widthMode)
      }
    }

    if (shouldNotifyOnTextLayout) {
      val themedReactContext = themedContext
      val lines = getFontMetrics(text, layout, themedReactContext)
      val event = Arguments.createMap().apply { putArray("lines", lines) }
      if (themedReactContext.hasActiveReactInstance()) {
        themedReactContext
            .getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(reactTag, "topTextLayout", event)
      } else {
        logSoftException(
            "ReactTextShadowNode",
            ReactNoCrashSoftException("Cannot get RCTEventEmitter, no CatalystInstance"))
      }
    }

    val lineCount =
        if (mNumberOfLines == ReactConstants.UNSET) layout.lineCount
        else min(mNumberOfLines.toDouble(), layout.lineCount.toDouble()).toInt()

    // Instead of using `layout.getWidth()` (which may yield a significantly larger width
    // for
    // text that is wrapping), compute width using the longest line.
    var layoutWidth = 0f
    if (widthMode == YogaMeasureMode.EXACTLY) {
      layoutWidth = width
    } else {
      for (lineIndex in 0 until lineCount) {
        val endsWithNewLine = text.length > 0 && text[layout.getLineEnd(lineIndex) - 1] == '\n'
        val lineWidth =
            if (endsWithNewLine) layout.getLineMax(lineIndex) else layout.getLineWidth(lineIndex)
        if (lineWidth > layoutWidth) {
          layoutWidth = lineWidth
        }
      }
      if (widthMode == YogaMeasureMode.AT_MOST && layoutWidth > width) {
        layoutWidth = width
      }
    }

    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.Q) {
      layoutWidth = ceil(layoutWidth.toDouble()).toFloat()
    }
    var layoutHeight = height
    if (heightMode != YogaMeasureMode.EXACTLY) {
      layoutHeight = layout.getLineBottom(lineCount - 1).toFloat()
      if (heightMode == YogaMeasureMode.AT_MOST && layoutHeight > height) {
        layoutHeight = height
      }
    }
    YogaMeasureOutput.make(layoutWidth, layoutHeight)
  }

  private val mTextBaselineFunction = YogaBaselineFunction { node, width, height ->
    val text =
        checkNotNull(preparedSpannableText) {
          "Spannable element has not been prepared in onBeforeLayout"
        }
    val layout = measureSpannedText(text, width, YogaMeasureMode.EXACTLY)
    layout.getLineBaseline(layout.lineCount - 1).toFloat()
  }

  init {
    initMeasureFunction()
  }

  private fun initMeasureFunction() {
    if (!isVirtual) {
      setMeasureFunction(textMeasureFunction)
      setBaselineFunction(mTextBaselineFunction)
    }
  }

  private fun measureSpannedText(
      text: Spannable,
      width: Float,
      widthMode: YogaMeasureMode
  ): Layout {
    // TODO(5578671): Handle text direction (see View#getTextDirectionHeuristic)
    var width = width
    val textPaint = textPaintInstance
    textPaint.textSize = mTextAttributes.effectiveFontSize.toFloat()
    val layout: Layout
    val boring = BoringLayout.isBoring(text, textPaint)
    val desiredWidth = if (boring == null) Layout.getDesiredWidth(text, textPaint) else Float.NaN

    // technically, width should never be negative, but there is currently a bug in
    val unconstrainedWidth = widthMode == YogaMeasureMode.UNDEFINED || width < 0

    val alignment =
        when (textAlign) {
          Gravity.LEFT -> Layout.Alignment.ALIGN_NORMAL
          Gravity.RIGHT -> Layout.Alignment.ALIGN_OPPOSITE
          Gravity.CENTER_HORIZONTAL -> Layout.Alignment.ALIGN_CENTER
          else -> Layout.Alignment.ALIGN_NORMAL
        }

    if (boring == null &&
        (unconstrainedWidth ||
            (!YogaConstants.isUndefined(desiredWidth) && desiredWidth <= width))) {
      // Is used when the width is not known and the text is not boring, ie. if it contains
      // unicode characters.
      val hintWidth = ceil(desiredWidth.toDouble()).toInt()
      val builder =
          StaticLayout.Builder.obtain(text, 0, text.length, textPaint, hintWidth)
              .setAlignment(alignment)
              .setLineSpacing(0f, 1f)
              .setIncludePad(mIncludeFontPadding)
              .setBreakStrategy(mTextBreakStrategy)
              .setHyphenationFrequency(mHyphenationFrequency)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        builder.setJustificationMode(mJustificationMode)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        builder.setUseLineSpacingFromFallbacks(true)
      }
      layout = builder.build()
    } else if (boring != null && (unconstrainedWidth || boring.width <= width)) {
      // Is used for single-line, boring text when the width is either unknown or bigger
      // than the width of the text.
      layout =
          BoringLayout.make(
              text,
              textPaint,
              max(boring.width.toDouble(), 0.0).toInt(),
              alignment,
              1f,
              0f,
              boring,
              mIncludeFontPadding)
    } else {
      // Is used for multiline, boring text and the width is known.
      // Android 11+ introduces changes in text width calculation which leads to cases
      // where the container is measured smaller than text. Math.ceil prevents it
      // See T136756103 for investigation
      if (Build.VERSION.SDK_INT > Build.VERSION_CODES.Q) {
        width = ceil(width.toDouble()).toFloat()
      }

      val builder =
          StaticLayout.Builder.obtain(text, 0, text.length, textPaint, width.toInt())
              .setAlignment(alignment)
              .setLineSpacing(0f, 1f)
              .setIncludePad(mIncludeFontPadding)
              .setBreakStrategy(mTextBreakStrategy)
              .setHyphenationFrequency(mHyphenationFrequency)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        builder.setJustificationMode(mJustificationMode)
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        builder.setUseLineSpacingFromFallbacks(true)
      }
      layout = builder.build()
    }
    return layout
  }

  // Return text alignment according to LTR or RTL style
  private val textAlign: Int
    get() {
      var textAlign = mTextAlign
      if (layoutDirection == YogaDirection.RTL) {
        if (textAlign == Gravity.RIGHT) {
          textAlign = Gravity.LEFT
        } else if (textAlign == Gravity.LEFT) {
          textAlign = Gravity.RIGHT
        }
      }
      return textAlign
    }

  override fun onBeforeLayout(nativeViewHierarchyOptimizer: NativeViewHierarchyOptimizer) {
    preparedSpannableText =
        spannedFromShadowNode(
            this, /* text (e.g. from `value` prop): */
            null, /* supportsInlineViews: */
            true,
            nativeViewHierarchyOptimizer)
    markUpdated()
  }

  // Text's descendants aren't necessarily all virtual nodes. Text can contain a combination
  // of
  // virtual and non-virtual (e.g. inline views) nodes. Therefore it's not a virtual anchor
  // by the doc comment on [ReactShadowNode.isVirtualAnchor].
  override fun isVirtualAnchor(): Boolean = false

  override fun hoistNativeChildren(): Boolean = true

  override fun markUpdated() {
    super.markUpdated()
    // Telling to Yoga that the node should be remeasured on next layout pass.
    super.dirty()
  }

  override fun onCollectExtraUpdates(uiViewOperationQueue: UIViewOperationQueue) {
    super.onCollectExtraUpdates(uiViewOperationQueue)

    val text = preparedSpannableText ?: return
    val reactTextUpdate =
        ReactTextUpdate(
            text,
            ReactConstants.UNSET,
            mContainsImages,
            getPadding(Spacing.START),
            getPadding(Spacing.TOP),
            getPadding(Spacing.END),
            getPadding(Spacing.BOTTOM),
            textAlign,
            mTextBreakStrategy,
            mJustificationMode)
    uiViewOperationQueue.enqueueUpdateExtraData(reactTag, reactTextUpdate)
  }

  @ReactProp(name = "onTextLayout")
  public fun setShouldNotifyOnTextLayout(shouldNotifyOnTextLayout: Boolean) {
    this.shouldNotifyOnTextLayout = shouldNotifyOnTextLayout
  }

  override fun calculateLayoutOnChildren(): Iterable<ReactShadowNode<*>?>? {
    // Run flexbox on and return the descendants which are inline views.

    if (mInlineViews.isNullOrEmpty()) return null

    val text: Spanned =
        checkNotNull(preparedSpannableText) {
          "Spannable element has not been prepared in onBeforeLayout"
        }
    val placeholders = text.getSpans(0, text.length, TextInlineViewPlaceholderSpan::class.java)
    val shadowNodes = mutableListOf<ReactShadowNode<*>?>()

    for (placeholder in placeholders) {
      val child = mInlineViews?.get(placeholder.reactTag)
      checkNotNull(child) { "Child is null" }
      child.calculateLayout()
      shadowNodes.add(child)
    }

    return shadowNodes
  }

  private companion object {
    // It's important to pass the ANTI_ALIAS_FLAG flag to the constructor rather than setting it
    // later by calling setFlags. This is because the latter approach triggers a bug on Android
    // 4.4.2.
    // The bug is that unicode emoticons aren't measured properly which causes text to be
    // clipped.
    private val textPaintInstance = TextPaint(TextPaint.ANTI_ALIAS_FLAG)
  }
}
