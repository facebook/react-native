/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

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
import com.facebook.react.common.assets.ReactFontManager;
import com.facebook.react.internal.views.text.BasicTextAttributeProvider;
import com.facebook.react.internal.views.text.HierarchicTextAttributeProvider;
import com.facebook.react.internal.views.text.TextLayoutUtils;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.NativeViewHierarchyOptimizer;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole;
import com.facebook.react.uimanager.ReactAccessibilityDelegate.Role;
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
public abstract class ReactBaseTextShadowNode extends LayoutShadowNode implements BasicTextAttributeProvider {

  // Use a direction weak character so the placeholder doesn't change the direction of the previous
  // character.
  // https://en.wikipedia.org/wiki/Bi-directional_text#weak_characters
  private static final String INLINE_VIEW_PLACEHOLDER = "0";
  public static final int UNSET = ReactFontManager.TypefaceStyle.UNSET;

  public static final String PROP_SHADOW_OFFSET = "textShadowOffset";
  public static final String PROP_SHADOW_OFFSET_WIDTH = "width";
  public static final String PROP_SHADOW_OFFSET_HEIGHT = "height";
  public static final String PROP_SHADOW_RADIUS = "textShadowRadius";
  public static final String PROP_SHADOW_COLOR = "textShadowColor";

  public static final String PROP_TEXT_TRANSFORM = "textTransform";

  public static final int DEFAULT_TEXT_SHADOW_COLOR = 0x55000000;

  protected @Nullable ReactTextViewManagerCallback mReactTextViewManagerCallback;

  private static void buildSpannedFromShadowNode(
      ReactBaseTextShadowNode textShadowNode,
      SpannableStringBuilder sb,
      List<SetSpanOperation> ops,
      @Nullable TextAttributes parentTextAttributes,
      boolean supportsInlineViews,
      @Nullable Map<Integer, ReactShadowNode> inlineViews,
      int start) {

    TextAttributes textAttributes;
    if (parentTextAttributes != null) {
      textAttributes = parentTextAttributes.applyChild(textShadowNode.mTextAttributes);
    } else {
      textAttributes = textShadowNode.mTextAttributes;
    }

    final var textAttributeProvider = new HierarchicTextAttributeProvider(textShadowNode, parentTextAttributes, textAttributes);

    for (int i = 0, length = textShadowNode.getChildCount(); i < length; i++) {
      ReactShadowNode child = textShadowNode.getChildAt(i);

      if (child instanceof ReactRawTextShadowNode) {
        TextLayoutUtils.addText(sb, ((ReactRawTextShadowNode) child).getText(), textAttributeProvider);
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
        addInlineImageSpan(ops, sb, (ReactTextInlineImageShadowNode) child);
      } else if (supportsInlineViews) {
        addInlineViewPlaceholderSpan(ops, sb, child);

        inlineViews.put(child.getReactTag(), child);
      } else {
        throw new IllegalViewOperationException(
            "Unexpected view type nested under a <Text> or <TextInput> node: " + child.getClass());
      }
      child.markUpdateSeen();
    }
    int end = sb.length();
    if (end >= start) {
      final int reactTag = textShadowNode.getReactTag();

      TextLayoutUtils.addApplicableTextAttributeSpans(
        ops, textAttributeProvider, reactTag, textShadowNode.getThemedContext(), start, end);
    }
  }

  private static void addInlineImageSpan(List<SetSpanOperation> ops, SpannableStringBuilder sb,
                                         ReactTextInlineImageShadowNode child) {
    // We make the image take up 1 character in the span and put a corresponding character into
    // the text so that the image doesn't run over any following text.
    sb.append(INLINE_VIEW_PLACEHOLDER);
    ops.add(new SetSpanOperation(sb.length() - INLINE_VIEW_PLACEHOLDER.length(), sb.length(),
      child.buildInlineImageSpan()));
  }

  private static void addInlineViewPlaceholderSpan(List<SetSpanOperation> ops, SpannableStringBuilder sb,
                                                   ReactShadowNode child) {
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

    // We make the inline view take up 1 character in the span and put a corresponding character into the text so that
    // the inline view doesn't run over any following text.
    sb.append(INLINE_VIEW_PLACEHOLDER);

    TextLayoutUtils.addInlineViewPlaceholderSpan(ops, sb, child.getReactTag(), width, height);
  }

