/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.annotation.TargetApi;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Build;
import android.text.Layout;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.TextUtils;
import android.view.Gravity;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.NativeViewHierarchyOptimizer;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.yoga.YogaDirection;
import com.facebook.yoga.YogaUnit;
import com.facebook.yoga.YogaValue;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * {@link ReactShadowNode} abstract class for spannable text nodes.
 *
 * <p>This class handles all text attributes associated with {@code <Text>}-ish node. A concrete
 * node can be an anchor {@code <Text>} node, an anchor {@code <TextInput>} node or virtual {@code
 * <Text>} node inside {@code <Text>} or {@code <TextInput>} node. Or even something else.
 *
 * <p>This also node calculates {@link Spannable} object based on subnodes of the same type, which
 * can be used in concrete classes to feed native views and compute layout.
 */
@TargetApi(Build.VERSION_CODES.M)
public abstract class ReactBaseTextShadowNode extends LayoutShadowNode {

  // Use a direction weak character so the placeholder doesn't change the direction of the previous
  // character.
  // https://en.wikipedia.org/wiki/Bi-directional_text#weak_characters
  private static final String INLINE_VIEW_PLACEHOLDER = "0";
  public static final int UNSET = -1;

  public static final String PROP_SHADOW_OFFSET = "textShadowOffset";
  public static final String PROP_SHADOW_OFFSET_WIDTH = "width";
  public static final String PROP_SHADOW_OFFSET_HEIGHT = "height";
  public static final String PROP_SHADOW_RADIUS = "textShadowRadius";
  public static final String PROP_SHADOW_COLOR = "textShadowColor";

  public static final String PROP_TEXT_TRANSFORM = "textTransform";

  public static final int DEFAULT_TEXT_SHADOW_COLOR = 0x55000000;

  protected @Nullable ReactTextViewManagerCallback mReactTextViewManagerCallback;

  private static class SetSpanOperation {
    protected int start, end;
    protected ReactSpan what;

    SetSpanOperation(int start, int end, ReactSpan what) {
      this.start = start;
      this.end = end;
      this.what = what;
    }

    public void execute(SpannableStringBuilder sb, int priority) {
      // All spans will automatically extend to the right of the text, but not the left - except
      // for spans that start at the beginning of the text.
      int spanFlags = Spannable.SPAN_EXCLUSIVE_INCLUSIVE;
      if (start == 0) {
        spanFlags = Spannable.SPAN_INCLUSIVE_INCLUSIVE;
      }

      spanFlags &= ~Spannable.SPAN_PRIORITY;
      spanFlags |= (priority << Spannable.SPAN_PRIORITY_SHIFT) & Spannable.SPAN_PRIORITY;

      sb.setSpan(what, start, end, spanFlags);
    }
  }

