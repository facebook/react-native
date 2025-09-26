/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.text

import android.graphics.Color
import android.os.Build
import android.text.Layout
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.view.Gravity
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.uimanager.IllegalViewOperationException
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.PixelUtil.toPixelFromDIP
import com.facebook.react.uimanager.ReactAccessibilityDelegate
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ReactShadowNodeImpl
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.text.ReactTypefaceUtils.parseFontStyle
import com.facebook.react.views.text.ReactTypefaceUtils.parseFontVariant
import com.facebook.react.views.text.ReactTypefaceUtils.parseFontWeight
import com.facebook.react.views.text.TextTransform.Companion.apply
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
import com.facebook.react.views.text.internal.span.TextInlineImageSpan
import com.facebook.react.views.text.internal.span.TextInlineViewPlaceholderSpan
import com.facebook.yoga.YogaDirection
import com.facebook.yoga.YogaUnit

/**
 * [ReactShadowNode] abstract class for spannable text nodes.
 *
 * This class handles all text attributes associated with `<Text>`-ish node. A concrete node can be
 * an anchor `<Text>` node, an anchor `<TextInput>` node or virtual `<Text>` node inside `<Text>` or
 * `<TextInput>` node. Or even something else.
 *
 * This also node calculates [Spannable] object based on sub nodes of the same type, which can be
 * used in concrete classes to feed native views and compute layout.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release"
)
public abstract class ReactBaseTextShadowNode
@JvmOverloads
public constructor(
    protected var reactTextViewManagerCallback: ReactTextViewManagerCallback? = null
) : LayoutShadowNode() {

  protected var textAttributes: TextAttributes = TextAttributes()
  protected var isColorSet: Boolean = false
  protected var color: Int = 0
  protected var isBackgroundColorSet: Boolean = false
  protected var backgroundColor: Int = 0
  protected var accessibilityRole: AccessibilityRole? = null
  protected var role: ReactAccessibilityDelegate.Role? = null
  protected var numberOfLines: Int = ReactConstants.UNSET
    private set

  protected var textBreakStrategy: Int = Layout.BREAK_STRATEGY_HIGH_QUALITY
  protected var hyphenationFrequency: Int = Layout.HYPHENATION_FREQUENCY_NONE
  protected var justificationMode: Int =
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        0
      } else {
        Layout.JUSTIFICATION_MODE_NONE
      }

  // Return text alignment according to LTR or RTL style
  protected var textAlign: Int = Gravity.NO_GRAVITY
    get() {
      return if (layoutDirection == YogaDirection.RTL) {
        when (field) {
          Gravity.RIGHT -> Gravity.LEFT
          Gravity.LEFT -> Gravity.RIGHT
          else -> field
        }
      } else {
        field
      }
    }
    private set

  /**
   * [fontStyle] can be [Typeface.NORMAL] or [Typeface.ITALIC]. [fontWeight] can be
   * [Typeface.NORMAL] or [Typeface.BOLD].
   */
  protected var fontStyle: Int = ReactConstants.UNSET

  protected var fontWeight: Int = ReactConstants.UNSET

  /**
   * NB: If a font family is used that does not have a style in a certain Android version (ie.
   * monospace bold pre Android 5.0), that style (ie. bold) will not be inherited by nested Text
   * nodes. To retain that style, you have to add it to those nodes explicitly.
   *
   * Example, Android 4.4:
   * <pre>
   * <Text style={{fontFamily="serif" fontWeight="bold" }}>Bold Text</Text>
   * <Text style={{fontFamily="sans-serif"}}>Bold Text</Text>
   * <Text style={{fontFamily="serif"}}>Bold Text</Text>
   *
   * <Text style={{fontFamily="monospace" fontWeight="bold" }}>Not Bold Text</Text>
   * <Text style={{fontFamily="sans-serif"}}>Not Bold Text</Text>
   * <Text style={{fontFamily="serif"}}>Not Bold Text</Text>
   *
   * <Text style={{fontFamily="monospace" fontWeight="bold" }}>Not Bold Text</Text>
   * <Text style={{fontFamily="sans-serif" fontWeight="bold" }}>Bold Text</Text>
   * <Text style={{fontFamily="serif"}}>Bold Text</Text>
   * </pre>
   */
  protected var fontFamily: String? = null
    private set

  /** @see [android.graphics.Paint.setFontFeatureSettings] */
  protected var fontFeatureSettings: String? = null

  protected var includeFontPadding: Boolean = true
    private set

  protected var adjustsFontSizeToFit: Boolean = false
  protected var minimumFontScale: Float = 0f
    private set

  protected var textShadowOffsetDx: Float = 0f
  protected var textShadowOffsetDy: Float = 0f
  protected var textShadowRadius: Float = 0f
    private set

  protected var textShadowColor: Int = DEFAULT_TEXT_SHADOW_COLOR
    private set

  protected var isUnderlineTextDecorationSet: Boolean = false
  protected var isLineThroughTextDecorationSet: Boolean = false
  protected var containsImages: Boolean = false

  // Only nullable if `supportsInlineViews` is `false`.
  protected var inlineViews: Map<Int, ReactShadowNode<*>>? = null

  // `nativeViewHierarchyOptimizer` can be `null` as long as `supportsInlineViews` is `false`.
  @Suppress("DEPRECATION")
  protected fun spannedFromShadowNode(
      textShadowNode: ReactBaseTextShadowNode,
      text: String?,
      supportsInlineViews: Boolean,
      nativeViewHierarchyOptimizer: com.facebook.react.uimanager.NativeViewHierarchyOptimizer?,
  ): Spannable {
    check(!supportsInlineViews || nativeViewHierarchyOptimizer != null) {
      "nativeViewHierarchyOptimizer is required when inline views are supported"
    }
    val sb = SpannableStringBuilder()

    // TODO(5837930): Investigate whether it's worth optimizing this part and do it if so

    // The [SpannableStringBuilder] implementation require setSpan operation to be called
    // up-to-bottom, otherwise all the spannables that are within the region for which one may set
    // a new spannable will be wiped out
    val ops: MutableList<SetSpanOperation> = ArrayList()
    val inlineViews: MutableMap<Int, ReactShadowNode<*>>? =
        if (supportsInlineViews) HashMap() else null

    if (text != null) {
      // Handle text that is provided via a prop (e.g. the `value` and `defaultValue` props on
      // TextInput).
      sb.append(apply(text, textShadowNode.textAttributes.textTransform))
    }

    buildSpannedFromShadowNode(textShadowNode, sb, ops, null, supportsInlineViews, inlineViews, 0)

    textShadowNode.containsImages = false
    textShadowNode.inlineViews = inlineViews
    var heightOfTallestInlineViewOrImage = Float.NaN

    // While setting the Spans on the final text, we also check whether any of them are inline views
    // or images.
    for (priorityIndex in ops.indices) {
      val op = ops[ops.size - priorityIndex - 1]
      val what = op.what

      val isInlineImage = what is TextInlineImageSpan
      if (isInlineImage || what is TextInlineViewPlaceholderSpan) {
        val height: Int
        if (isInlineImage) {
          height = what.height
          textShadowNode.containsImages = true
        } else {
          val placeholder = what as TextInlineViewPlaceholderSpan
          height = placeholder.height

          // Inline views cannot be layout-only because ReactTextView needs to access
          // them on the UI thread to measure and position them.
          val childNode = checkNotNull(inlineViews)[placeholder.reactTag]

          checkNotNull(childNode)
          checkNotNull(nativeViewHierarchyOptimizer)
          nativeViewHierarchyOptimizer.handleForceViewToBeNonLayoutOnly(childNode)

          // The ReactTextView is responsible for laying out the inline views.
          @Suppress("UNCHECKED_CAST")
          (childNode as ReactShadowNode<ReactShadowNodeImpl>).setLayoutParent(textShadowNode)
        }

        if (heightOfTallestInlineViewOrImage.isNaN() || height > heightOfTallestInlineViewOrImage) {
          heightOfTallestInlineViewOrImage = height.toFloat()
        }
      }

      // Actual order of calling `execute` does NOT matter,
      // but the `priorityIndex` DOES matter.
      op.execute(sb, priorityIndex)
    }

    textShadowNode.textAttributes.heightOfTallestInlineViewOrImage =
        heightOfTallestInlineViewOrImage

    reactTextViewManagerCallback?.onPostProcessSpannable(sb)

    return sb
  }

  @ReactProp(name = ViewProps.NUMBER_OF_LINES, defaultInt = ReactConstants.UNSET)
  public fun setNumberOfLines(numberOfLines: Int) {
    this.numberOfLines = if (numberOfLines == 0) ReactConstants.UNSET else numberOfLines
    markUpdated()
  }

  @ReactProp(name = ViewProps.LINE_HEIGHT, defaultFloat = Float.NaN)
  public fun setLineHeight(lineHeight: Float) {
    textAttributes.lineHeight = lineHeight
    markUpdated()
  }

  @ReactProp(name = ViewProps.LETTER_SPACING, defaultFloat = 0f)
  public fun setLetterSpacing(letterSpacing: Float) {
    textAttributes.letterSpacing = letterSpacing
    markUpdated()
  }

  @ReactProp(name = ViewProps.ALLOW_FONT_SCALING, defaultBoolean = true)
  public fun setAllowFontScaling(allowFontScaling: Boolean) {
    if (allowFontScaling != textAttributes.allowFontScaling) {
      textAttributes.allowFontScaling = allowFontScaling
      markUpdated()
    }
  }

  @ReactProp(name = ViewProps.MAX_FONT_SIZE_MULTIPLIER, defaultFloat = Float.NaN)
  public fun setMaxFontSizeMultiplier(maxFontSizeMultiplier: Float) {
    if (maxFontSizeMultiplier != textAttributes.maxFontSizeMultiplier) {
      textAttributes.maxFontSizeMultiplier = maxFontSizeMultiplier
      markUpdated()
    }
  }

  @ReactProp(name = ViewProps.TEXT_ALIGN)
  public fun setTextAlign(textAlign: String?) {
    if ("justify" == textAlign) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        justificationMode = Layout.JUSTIFICATION_MODE_INTER_WORD
      }
      this.textAlign = Gravity.LEFT
    } else {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        justificationMode = Layout.JUSTIFICATION_MODE_NONE
      }

      this.textAlign =
          when (textAlign) {
            null,
            "auto" -> Gravity.NO_GRAVITY
            "left" -> Gravity.LEFT
            "right" -> Gravity.RIGHT
            "center" -> Gravity.CENTER_HORIZONTAL
            else -> {
              FLog.w(ReactConstants.TAG, "Invalid textAlign: $textAlign")
              Gravity.NO_GRAVITY
            }
          }
    }
    markUpdated()
  }

  @ReactProp(name = ViewProps.FONT_SIZE, defaultFloat = Float.NaN)
  public fun setFontSize(fontSize: Float) {
    textAttributes.fontSize = fontSize
    markUpdated()
  }

  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  public fun setColor(color: Int?) {
    color?.let { newColor ->
      isColorSet = true
      this.color = newColor
    }
    markUpdated()
  }

  @ReactProp(name = ViewProps.BACKGROUND_COLOR, customType = "Color")
  public fun setBackgroundColor(color: Int?) {
    // Background color needs to be handled here for virtual nodes so it can be incorporated into
    // the span. However, it doesn't need to be applied to non-virtual nodes because non-virtual
    // nodes get mapped to native views and native views get their background colors get set via
    // [BaseViewManager].
    if (isVirtual) {
      color?.let { newColor ->
        isBackgroundColorSet = true
        backgroundColor = newColor
      }
      markUpdated()
    }
  }

  @ReactProp(name = ViewProps.ACCESSIBILITY_ROLE)
  public fun setAccessibilityRole(accessibilityRole: String?) {
    if (isVirtual) {
      this.accessibilityRole = AccessibilityRole.fromValue(accessibilityRole)
      markUpdated()
    }
  }

  @ReactProp(name = ViewProps.ROLE)
  public fun setRole(role: String?) {
    if (isVirtual) {
      this.role = ReactAccessibilityDelegate.Role.fromValue(role)
      markUpdated()
    }
  }

  @ReactProp(name = ViewProps.FONT_FAMILY)
  public fun setFontFamily(fontFamily: String?) {
    this.fontFamily = fontFamily
    markUpdated()
  }

  @ReactProp(name = ViewProps.FONT_WEIGHT)
  public fun setFontWeight(fontWeightString: String?) {
    val parsedFontWeight = parseFontWeight(fontWeightString)
    if (parsedFontWeight != fontWeight) {
      fontWeight = parsedFontWeight
      markUpdated()
    }
  }

  @ReactProp(name = ViewProps.FONT_VARIANT)
  public fun setFontVariant(fontVariantArray: ReadableArray?) {
    val fontFeatureSettings = parseFontVariant(fontVariantArray)

    if (fontFeatureSettings != this.fontFeatureSettings) {
      this.fontFeatureSettings = fontFeatureSettings
      markUpdated()
    }
  }

  @ReactProp(name = ViewProps.FONT_STYLE)
  public fun setFontStyle(fontStyleString: String?) {
    val parsedFontStyle = parseFontStyle(fontStyleString)
    if (parsedFontStyle != fontStyle) {
      fontStyle = parsedFontStyle
      markUpdated()
    }
  }

  @ReactProp(name = ViewProps.INCLUDE_FONT_PADDING, defaultBoolean = true)
  public fun setIncludeFontPadding(includepad: Boolean) {
    includeFontPadding = includepad
  }

  @ReactProp(name = ViewProps.TEXT_DECORATION_LINE)
  public fun setTextDecorationLine(textDecorationLineString: String?) {
    isUnderlineTextDecorationSet = false
    isLineThroughTextDecorationSet = false
    if (textDecorationLineString != null) {
      for (textDecorationLineSubString in
          textDecorationLineString.split(" ").dropLastWhile { it.isEmpty() }.toTypedArray()) {
        if ("underline" == textDecorationLineSubString) {
          isUnderlineTextDecorationSet = true
        } else if ("line-through" == textDecorationLineSubString) {
          isLineThroughTextDecorationSet = true
        }
      }
    }
    markUpdated()
  }

  @ReactProp(name = ViewProps.TEXT_BREAK_STRATEGY)
  public open fun setTextBreakStrategy(textBreakStrategy: String?) {
    this.textBreakStrategy =
        when (textBreakStrategy) {
          null,
          "highQuality" -> Layout.BREAK_STRATEGY_HIGH_QUALITY
          "simple" -> Layout.BREAK_STRATEGY_SIMPLE
          "balanced" -> Layout.BREAK_STRATEGY_BALANCED
          else -> {
            FLog.w(ReactConstants.TAG, "Invalid textBreakStrategy: $textBreakStrategy")
            Layout.BREAK_STRATEGY_HIGH_QUALITY
          }
        }
    markUpdated()
  }

  @ReactProp(name = PROP_SHADOW_OFFSET)
  public fun setTextShadowOffset(offsetMap: ReadableMap?) {
    textShadowOffsetDx = 0f
    textShadowOffsetDy = 0f

    offsetMap?.let { map ->
      if (map.hasKey(PROP_SHADOW_OFFSET_WIDTH) && !map.isNull(PROP_SHADOW_OFFSET_WIDTH)) {
        textShadowOffsetDx = toPixelFromDIP(map.getDouble(PROP_SHADOW_OFFSET_WIDTH))
      }
      if (map.hasKey(PROP_SHADOW_OFFSET_HEIGHT) && !map.isNull(PROP_SHADOW_OFFSET_HEIGHT)) {
        textShadowOffsetDy = toPixelFromDIP(map.getDouble(PROP_SHADOW_OFFSET_HEIGHT))
      }
    }

    markUpdated()
  }

  @ReactProp(name = PROP_SHADOW_RADIUS, defaultInt = 1)
  public fun setTextShadowRadius(textShadowRadius: Float) {
    if (textShadowRadius != this.textShadowRadius) {
      this.textShadowRadius = textShadowRadius
      markUpdated()
    }
  }

  @ReactProp(name = PROP_SHADOW_COLOR, defaultInt = DEFAULT_TEXT_SHADOW_COLOR, customType = "Color")
  public fun setTextShadowColor(textShadowColor: Int) {
    if (textShadowColor != this.textShadowColor) {
      this.textShadowColor = textShadowColor
      markUpdated()
    }
  }

  @ReactProp(name = PROP_TEXT_TRANSFORM)
  public fun setTextTransform(textTransform: String?) {
    val textTransformEnum =
        when (textTransform) {
          null -> TextTransform.UNSET
          "none" -> TextTransform.NONE
          "uppercase" -> TextTransform.UPPERCASE
          "lowercase" -> TextTransform.LOWERCASE
          "capitalize" -> TextTransform.CAPITALIZE
          else -> {
            FLog.w(ReactConstants.TAG, "Invalid textTransform: $textTransform")
            TextTransform.UNSET
          }
        }
    textAttributes.textTransform = textTransformEnum
    markUpdated()
  }

  @ReactProp(name = ViewProps.ADJUSTS_FONT_SIZE_TO_FIT)
  public fun setAdjustFontSizeToFit(adjustsFontSizeToFit: Boolean) {
    if (adjustsFontSizeToFit != this.adjustsFontSizeToFit) {
      this.adjustsFontSizeToFit = adjustsFontSizeToFit
      markUpdated()
    }
  }

  @ReactProp(name = ViewProps.MINIMUM_FONT_SCALE)
  public fun setMinimumFontScale(minimumFontScale: Float) {
    if (minimumFontScale != this.minimumFontScale) {
      this.minimumFontScale = minimumFontScale
      markUpdated()
    }
  }

  public companion object {
    // Use a direction weak character so the placeholder doesn't change the direction of the
    // previous character. https://en.wikipedia.org/wiki/Bi-directional_text#weak_characters
    private const val INLINE_VIEW_PLACEHOLDER = "0"

    public const val PROP_SHADOW_OFFSET: String = "textShadowOffset"
    public const val PROP_SHADOW_OFFSET_WIDTH: String = "width"
    public const val PROP_SHADOW_OFFSET_HEIGHT: String = "height"
    public const val PROP_SHADOW_RADIUS: String = "textShadowRadius"
    public const val PROP_SHADOW_COLOR: String = "textShadowColor"

    public const val PROP_TEXT_TRANSFORM: String = "textTransform"

    public const val DEFAULT_TEXT_SHADOW_COLOR: Int = 0x55000000

    private fun buildSpannedFromShadowNode(
        textShadowNode: ReactBaseTextShadowNode,
        sb: SpannableStringBuilder,
        ops: MutableList<SetSpanOperation>,
        parentTextAttributes: TextAttributes?,
        supportsInlineViews: Boolean,
        inlineViews: MutableMap<Int, ReactShadowNode<*>>?,
        start: Int,
    ) {
      val textAttributes =
          parentTextAttributes?.applyChild(textShadowNode.textAttributes)
              ?: textShadowNode.textAttributes

      var i = 0
      val length = textShadowNode.childCount
      while (i < length) {
        val child: ReactShadowNode<*> = textShadowNode.getChildAt(i)

        @Suppress("DEPRECATION")
        if (child is ReactBaseTextShadowNode) {
          buildSpannedFromShadowNode(
              child,
              sb,
              ops,
              textAttributes,
              supportsInlineViews,
              inlineViews,
              sb.length,
          )
        } else if (child is com.facebook.react.views.text.internal.ReactTextInlineImageShadowNode) {
          // We make the image take up 1 character in the span and put a corresponding character
          // into the text so that the image doesn't run over any following text.
          sb.append(INLINE_VIEW_PLACEHOLDER)
          ops.add(
              SetSpanOperation(
                  sb.length - INLINE_VIEW_PLACEHOLDER.length,
                  sb.length,
                  child.buildInlineImageSpan(),
              )
          )
        } else if (supportsInlineViews) {
          val reactTag = child.reactTag
          val widthValue = child.styleWidth
          val heightValue = child.styleHeight

          val width: Float
          val height: Float
          if (widthValue.unit != YogaUnit.POINT || heightValue.unit != YogaUnit.POINT) {
            // If the measurement of the child isn't calculated, we calculate the layout for the
            // view using Yoga
            child.calculateLayout()
            width = child.layoutWidth
            height = child.layoutHeight
          } else {
            width = widthValue.value
            height = heightValue.value
          }

          // We make the inline view take up 1 character in the span and put a corresponding
          // character
          // into
          // the text so that the inline view doesn't run over any following text.
          sb.append(INLINE_VIEW_PLACEHOLDER)
          ops.add(
              SetSpanOperation(
                  sb.length - INLINE_VIEW_PLACEHOLDER.length,
                  sb.length,
                  TextInlineViewPlaceholderSpan(reactTag, width.toInt(), height.toInt()),
              )
          )

          // supportsInlineViews is true, so we can assume that inlineViews is not null
          checkNotNull(inlineViews)[reactTag] = child
        } else {
          throw IllegalViewOperationException(
              "Unexpected view type nested under a <Text> or <TextInput> node: ${child.javaClass}"
          )
        }
        child.markUpdateSeen()
        i++
      }
      val end = sb.length
      if (end >= start) {
        if (textShadowNode.isColorSet) {
          ops.add(SetSpanOperation(start, end, ReactForegroundColorSpan(textShadowNode.color)))
        }
        if (textShadowNode.isBackgroundColorSet) {
          ops.add(
              SetSpanOperation(start, end, ReactBackgroundColorSpan(textShadowNode.backgroundColor))
          )
        }
        val roleIsLink =
            if (textShadowNode.role != null)
                textShadowNode.role == ReactAccessibilityDelegate.Role.LINK
            else textShadowNode.accessibilityRole == AccessibilityRole.LINK
        if (roleIsLink) {
          ops.add(SetSpanOperation(start, end, ReactClickableSpan(textShadowNode.reactTag)))
        }
        val effectiveLetterSpacing = textAttributes.effectiveLetterSpacing
        if (
            !java.lang.Float.isNaN(effectiveLetterSpacing) &&
                (parentTextAttributes == null ||
                    parentTextAttributes.effectiveLetterSpacing != effectiveLetterSpacing)
        ) {
          ops.add(SetSpanOperation(start, end, CustomLetterSpacingSpan(effectiveLetterSpacing)))
        }
        val effectiveFontSize = textAttributes.effectiveFontSize
        if ( // `getEffectiveFontSize` always returns a value so don't need to check for anything
            // like `Float.NaN`.
            parentTextAttributes == null ||
                parentTextAttributes.effectiveFontSize != effectiveFontSize
        ) {
          ops.add(SetSpanOperation(start, end, ReactAbsoluteSizeSpan(effectiveFontSize)))
        }
        if (
            textShadowNode.fontStyle != ReactConstants.UNSET ||
                textShadowNode.fontWeight != ReactConstants.UNSET ||
                textShadowNode.fontFamily != null
        ) {
          ops.add(
              SetSpanOperation(
                  start,
                  end,
                  CustomStyleSpan(
                      textShadowNode.fontStyle,
                      textShadowNode.fontWeight,
                      textShadowNode.fontFeatureSettings,
                      textShadowNode.fontFamily,
                      textShadowNode.themedContext.assets,
                  ),
              )
          )
        }
        if (textShadowNode.isUnderlineTextDecorationSet) {
          ops.add(SetSpanOperation(start, end, ReactUnderlineSpan()))
        }
        if (textShadowNode.isLineThroughTextDecorationSet) {
          ops.add(SetSpanOperation(start, end, ReactStrikethroughSpan()))
        }
        if (
            (textShadowNode.textShadowOffsetDx != 0f ||
                textShadowNode.textShadowOffsetDy != 0f ||
                textShadowNode.textShadowRadius != 0f) &&
                Color.alpha(textShadowNode.textShadowColor) != 0
        ) {
          ops.add(
              SetSpanOperation(
                  start,
                  end,
                  ShadowStyleSpan(
                      textShadowNode.textShadowOffsetDx,
                      textShadowNode.textShadowOffsetDy,
                      textShadowNode.textShadowRadius,
                      textShadowNode.textShadowColor,
                  ),
              )
          )
        }
        val effectiveLineHeight = textAttributes.effectiveLineHeight
        if (
            !java.lang.Float.isNaN(effectiveLineHeight) &&
                (parentTextAttributes == null ||
                    parentTextAttributes.effectiveLineHeight != effectiveLineHeight)
        ) {
          ops.add(SetSpanOperation(start, end, CustomLineHeightSpan(effectiveLineHeight)))
        }
        ops.add(SetSpanOperation(start, end, ReactTagSpan(textShadowNode.reactTag)))
      }
    }
  }
}