  // `nativeViewHierarchyOptimizer` can be `null` as long as `supportsInlineViews` is `false`.
  protected Spannable spannedFromShadowNode(
      ReactBaseTextShadowNode textShadowNode,
      @Nullable String text,
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
    Map<Integer, ReactShadowNode> inlineViews = supportsInlineViews ? new HashMap<>() : null;

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
    for (int priorityIndex = 0; priorityIndex < ops.size(); priorityIndex++) {
      final SetSpanOperation op = ops.get(ops.size() - priorityIndex - 1);

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
      // but the {@code priorityIndex} DOES matter.
      op.execute(sb, priorityIndex);
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

  protected @Nullable AccessibilityRole mAccessibilityRole = null;
  protected @Nullable Role mRole = null;

  protected int mNumberOfLines = UNSET;
  protected int mTextAlign = Gravity.NO_GRAVITY;
  protected int mTextBreakStrategy = Layout.BREAK_STRATEGY_HIGH_QUALITY;
  protected int mHyphenationFrequency = Layout.HYPHENATION_FREQUENCY_NONE;
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

  @Override
  public int getColor() {
    return mColor;
  }

  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  public void setColor(@Nullable Integer color) {
    mIsColorSet = (color != null);
    if (mIsColorSet) {
      mColor = color;
    }
    markUpdated();
  }

  @Override
  public boolean isColorSet() {
    return mIsColorSet;
  }

  @Override
  public int getBackgroundColor() {
    return mBackgroundColor;
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

  @Override
  public boolean isBackgroundColorSet() {
    return mIsBackgroundColorSet;
  }

  @Override
  public @Nullable AccessibilityRole getAccessibilityRole() {
    return mAccessibilityRole;
  }

  @ReactProp(name = ViewProps.ACCESSIBILITY_ROLE)
  public void setAccessibilityRole(@Nullable String accessibilityRole) {
    if (isVirtual()) {
      mAccessibilityRole = AccessibilityRole.fromValue(accessibilityRole);
      markUpdated();
    }
  }

  @Override
  public @Nullable Role getRole() {
    return mRole;
  }

  @ReactProp(name = ViewProps.ROLE)
  public void setRole(@Nullable String role) {
    if (isVirtual()) {
      mRole = Role.fromValue(role);
      markUpdated();
    }
  }

  @Override
  public String getFontFamily() {
    return mFontFamily;
  }

  @ReactProp(name = ViewProps.FONT_FAMILY)
  public void setFontFamily(@Nullable String fontFamily) {
    mFontFamily = fontFamily;
    markUpdated();
  }

  @Override
  public int getFontWeight() {
    return mFontWeight;
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

  @Override
  public String getFontFeatureSettings() {
    return mFontFeatureSettings;
  }

  @Override
  public int getFontStyle() {
    return mFontStyle;
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

  @Override
  public boolean isUnderlineTextDecorationSet() {
    return mIsUnderlineTextDecorationSet;
  }

  @Override
  public boolean isLineThroughTextDecorationSet() {
    return mIsLineThroughTextDecorationSet;
  }

  @ReactProp(name = ViewProps.TEXT_BREAK_STRATEGY)
  public void setTextBreakStrategy(@Nullable String textBreakStrategy) {
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

  @Override
  public float getTextShadowOffsetDx() {
    return mTextShadowOffsetDx;
  }

  @Override
  public float getTextShadowOffsetDy() {
    return mTextShadowOffsetDy;
  }

  @Override
  public float getTextShadowRadius() {
    return mTextShadowRadius;
  }

  @ReactProp(name = PROP_SHADOW_RADIUS, defaultInt = 1)
  public void setTextShadowRadius(float textShadowRadius) {
    if (textShadowRadius != mTextShadowRadius) {
      mTextShadowRadius = textShadowRadius;
      markUpdated();
    }
  }

  @Override
  public int getTextShadowColor() {
    return mTextShadowColor;
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