  private static void buildSpannedFromShadowNode(
      ReactBaseTextShadowNode textShadowNode,
      SpannableStringBuilder sb,
      List<SetSpanOperation> ops,
      TextAttributes parentTextAttributes,
      boolean supportsInlineViews,
      Map<Integer, ReactShadowNode> inlineViews,
      int start) {

    TextAttributes textAttributes;
    if (parentTextAttributes != null) {
      textAttributes = parentTextAttributes.applyChild(textShadowNode.mTextAttributes);
    } else {
      textAttributes = textShadowNode.mTextAttributes;
    }

    for (int i = 0, length = textShadowNode.getChildCount(); i < length; i++) {
      ReactShadowNode child = textShadowNode.getChildAt(i);

      if (child instanceof ReactRawTextShadowNode) {
        sb.append(
            TextTransform.apply(
                ((ReactRawTextShadowNode) child).getText(), textAttributes.getTextTransform()));
      } else if (child instanceof ReactBaseTextShadowNode) {
        buildSpannedFromShadowNode(
            (ReactBaseTextShadowNode) child,
            sb,
            ops,
            textAttributes,
            supportsInlineViews,
            inlineViews,
            sb.length());
      } else if (child instanceof ReactTextInlineImageShadowNode) {
        // We make the image take up 1 character in the span and put a corresponding character into
        // the text so that the image doesn't run over any following text.
        sb.append(INLINE_VIEW_PLACEHOLDER);
        ops.add(
            new SetSpanOperation(
                sb.length() - INLINE_VIEW_PLACEHOLDER.length(),
                sb.length(),
                ((ReactTextInlineImageShadowNode) child).buildInlineImageSpan()));
      } else if (supportsInlineViews) {
        int reactTag = child.getReactTag();
        YogaValue widthValue = child.getStyleWidth();
        YogaValue heightValue = child.getStyleHeight();

        float width;
        float height;
        if (widthValue.unit != YogaUnit.POINT || heightValue.unit != YogaUnit.POINT) {
          // If the measurement of the child isn't calculated, we calculate the layout for the
          // view using Yoga
          child.calculateLayout();
          width = child.getLayoutWidth();
          height = child.getLayoutHeight();
        } else {
          width = widthValue.value;
          height = heightValue.value;
        }

        // We make the inline view take up 1 character in the span and put a corresponding character
        // into
        // the text so that the inline view doesn't run over any following text.
        sb.append(INLINE_VIEW_PLACEHOLDER);
        ops.add(
            new SetSpanOperation(
                sb.length() - INLINE_VIEW_PLACEHOLDER.length(),
                sb.length(),
                new TextInlineViewPlaceholderSpan(reactTag, (int) width, (int) height)));
        inlineViews.put(reactTag, child);
      } else {
        throw new IllegalViewOperationException(
            "Unexpected view type nested under a <Text> or <TextInput> node: " + child.getClass());
      }
      child.markUpdateSeen();
    }
    int end = sb.length();
    if (end >= start) {
      if (textShadowNode.mIsColorSet) {
        ops.add(
            new SetSpanOperation(start, end, new ReactForegroundColorSpan(textShadowNode.mColor)));
      }
      if (textShadowNode.mIsBackgroundColorSet) {
        ops.add(
            new SetSpanOperation(
                start, end, new ReactBackgroundColorSpan(textShadowNode.mBackgroundColor)));
      }
      if (textShadowNode.mIsAccessibilityLink) {
        ops.add(
            new SetSpanOperation(start, end, new ReactClickableSpan(textShadowNode.getReactTag())));
      }
      float effectiveLetterSpacing = textAttributes.getEffectiveLetterSpacing();
      if (!Float.isNaN(effectiveLetterSpacing)
          && (parentTextAttributes == null
              || parentTextAttributes.getEffectiveLetterSpacing() != effectiveLetterSpacing)) {
        ops.add(
            new SetSpanOperation(start, end, new CustomLetterSpacingSpan(effectiveLetterSpacing)));
      }
      int effectiveFontSize = textAttributes.getEffectiveFontSize();
      if ( // `getEffectiveFontSize` always returns a value so don't need to check for anything like
      // `Float.NaN`.
      parentTextAttributes == null
          || parentTextAttributes.getEffectiveFontSize() != effectiveFontSize) {
        ops.add(new SetSpanOperation(start, end, new ReactAbsoluteSizeSpan(effectiveFontSize)));
      }
      if (textShadowNode.mFontStyle != UNSET
          || textShadowNode.mFontWeight != UNSET
          || textShadowNode.mFontFamily != null) {
        ops.add(
            new SetSpanOperation(
                start,
                end,
                new CustomStyleSpan(
                    textShadowNode.mFontStyle,
                    textShadowNode.mFontWeight,
                    textShadowNode.mFontFeatureSettings,
                    textShadowNode.mFontFamily,
                    textShadowNode.getThemedContext().getAssets())));
      }
      if (textShadowNode.mIsUnderlineTextDecorationSet) {
        ops.add(new SetSpanOperation(start, end, new ReactUnderlineSpan()));
      }
      if (textShadowNode.mIsLineThroughTextDecorationSet) {
        ops.add(new SetSpanOperation(start, end, new ReactStrikethroughSpan()));
      }
      if ((textShadowNode.mTextShadowOffsetDx != 0
              || textShadowNode.mTextShadowOffsetDy != 0
              || textShadowNode.mTextShadowRadius != 0)
          && Color.alpha(textShadowNode.mTextShadowColor) != 0) {
        ops.add(
            new SetSpanOperation(
                start,
                end,
                new ShadowStyleSpan(
                    textShadowNode.mTextShadowOffsetDx,
                    textShadowNode.mTextShadowOffsetDy,
                    textShadowNode.mTextShadowRadius,
                    textShadowNode.mTextShadowColor)));
      }
      float effectiveLineHeight = textAttributes.getEffectiveLineHeight();
      if (!Float.isNaN(effectiveLineHeight)
          && (parentTextAttributes == null
              || parentTextAttributes.getEffectiveLineHeight() != effectiveLineHeight)) {
        ops.add(new SetSpanOperation(start, end, new CustomLineHeightSpan(effectiveLineHeight)));
      }
      ops.add(new SetSpanOperation(start, end, new ReactTagSpan(textShadowNode.getReactTag())));
    }
  }

