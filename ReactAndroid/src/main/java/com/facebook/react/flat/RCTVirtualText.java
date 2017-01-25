/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.graphics.Typeface;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.TextUtils;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * RCTVirtualText is a {@link FlatTextShadowNode} that can contain font styling information.
 */
/* package */ class RCTVirtualText extends FlatTextShadowNode {

  private static final String BOLD = "bold";
  private static final String ITALIC = "italic";
  private static final String NORMAL = "normal";

  private static final String PROP_SHADOW_OFFSET = "textShadowOffset";
  private static final String PROP_SHADOW_RADIUS = "textShadowRadius";
  private static final String PROP_SHADOW_COLOR = "textShadowColor";
  private static final int DEFAULT_TEXT_SHADOW_COLOR = 0x55000000;

  private FontStylingSpan mFontStylingSpan = FontStylingSpan.INSTANCE;
  private ShadowStyleSpan mShadowStyleSpan = ShadowStyleSpan.INSTANCE;

  @Override
  public void addChildAt(ReactShadowNode child, int i) {
    super.addChildAt(child, i);
    notifyChanged(true);
  }

  @Override
  protected void performCollectText(SpannableStringBuilder builder) {
    for (int i = 0, childCount = getChildCount(); i < childCount; ++i) {
      FlatTextShadowNode child = (FlatTextShadowNode) getChildAt(i);
      child.collectText(builder);
    }
  }

  @Override
  protected void performApplySpans(SpannableStringBuilder builder, int begin, int end, boolean isEditable) {
    mFontStylingSpan.freeze();

    // All spans will automatically extend to the right of the text, but not the left - except
    // for spans that start at the beginning of the text.
    final int flag;
    if (isEditable) {
      flag = Spannable.SPAN_EXCLUSIVE_EXCLUSIVE;
    } else {
      flag = begin == 0 ?
          Spannable.SPAN_INCLUSIVE_INCLUSIVE :
          Spannable.SPAN_EXCLUSIVE_INCLUSIVE;
    }

    builder.setSpan(
        mFontStylingSpan,
        begin,
        end,
        flag);

    if (mShadowStyleSpan.getColor() != 0 && mShadowStyleSpan.getRadius() != 0) {
      mShadowStyleSpan.freeze();

      builder.setSpan(
          mShadowStyleSpan,
          begin,
          end,
          flag);
    }

    for (int i = 0, childCount = getChildCount(); i < childCount; ++i) {
      FlatTextShadowNode child = (FlatTextShadowNode) getChildAt(i);
      child.applySpans(builder, isEditable);
    }
  }

  @Override
  protected void performCollectAttachDetachListeners(StateBuilder stateBuilder) {
    for (int i = 0, childCount = getChildCount(); i < childCount; ++i) {
      FlatTextShadowNode child = (FlatTextShadowNode) getChildAt(i);
      child.performCollectAttachDetachListeners(stateBuilder);
    }
  }

  @ReactProp(name = ViewProps.FONT_SIZE, defaultFloat = Float.NaN)
  public void setFontSize(float fontSizeSp) {
    final int fontSize;
    if (Float.isNaN(fontSizeSp)) {
      fontSize = getDefaultFontSize();
    } else {
      fontSize = fontSizeFromSp(fontSizeSp);
    }

    if (mFontStylingSpan.getFontSize() != fontSize) {
      getSpan().setFontSize(fontSize);
      notifyChanged(true);
    }
  }

  @ReactProp(name = ViewProps.COLOR, defaultDouble = Double.NaN)
  public void setColor(double textColor) {
    if (mFontStylingSpan.getTextColor() != textColor) {
      getSpan().setTextColor(textColor);
      notifyChanged(false);
    }
  }

  @Override
  public void setBackgroundColor(int backgroundColor) {
    if (isVirtual()) {
      // for nested Text elements, we want to apply background color to the text only
      // e.g. Hello <style backgroundColor=red>World</style>, "World" will have red background color
      if (mFontStylingSpan.getBackgroundColor() != backgroundColor) {
        getSpan().setBackgroundColor(backgroundColor);
        notifyChanged(false);
      }
    } else {
      // for top-level Text element, background needs to be applied for the entire shadow node
      //
      // For example: <Text style={flex:1}>Hello World</Text>
      // "Hello World" may only occupy e.g. 200 pixels, but the node may be measured at e.g. 500px.
      // In this case, we want background to be 500px wide as well, and this is exactly what
      // FlatShadowNode does.
      super.setBackgroundColor(backgroundColor);
    }
  }

  @ReactProp(name = ViewProps.FONT_FAMILY)
  public void setFontFamily(@Nullable String fontFamily) {
    if (!TextUtils.equals(mFontStylingSpan.getFontFamily(), fontFamily)) {
      getSpan().setFontFamily(fontFamily);
      notifyChanged(true);
    }
  }

  @ReactProp(name = ViewProps.FONT_WEIGHT)
  public void setFontWeight(@Nullable String fontWeightString) {
    final int fontWeight;
    if (fontWeightString == null) {
      fontWeight = -1;
    } else if (BOLD.equals(fontWeightString)) {
      fontWeight = Typeface.BOLD;
    } else if (NORMAL.equals(fontWeightString)) {
      fontWeight = Typeface.NORMAL;
    } else {
      int fontWeightNumeric = parseNumericFontWeight(fontWeightString);
      if (fontWeightNumeric == -1) {
        throw new RuntimeException("invalid font weight " + fontWeightString);
      }
      fontWeight = fontWeightNumeric >= 500 ? Typeface.BOLD : Typeface.NORMAL;
    }

    if (mFontStylingSpan.getFontWeight() != fontWeight) {
      getSpan().setFontWeight(fontWeight);
      notifyChanged(true);
    }
  }

  @ReactProp(name = ViewProps.TEXT_DECORATION_LINE)
  public void setTextDecorationLine(@Nullable String textDecorationLineString) {
    boolean isUnderlineTextDecorationSet = false;
    boolean isLineThroughTextDecorationSet = false;
    if (textDecorationLineString != null) {
      for (String textDecorationLineSubString : textDecorationLineString.split(" ")) {
        if ("underline".equals(textDecorationLineSubString)) {
          isUnderlineTextDecorationSet = true;
        } else if ("line-through".equals(textDecorationLineSubString)) {
          isLineThroughTextDecorationSet = true;
        }
      }
    }

    if (isUnderlineTextDecorationSet != mFontStylingSpan.hasUnderline() ||
        isLineThroughTextDecorationSet != mFontStylingSpan.hasStrikeThrough()) {
      FontStylingSpan span = getSpan();
      span.setHasUnderline(isUnderlineTextDecorationSet);
      span.setHasStrikeThrough(isLineThroughTextDecorationSet);
      notifyChanged(true);
    }
  }

  @ReactProp(name = ViewProps.FONT_STYLE)
  public void setFontStyle(@Nullable String fontStyleString) {
    final int fontStyle;
    if (fontStyleString == null) {
      fontStyle = -1;
    } else if (ITALIC.equals(fontStyleString)) {
      fontStyle = Typeface.ITALIC;
    } else if (NORMAL.equals(fontStyleString)) {
      fontStyle = Typeface.NORMAL;
    } else {
      throw new RuntimeException("invalid font style " + fontStyleString);
    }

    if (mFontStylingSpan.getFontStyle() != fontStyle) {
      getSpan().setFontStyle(fontStyle);
      notifyChanged(true);
    }
  }

  @ReactProp(name = PROP_SHADOW_OFFSET)
  public void setTextShadowOffset(@Nullable ReadableMap offsetMap) {
    float dx = 0;
    float dy = 0;
    if (offsetMap != null) {
      if (offsetMap.hasKey("width")) {
        dx = PixelUtil.toPixelFromDIP(offsetMap.getDouble("width"));
      }
      if (offsetMap.hasKey("height")) {
        dy = PixelUtil.toPixelFromDIP(offsetMap.getDouble("height"));
      }
    }

    if (!mShadowStyleSpan.offsetMatches(dx, dy)) {
      getShadowSpan().setOffset(dx, dy);
      notifyChanged(false);
    }
  }

  @ReactProp(name = PROP_SHADOW_RADIUS)
  public void setTextShadowRadius(float textShadowRadius) {
    textShadowRadius = PixelUtil.toPixelFromDIP(textShadowRadius);
    if (mShadowStyleSpan.getRadius() != textShadowRadius) {
      getShadowSpan().setRadius(textShadowRadius);
      notifyChanged(false);
    }
  }

  @ReactProp(name = PROP_SHADOW_COLOR, defaultInt = DEFAULT_TEXT_SHADOW_COLOR, customType = "Color")
  public void setTextShadowColor(int textShadowColor) {
    if (mShadowStyleSpan.getColor() != textShadowColor) {
      getShadowSpan().setColor(textShadowColor);
      notifyChanged(false);
    }
  }

  /**
   * Returns font size for this node.
   * When called on RCTText, this value is never -1 (unset).
   */
  protected final int getFontSize() {
    return mFontStylingSpan.getFontSize();
  }
  /**
   * Returns font style for this node.
   */
  protected final int getFontStyle() {
    int style = mFontStylingSpan.getFontStyle();
    return style >= 0 ? style : Typeface.NORMAL;
  }

  protected int getDefaultFontSize() {
    return -1;
  }

  /* package */ static int fontSizeFromSp(float sp) {
    return (int) Math.ceil(PixelUtil.toPixelFromSP(sp));
  }

  protected final FontStylingSpan getSpan() {
    if (mFontStylingSpan.isFrozen()) {
      mFontStylingSpan = mFontStylingSpan.mutableCopy();
    }
    return mFontStylingSpan;
  }

  /**
   * Returns a new SpannableStringBuilder that includes all the text and styling information to
   * create the Layout.
   */
  /* package */ final SpannableStringBuilder getText() {
    SpannableStringBuilder sb = new SpannableStringBuilder();
    collectText(sb);
    applySpans(sb, isEditable());
    return sb;
  }

  private final ShadowStyleSpan getShadowSpan() {
    if (mShadowStyleSpan.isFrozen()) {
      mShadowStyleSpan = mShadowStyleSpan.mutableCopy();
    }
    return mShadowStyleSpan;
  }

  /**
   * Return -1 if the input string is not a valid numeric fontWeight (100, 200, ..., 900), otherwise
   * return the weight.
   */
  private static int parseNumericFontWeight(String fontWeightString) {
    // This should be much faster than using regex to verify input and Integer.parseInt
    return fontWeightString.length() == 3 && fontWeightString.endsWith("00")
        && fontWeightString.charAt(0) <= '9' && fontWeightString.charAt(0) >= '1' ?
        100 * (fontWeightString.charAt(0) - '0') : -1;
  }
}
