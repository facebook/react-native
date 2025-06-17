/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.text.BoringLayout
import android.text.Layout
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextDirectionHeuristics
import android.text.TextPaint
import android.text.TextUtils
import android.util.LayoutDirection
import android.view.Gravity
import android.view.View
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.WritableArray
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.common.mapbuffer.ReadableMapBuffer
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.ReactAccessibilityDelegate
import com.facebook.react.views.text.internal.span.CustomLetterSpacingSpan
import com.facebook.react.views.text.internal.span.CustomLineHeightSpan
import com.facebook.react.views.text.internal.span.CustomStyleSpan
import com.facebook.react.views.text.internal.span.ReactAbsoluteSizeSpan
import com.facebook.react.views.text.internal.span.ReactBackgroundColorSpan
import com.facebook.react.views.text.internal.span.ReactClickableSpan
import com.facebook.react.views.text.internal.span.ReactForegroundColorSpan
import com.facebook.react.views.text.internal.span.ReactOpacitySpan
import com.facebook.react.views.text.internal.span.ReactStrikethroughSpan
import com.facebook.react.views.text.internal.span.ReactTagSpan
import com.facebook.react.views.text.internal.span.ReactTextPaintHolderSpan
import com.facebook.react.views.text.internal.span.ReactUnderlineSpan
import com.facebook.react.views.text.internal.span.SetSpanOperation
import com.facebook.react.views.text.internal.span.ShadowStyleSpan
import com.facebook.react.views.text.internal.span.TextInlineViewPlaceholderSpan
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

/** Class responsible of creating [Spanned] object for the JS representation of Text */
internal object TextLayoutManager {

  // constants for AttributedString serialization
  const val AS_KEY_HASH: Int = 0
  const val AS_KEY_STRING: Int = 1
  const val AS_KEY_FRAGMENTS: Int = 2
  const val AS_KEY_CACHE_ID: Int = 3
  const val AS_KEY_BASE_ATTRIBUTES: Int = 4

  // constants for Fragment serialization
  const val FR_KEY_STRING: Int = 0
  const val FR_KEY_REACT_TAG: Int = 1
  const val FR_KEY_IS_ATTACHMENT: Int = 2
  const val FR_KEY_WIDTH: Int = 3
  const val FR_KEY_HEIGHT: Int = 4
  const val FR_KEY_TEXT_ATTRIBUTES: Int = 5

  // constants for ParagraphAttributes serialization
  const val PA_KEY_MAX_NUMBER_OF_LINES: Int = 0
  const val PA_KEY_ELLIPSIZE_MODE: Int = 1
  const val PA_KEY_TEXT_BREAK_STRATEGY: Int = 2
  const val PA_KEY_ADJUST_FONT_SIZE_TO_FIT: Int = 3
  const val PA_KEY_INCLUDE_FONT_PADDING: Int = 4
  const val PA_KEY_HYPHENATION_FREQUENCY: Int = 5
  const val PA_KEY_MINIMUM_FONT_SIZE: Int = 6
  const val PA_KEY_MAXIMUM_FONT_SIZE: Int = 7
  const val PA_KEY_TEXT_ALIGN_VERTICAL: Int = 8

  private val TAG: String = TextLayoutManager::class.java.simpleName

  // Each thread has its own copy of scratch TextPaint so that TextLayoutManager
  // measurement/Spannable creation can be free-threaded.
  private val textPaintInstance: ThreadLocal<TextPaint> =
      object : ThreadLocal<TextPaint>() {
        override fun initialValue(): TextPaint = TextPaint(TextPaint.ANTI_ALIAS_FLAG)
      }

  private const val DEFAULT_INCLUDE_FONT_PADDING = true

  private const val DEFAULT_ADJUST_FONT_SIZE_TO_FIT = false

  private val tagToSpannableCache = ConcurrentHashMap<Int, Spannable>()

  fun setCachedSpannableForTag(reactTag: Int, sp: Spannable): Unit {
    tagToSpannableCache[reactTag] = sp
  }

  fun deleteCachedSpannableForTag(reactTag: Int): Unit {
    tagToSpannableCache.remove(reactTag)
  }

  fun isRTL(attributedString: MapBuffer): Boolean {
    // TODO: Don't read AS_KEY_FRAGMENTS, which may be expensive, and is not present when using
    // cached Spannable
    if (!attributedString.contains(AS_KEY_FRAGMENTS)) {
      return false
    }

    val fragments = attributedString.getMapBuffer(AS_KEY_FRAGMENTS)
    if (fragments.count == 0) {
      return false
    }

    val fragment = fragments.getMapBuffer(0)
    val textAttributes = fragment.getMapBuffer(FR_KEY_TEXT_ATTRIBUTES)

    if (!textAttributes.contains(TextAttributeProps.TA_KEY_LAYOUT_DIRECTION.toInt())) {
      return false
    }

    return TextAttributeProps.getLayoutDirection(
        textAttributes.getString(TextAttributeProps.TA_KEY_LAYOUT_DIRECTION.toInt())) ==
        LayoutDirection.RTL
  }