  // `nativeViewHierarchyOptimizer` can be `null` as long as `supportsInlineViews` is `false`.
  protected Spannable spannedFromShadowNode(
      ReactBaseTextShadowNode textShadowNode,
      String text,
      boolean supportsInlineViews,
      NativeViewHierarchyOptimizer nativeViewHierarchyOptimizer) {
    Assertions.assertCondition(
        !supportsInlineViews || nativeViewHierarchyOptimizer != null,
        "nativeViewHierarchyOptimizer is required when inline views are supported");
    SpannableStringBuilder sb = new SpannableStringBuilder();

    // TODO(5837930): Investigate whether it's worth optimizing this part and do it if so

    // The {@link SpannableStringBuilder} implementation require setSpan operation to be called
    // up-to-bottom, otherwise all the spannables that are within the region for which one may set
    // a new spannable will be wiped out
    List<SetSpanOperation> ops = new ArrayList<>();
    Map<Integer, ReactShadowNode> inlineViews =
        supportsInlineViews ? new HashMap<Integer, ReactShadowNode>() : null;

    if (text != null) {
      // Handle text that is provided via a prop (e.g. the `value` and `defaultValue` props on
      // TextInput).
      sb.append(TextTransform.apply(text, textShadowNode.mTextAttributes.getTextTransform()));
    }

    buildSpannedFromShadowNode(textShadowNode, sb, ops, null, supportsInlineViews, inlineViews, 0);

    textShadowNode.mContainsImages = false;
    textShadowNode.mInlineViews = inlineViews;
    float heightOfTallestInlineViewOrImage = Float.NaN;

    // While setting the Spans on the final text, we also check whether any of them are inline views
    // or images.
    int priority = 0;
    for (SetSpanOperation op : ops) {
      boolean isInlineImage = op.what instanceof TextInlineImageSpan;
      if (isInlineImage || op.what instanceof TextInlineViewPlaceholderSpan) {
        int height;
        if (isInlineImage) {
          height = ((TextInlineImageSpan) op.what).getHeight();
          textShadowNode.mContainsImages = true;
        } else {
          TextInlineViewPlaceholderSpan placeholder = (TextInlineViewPlaceholderSpan) op.what;
          height = placeholder.getHeight();

          // Inline views cannot be layout-only because the ReactTextView needs to be able to grab
          // ahold of them on the UI thread to size and position them.
          ReactShadowNode childNode = inlineViews.get(placeholder.getReactTag());
          nativeViewHierarchyOptimizer.handleForceViewToBeNonLayoutOnly(childNode);

          // The ReactTextView is responsible for laying out the inline views.
          childNode.setLayoutParent(textShadowNode);
        }

        if (Float.isNaN(heightOfTallestInlineViewOrImage)
            || height > heightOfTallestInlineViewOrImage) {
          heightOfTallestInlineViewOrImage = height;
        }
      }

      // Actual order of calling {@code execute} does NOT matter,
      // but the {@code priority} DOES matter.
      op.execute(sb, priority);
      priority++;
    }

    textShadowNode.mTextAttributes.setHeightOfTallestInlineViewOrImage(
        heightOfTallestInlineViewOrImage);

    if (mReactTextViewManagerCallback != null) {
      mReactTextViewManagerCallback.onPostProcessSpannable(sb);
    }

    return sb;
  }

  protected TextAttributes mTextAttributes;

  protected boolean mIsColorSet = false;
  protected int mColor;
  protected boolean mIsBackgroundColorSet = false;
  protected int mBackgroundColor;
  protected boolean mIsAccessibilityLink = false;

  protected int mNumberOfLines = UNSET;
  protected int mMaxNumberOfLines = UNSET;
  protected int mTextAlign = Gravity.NO_GRAVITY;
  protected int mTextBreakStrategy =
      (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) ? 0 : Layout.BREAK_STRATEGY_HIGH_QUALITY;
  protected int mHyphenationFrequency =
      (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) ? 0 : Layout.HYPHENATION_FREQUENCY_NONE;
  protected int mJustificationMode =
      (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) ? 0 : Layout.JUSTIFICATION_MODE_NONE;

  protected float mTextShadowOffsetDx = 0;
  protected float mTextShadowOffsetDy = 0;
  protected float mTextShadowRadius = 0;
  protected int mTextShadowColor = DEFAULT_TEXT_SHADOW_COLOR;

