/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.views.text;

import android.graphics.Typeface;
import android.os.Build;
import android.text.Layout;
import android.view.Gravity;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.yoga.YogaDirection;

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

  protected float mLineHeight = Float.NaN;
  protected float mLetterSpacing = Float.NaN;
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
  protected int mTextBreakStrategy =
      (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) ? 0 : Layout.BREAK_STRATEGY_HIGH_QUALITY;
  protected int mJustificationMode =
      (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) ? 0 : Layout.JUSTIFICATION_MODE_NONE;
  protected TextTransform mTextTransform = TextTransform.UNSET;

  protected float mTextShadowOffsetDx = 0;
  protected float mTextShadowOffsetDy = 0;
  protected float mTextShadowRadius = 1;
  protected int mTextShadowColor = DEFAULT_TEXT_SHADOW_COLOR;

  protected boolean mIsUnderlineTextDecorationSet = false;
  protected boolean mIsLineThroughTextDecorationSet = false;
  protected boolean mIncludeFontPadding = true;

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

  protected boolean mContainsImages = false;
  protected float mHeightOfTallestInlineImage = Float.NaN;

  private final ReactStylesDiffMap mProps;

  public TextAttributeProps(ReactStylesDiffMap props) {
    mProps = props;
    setNumberOfLines(getIntProp(ViewProps.NUMBER_OF_LINES, UNSET));
    setLineHeight(getFloatProp(ViewProps.LINE_HEIGHT, UNSET));
    setLetterSpacing(getFloatProp(ViewProps.LETTER_SPACING, Float.NaN));
    setAllowFontScaling(getBooleanProp(ViewProps.ALLOW_FONT_SCALING, true));
    setTextAlign(getStringProp(ViewProps.TEXT_ALIGN));
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
    setIncludeFontPadding(getBooleanProp(ViewProps.INCLUDE_FONT_PADDING, true));
    setTextDecorationLine(getStringProp(ViewProps.TEXT_DECORATION_LINE));
    setTextBreakStrategy(getStringProp(ViewProps.TEXT_BREAK_STRATEGY));
    setTextShadowOffset(props.hasKey(PROP_SHADOW_OFFSET) ? props.getMap(PROP_SHADOW_OFFSET) : null);
    setTextShadowRadius(getIntProp(PROP_SHADOW_RADIUS, 1));
    setTextShadowColor(getIntProp(PROP_SHADOW_COLOR, DEFAULT_TEXT_SHADOW_COLOR));
    setTextTransform(getStringProp(PROP_TEXT_TRANSFORM));
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

  // Returns a line height which takes into account the requested line height
  // and the height of the inline images.
  public float getEffectiveLineHeight() {
    boolean useInlineViewHeight =
        !Float.isNaN(mLineHeight)
            && !Float.isNaN(mHeightOfTallestInlineImage)
            && mHeightOfTallestInlineImage > mLineHeight;
    return useInlineViewHeight ? mHeightOfTallestInlineImage : mLineHeight;
  }

  // Return text alignment according to LTR or RTL style
  public int getTextAlign() {
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
    mLetterSpacing =
        mAllowFontScaling
            ? PixelUtil.toPixelFromSP(mLetterSpacingInput)
            : PixelUtil.toPixelFromDIP(mLetterSpacingInput);
  }

  public void setAllowFontScaling(boolean allowFontScaling) {
    if (allowFontScaling != mAllowFontScaling) {
      mAllowFontScaling = allowFontScaling;
      setFontSize(mFontSizeInput);
      setLineHeight(mLineHeightInput);
      setLetterSpacing(mLetterSpacingInput);
    }
  }

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
        throw new JSApplicationIllegalArgumentException("Invalid textAlign: " + textAlign);
      }
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
      throw new JSApplicationIllegalArgumentException(
          "Invalid textBreakStrategy: " + textBreakStrategy);
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

  // TODO T31905686 remove this from here and add support to RTL
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
