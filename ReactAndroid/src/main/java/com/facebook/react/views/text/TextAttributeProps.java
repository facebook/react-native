/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.os.Build;
import android.text.Layout;
import android.text.TextUtils;
import android.util.LayoutDirection;
import android.view.Gravity;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.mapbuffer.ReadableMapBuffer;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactAccessibilityDelegate;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ViewProps;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

// TODO: T63643819 refactor naming of TextAttributeProps to make explicit that this represents
// TextAttributes and not TextProps. As part of this refactor extract methods that don't belong to
// TextAttributeProps (e.g. TextAlign)
public class TextAttributeProps {

  // constants for Text Attributes serialization
  public static final short TA_KEY_FOREGROUND_COLOR = 0;
  public static final short TA_KEY_BACKGROUND_COLOR = 1;
  public static final short TA_KEY_OPACITY = 2;
  public static final short TA_KEY_FONT_FAMILY = 3;
  public static final short TA_KEY_FONT_SIZE = 4;
  public static final short TA_KEY_FONT_SIZE_MULTIPLIER = 5;
  public static final short TA_KEY_FONT_WEIGHT = 6;
  public static final short TA_KEY_FONT_STYLE = 7;
  public static final short TA_KEY_FONT_VARIANT = 8;
  public static final short TA_KEY_ALLOW_FONT_SCALING = 9;
  public static final short TA_KEY_LETTER_SPACING = 10;
  public static final short TA_KEY_LINE_HEIGHT = 11;
  public static final short TA_KEY_ALIGNMENT = 12;
  public static final short TA_KEY_BEST_WRITING_DIRECTION = 13;
  public static final short TA_KEY_TEXT_DECORATION_COLOR = 14;
  public static final short TA_KEY_TEXT_DECORATION_LINE = 15;
  public static final short TA_KEY_TEXT_DECORATION_STYLE = 16;
  public static final short TA_KEY_TEXT_SHADOW_RAIDUS = 18;
  public static final short TA_KEY_TEXT_SHADOW_COLOR = 19;
  public static final short TA_KEY_IS_HIGHLIGHTED = 20;
  public static final short TA_KEY_LAYOUT_DIRECTION = 21;
  public static final short TA_KEY_ACCESSIBILITY_ROLE = 22;

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
  private static final int DEFAULT_HYPHENATION_FREQUENCY =
      (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) ? 0 : Layout.HYPHENATION_FREQUENCY_NONE;

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

  protected TextTransform mTextTransform = TextTransform.NONE;

  protected float mTextShadowOffsetDx = 0;
  protected float mTextShadowOffsetDy = 0;
  protected float mTextShadowRadius = 1;
  protected int mTextShadowColor = DEFAULT_TEXT_SHADOW_COLOR;

  protected boolean mIsUnderlineTextDecorationSet = false;
  protected boolean mIsLineThroughTextDecorationSet = false;
  protected boolean mIncludeFontPadding = true;

  protected @Nullable ReactAccessibilityDelegate.AccessibilityRole mAccessibilityRole = null;
  protected boolean mIsAccessibilityRoleSet = false;

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

  private TextAttributeProps() {}

  /**
   * Build a TextAttributeProps using data from the {@link ReadableMapBuffer} received as a
   * parameter.
   */
  public static TextAttributeProps fromReadableMapBuffer(ReadableMapBuffer props) {
    TextAttributeProps result = new TextAttributeProps();

    // TODO T83483191: Review constants that are not being set!
    Iterator<ReadableMapBuffer.MapBufferEntry> iterator = props.iterator();
    while (iterator.hasNext()) {
      ReadableMapBuffer.MapBufferEntry entry = iterator.next();
      switch (entry.getKey()) {
        case TA_KEY_FOREGROUND_COLOR:
          result.setColor(entry.getInt());
          break;
        case TA_KEY_BACKGROUND_COLOR:
          result.setBackgroundColor(entry.getInt());
          break;
        case TA_KEY_OPACITY:
          break;
        case TA_KEY_FONT_FAMILY:
          result.setFontFamily(entry.getString());
          break;
        case TA_KEY_FONT_SIZE:
          result.setFontSize((float) entry.getDouble());
          break;
        case TA_KEY_FONT_SIZE_MULTIPLIER:
          break;
        case TA_KEY_FONT_WEIGHT:
          result.setFontWeight(entry.getString());
          break;
        case TA_KEY_FONT_STYLE:
          result.setFontStyle(entry.getString());
          break;
        case TA_KEY_FONT_VARIANT:
          result.setFontVariant(entry.getReadableMapBuffer());
          break;
        case TA_KEY_ALLOW_FONT_SCALING:
          result.setAllowFontScaling(entry.getBoolean());
          break;
        case TA_KEY_LETTER_SPACING:
          result.setLetterSpacing((float) entry.getDouble());
          break;
        case TA_KEY_LINE_HEIGHT:
          result.setLineHeight((float) entry.getDouble());
          break;
        case TA_KEY_ALIGNMENT:
          break;
        case TA_KEY_BEST_WRITING_DIRECTION:
          break;
        case TA_KEY_TEXT_DECORATION_COLOR:
          break;
        case TA_KEY_TEXT_DECORATION_LINE:
          result.setTextDecorationLine(entry.getString());
          break;
        case TA_KEY_TEXT_DECORATION_STYLE:
          break;
        case TA_KEY_TEXT_SHADOW_RAIDUS:
          result.setTextShadowRadius(entry.getInt());
          break;
        case TA_KEY_TEXT_SHADOW_COLOR:
          result.setTextShadowColor(entry.getInt());
          break;
        case TA_KEY_IS_HIGHLIGHTED:
          break;
        case TA_KEY_LAYOUT_DIRECTION:
          result.setLayoutDirection(entry.getString());
          break;
        case TA_KEY_ACCESSIBILITY_ROLE:
          result.setAccessibilityRole(entry.getString());
          break;
      }
    }

    // TODO T83483191: Review why the following props are not serialized:
    // setNumberOfLines
    // setColor
    // setIncludeFontPadding
    // setTextShadowOffset
    // setTextTransform
    return result;
  }

