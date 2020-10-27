/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.graphics.Typeface;
import android.os.Build;
import android.text.Layout;
import android.util.LayoutDirection;
import android.view.Gravity;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactAccessibilityDelegate;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.yoga.YogaDirection;

// TODO: T63643819 refactor naming of TextAttributeProps to make explicit that this represents
// TextAttributes and not TextProps. As part of this refactor extract methods that don't belong to
// TextAttributeProps (e.g. TextAlign)
public class TextAttributeProps {

  private static final String INLINE_IMAGE_PLACEHOLDER = "I";
  public static final int UNSET = -1;

  private static final String PROP_SHADOW_OFFSET = "textShadowOffset";
  private static final String PROP_SHADOW_OFFSET_WIDTH = "width";
  private static final String PROP_SHADOW_OFFSET_HEIGHT = "height";
  private static final String PROP_SHADOW_RADIUS = "textShadowRadius";
  private static final String PROP_SHADOW_COLOR = "textShadowColor";

  private static final String PROP_TEXT_TRANSFORM = "textTransform";

  private static final int DEFAULT_TEXT_SHADOW_COLOR = 0x55000000;
  private static final int DEFAULT_JUSTIFICATION_MODE =
      (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) ? 0 : Layout.JUSTIFICATION_MODE_NONE;

  private static final int DEFAULT_BREAK_STRATEGY =
      (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) ? 0 : Layout.BREAK_STRATEGY_HIGH_QUALITY;

  protected float mLineHeight = Float.NaN;
  protected boolean mIsColorSet = false;
  protected boolean mAllowFontScaling = true;
  protected int mColor;
  protected boolean mIsBackgroundColorSet = false;
  protected int mBackgroundColor;

  protected int mNumberOfLines = UNSET;
  protected int mFontSize = UNSET;
  protected float mFontSizeInput = UNSET;
  protected float mLineHeightInput = UNSET;
  protected float mLetterSpacingInput = Float.NaN;
  protected int mTextAlign = Gravity.NO_GRAVITY;

  // `UNSET` is -1 and is the same as `LayoutDirection.UNDEFINED` but the symbol isn't available.
  protected int mLayoutDirection = UNSET;

  protected TextTransform mTextTransform = TextTransform.UNSET;

  protected float mTextShadowOffsetDx = 0;
  protected float mTextShadowOffsetDy = 0;
  protected float mTextShadowRadius = 1;
  protected int mTextShadowColor = DEFAULT_TEXT_SHADOW_COLOR;

  protected boolean mIsUnderlineTextDecorationSet = false;
  protected boolean mIsLineThroughTextDecorationSet = false;
  protected boolean mIncludeFontPadding = true;

  protected @Nullable ReactAccessibilityDelegate.AccessibilityRole mAccessibilityRole = null;
  protected boolean mIsAccessibilityRoleSet = false;

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
  protected float mHeightOfTallestInlineImage = Float.NaN;

  private final ReactStylesDiffMap mProps;

  public TextAttributeProps(ReactStylesDiffMap props) {
    mProps = props;
    setNumberOfLines(getIntProp(ViewProps.NUMBER_OF_LINES, UNSET));
    setLineHeight(getFloatProp(ViewProps.LINE_HEIGHT, UNSET));
    setLetterSpacing(getFloatProp(ViewProps.LETTER_SPACING, Float.NaN));
    setAllowFontScaling(getBooleanProp(ViewProps.ALLOW_FONT_SCALING, true));
    setFontSize(getFloatProp(ViewProps.FONT_SIZE, UNSET));
    setColor(props.hasKey(ViewProps.COLOR) ? props.getInt(ViewProps.COLOR, 0) : null);
    setColor(props.hasKey("foregroundColor") ? props.getInt("foregroundColor", 0) : null);
    setBackgroundColor(
        props.hasKey(ViewProps.BACKGROUND_COLOR)
            ? props.getInt(ViewProps.BACKGROUND_COLOR, 0)
            : null);
    setFontFamily(getStringProp(ViewProps.FONT_FAMILY));
    setFontWeight(getStringProp(ViewProps.FONT_WEIGHT));
    setFontStyle(getStringProp(ViewProps.FONT_STYLE));
    setFontVariant(getArrayProp(ViewProps.FONT_VARIANT));
    setIncludeFontPadding(getBooleanProp(ViewProps.INCLUDE_FONT_PADDING, true));
    setTextDecorationLine(getStringProp(ViewProps.TEXT_DECORATION_LINE));
    setTextShadowOffset(props.hasKey(PROP_SHADOW_OFFSET) ? props.getMap(PROP_SHADOW_OFFSET) : null);
    setTextShadowRadius(getIntProp(PROP_SHADOW_RADIUS, 1));
    setTextShadowColor(getIntProp(PROP_SHADOW_COLOR, DEFAULT_TEXT_SHADOW_COLOR));
    setTextTransform(getStringProp(PROP_TEXT_TRANSFORM));
    setLayoutDirection(getStringProp(ViewProps.LAYOUT_DIRECTION));
    setAccessibilityRole(getStringProp(ViewProps.ACCESSIBILITY_ROLE));
  }