  protected boolean mIsUnderlineTextDecorationSet = false;
  protected boolean mIsLineThroughTextDecorationSet = false;
  protected boolean mIncludeFontPadding = true;
  protected boolean mAdjustsFontSizeToFit = false;
  protected float mMinimumFontScale = 0;

  /**
   * mFontStyle can be {@link Typeface#NORMAL} or {@link Typeface#ITALIC}. mFontWeight can be {@link
   * Typeface#NORMAL} or {@link Typeface#BOLD}.
   */
  protected int mFontStyle = UNSET;

  protected int mFontWeight = UNSET;
  /**
   * NB: If a font family is used that does not have a style in a certain Android version (ie.
   * monospace bold pre Android 5.0), that style (ie. bold) will not be inherited by nested Text
   * nodes. To retain that style, you have to add it to those nodes explicitly.
   *
   * <p>Example, Android 4.4:
   *
   * <pre>
   * <Text style={{fontFamily="serif" fontWeight="bold"}}>Bold Text</Text>
   *   <Text style={{fontFamily="sans-serif"}}>Bold Text</Text>
   *     <Text style={{fontFamily="serif}}>Bold Text</Text>
   *
   * <Text style={{fontFamily="monospace" fontWeight="bold"}}>Not Bold Text</Text>
   *   <Text style={{fontFamily="sans-serif"}}>Not Bold Text</Text>
   *     <Text style={{fontFamily="serif}}>Not Bold Text</Text>
   *
   * <Text style={{fontFamily="monospace" fontWeight="bold"}}>Not Bold Text</Text>
   *   <Text style={{fontFamily="sans-serif" fontWeight="bold"}}>Bold Text</Text>
   *     <Text style={{fontFamily="serif}}>Bold Text</Text>
   * </pre>
   */
  protected @Nullable String mFontFamily = null;

  /** @see android.graphics.Paint#setFontFeatureSettings */
  protected @Nullable String mFontFeatureSettings = null;

  protected boolean mContainsImages = false;
  protected Map<Integer, ReactShadowNode> mInlineViews;

  public ReactBaseTextShadowNode() {
    this(null);
  }

  public ReactBaseTextShadowNode(
      @Nullable ReactTextViewManagerCallback reactTextViewManagerCallback) {
    mTextAttributes = new TextAttributes();
    mReactTextViewManagerCallback = reactTextViewManagerCallback;
  }

  // Return text alignment according to LTR or RTL style
  private int getTextAlign() {
    int textAlign = mTextAlign;
    if (getLayoutDirection() == YogaDirection.RTL) {
      if (textAlign == Gravity.RIGHT) {
        textAlign = Gravity.LEFT;
      } else if (textAlign == Gravity.LEFT) {
        textAlign = Gravity.RIGHT;
      }
    }
    return textAlign;
  }

  @ReactProp(name = ViewProps.NUMBER_OF_LINES, defaultInt = UNSET)
  public void setNumberOfLines(int numberOfLines) {
    mNumberOfLines = numberOfLines == 0 ? UNSET : numberOfLines;
    markUpdated();
  }

  @ReactProp(name = ViewProps.MAXIMUM_NUMBER_OF_LINES, defaultInt = UNSET)
  public void setMaxNumberOfLines(int numberOfLines) {
    mMaxNumberOfLines = numberOfLines == 0 ? UNSET : numberOfLines;
    markUpdated();
  }

  @ReactProp(name = ViewProps.LINE_HEIGHT, defaultFloat = Float.NaN)
  public void setLineHeight(float lineHeight) {
    mTextAttributes.setLineHeight(lineHeight);
    markUpdated();
  }

  @ReactProp(name = ViewProps.LETTER_SPACING, defaultFloat = Float.NaN)
  public void setLetterSpacing(float letterSpacing) {
    mTextAttributes.setLetterSpacing(letterSpacing);
    markUpdated();
  }

  @ReactProp(name = ViewProps.ALLOW_FONT_SCALING, defaultBoolean = true)
  public void setAllowFontScaling(boolean allowFontScaling) {
    if (allowFontScaling != mTextAttributes.getAllowFontScaling()) {
      mTextAttributes.setAllowFontScaling(allowFontScaling);
      markUpdated();
    }
  }

  @ReactProp(name = ViewProps.MAX_FONT_SIZE_MULTIPLIER, defaultFloat = Float.NaN)
  public void setMaxFontSizeMultiplier(float maxFontSizeMultiplier) {
    if (maxFontSizeMultiplier != mTextAttributes.getMaxFontSizeMultiplier()) {
      mTextAttributes.setMaxFontSizeMultiplier(maxFontSizeMultiplier);
      markUpdated();
    }
  }

