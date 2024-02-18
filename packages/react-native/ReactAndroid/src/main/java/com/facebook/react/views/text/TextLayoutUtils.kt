/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.content.Context
import android.graphics.Color
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.view.View
import com.facebook.react.common.ReactConstants
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactAccessibilityDelegate
import com.facebook.react.views.text.fragments.TextFragment
import com.facebook.react.views.text.fragments.TextFragmentList
import com.facebook.react.views.text.internal.span.CustomLetterSpacingSpan
import com.facebook.react.views.text.internal.span.CustomLineHeightSpan
import com.facebook.react.views.text.internal.span.CustomStyleSpan
import com.facebook.react.views.text.internal.span.ReactAbsoluteSizeSpan
import com.facebook.react.views.text.internal.span.ReactBackgroundColorSpan
import com.facebook.react.views.text.internal.span.ReactClickableSpan
import com.facebook.react.views.text.internal.span.ReactForegroundColorSpan
import com.facebook.react.views.text.internal.span.ReactStrikethroughSpan
import com.facebook.react.views.text.internal.span.ReactTagSpan
import com.facebook.react.views.text.internal.span.ReactUnderlineSpan
import com.facebook.react.views.text.internal.span.SetSpanOperation
import com.facebook.react.views.text.internal.span.ShadowStyleSpan
import com.facebook.react.views.text.internal.span.TextInlineViewPlaceholderSpan

/** Utility methods for building [Spannable]s */
internal object TextLayoutUtils {
  private const val INLINE_VIEW_PLACEHOLDER = "0"

  @JvmStatic
  fun buildSpannableFromTextFragmentList(
      context: Context,
      textFragmentList: TextFragmentList,
      sb: SpannableStringBuilder,
      ops: MutableList<SetSpanOperation>,
  ) {
    for (i in 0 until textFragmentList.count) {
      val fragment = textFragmentList.getFragment(i)

      addApplicableFragmentSpans(
          context = context,
          fragment = fragment,
          sb = sb,
          ops = ops,
      )
    }
  }

  private fun addApplicableFragmentSpans(
      context: Context,
      fragment: TextFragment,
      sb: SpannableStringBuilder,
      ops: MutableList<SetSpanOperation>,
  ) {
    val start = sb.length

    // ReactRawText
    val textAttributes = fragment.textAttributeProps

    addText(sb, fragment.string, textAttributes)

    val end = sb.length
    val reactTag = if (fragment.hasReactTag()) fragment.reactTag else View.NO_ID
    if (fragment.hasIsAttachment() && fragment.isAttachment) {
      val width = PixelUtil.toPixelFromSP(fragment.width)
      val height = PixelUtil.toPixelFromSP(fragment.height)

      addInlineViewPlaceholderSpan(
          ops = ops,
          sb = sb,
          reactTag = reactTag,
          width = width,
          height = height,
      )
    } else if (end >= start) {
      addApplicableTextAttributeSpans(
          ops = ops,
          textAttributeProvider = textAttributes,
          reactTag = reactTag,
          context = context,
          start = start,
          end = end,
      )
    }
  }

  @JvmStatic
  fun addText(
      sb: SpannableStringBuilder,
      text: String?,
      textAttributeProvider: EffectiveTextAttributeProvider
  ) {
    sb.append(TextTransform.apply(text, textAttributeProvider.textTransform))
  }

  @JvmStatic
  fun addInlineViewPlaceholderSpan(
      ops: MutableList<SetSpanOperation>,
      sb: SpannableStringBuilder,
      reactTag: Int,
      width: Float,
      height: Float
  ) {
    ops.add(
        SetSpanOperation(
            sb.length - INLINE_VIEW_PLACEHOLDER.length,
            sb.length,
            TextInlineViewPlaceholderSpan(reactTag, width.toInt(), height.toInt())))
  }