  public static int getTextAlignment(ReactStylesDiffMap props, boolean isRTL) {
    @Nullable
    String textAlignPropValue =
        props.hasKey(ViewProps.TEXT_ALIGN) ? props.getString(ViewProps.TEXT_ALIGN) : null;
    int textAlignment;

    if ("justify".equals(textAlignPropValue)) {
      textAlignment = Gravity.LEFT;
    } else {
      if (textAlignPropValue == null || "auto".equals(textAlignPropValue)) {
        textAlignment = Gravity.NO_GRAVITY;
      } else if ("left".equals(textAlignPropValue)) {
        textAlignment = isRTL ? Gravity.RIGHT : Gravity.LEFT;
      } else if ("right".equals(textAlignPropValue)) {
        textAlignment = isRTL ? Gravity.LEFT : Gravity.RIGHT;
      } else if ("center".equals(textAlignPropValue)) {
        textAlignment = Gravity.CENTER_HORIZONTAL;
      } else {
        throw new JSApplicationIllegalArgumentException("Invalid textAlign: " + textAlignPropValue);
      }
    }
    return textAlignment;
  }

  public static int getJustificationMode(ReactStylesDiffMap props) {
    @Nullable
    String textAlignPropValue =
        props.hasKey(ViewProps.TEXT_ALIGN) ? props.getString(ViewProps.TEXT_ALIGN) : null;

    if ("justify".equals(textAlignPropValue) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      return Layout.JUSTIFICATION_MODE_INTER_WORD;
    }
    return DEFAULT_JUSTIFICATION_MODE;
  }

  private boolean getBooleanProp(String name, boolean defaultValue) {
    if (mProps.hasKey(name)) {
      return mProps.getBoolean(name, defaultValue);
    } else {
      return defaultValue;
    }
  }

  private String getStringProp(String name) {
    if (mProps.hasKey(name)) {
      return mProps.getString(name);
    } else {
      return null;
    }
  }

  private int getIntProp(String name, int defaultvalue) {
    if (mProps.hasKey(name)) {
      return mProps.getInt(name, defaultvalue);
    } else {
      return defaultvalue;
    }
  }

  private float getFloatProp(String name, float defaultvalue) {
    if (mProps.hasKey(name)) {
      return mProps.getFloat(name, defaultvalue);
    } else {
      return defaultvalue;
    }
  }

  private @Nullable ReadableArray getArrayProp(String name) {
    if (mProps.hasKey(name)) {
      return mProps.getArray(name);
    } else {
      return null;
    }
  }

  // Returns a line height which takes into account the requested line height
  // and the height of the inline images.
  public float getEffectiveLineHeight() {
    boolean useInlineViewHeight =
        !Float.isNaN(mLineHeight)
            && !Float.isNaN(mHeightOfTallestInlineImage)
            && mHeightOfTallestInlineImage > mLineHeight;
    return useInlineViewHeight ? mHeightOfTallestInlineImage : mLineHeight;
  }

  public void setNumberOfLines(int numberOfLines) {
    mNumberOfLines = numberOfLines == 0 ? UNSET : numberOfLines;
  }

  public void setLineHeight(float lineHeight) {
    mLineHeightInput = lineHeight;
    if (lineHeight == UNSET) {
      mLineHeight = Float.NaN;
    } else {
      mLineHeight =
          mAllowFontScaling
              ? PixelUtil.toPixelFromSP(lineHeight)
              : PixelUtil.toPixelFromDIP(lineHeight);
    }
  }

