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

import android.support.v4.text.TextDirectionHeuristicsCompat;
import android.text.Layout;
import android.text.TextUtils;

import com.facebook.csslayout.CSSMeasureMode;
import com.facebook.csslayout.CSSNodeAPI;
import com.facebook.csslayout.MeasureOutput;
import com.facebook.csslayout.Spacing;
import com.facebook.fbui.textlayoutbuilder.TextLayoutBuilder;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.textcachewarmer.DefaultTextLayoutCacheWarmer;

/**
 * RCTText is a top-level node for text. It extends {@link RCTVirtualText} because it can contain
 * styling information, but has the following differences:
 *
 * a) RCTText is not a virtual node, and can be measured and laid out.
 * b) when no font size is specified, a font size of ViewDefaults#FONT_SIZE_SP is assumed.
 */
/* package */ final class RCTText extends RCTVirtualText implements CSSNodeAPI.MeasureFunction {

  // We set every value we use every time we use the layout builder, so we can get away with only
  // using a single instance.
  private static final TextLayoutBuilder sTextLayoutBuilder =
      new TextLayoutBuilder()
          .setShouldCacheLayout(false)
          .setShouldWarmText(true)
          .setCacheWarmer(new DefaultTextLayoutCacheWarmer());

  private @Nullable CharSequence mText;
  private @Nullable DrawTextLayout mDrawCommand;
  private float mSpacingMult = 1.0f;
  private float mSpacingAdd = 0.0f;
  private int mNumberOfLines = Integer.MAX_VALUE;
  private Layout.Alignment mAlignment = Layout.Alignment.ALIGN_NORMAL;

  public RCTText() {
    setMeasureFunction(this);
    getSpan().setFontSize(getDefaultFontSize());
  }

  @Override
  public boolean isVirtual() {
    return false;
  }

  @Override
  public boolean isVirtualAnchor() {
    return true;
  }

  @Override
  public void measure(
      CSSNodeAPI node,
      float width,
      CSSMeasureMode widthMode,
      float height,
      CSSMeasureMode heightMode,
      MeasureOutput measureOutput) {

    CharSequence text = getText();
    if (TextUtils.isEmpty(text)) {
      // to indicate that we don't have anything to display
      mText = null;
      measureOutput.width = 0;
      measureOutput.height = 0;
      return;
    } else {
      mText = text;
    }

    Layout layout = createTextLayout(
        (int) Math.ceil(width),
        widthMode,
        TextUtils.TruncateAt.END,
        true,
        mNumberOfLines,
        mNumberOfLines == 1,
        text,
        getFontSize(),
        mSpacingAdd,
        mSpacingMult,
        getFontStyle(),
        mAlignment);

    if (mDrawCommand != null && !mDrawCommand.isFrozen()) {
      mDrawCommand.setLayout(layout);
    } else {
      mDrawCommand = new DrawTextLayout(layout);
    }

    measureOutput.width = mDrawCommand.getLayoutWidth();
    measureOutput.height = mDrawCommand.getLayoutHeight();
  }

  @Override
  protected void collectState(
      StateBuilder stateBuilder,
      float left,
      float top,
      float right,
      float bottom,
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {

    super.collectState(
        stateBuilder,
        left,
        top,
        right,
        bottom,
        clipLeft,
        clipTop,
        clipRight,
        clipBottom);

    if (mText == null) {
      // as an optimization, LayoutEngine may not call measure in certain cases, such as when the
      // dimensions are already defined. in these cases, we should still draw the text.
      if (bottom - top > 0 && right - left > 0) {
        CharSequence text = getText();
        if (!TextUtils.isEmpty(text)) {
          mText = text;
        }
      }

      if (mText == null) {
        // nothing to draw (empty text).
        return;
      }
    }

    boolean updateNodeRegion = false;
    if (mDrawCommand == null) {
      mDrawCommand = new DrawTextLayout(createTextLayout(
          (int) Math.ceil(right - left),
          CSSMeasureMode.EXACTLY,
          TextUtils.TruncateAt.END,
          true,
          mNumberOfLines,
          mNumberOfLines == 1,
          mText,
          getFontSize(),
          mSpacingAdd,
          mSpacingMult,
          getFontStyle(),
          mAlignment));
      updateNodeRegion = true;
    }

    Spacing padding = getPadding();

    left += padding.get(Spacing.LEFT);
    top += padding.get(Spacing.TOP);

    // these are actual right/bottom coordinates where this DrawCommand will draw.
    right = left + mDrawCommand.getLayoutWidth();
    bottom = top + mDrawCommand.getLayoutHeight();

    mDrawCommand = (DrawTextLayout) mDrawCommand.updateBoundsAndFreeze(
        left,
        top,
        right,
        bottom,
        clipLeft,
        clipTop,
        clipRight,
        clipBottom);
    stateBuilder.addDrawCommand(mDrawCommand);

    if (updateNodeRegion) {
      NodeRegion nodeRegion = getNodeRegion();
      if (nodeRegion instanceof TextNodeRegion) {
        ((TextNodeRegion) nodeRegion).setLayout(mDrawCommand.getLayout());
      }
    }

    performCollectAttachDetachListeners(stateBuilder);
  }

  @ReactProp(name = ViewProps.LINE_HEIGHT, defaultDouble = Double.NaN)
  public void setLineHeight(double lineHeight) {
    if (Double.isNaN(lineHeight)) {
      mSpacingMult = 1.0f;
      mSpacingAdd = 0.0f;
    } else {
      mSpacingMult = 0.0f;
      mSpacingAdd = PixelUtil.toPixelFromSP((float) lineHeight);
    }
    notifyChanged(true);
  }

  @ReactProp(name = ViewProps.NUMBER_OF_LINES, defaultInt = Integer.MAX_VALUE)
  public void setNumberOfLines(int numberOfLines) {
    mNumberOfLines = numberOfLines;
    notifyChanged(true);
  }

  @Override
  /* package */ void updateNodeRegion(
      float left,
      float top,
      float right,
      float bottom,
      boolean isVirtual) {

    NodeRegion nodeRegion = getNodeRegion();
    if (mDrawCommand == null) {
      if (nodeRegion.mLeft != left || nodeRegion.mTop != top || nodeRegion.mRight != right ||
          nodeRegion.mBottom != bottom || nodeRegion.mIsVirtual != isVirtual) {
        setNodeRegion(new TextNodeRegion(left, top, right, bottom, getReactTag(), isVirtual, null));
      }
      return;
    }

    Layout layout = null;

    if (nodeRegion instanceof TextNodeRegion) {
      layout = ((TextNodeRegion) nodeRegion).getLayout();
    }

    Layout newLayout = mDrawCommand.getLayout();
    if (nodeRegion.mLeft != left || nodeRegion.mTop != top ||
        nodeRegion.mRight != right || nodeRegion.mBottom != bottom ||
        nodeRegion.mIsVirtual != isVirtual || layout != newLayout) {
      setNodeRegion(
          new TextNodeRegion(left, top, right, bottom, getReactTag(), isVirtual, newLayout));
    }
  }

  @Override
  protected int getDefaultFontSize() {
    // top-level <Text /> should always specify font size.
    return fontSizeFromSp(ViewDefaults.FONT_SIZE_SP);
  }

  @Override
  protected void notifyChanged(boolean shouldRemeasure) {
    // Future patch: should only recreate Layout if shouldRemeasure is false
    dirty();
  }

  @ReactProp(name = ViewProps.TEXT_ALIGN)
  public void setTextAlign(@Nullable String textAlign) {
    if (textAlign == null || "auto".equals(textAlign)) {
      mAlignment = Layout.Alignment.ALIGN_NORMAL;
    } else if ("left".equals(textAlign)) {
      // left and right may yield potentially different results (relative to non-nodes) in cases
      // when supportsRTL="true" in the manifest.
      mAlignment = Layout.Alignment.ALIGN_NORMAL;
    } else if ("right".equals(textAlign)) {
      mAlignment = Layout.Alignment.ALIGN_OPPOSITE;
    } else if ("center".equals(textAlign)) {
      mAlignment = Layout.Alignment.ALIGN_CENTER;
    } else {
      throw new JSApplicationIllegalArgumentException("Invalid textAlign: " + textAlign);
    }
    notifyChanged(false);
  }

  private static Layout createTextLayout(
      int width,
      CSSMeasureMode widthMode,
      TextUtils.TruncateAt ellipsize,
      boolean shouldIncludeFontPadding,
      int maxLines,
      boolean isSingleLine,
      CharSequence text,
      int textSize,
      float extraSpacing,
      float spacingMultiplier,
      int textStyle,
      Layout.Alignment textAlignment) {
    Layout newLayout;

    final @TextLayoutBuilder.MeasureMode int textMeasureMode;
    switch (widthMode) {
      case UNDEFINED:
        textMeasureMode = TextLayoutBuilder.MEASURE_MODE_UNSPECIFIED;
        break;
      case EXACTLY:
        textMeasureMode = TextLayoutBuilder.MEASURE_MODE_EXACTLY;
        break;
      case AT_MOST:
        textMeasureMode = TextLayoutBuilder.MEASURE_MODE_AT_MOST;
        break;
      default:
        throw new IllegalStateException("Unexpected size mode: " + widthMode);
    }

    sTextLayoutBuilder
        .setEllipsize(ellipsize)
        .setMaxLines(maxLines)
        .setSingleLine(isSingleLine)
        .setText(text)
        .setTextSize(textSize)
        .setWidth(width, textMeasureMode);

    sTextLayoutBuilder.setTextStyle(textStyle);

    sTextLayoutBuilder.textDirection(TextDirectionHeuristicsCompat.FIRSTSTRONG_LTR);
    sTextLayoutBuilder.setIncludeFontPadding(shouldIncludeFontPadding);
    sTextLayoutBuilder.setTextSpacingExtra(extraSpacing);
    sTextLayoutBuilder.setTextSpacingMultiplier(spacingMultiplier);
    sTextLayoutBuilder.setAlignment(textAlignment);

    newLayout = sTextLayoutBuilder.build();

    sTextLayoutBuilder.setText(null);

    return newLayout;
  }
}