  @JvmStatic
  fun addApplicableTextAttributeSpans(
      ops: MutableList<SetSpanOperation>,
      textAttributeProvider: EffectiveTextAttributeProvider,
      reactTag: Int,
      context: Context,
      start: Int,
      end: Int
  ) {
    addColorSpanIfApplicable(
        ops = ops,
        textAttributeProvider = textAttributeProvider,
        start = start,
        end = end,
    )

    addBackgroundColorSpanIfApplicable(
        ops = ops,
        textAttributeProvider = textAttributeProvider,
        start = start,
        end = end,
    )

    addLinkSpanIfApplicable(
        ops = ops,
        textAttributeProvider = textAttributeProvider,
        reactTag,
        start = start,
        end = end,
    )

    addLetterSpacingSpanIfApplicable(
        ops = ops,
        textAttributeProvider = textAttributeProvider,
        start = start,
        end = end,
    )

    addFontSizeSpanIfApplicable(
        ops = ops,
        textAttributeProvider = textAttributeProvider,
        start = start,
        end = end,
    )

    addCustomStyleSpanIfApplicable(
        ops = ops,
        textAttributeProvider = textAttributeProvider,
        context,
        start = start,
        end = end,
    )

    addUnderlineSpanIfApplicable(
        ops = ops,
        textAttributeProvider = textAttributeProvider,
        start = start,
        end = end,
    )

    addStrikethroughSpanIfApplicable(
        ops = ops,
        textAttributeProvider = textAttributeProvider,
        start = start,
        end = end,
    )

    addShadowStyleSpanIfApplicable(
        ops = ops,
        textAttributeProvider = textAttributeProvider,
        start = start,
        end = end,
    )

    addLineHeightSpanIfApplicable(
        ops = ops,
        textAttributeProvider = textAttributeProvider,
        start = start,
        end = end,
    )

    addReactTagSpan(
        ops = ops,
        start = start,
        end = end,
        reactTag = reactTag,
    )
  }

  @JvmStatic
  private fun addLinkSpanIfApplicable(
      ops: MutableList<SetSpanOperation>,
      textAttributeProvider: EffectiveTextAttributeProvider,
      reactTag: Int,
      start: Int,
      end: Int
  ) {
    val roleIsLink =
        textAttributeProvider.role?.let { it == ReactAccessibilityDelegate.Role.LINK }
            ?: (textAttributeProvider.accessibilityRole ==
                ReactAccessibilityDelegate.AccessibilityRole.LINK)
    if (roleIsLink) {
      ops.add(SetSpanOperation(start, end, ReactClickableSpan(reactTag)))
    }
  }

  @JvmStatic
  private fun addColorSpanIfApplicable(
      ops: MutableList<SetSpanOperation>,
      textAttributeProvider: EffectiveTextAttributeProvider,
      start: Int,
      end: Int
  ) {
    if (textAttributeProvider.isColorSet) {
      ops.add(SetSpanOperation(start, end, ReactForegroundColorSpan(textAttributeProvider.color)))
    }
  }

  @JvmStatic
  private fun addBackgroundColorSpanIfApplicable(
      ops: MutableList<SetSpanOperation>,
      textAttributeProvider: EffectiveTextAttributeProvider,
      start: Int,
      end: Int
  ) {
    if (textAttributeProvider.isBackgroundColorSet) {
      ops.add(
          SetSpanOperation(
              start, end, ReactBackgroundColorSpan(textAttributeProvider.backgroundColor)))
    }
  }

  @JvmStatic
  private fun addLetterSpacingSpanIfApplicable(
      ops: MutableList<SetSpanOperation>,
      textAttributeProvider: EffectiveTextAttributeProvider,
      start: Int,
      end: Int
  ) {
    val effectiveLetterSpacing = textAttributeProvider.effectiveLetterSpacing

    if (!effectiveLetterSpacing.isNaN()) {
      ops.add(SetSpanOperation(start, end, CustomLetterSpacingSpan(effectiveLetterSpacing)))
    }
  }