  public void setLetterSpacing(float letterSpacing) {
    mLetterSpacingInput = letterSpacing;
  }

  public float getLetterSpacing() {
    float letterSpacingPixels =
        mAllowFontScaling
            ? PixelUtil.toPixelFromSP(mLetterSpacingInput)
            : PixelUtil.toPixelFromDIP(mLetterSpacingInput);

    if (mFontSize <= 0) {
      throw new IllegalArgumentException(
          "FontSize should be a positive value. Current value: " + mFontSize);
    }
    // `letterSpacingPixels` and `mFontSize` are both in pixels,
    // yielding an accurate em value.
    return letterSpacingPixels / mFontSize;
  }

  public void setAllowFontScaling(boolean allowFontScaling) {
    if (allowFontScaling != mAllowFontScaling) {
      mAllowFontScaling = allowFontScaling;
      setFontSize(mFontSizeInput);
      setLineHeight(mLineHeightInput);
      setLetterSpacing(mLetterSpacingInput);
    }
  }

  public void setFontSize(float fontSize) {
    mFontSizeInput = fontSize;
    if (fontSize != UNSET) {
      fontSize =
          mAllowFontScaling
              ? (float) Math.ceil(PixelUtil.toPixelFromSP(fontSize))
              : (float) Math.ceil(PixelUtil.toPixelFromDIP(fontSize));
    }
    mFontSize = (int) fontSize;
  }

  public void setColor(@Nullable Integer color) {
    mIsColorSet = (color != null);
    if (mIsColorSet) {
      mColor = color;
    }
  }

  public void setBackgroundColor(Integer color) {
    // TODO: Don't apply background color to anchor TextView since it will be applied on the View
    // directly
    // if (!isVirtualAnchor()) {
    mIsBackgroundColorSet = (color != null);
    if (mIsBackgroundColorSet) {
      mBackgroundColor = color;
    }
    // }
  }

  public void setFontFamily(@Nullable String fontFamily) {
    mFontFamily = fontFamily;
  }

  public void setFontVariant(@Nullable ReadableArray fontVariant) {
    mFontFeatureSettings = ReactTypefaceUtils.parseFontVariant(fontVariant);
  }

  /**
   * /* This code is duplicated in ReactTextInputManager /* TODO: Factor into a common place they
   * can both use
   */
  public void setFontWeight(@Nullable String fontWeightString) {
    int fontWeightNumeric =
        fontWeightString != null ? parseNumericFontWeight(fontWeightString) : -1;
    int fontWeight = UNSET;
    if (fontWeightNumeric >= 500 || "bold".equals(fontWeightString)) {
      fontWeight = Typeface.BOLD;
    } else if ("normal".equals(fontWeightString)
        || (fontWeightNumeric != -1 && fontWeightNumeric < 500)) {
      fontWeight = Typeface.NORMAL;
    }
    if (fontWeight != mFontWeight) {
      mFontWeight = fontWeight;
    }
  }

  /**
   * /* This code is duplicated in ReactTextInputManager /* TODO: Factor into a common place they
   * can both use
   */
  public void setFontStyle(@Nullable String fontStyleString) {
    int fontStyle = UNSET;
    if ("italic".equals(fontStyleString)) {
      fontStyle = Typeface.ITALIC;
    } else if ("normal".equals(fontStyleString)) {
      fontStyle = Typeface.NORMAL;
    }
    if (fontStyle != mFontStyle) {
      mFontStyle = fontStyle;
    }
  }

  public void setIncludeFontPadding(boolean includepad) {
    mIncludeFontPadding = includepad;
  }