  public static TextAttributeProps fromReadableMap(ReactStylesDiffMap props) {
    TextAttributeProps result = new TextAttributeProps();
    result.setNumberOfLines(getIntProp(props, ViewProps.NUMBER_OF_LINES, UNSET));
    result.setLineHeight(getFloatProp(props, ViewProps.LINE_HEIGHT, UNSET));
    result.setLetterSpacing(getFloatProp(props, ViewProps.LETTER_SPACING, Float.NaN));
    result.setAllowFontScaling(getBooleanProp(props, ViewProps.ALLOW_FONT_SCALING, true));
    result.setFontSize(getFloatProp(props, ViewProps.FONT_SIZE, UNSET));
    result.setColor(props.hasKey(ViewProps.COLOR) ? props.getInt(ViewProps.COLOR, 0) : null);
    result.setColor(
        props.hasKey(ViewProps.FOREGROUND_COLOR)
            ? props.getInt(ViewProps.FOREGROUND_COLOR, 0)
            : null);
    result.setBackgroundColor(
        props.hasKey(ViewProps.BACKGROUND_COLOR)
            ? props.getInt(ViewProps.BACKGROUND_COLOR, 0)
            : null);
    result.setFontFamily(getStringProp(props, ViewProps.FONT_FAMILY));
    result.setFontWeight(getStringProp(props, ViewProps.FONT_WEIGHT));
    result.setFontStyle(getStringProp(props, ViewProps.FONT_STYLE));
    result.setFontVariant(getArrayProp(props, ViewProps.FONT_VARIANT));
    result.setIncludeFontPadding(getBooleanProp(props, ViewProps.INCLUDE_FONT_PADDING, true));
    result.setTextDecorationLine(getStringProp(props, ViewProps.TEXT_DECORATION_LINE));
    result.setTextShadowOffset(
        props.hasKey(PROP_SHADOW_OFFSET) ? props.getMap(PROP_SHADOW_OFFSET) : null);
    result.setTextShadowRadius(getIntProp(props, PROP_SHADOW_RADIUS, 1));
    result.setTextShadowColor(getIntProp(props, PROP_SHADOW_COLOR, DEFAULT_TEXT_SHADOW_COLOR));
    result.setTextTransform(getStringProp(props, PROP_TEXT_TRANSFORM));
    result.setLayoutDirection(getStringProp(props, ViewProps.LAYOUT_DIRECTION));
    result.setAccessibilityRole(getStringProp(props, ViewProps.ACCESSIBILITY_ROLE));
    return result;
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

  private static boolean getBooleanProp(
      ReactStylesDiffMap mProps, String name, boolean defaultValue) {
    if (mProps.hasKey(name)) {
      return mProps.getBoolean(name, defaultValue);
    } else {
      return defaultValue;
    }
  }

  private static String getStringProp(ReactStylesDiffMap mProps, String name) {
    if (mProps.hasKey(name)) {
      return mProps.getString(name);
    } else {
      return null;
    }
  }

  private static int getIntProp(ReactStylesDiffMap mProps, String name, int defaultvalue) {
    if (mProps.hasKey(name)) {
      return mProps.getInt(name, defaultvalue);
    } else {
      return defaultvalue;
    }
  }

  private static float getFloatProp(ReactStylesDiffMap mProps, String name, float defaultvalue) {
    if (mProps.hasKey(name)) {
      return mProps.getFloat(name, defaultvalue);
    } else {
      return defaultvalue;
    }
  }

  private static @Nullable ReadableArray getArrayProp(ReactStylesDiffMap mProps, String name) {
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

  private void setNumberOfLines(int numberOfLines) {
    mNumberOfLines = numberOfLines == 0 ? UNSET : numberOfLines;
  }

  private void setLineHeight(float lineHeight) {
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

  private void setLetterSpacing(float letterSpacing) {
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

  private void setAllowFontScaling(boolean allowFontScaling) {
    if (allowFontScaling != mAllowFontScaling) {
      mAllowFontScaling = allowFontScaling;
      setFontSize(mFontSizeInput);
      setLineHeight(mLineHeightInput);
      setLetterSpacing(mLetterSpacingInput);
    }
  }

  private void setFontSize(float fontSize) {
    mFontSizeInput = fontSize;
    if (fontSize != UNSET) {
      fontSize =
          mAllowFontScaling
              ? (float) Math.ceil(PixelUtil.toPixelFromSP(fontSize))
              : (float) Math.ceil(PixelUtil.toPixelFromDIP(fontSize));
    }
    mFontSize = (int) fontSize;
  }

  private void setColor(@Nullable Integer color) {
    mIsColorSet = (color != null);
    if (mIsColorSet) {
      mColor = color;
    }
  }

  private void setBackgroundColor(Integer color) {
    // TODO: Don't apply background color to anchor TextView since it will be applied on the View
    // directly
    // if (!isVirtualAnchor()) {
    mIsBackgroundColorSet = (color != null);
    if (mIsBackgroundColorSet) {
      mBackgroundColor = color;
    }
    // }
  }

  private void setFontFamily(@Nullable String fontFamily) {
    mFontFamily = fontFamily;
  }

  private void setFontVariant(@Nullable ReadableArray fontVariant) {
    mFontFeatureSettings = ReactTypefaceUtils.parseFontVariant(fontVariant);
  }

  private void setFontVariant(@Nullable ReadableMapBuffer fontVariant) {
    if (fontVariant == null || fontVariant.getCount() == 0) {
      mFontFeatureSettings = null;
      return;
    }

    List<String> features = new ArrayList<>();
    Iterator<ReadableMapBuffer.MapBufferEntry> iterator = fontVariant.iterator();
    while (iterator.hasNext()) {
      ReadableMapBuffer.MapBufferEntry entry = iterator.next();
      String value = entry.getString();
      if (value != null) {
        switch (value) {
          case "small-caps":
            features.add("'smcp'");
            break;
          case "oldstyle-nums":
            features.add("'onum'");
            break;
          case "lining-nums":
            features.add("'lnum'");
            break;
          case "tabular-nums":
            features.add("'tnum'");
            break;
          case "proportional-nums":
            features.add("'pnum'");
            break;
        }
      }
    }
    mFontFeatureSettings = TextUtils.join(", ", features);
  }

  private void setFontWeight(@Nullable String fontWeightString) {
    mFontWeight = ReactTypefaceUtils.parseFontWeight(fontWeightString);
  }

  private void setFontStyle(@Nullable String fontStyleString) {
    mFontStyle = ReactTypefaceUtils.parseFontStyle(fontStyleString);
  }

  private void setIncludeFontPadding(boolean includepad) {
    mIncludeFontPadding = includepad;
  }

  private void setTextDecorationLine(@Nullable String textDecorationLineString) {
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

  private void setTextShadowOffset(ReadableMap offsetMap) {
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

  public static int getLayoutDirection(@Nullable String layoutDirection) {
    int androidLayoutDirection;
    if (layoutDirection == null || "undefined".equals(layoutDirection)) {
      androidLayoutDirection = UNSET;
    } else if ("rtl".equals(layoutDirection)) {
      androidLayoutDirection = LayoutDirection.RTL;
    } else if ("ltr".equals(layoutDirection)) {
      androidLayoutDirection = LayoutDirection.LTR;
    } else {
      throw new JSApplicationIllegalArgumentException(
          "Invalid layoutDirection: " + layoutDirection);
    }
    return androidLayoutDirection;
  }

  private void setLayoutDirection(@Nullable String layoutDirection) {
    mLayoutDirection = getLayoutDirection(layoutDirection);
  }

  private void setTextShadowRadius(float textShadowRadius) {
    if (textShadowRadius != mTextShadowRadius) {
      mTextShadowRadius = textShadowRadius;
    }
  }

  private void setTextShadowColor(int textShadowColor) {
    if (textShadowColor != mTextShadowColor) {
      mTextShadowColor = textShadowColor;
    }
  }

  private void setTextTransform(@Nullable String textTransform) {
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

  private void setAccessibilityRole(@Nullable String accessibilityRole) {
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

  public static int getHyphenationFrequency(@Nullable String hyphenationFrequency) {
    int androidHyphenationFrequency = DEFAULT_HYPHENATION_FREQUENCY;
    if (hyphenationFrequency != null) {
      switch (hyphenationFrequency) {
        case "none":
          androidHyphenationFrequency = Layout.HYPHENATION_FREQUENCY_NONE;
          break;
        case "normal":
          androidHyphenationFrequency = Layout.HYPHENATION_FREQUENCY_NORMAL;
          break;
        default:
          androidHyphenationFrequency = Layout.HYPHENATION_FREQUENCY_FULL;
          break;
      }
    }
    return androidHyphenationFrequency;
  }
}