  private fun getTextAlignmentAttr(attributedString: MapBuffer): String? {
    // TODO: Don't read AS_KEY_FRAGMENTS, which may be expensive, and is not present when using
    // cached Spannable
    if (!attributedString.contains(AS_KEY_FRAGMENTS)) {
      return null
    }

    val fragments = attributedString.getMapBuffer(AS_KEY_FRAGMENTS)
    if (fragments.count != 0) {
      val fragment = fragments.getMapBuffer(0)
      val textAttributes = fragment.getMapBuffer(FR_KEY_TEXT_ATTRIBUTES)

      if (textAttributes.contains(TextAttributeProps.TA_KEY_ALIGNMENT.toInt())) {
        return textAttributes.getString(TextAttributeProps.TA_KEY_ALIGNMENT.toInt())
      }
    }

    return null
  }

  private fun getTextJustificationMode(alignmentAttr: String?): Int {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return -1
    }

    if (alignmentAttr != null && alignmentAttr == "justified") {
      return Layout.JUSTIFICATION_MODE_INTER_WORD
    }

    return Layout.JUSTIFICATION_MODE_NONE
  }

  private fun getTextAlignment(
      attributedString: MapBuffer,
      spanned: Spannable,
      alignmentAttr: String?
  ): Layout.Alignment {
    // Android will align text based on the script, so normal and opposite alignment needs to be
    // swapped when the directions of paragraph and script don't match.
    // I.e. paragraph is LTR but script is RTL, text needs to be aligned to the left, which means
    // ALIGN_OPPOSITE needs to be used to align RTL script to the left
    val isParagraphRTL = isRTL(attributedString)
    val isScriptRTL = TextDirectionHeuristics.FIRSTSTRONG_LTR.isRtl(spanned, 0, spanned.length)
    val swapNormalAndOpposite = isParagraphRTL != isScriptRTL

    var alignment =
        if (swapNormalAndOpposite) Layout.Alignment.ALIGN_OPPOSITE
        else Layout.Alignment.ALIGN_NORMAL

    if (alignmentAttr == null) {
      return alignment
    }

    if (alignmentAttr == "center") {
      alignment = Layout.Alignment.ALIGN_CENTER
    } else if (alignmentAttr == "right") {
      alignment =
          if (swapNormalAndOpposite) Layout.Alignment.ALIGN_NORMAL
          else Layout.Alignment.ALIGN_OPPOSITE
    }

    return alignment
  }

  @JvmStatic
  fun getTextGravity(attributedString: MapBuffer, spanned: Spannable): Int {
    val alignmentAttr = getTextAlignmentAttr(attributedString)
    val alignment = getTextAlignment(attributedString, spanned, alignmentAttr)

    // depending on whether the script is LTR or RTL, ALIGN_NORMAL and ALIGN_OPPOSITE may mean
    // different things
    val swapLeftAndRight = TextDirectionHeuristics.FIRSTSTRONG_LTR.isRtl(spanned, 0, spanned.length)

    return when (alignment) {
      Layout.Alignment.ALIGN_NORMAL -> if (swapLeftAndRight) Gravity.RIGHT else Gravity.LEFT
      Layout.Alignment.ALIGN_OPPOSITE -> if (swapLeftAndRight) Gravity.LEFT else Gravity.RIGHT
      Layout.Alignment.ALIGN_CENTER -> Gravity.CENTER_HORIZONTAL
    }
  }

  private fun buildSpannableFromFragments(
      context: Context,
      fragments: MapBuffer,
      sb: SpannableStringBuilder,
      ops: MutableList<SetSpanOperation>
  ) {
    for (i in 0 until fragments.count) {
      val fragment = fragments.getMapBuffer(i)
      val start = sb.length

      val textAttributes =
          TextAttributeProps.fromMapBuffer(fragment.getMapBuffer(FR_KEY_TEXT_ATTRIBUTES))

      sb.append(
          TextTransform.apply(fragment.getString(FR_KEY_STRING), textAttributes.mTextTransform))

      val end = sb.length
      val reactTag =
          if (fragment.contains(FR_KEY_REACT_TAG)) fragment.getInt(FR_KEY_REACT_TAG) else View.NO_ID
      if (fragment.contains(FR_KEY_IS_ATTACHMENT) && fragment.getBoolean(FR_KEY_IS_ATTACHMENT)) {
        val width = PixelUtil.toPixelFromSP(fragment.getDouble(FR_KEY_WIDTH))
        val height = PixelUtil.toPixelFromSP(fragment.getDouble(FR_KEY_HEIGHT))
        ops.add(
            SetSpanOperation(
                sb.length - 1,
                sb.length,
                TextInlineViewPlaceholderSpan(reactTag, width.toInt(), height.toInt())))
      } else if (end >= start) {
        val roleIsLink =
            if (textAttributes.mRole != null)
                (textAttributes.mRole == ReactAccessibilityDelegate.Role.LINK)
            else
                (textAttributes.mAccessibilityRole ==
                    ReactAccessibilityDelegate.AccessibilityRole.LINK)
        if (roleIsLink) {
          ops.add(SetSpanOperation(start, end, ReactClickableSpan(reactTag)))
        }
        if (textAttributes.mIsColorSet) {
          ops.add(SetSpanOperation(start, end, ReactForegroundColorSpan(textAttributes.mColor)))
        }
        if (textAttributes.mIsBackgroundColorSet) {
          ops.add(
              SetSpanOperation(
                  start, end, ReactBackgroundColorSpan(textAttributes.mBackgroundColor)))
        }
        if (!textAttributes.opacity.isNaN()) {
          ops.add(SetSpanOperation(start, end, ReactOpacitySpan(textAttributes.opacity)))
        }
        if (!textAttributes.letterSpacing.isNaN()) {
          ops.add(
              SetSpanOperation(start, end, CustomLetterSpacingSpan(textAttributes.letterSpacing)))
        }
        ops.add(SetSpanOperation(start, end, ReactAbsoluteSizeSpan(textAttributes.mFontSize)))
        if (textAttributes.mFontStyle != ReactConstants.UNSET ||
            textAttributes.mFontWeight != ReactConstants.UNSET ||
            textAttributes.mFontFamily != null) {
          ops.add(
              SetSpanOperation(
                  start,
                  end,
                  CustomStyleSpan(
                      textAttributes.mFontStyle,
                      textAttributes.mFontWeight,
                      textAttributes.mFontFeatureSettings,
                      textAttributes.mFontFamily,
                      context.assets)))
        }
        if (textAttributes.mIsUnderlineTextDecorationSet) {
          ops.add(SetSpanOperation(start, end, ReactUnderlineSpan()))
        }
        if (textAttributes.mIsLineThroughTextDecorationSet) {
          ops.add(SetSpanOperation(start, end, ReactStrikethroughSpan()))
        }
        if ((textAttributes.mTextShadowOffsetDx != 0f ||
            textAttributes.mTextShadowOffsetDy != 0f ||
            textAttributes.mTextShadowRadius != 0f) &&
            Color.alpha(textAttributes.mTextShadowColor) != 0) {
          ops.add(
              SetSpanOperation(
                  start,
                  end,
                  ShadowStyleSpan(
                      textAttributes.mTextShadowOffsetDx,
                      textAttributes.mTextShadowOffsetDy,
                      textAttributes.mTextShadowRadius,
                      textAttributes.mTextShadowColor)))
        }
        if (!textAttributes.effectiveLineHeight.isNaN()) {
          ops.add(
              SetSpanOperation(
                  start, end, CustomLineHeightSpan(textAttributes.effectiveLineHeight)))
        }

        ops.add(SetSpanOperation(start, end, ReactTagSpan(reactTag)))
      }
    }
  }

  fun getOrCreateSpannableForText(
      context: Context,
      attributedString: MapBuffer,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?
  ): Spannable {
    var text: Spannable?
    if (attributedString.contains(AS_KEY_CACHE_ID)) {
      val cacheId = attributedString.getInt(AS_KEY_CACHE_ID)
      text = checkNotNull(tagToSpannableCache[cacheId])
    } else {
      text =
          createSpannableFromAttributedString(
              context, attributedString, reactTextViewManagerCallback)
    }

    return text
  }

  private fun createSpannableFromAttributedString(
      context: Context,
      attributedString: MapBuffer,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?
  ): Spannable {
    val sb = SpannableStringBuilder()

    // The [SpannableStringBuilder] implementation require setSpan operation to be called
    // up-to-bottom, otherwise all the spannables that are within the region for which one may set
    // a new spannable will be wiped out
    val ops: MutableList<SetSpanOperation> = ArrayList()

    buildSpannableFromFragments(context, attributedString.getMapBuffer(AS_KEY_FRAGMENTS), sb, ops)

    // TODO T31905686: add support for inline Images
    // While setting the Spans on the final text, we also check whether any of them are images.
    for (priorityIndex in ops.indices) {
      val op = ops[ops.size - priorityIndex - 1]

      // Actual order of calling {@code execute} does NOT matter,
      // but the {@code priorityIndex} DOES matter.
      op.execute(sb, priorityIndex)
    }

    reactTextViewManagerCallback?.onPostProcessSpannable(sb)
    return sb
  }

  private fun createLayout(
      text: Spannable,
      boring: BoringLayout.Metrics?,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      includeFontPadding: Boolean,
      textBreakStrategy: Int,
      hyphenationFrequency: Int,
      alignment: Layout.Alignment,
      justificationMode: Int,
      ellipsizeMode: TextUtils.TruncateAt?,
      maxNumberOfLines: Int,
      paint: TextPaint
  ): Layout {
    // If our text is boring, and fully fits in the available space, we can represent the text
    // layout as a BoringLayout
    if (boring != null &&
        (widthYogaMeasureMode == YogaMeasureMode.UNDEFINED || boring.width <= floor(width))) {
      val layoutWidth =
          if (widthYogaMeasureMode == YogaMeasureMode.EXACTLY) floor(width).toInt()
          else boring.width
      return BoringLayout.make(
          text, paint, layoutWidth, alignment, 1f, 0f, boring, includeFontPadding)
    }

    val desiredWidth = ceil(Layout.getDesiredWidth(text, paint)).toInt()

    val layoutWidth =
        when (widthYogaMeasureMode) {
          YogaMeasureMode.EXACTLY -> floor(width).toInt()
          YogaMeasureMode.AT_MOST -> min(desiredWidth, floor(width).toInt())
          else -> desiredWidth
        }

    val builder =
        StaticLayout.Builder.obtain(text, 0, text.length, paint, layoutWidth)
            .setAlignment(alignment)
            .setLineSpacing(0f, 1f)
            .setIncludePad(includeFontPadding)
            .setBreakStrategy(textBreakStrategy)
            .setHyphenationFrequency(hyphenationFrequency)

    if (maxNumberOfLines != ReactConstants.UNSET && maxNumberOfLines != 0) {
      builder.setEllipsize(ellipsizeMode).setMaxLines(maxNumberOfLines)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      builder.setJustificationMode(justificationMode)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      builder.setUseLineSpacingFromFallbacks(true)
    }

    return builder.build()
  }

  /**
   * Sets attributes on the TextPaint, used for content outside the Spannable text, like for empty
   * strings, or newlines after the last trailing character
   */
  private fun updateTextPaint(
      paint: TextPaint,
      baseTextAttributes: TextAttributeProps,
      context: Context
  ) {
    if (baseTextAttributes.effectiveFontSize != ReactConstants.UNSET) {
      paint.textSize = baseTextAttributes.effectiveFontSize.toFloat()
    }

    if (baseTextAttributes.fontStyle != ReactConstants.UNSET ||
        baseTextAttributes.fontWeight != ReactConstants.UNSET ||
        baseTextAttributes.fontFamily != null) {
      val typeface =
          ReactTypefaceUtils.applyStyles(
              null,
              baseTextAttributes.fontStyle,
              baseTextAttributes.fontWeight,
              baseTextAttributes.fontFamily,
              context.assets)
      paint.setTypeface(typeface)

      if (baseTextAttributes.fontStyle != ReactConstants.UNSET &&
          baseTextAttributes.fontStyle != typeface.style) {
        // https://cs.android.com/android/platform/superproject/main/+/main:frameworks/base/core/java/android/widget/TextView.java;l=2536;drc=d262a68a1e0c3b640274b094a7f1e3a5b75563e9
        val missingStyle = baseTextAttributes.fontStyle and typeface.style.inv()
        paint.isFakeBoldText = missingStyle and Typeface.BOLD != 0
        paint.textSkewX = if ((missingStyle and Typeface.ITALIC) != 0) -0.25f else 0f
      }
    }
  }

  /**
   * WARNING: This paint should not be used for any layouts which may escape TextLayoutManager, as
   * they may need to be drawn later, and may not safely be reused
   */
  private fun scratchPaintWithAttributes(
      baseTextAttributes: TextAttributeProps,
      context: Context
  ): TextPaint {
    val paint = checkNotNull(textPaintInstance.get())
    paint.setTypeface(null)
    paint.textSize = 12f
    paint.isFakeBoldText = false
    paint.textSkewX = 0f
    updateTextPaint(paint, baseTextAttributes, context)
    return paint
  }

  private fun newPaintWithAttributes(
      baseTextAttributes: TextAttributeProps,
      context: Context
  ): TextPaint {
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG)
    updateTextPaint(paint, baseTextAttributes, context)
    return paint
  }

  private fun createLayoutForMeasurement(
      context: Context,
      attributedString: MapBuffer,
      paragraphAttributes: MapBuffer,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?
  ): Layout {
    val text = getOrCreateSpannableForText(context, attributedString, reactTextViewManagerCallback)

    val paint: TextPaint
    if (attributedString.contains(AS_KEY_CACHE_ID)) {
      paint = text.getSpans(0, 0, ReactTextPaintHolderSpan::class.java)[0].textPaint
    } else {
      val baseTextAttributes =
          TextAttributeProps.fromMapBuffer(attributedString.getMapBuffer(AS_KEY_BASE_ATTRIBUTES))
      paint = scratchPaintWithAttributes(baseTextAttributes, context)
    }

    return createLayout(
        text,
        paint,
        attributedString,
        paragraphAttributes,
        width,
        widthYogaMeasureMode,
        height,
        heightYogaMeasureMode)
  }

  private fun createLayout(
      text: Spannable,
      paint: TextPaint,
      attributedString: MapBuffer,
      paragraphAttributes: MapBuffer,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode
  ): Layout {
    val boring = isBoring(text, paint)

    val textBreakStrategy =
        TextAttributeProps.getTextBreakStrategy(
            paragraphAttributes.getString(PA_KEY_TEXT_BREAK_STRATEGY))
    val includeFontPadding =
        if (paragraphAttributes.contains(PA_KEY_INCLUDE_FONT_PADDING))
            paragraphAttributes.getBoolean(PA_KEY_INCLUDE_FONT_PADDING)
        else DEFAULT_INCLUDE_FONT_PADDING
    val hyphenationFrequency =
        TextAttributeProps.getHyphenationFrequency(
            paragraphAttributes.getString(PA_KEY_HYPHENATION_FREQUENCY))
    val adjustFontSizeToFit =
        if (paragraphAttributes.contains(PA_KEY_ADJUST_FONT_SIZE_TO_FIT))
            paragraphAttributes.getBoolean(PA_KEY_ADJUST_FONT_SIZE_TO_FIT)
        else DEFAULT_ADJUST_FONT_SIZE_TO_FIT
    val maximumNumberOfLines =
        if (paragraphAttributes.contains(PA_KEY_MAX_NUMBER_OF_LINES))
            paragraphAttributes.getInt(PA_KEY_MAX_NUMBER_OF_LINES)
        else ReactConstants.UNSET
    val ellipsizeMode =
        if (paragraphAttributes.contains(PA_KEY_ELLIPSIZE_MODE))
            TextAttributeProps.getEllipsizeMode(
                paragraphAttributes.getString(PA_KEY_ELLIPSIZE_MODE))
        else null

    // T226571629: textAlign should be moved to ParagraphAttributes
    val alignmentAttr = getTextAlignmentAttr(attributedString)
    val alignment = getTextAlignment(attributedString, text, alignmentAttr)
    val justificationMode = getTextJustificationMode(alignmentAttr)

    if (adjustFontSizeToFit) {
      val minimumFontSize =
          if (paragraphAttributes.contains(PA_KEY_MINIMUM_FONT_SIZE))
              paragraphAttributes.getDouble(PA_KEY_MINIMUM_FONT_SIZE).toFloat()
          else Float.NaN

      adjustSpannableFontToFit(
          text,
          width,
          YogaMeasureMode.EXACTLY,
          height,
          heightYogaMeasureMode,
          minimumFontSize,
          maximumNumberOfLines,
          includeFontPadding,
          textBreakStrategy,
          hyphenationFrequency,
          alignment,
          justificationMode,
          paint)
    }

    return createLayout(
        text,
        boring,
        width,
        widthYogaMeasureMode,
        includeFontPadding,
        textBreakStrategy,
        hyphenationFrequency,
        alignment,
        justificationMode,
        ellipsizeMode,
        maximumNumberOfLines,
        paint)
  }

  @JvmStatic
  fun createPreparedLayout(
      context: Context,
      attributedString: ReadableMapBuffer,
      paragraphAttributes: ReadableMapBuffer,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?
  ): PreparedLayout {
    val text = getOrCreateSpannableForText(context, attributedString, reactTextViewManagerCallback)
    val baseTextAttributes =
        TextAttributeProps.fromMapBuffer(attributedString.getMapBuffer(AS_KEY_BASE_ATTRIBUTES))
    val layout =
        createLayout(
            text,
            newPaintWithAttributes(baseTextAttributes, context),
            attributedString,
            paragraphAttributes,
            width,
            widthYogaMeasureMode,
            height,
            heightYogaMeasureMode)

    val maximumNumberOfLines =
        if (paragraphAttributes.contains(PA_KEY_MAX_NUMBER_OF_LINES))
            paragraphAttributes.getInt(PA_KEY_MAX_NUMBER_OF_LINES)
        else ReactConstants.UNSET

    val verticalOffset =
        getVerticalOffset(
            layout, paragraphAttributes, height, heightYogaMeasureMode, maximumNumberOfLines)

    return PreparedLayout(layout, maximumNumberOfLines, verticalOffset)
  }

  @JvmStatic
  fun adjustSpannableFontToFit(
      text: Spannable,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode,
      minimumFontSizeAttr: Float,
      maximumNumberOfLines: Int,
      includeFontPadding: Boolean,
      textBreakStrategy: Int,
      hyphenationFrequency: Int,
      alignment: Layout.Alignment,
      justificationMode: Int,
      paint: TextPaint
  ): Unit {
    var boring = isBoring(text, paint)
    var layout =
        createLayout(
            text,
            boring,
            width,
            widthYogaMeasureMode,
            includeFontPadding,
            textBreakStrategy,
            hyphenationFrequency,
            alignment,
            justificationMode,
            null,
            ReactConstants.UNSET,
            paint)

    // Minimum font size is 4pts to match the iOS implementation.
    val minimumFontSize =
        (if (minimumFontSizeAttr.isNaN()) 4.dpToPx() else minimumFontSizeAttr).toInt()

    // Find the largest font size used in the spannable to use as a starting point.
    var currentFontSize = minimumFontSize
    val spans = text.getSpans(0, text.length, ReactAbsoluteSizeSpan::class.java)
    for (span in spans) {
      currentFontSize = max(currentFontSize, span.size).toInt()
    }

    val initialFontSize = currentFontSize
    while (currentFontSize > minimumFontSize &&
        ((maximumNumberOfLines != ReactConstants.UNSET &&
            maximumNumberOfLines != 0 &&
            layout.lineCount > maximumNumberOfLines) ||
            (heightYogaMeasureMode != YogaMeasureMode.UNDEFINED && layout.height > height) ||
            (text.length == 1 && layout.getLineWidth(0) > width))) {
      // TODO: We could probably use a smarter algorithm here. This will require 0(n)
      // measurements based on the number of points the font size needs to be reduced by.
      currentFontSize -= max(1, 1.dpToPx().toInt())

      val ratio = currentFontSize.toFloat() / initialFontSize.toFloat()
      paint.textSize = max((paint.textSize * ratio).toInt(), minimumFontSize).toFloat()

      val sizeSpans = text.getSpans(0, text.length, ReactAbsoluteSizeSpan::class.java)
      for (span in sizeSpans) {
        text.setSpan(
            ReactAbsoluteSizeSpan(max((span.size * ratio).toInt(), minimumFontSize)),
            text.getSpanStart(span),
            text.getSpanEnd(span),
            text.getSpanFlags(span))
        text.removeSpan(span)
      }
      if (boring != null) {
        boring = isBoring(text, paint)
      }
      layout =
          createLayout(
              text,
              boring,
              width,
              widthYogaMeasureMode,
              includeFontPadding,
              textBreakStrategy,
              hyphenationFrequency,
              alignment,
              justificationMode,
              null,
              ReactConstants.UNSET,
              paint)
    }
  }

  @JvmStatic
  fun measureText(
      context: Context,
      attributedString: MapBuffer,
      paragraphAttributes: MapBuffer,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?,
      attachmentsPositions: FloatArray?
  ): Long {
    // TODO(5578671): Handle text direction (see View#getTextDirectionHeuristic)
    val layout =
        createLayoutForMeasurement(
            context,
            attributedString,
            paragraphAttributes,
            width,
            widthYogaMeasureMode,
            height,
            heightYogaMeasureMode,
            reactTextViewManagerCallback)

    val maximumNumberOfLines =
        if (paragraphAttributes.contains(PA_KEY_MAX_NUMBER_OF_LINES))
            paragraphAttributes.getInt(PA_KEY_MAX_NUMBER_OF_LINES)
        else ReactConstants.UNSET

    val text = layout.text as Spanned

    val calculatedLineCount = calculateLineCount(layout, maximumNumberOfLines)
    val calculatedWidth =
        calculateWidth(layout, text, width, widthYogaMeasureMode, calculatedLineCount)
    val calculatedHeight =
        calculateHeight(layout, height, heightYogaMeasureMode, calculatedLineCount)

    if (attachmentsPositions != null) {
      var attachmentIndex = 0
      var lastAttachmentFoundInSpan: Int

      val metrics = AttachmentMetrics()
      var i = 0
      while (i < text.length) {
        lastAttachmentFoundInSpan =
            nextAttachmentMetrics(
                layout, text, calculatedWidth, calculatedLineCount, i, 0f, metrics)
        if (metrics.wasFound) {
          attachmentsPositions[attachmentIndex] = metrics.top.pxToDp()
          attachmentsPositions[attachmentIndex + 1] = metrics.left.pxToDp()
          attachmentIndex += 2
        }
        i = lastAttachmentFoundInSpan
      }
    }

    val widthInSP = calculatedWidth.pxToDp()
    val heightInSP = calculatedHeight.pxToDp()

    return YogaMeasureOutput.make(widthInSP, heightInSP)
  }

  @JvmStatic
  fun measurePreparedLayout(
      preparedLayout: PreparedLayout,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode
  ): FloatArray {
    val layout = preparedLayout.layout
    val text = layout.text as Spanned
    val maximumNumberOfLines = preparedLayout.maximumNumberOfLines

    val calculatedLineCount = calculateLineCount(layout, maximumNumberOfLines)
    val calculatedWidth =
        calculateWidth(layout, text, width, widthYogaMeasureMode, calculatedLineCount)
    val calculatedHeight =
        calculateHeight(layout, height, heightYogaMeasureMode, calculatedLineCount)

    val retList = ArrayList<Float>()
    retList.add(calculatedWidth.pxToDp())
    retList.add(calculatedHeight.pxToDp())

    val metrics = AttachmentMetrics()
    var lastAttachmentFoundInSpan: Int
    run {
      var i = 0
      while (i < text.length) {
        lastAttachmentFoundInSpan =
            nextAttachmentMetrics(
                layout,
                text,
                calculatedWidth,
                calculatedLineCount,
                i,
                preparedLayout.verticalOffset,
                metrics)
        if (metrics.wasFound) {
          retList.add(metrics.top.pxToDp())
          retList.add(metrics.left.pxToDp())
          retList.add(metrics.width.pxToDp())
          retList.add(metrics.height.pxToDp())
        }
        i = lastAttachmentFoundInSpan
      }
    }

    val ret = FloatArray(retList.size)
    for (i in retList.indices) {
      ret[i] = retList[i]
    }
    return ret
  }

  private fun getVerticalOffset(
      layout: Layout,
      paragraphAttributes: ReadableMapBuffer,
      height: Float,
      heightMeasureMode: YogaMeasureMode,
      maximumNumberOfLines: Int
  ): Float {
    val textAlignVertical =
        if (paragraphAttributes.contains(PA_KEY_TEXT_ALIGN_VERTICAL))
            paragraphAttributes.getString(PA_KEY_TEXT_ALIGN_VERTICAL)
        else null

    if (textAlignVertical == null) {
      return 0f
    }

    val textHeight = layout.height
    val calculatedLineCount = calculateLineCount(layout, maximumNumberOfLines)
    val boxHeight = calculateHeight(layout, height, heightMeasureMode, calculatedLineCount)

    if (textHeight > boxHeight) {
      return 0f
    }

    when (textAlignVertical) {
      "auto",
      "top" -> return 0f
      "center" -> return (boxHeight - textHeight) / 2f
      "bottom" -> return boxHeight - textHeight
      else -> {
        FLog.w(ReactConstants.TAG, "Invalid textAlignVertical: $textAlignVertical")
        return 0f
      }
    }
  }

  private fun calculateLineCount(layout: Layout, maximumNumberOfLines: Int): Int =
      if (maximumNumberOfLines == ReactConstants.UNSET || maximumNumberOfLines == 0)
          layout.lineCount
      else min(maximumNumberOfLines, layout.lineCount)

  private fun calculateWidth(
      layout: Layout,
      text: Spanned,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      calculatedLineCount: Int
  ): Float {
    // Our layout must be created at a physical pixel boundary, so may be sized smaller by a
    // subpixel compared to the assigned layout width.
    if (widthYogaMeasureMode == YogaMeasureMode.EXACTLY) {
      return width
    }

    return layout.width.toFloat()
  }

  private fun calculateHeight(
      layout: Layout,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode,
      calculatedLineCount: Int
  ): Float {
    var calculatedHeight = height
    if (heightYogaMeasureMode != YogaMeasureMode.EXACTLY) {
      // StaticLayout only seems to change its height in response to maxLines when ellipsizing, so
      // we must truncate
      calculatedHeight = layout.getLineBottom(calculatedLineCount - 1).toFloat()
      if (heightYogaMeasureMode == YogaMeasureMode.AT_MOST && calculatedHeight > height) {
        calculatedHeight = height
      }
    }
    return calculatedHeight
  }

  private fun nextAttachmentMetrics(
      layout: Layout,
      text: Spanned,
      calculatedWidth: Float,
      calculatedLineCount: Int,
      i: Int,
      verticalOffset: Float,
      metrics: AttachmentMetrics
  ): Int {
    // Calculate the positions of the attachments (views) that will be rendered inside the
    // Spanned Text. The following logic is only executed when a text contains views inside.
    // This follows a similar logic than used in pre-fabric (see ReactTextView.onLayout method).
    val lastAttachmentFoundInSpan =
        text.nextSpanTransition(i, text.length, TextInlineViewPlaceholderSpan::class.java)
    val placeholders =
        text.getSpans(i, lastAttachmentFoundInSpan, TextInlineViewPlaceholderSpan::class.java)

    if (placeholders.size == 0) {
      metrics.wasFound = false
      return lastAttachmentFoundInSpan
    }

    Assertions.assertCondition(placeholders.size == 1)
    val placeholder = placeholders[0]

    val start = text.getSpanStart(placeholder)
    val line = layout.getLineForOffset(start)
    val isLineTruncated = layout.getEllipsisCount(line) > 0
    val isAttachmentTruncated =
        line > calculatedLineCount ||
            (isLineTruncated && start >= layout.getLineStart(line) + layout.getEllipsisStart(line))
    if (isAttachmentTruncated) {
      metrics.top = Float.NaN
      metrics.left = Float.NaN
    } else {
      val placeholderWidth = placeholder.width.toFloat()
      val placeholderHeight = placeholder.height.toFloat()
      // Calculate if the direction of the placeholder character is Right-To-Left.
      val isRtlChar = layout.isRtlCharAt(start)
      val isRtlParagraph = layout.getParagraphDirection(line) == Layout.DIR_RIGHT_TO_LEFT
      var placeholderLeftPosition: Float
      // There's a bug on Samsung devices where calling getPrimaryHorizontal on
      // the last offset in the layout will result in an endless loop. Work around
      // this bug by avoiding getPrimaryHorizontal in that case.
      if (start == text.length - 1) {
        val endsWithNewLine = text.length > 0 && text[layout.getLineEnd(line) - 1] == '\n'
        val lineWidth = if (endsWithNewLine) layout.getLineMax(line) else layout.getLineWidth(line)
        placeholderLeftPosition =
            if (isRtlParagraph // Equivalent to `layout.getLineLeft(line)` but `getLineLeft` returns
            // incorrect
            // values when the paragraph is RTL and `setSingleLine(true)`.
            )
                ( // Equivalent to `layout.getLineLeft(line)` but `getLineLeft` returns
                // incorrect
                // values when the paragraph is RTL and `setSingleLine(true)`.
                calculatedWidth - lineWidth)
            else (layout.getLineRight(line) - placeholderWidth)
      } else {
        // The direction of the paragraph may not be exactly the direction the string is
        // heading
        // in at the
        // position of the placeholder. So, if the direction of the character is the same
        // as the
        // paragraph
        // use primary, secondary otherwise.
        val characterAndParagraphDirectionMatch = isRtlParagraph == isRtlChar
        placeholderLeftPosition =
            if (characterAndParagraphDirectionMatch) layout.getPrimaryHorizontal(start)
            else layout.getSecondaryHorizontal(start)
        if (isRtlParagraph && !isRtlChar) {
          // Adjust `placeholderLeftPosition` to work around an Android bug.
          // The bug is when the paragraph is RTL and `setSingleLine(true)`, some layout
          // methods such as `getPrimaryHorizontal`, `getSecondaryHorizontal`, and
          // `getLineRight` return incorrect values. Their return values seem to be off
          // by the same number of pixels so subtracting these values cancels out the
          // error.
          //
          // The result is equivalent to bugless versions of
          // `getPrimaryHorizontal`/`getSecondaryHorizontal`.
          placeholderLeftPosition =
              calculatedWidth - (layout.getLineRight(line) - placeholderLeftPosition)
        }
        if (isRtlChar) {
          placeholderLeftPosition -= placeholderWidth
        }
      }
      // Vertically align the inline view to the baseline of the line of text.
      val placeholderTopPosition = layout.getLineBaseline(line) - placeholderHeight

      // The attachment array returns the positions of each of the attachments as
      metrics.top = placeholderTopPosition
      metrics.left = placeholderLeftPosition
    }

    // The text may be vertically aligned to the top, center, or bottom of the container. This is
    // not captured in the Layout, but rather applied separately. We need to account for this here.
    metrics.top += verticalOffset

    metrics.wasFound = true
    metrics.width = placeholder.width.toFloat()
    metrics.height = placeholder.height.toFloat()
    return lastAttachmentFoundInSpan
  }

  @JvmStatic
  fun measureLines(
      context: Context,
      attributedString: MapBuffer,
      paragraphAttributes: MapBuffer,
      width: Float,
      height: Float
  ): WritableArray {
    val layout =
        createLayoutForMeasurement(
            context,
            attributedString,
            paragraphAttributes,
            width,
            YogaMeasureMode.EXACTLY,
            height,
            YogaMeasureMode.EXACTLY,
            null /* TODO T226571550: Fix measureLines with ReactTextViewManagerCallback */)
    return FontMetricsUtil.getFontMetrics(layout.text, layout, context)
  }

  private fun isBoring(text: Spannable, paint: TextPaint): BoringLayout.Metrics? =
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
        BoringLayout.isBoring(text, paint)
      } else {
        // Default to include fallback line spacing on Android 13+, like TextView
        // https://cs.android.com/android/_/android/platform/frameworks/base/+/78c774defb238c05c42b34a12b6b3b0c64844ed7
        BoringLayout.isBoring(text, paint, TextDirectionHeuristics.FIRSTSTRONG_LTR, true, null)
      }

  private class AttachmentMetrics {
    var wasFound: Boolean = false
    var top: Float = 0f
    var left: Float = 0f
    var width: Float = 0f
    var height: Float = 0f
  }
}