  public void setTextDecorationLine(@Nullable String textDecorationLineString) {
    mIsUnderlineTextDecorationSet = false;
    mIsLineThroughTextDecorationSet = false;
    if (textDecorationLineString != null) {
      for (String textDecorationLineSubString : textDecorationLineString.split("-")) {
        if ("underline".equals(textDecorationLineSubString)) {
          mIsUnderlineTextDecorationSet = true;
        } else if ("strikethrough".equals(textDecorationLineSubString)) {
          mIsLineThroughTextDecorationSet = true;
        }
      }
    }
  }

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
  }

  public void setLayoutDirection(@Nullable String layoutDirection) {
    if (layoutDirection == null || "undefined".equals(layoutDirection)) {
      mLayoutDirection = UNSET;
    } else if ("rtl".equals(layoutDirection)) {
      mLayoutDirection = LayoutDirection.RTL;
    } else if ("ltr".equals(layoutDirection)) {
      mLayoutDirection = LayoutDirection.LTR;
    } else {
      throw new JSApplicationIllegalArgumentException(
          "Invalid layoutDirection: " + layoutDirection);
    }
  }

  public void setTextShadowRadius(float textShadowRadius) {
    if (textShadowRadius != mTextShadowRadius) {
      mTextShadowRadius = textShadowRadius;
    }
  }

  public void setTextShadowColor(int textShadowColor) {
    if (textShadowColor != mTextShadowColor) {
      mTextShadowColor = textShadowColor;
    }
  }

  public void setTextTransform(@Nullable String textTransform) {
    if (textTransform == null || "none".equals(textTransform)) {
      mTextTransform = TextTransform.NONE;
    } else if ("uppercase".equals(textTransform)) {
      mTextTransform = TextTransform.UPPERCASE;
    } else if ("lowercase".equals(textTransform)) {
      mTextTransform = TextTransform.LOWERCASE;
    } else if ("capitalize".equals(textTransform)) {
      mTextTransform = TextTransform.CAPITALIZE;
    } else {
      throw new JSApplicationIllegalArgumentException("Invalid textTransform: " + textTransform);
    }
  }

  public void setAccessibilityRole(@Nullable String accessibilityRole) {
    if (accessibilityRole != null) {
      mIsAccessibilityRoleSet = accessibilityRole != null;
      mAccessibilityRole =
          ReactAccessibilityDelegate.AccessibilityRole.fromValue(accessibilityRole);
    }
  }

  public static int getTextBreakStrategy(@Nullable String textBreakStrategy) {
    int androidTextBreakStrategy = DEFAULT_BREAK_STRATEGY;
    if (textBreakStrategy != null) {
      switch (textBreakStrategy) {
        case "simple":
          androidTextBreakStrategy = Layout.BREAK_STRATEGY_SIMPLE;
          break;
        case "balanced":
          androidTextBreakStrategy = Layout.BREAK_STRATEGY_BALANCED;
          break;
        default:
          androidTextBreakStrategy = Layout.BREAK_STRATEGY_HIGH_QUALITY;
          break;
      }
    }
    return androidTextBreakStrategy;
  }

  /**
   * Return -1 if the input string is not a valid numeric fontWeight (100, 200, ..., 900), otherwise
   * return the weight.
   *
   * <p>This code is duplicated in ReactTextInputManager TODO: Factor into a common place they can
   * both use
   */
  private static int parseNumericFontWeight(String fontWeightString) {
    // This should be much faster than using regex to verify input and Integer.parseInt
    return fontWeightString.length() == 3
            && fontWeightString.endsWith("00")
            && fontWeightString.charAt(0) <= '9'
            && fontWeightString.charAt(0) >= '1'
        ? 100 * (fontWeightString.charAt(0) - '0')
        : -1;
  }

  // TODO T63645393 remove this from here and add support to RTL
  private YogaDirection getLayoutDirection() {
    return YogaDirection.LTR;
  }

  public float getBottomPadding() {
    return getPaddingProp(ViewProps.PADDING_BOTTOM);
  }

  public float getLeftPadding() {
    return getPaddingProp(ViewProps.PADDING_LEFT);
  }

  public float getStartPadding() {
    return getPaddingProp(ViewProps.PADDING_START);
  }

  public float getEndPadding() {
    return getPaddingProp(ViewProps.PADDING_END);
  }

  public float getTopPadding() {
    return getPaddingProp(ViewProps.PADDING_TOP);
  }

  public float getRightPadding() {
    return getPaddingProp(ViewProps.PADDING_RIGHT);
  }

  private float getPaddingProp(String paddingType) {
    if (mProps.hasKey(ViewProps.PADDING)) {
      return PixelUtil.toPixelFromDIP(getFloatProp(ViewProps.PADDING, 0f));
    }

    return PixelUtil.toPixelFromDIP(getFloatProp(paddingType, 0f));
  }
}