  @ReactProp(name = ViewProps.TEXT_ALIGN)
  public void setTextAlign(@Nullable String textAlign) {
    if ("justify".equals(textAlign)) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        mJustificationMode = Layout.JUSTIFICATION_MODE_INTER_WORD;
      }
      mTextAlign = Gravity.LEFT;
    } else {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        mJustificationMode = Layout.JUSTIFICATION_MODE_NONE;
      }

      if (textAlign == null || "auto".equals(textAlign)) {
        mTextAlign = Gravity.NO_GRAVITY;
      } else if ("left".equals(textAlign)) {
        mTextAlign = Gravity.LEFT;
      } else if ("right".equals(textAlign)) {
        mTextAlign = Gravity.RIGHT;
      } else if ("center".equals(textAlign)) {
        mTextAlign = Gravity.CENTER_HORIZONTAL;
      } else {
        FLog.w(ReactConstants.TAG, "Invalid textAlign: " + textAlign);
        mTextAlign = Gravity.NO_GRAVITY;
      }
    }
    markUpdated();
  }

  @ReactProp(name = ViewProps.FONT_SIZE, defaultFloat = Float.NaN)
  public void setFontSize(float fontSize) {
    mTextAttributes.setFontSize(fontSize);
    markUpdated();
  }

  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  public void setColor(@Nullable Integer color) {
    mIsColorSet = (color != null);
    if (mIsColorSet) {
      mColor = color;
    }
    markUpdated();
  }

  @ReactProp(name = ViewProps.BACKGROUND_COLOR, customType = "Color")
  public void setBackgroundColor(@Nullable Integer color) {
    // Background color needs to be handled here for virtual nodes so it can be incorporated into
    // the span. However, it doesn't need to be applied to non-virtual nodes because non-virtual
    // nodes get mapped to native views and native views get their background colors get set via
    // {@link BaseViewManager}.
    if (isVirtual()) {
      mIsBackgroundColorSet = (color != null);
      if (mIsBackgroundColorSet) {
        mBackgroundColor = color;
      }
      markUpdated();
    }
  }

  @ReactProp(name = ViewProps.ACCESSIBILITY_ROLE)
  public void setIsAccessibilityLink(@Nullable String accessibilityRole) {
    if (isVirtual()) {
      mIsAccessibilityLink = Objects.equals(accessibilityRole, "link");
      markUpdated();
    }
  }

  @ReactProp(name = ViewProps.FONT_FAMILY)
  public void setFontFamily(@Nullable String fontFamily) {
    mFontFamily = fontFamily;
    markUpdated();
  }

  @ReactProp(name = ViewProps.FONT_WEIGHT)
  public void setFontWeight(@Nullable String fontWeightString) {
    int fontWeight = ReactTypefaceUtils.parseFontWeight(fontWeightString);
    if (fontWeight != mFontWeight) {
      mFontWeight = fontWeight;
      markUpdated();
    }
  }

  @ReactProp(name = ViewProps.FONT_VARIANT)
  public void setFontVariant(@Nullable ReadableArray fontVariantArray) {
    String fontFeatureSettings = ReactTypefaceUtils.parseFontVariant(fontVariantArray);

    if (!TextUtils.equals(fontFeatureSettings, mFontFeatureSettings)) {
      mFontFeatureSettings = fontFeatureSettings;
      markUpdated();
    }
  }

  @ReactProp(name = ViewProps.FONT_STYLE)
  public void setFontStyle(@Nullable String fontStyleString) {
    int fontStyle = ReactTypefaceUtils.parseFontStyle(fontStyleString);
    if (fontStyle != mFontStyle) {
      mFontStyle = fontStyle;
      markUpdated();
    }
  }

  @ReactProp(name = ViewProps.INCLUDE_FONT_PADDING, defaultBoolean = true)
  public void setIncludeFontPadding(boolean includepad) {
    mIncludeFontPadding = includepad;
  }

  @ReactProp(name = ViewProps.TEXT_DECORATION_LINE)
  public void setTextDecorationLine(@Nullable String textDecorationLineString) {
    mIsUnderlineTextDecorationSet = false;
    mIsLineThroughTextDecorationSet = false;
    if (textDecorationLineString != null) {
      for (String textDecorationLineSubString : textDecorationLineString.split(" ")) {
        if ("underline".equals(textDecorationLineSubString)) {
          mIsUnderlineTextDecorationSet = true;
        } else if ("line-through".equals(textDecorationLineSubString)) {
          mIsLineThroughTextDecorationSet = true;
        }
      }
    }
    markUpdated();
  }

  @ReactProp(name = ViewProps.TEXT_BREAK_STRATEGY)
  public void setTextBreakStrategy(@Nullable String textBreakStrategy) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return;
    }

    if (textBreakStrategy == null || "highQuality".equals(textBreakStrategy)) {
      mTextBreakStrategy = Layout.BREAK_STRATEGY_HIGH_QUALITY;
    } else if ("simple".equals(textBreakStrategy)) {
      mTextBreakStrategy = Layout.BREAK_STRATEGY_SIMPLE;
    } else if ("balanced".equals(textBreakStrategy)) {
      mTextBreakStrategy = Layout.BREAK_STRATEGY_BALANCED;
    } else {
      FLog.w(ReactConstants.TAG, "Invalid textBreakStrategy: " + textBreakStrategy);
      mTextBreakStrategy = Layout.BREAK_STRATEGY_HIGH_QUALITY;
    }

    markUpdated();
  }

  @ReactProp(name = PROP_SHADOW_OFFSET)
  public void setTextShadowOffset(ReadableMap offsetMap) {
    mTextShadowOffsetDx = 0;
    mTextShadowOffsetDy = 0;

    if (offsetMap != null) {
      if (offsetMap.hasKey(PROP_SHADOW_OFFSET_WIDTH)
          && !offsetMap.isNull(PROP_SHADOW_OFFSET_WIDTH)) {
        mTextShadowOffsetDx =
            PixelUtil.toPixelFromDIP(offsetMap.getDouble(PROP_SHADOW_OFFSET_WIDTH));
      }
      if (offsetMap.hasKey(PROP_SHADOW_OFFSET_HEIGHT)
          && !offsetMap.isNull(PROP_SHADOW_OFFSET_HEIGHT)) {
        mTextShadowOffsetDy =
            PixelUtil.toPixelFromDIP(offsetMap.getDouble(PROP_SHADOW_OFFSET_HEIGHT));
      }
    }

    markUpdated();
  }

  @ReactProp(name = PROP_SHADOW_RADIUS, defaultInt = 1)
  public void setTextShadowRadius(float textShadowRadius) {
    if (textShadowRadius != mTextShadowRadius) {
      mTextShadowRadius = textShadowRadius;
      markUpdated();
    }
  }

  @ReactProp(name = PROP_SHADOW_COLOR, defaultInt = DEFAULT_TEXT_SHADOW_COLOR, customType = "Color")
  public void setTextShadowColor(int textShadowColor) {
    if (textShadowColor != mTextShadowColor) {
      mTextShadowColor = textShadowColor;
      markUpdated();
    }
  }

  @ReactProp(name = PROP_TEXT_TRANSFORM)
  public void setTextTransform(@Nullable String textTransform) {
    if (textTransform == null) {
      mTextAttributes.setTextTransform(TextTransform.UNSET);
    } else if ("none".equals(textTransform)) {
      mTextAttributes.setTextTransform(TextTransform.NONE);
    } else if ("uppercase".equals(textTransform)) {
      mTextAttributes.setTextTransform(TextTransform.UPPERCASE);
    } else if ("lowercase".equals(textTransform)) {
      mTextAttributes.setTextTransform(TextTransform.LOWERCASE);
    } else if ("capitalize".equals(textTransform)) {
      mTextAttributes.setTextTransform(TextTransform.CAPITALIZE);
    } else {
      FLog.w(ReactConstants.TAG, "Invalid textTransform: " + textTransform);
      mTextAttributes.setTextTransform(TextTransform.UNSET);
    }
    markUpdated();
  }

  @ReactProp(name = ViewProps.ADJUSTS_FONT_SIZE_TO_FIT)
  public void setAdjustFontSizeToFit(boolean adjustsFontSizeToFit) {
    if (adjustsFontSizeToFit != mAdjustsFontSizeToFit) {
      mAdjustsFontSizeToFit = adjustsFontSizeToFit;
      markUpdated();
    }
  }

  @ReactProp(name = ViewProps.MINIMUM_FONT_SCALE)
  public void setMinimumFontScale(float minimumFontScale) {
    if (minimumFontScale != mMinimumFontScale) {
      mMinimumFontScale = minimumFontScale;
      markUpdated();
    }
  }
}