  @JvmStatic
  private fun addFontSizeSpanIfApplicable(
      ops: MutableList<SetSpanOperation>,
      textAttributeProvider: EffectiveTextAttributeProvider,
      start: Int,
      end: Int
  ) {
    val effectiveFontSize = textAttributeProvider.effectiveFontSize

    if (effectiveFontSize != ReactConstants.UNSET) {
      ops.add(SetSpanOperation(start, end, ReactAbsoluteSizeSpan(effectiveFontSize)))
    }
  }

  @JvmStatic
  private fun addCustomStyleSpanIfApplicable(
      ops: MutableList<SetSpanOperation>,
      textAttributeProvider: EffectiveTextAttributeProvider,
      context: Context,
      start: Int,
      end: Int
  ) {
    val fontStyle = textAttributeProvider.fontStyle
    val fontWeight = textAttributeProvider.fontWeight
    val fontFamily = textAttributeProvider.fontFamily

    if (fontStyle != ReactConstants.UNSET ||
        fontWeight != ReactConstants.UNSET ||
        fontFamily != null) {
      ops.add(
          SetSpanOperation(
              start,
              end,
              CustomStyleSpan(
                  fontStyle,
                  fontWeight,
                  textAttributeProvider.fontFeatureSettings,
                  fontFamily,
                  context.assets)))
    }
  }

  @JvmStatic
  private fun addUnderlineSpanIfApplicable(
      ops: MutableList<SetSpanOperation>,
      textAttributeProvider: EffectiveTextAttributeProvider,
      start: Int,
      end: Int
  ) {
    if (textAttributeProvider.isUnderlineTextDecorationSet) {
      ops.add(SetSpanOperation(start, end, ReactUnderlineSpan()))
    }
  }

  @JvmStatic
  private fun addStrikethroughSpanIfApplicable(
      ops: MutableList<SetSpanOperation>,
      textAttributeProvider: EffectiveTextAttributeProvider,
      start: Int,
      end: Int
  ) {
    if (textAttributeProvider.isLineThroughTextDecorationSet) {
      ops.add(SetSpanOperation(start, end, ReactStrikethroughSpan()))
    }
  }

  @JvmStatic
  private fun addShadowStyleSpanIfApplicable(
      ops: MutableList<SetSpanOperation>,
      textAttributeProvider: EffectiveTextAttributeProvider,
      start: Int,
      end: Int
  ) {
    val hasTextShadowOffset =
        textAttributeProvider.textShadowOffsetDx != 0f ||
            textAttributeProvider.textShadowOffsetDy != 0f
    val hasTextShadowRadius = textAttributeProvider.textShadowRadius != 0f
    val hasTextShadowColorAlpha = Color.alpha(textAttributeProvider.textShadowColor) != 0

    if ((hasTextShadowOffset || hasTextShadowRadius) && hasTextShadowColorAlpha) {
      ops.add(
          SetSpanOperation(
              start,
              end,
              ShadowStyleSpan(
                  textAttributeProvider.textShadowOffsetDx,
                  textAttributeProvider.textShadowOffsetDy,
                  textAttributeProvider.textShadowRadius,
                  textAttributeProvider.textShadowColor)))
    }
  }

  @JvmStatic
  private fun addLineHeightSpanIfApplicable(
      ops: MutableList<SetSpanOperation>,
      textAttributeProvider: EffectiveTextAttributeProvider,
      start: Int,
      end: Int
  ) {
    val effectiveLineHeight = textAttributeProvider.effectiveLineHeight
    if (!effectiveLineHeight.isNaN()) {
      ops.add(SetSpanOperation(start, end, CustomLineHeightSpan(effectiveLineHeight)))
    }
  }

  @JvmStatic
  private fun addReactTagSpan(
      ops: MutableList<SetSpanOperation>,
      start: Int,
      end: Int,
      reactTag: Int
  ) {
    ops.add(SetSpanOperation(start, end, ReactTagSpan(reactTag)))
  }
}
