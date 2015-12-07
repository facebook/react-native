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

import android.text.BoringLayout;
import android.text.Layout;
import android.text.SpannableStringBuilder;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.text.TextUtils;

import com.facebook.csslayout.CSSNode;
import com.facebook.csslayout.MeasureOutput;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;

/**
 * RCTText is a top-level node for text. It extends {@link RCTVirtualText} because it can contain
 * styling information, but has the following differences:
 *
 * a) RCTText is not a virtual node, and can be measured and laid out.
 * b) when no font size is specified, a font size of ViewDefaults#FONT_SIZE_SP is assumed.
 */
/* package */ final class RCTText extends RCTVirtualText implements CSSNode.MeasureFunction {

  private static final boolean INCLUDE_PADDING = true;
  private static final TextPaint PAINT = new TextPaint(TextPaint.ANTI_ALIAS_FLAG);

  // this is optional, and helps saving a few BoringLayout.Metrics allocations during measure().
  private static @Nullable BoringLayout.Metrics sBoringLayoutMetrics;

  private @Nullable CharSequence mText;
  private @Nullable DrawTextLayout mDrawCommand;
  private @Nullable BoringLayout.Metrics mBoringLayoutMetrics;
  private float mSpacingMult = 1.0f;
  private float mSpacingAdd = 0.0f;

  public RCTText() {
    setMeasureFunction(this);
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
  public void measure(CSSNode node, float width, MeasureOutput measureOutput) {
    CharSequence text = getText();

    if (TextUtils.isEmpty(text)) {
      // to indicate that we don't have anything to display
      mText = null;
      measureOutput.width = 0;
      measureOutput.height = 0;
      return;
    }

    mText = text;

    BoringLayout.Metrics metrics = BoringLayout.isBoring(text, PAINT, sBoringLayoutMetrics);
    if (metrics != null) {
      sBoringLayoutMetrics = mBoringLayoutMetrics;
      if (sBoringLayoutMetrics != null) {
        // make sure it's always empty, reported metrics can be incorrect otherwise
        sBoringLayoutMetrics.top = 0;
        sBoringLayoutMetrics.ascent = 0;
        sBoringLayoutMetrics.descent = 0;
        sBoringLayoutMetrics.bottom = 0;
        sBoringLayoutMetrics.leading = 0;
      }

      mBoringLayoutMetrics = metrics;

      float measuredWidth = (float) metrics.width;
      if (Float.isNaN(width) || measuredWidth <= width) {
        measureOutput.width = measuredWidth;
        measureOutput.height = getMetricsHeight(metrics, INCLUDE_PADDING);

        // to indicate that text layout was not created during the measure pass
        mDrawCommand = null;

        return;
      }

      // width < measuredWidth -> more that a single line -> not boring
    }

    int maximumWidth = Float.isNaN(width) ? Integer.MAX_VALUE : (int) width;

    // at this point we need to create a StaticLayout to measure the text
    StaticLayout layout = new StaticLayout(
        text,
        PAINT,
        maximumWidth,
        Layout.Alignment.ALIGN_NORMAL,
        mSpacingMult,
        mSpacingAdd,
        INCLUDE_PADDING);

    // determine how wide we actually are
    float maxLineWidth = 0;
    int lineCount = layout.getLineCount();
    for (int i = 0; i != lineCount; ++i) {
      maxLineWidth = Math.max(maxLineWidth, layout.getLineMax(i));
    }

    measureOutput.width = maxLineWidth;
    measureOutput.height = layout.getHeight();

    if (mDrawCommand != null && !mDrawCommand.isFrozen()) {
      mDrawCommand.setLayout(layout);
    } else {
      mDrawCommand = new DrawTextLayout(layout);
    }
  }

  @Override
  protected void collectState(
      StateBuilder stateBuilder,
      float left,
      float top,
      float right,
      float bottom) {
    super.collectState(stateBuilder, left, top, right, bottom);

    if (mText == null) {
      // nothing to draw (empty text).
      return;
    }

    if (mDrawCommand == null) {
      // Layout was not created during the measure pass, must be Boring, create it now
      mDrawCommand = new DrawTextLayout(new BoringLayout(
          mText,
          PAINT,
          Integer.MAX_VALUE, // fits one line so don't care about the width
          Layout.Alignment.ALIGN_NORMAL,
          mSpacingMult,
          mSpacingAdd,
          mBoringLayoutMetrics,
          INCLUDE_PADDING));
    }

    mDrawCommand = (DrawTextLayout) mDrawCommand.updateBoundsAndFreeze(left, top, right, bottom);
    stateBuilder.addDrawCommand(mDrawCommand);
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

  /**
   * Returns a new CharSequence that includes all the text and styling information to create Layout.
   */
  private CharSequence getText() {
    SpannableStringBuilder sb = new SpannableStringBuilder();
    collectText(sb);
    applySpans(sb);
    return sb;
  }

  /**
   * Returns measured line height according to an includePadding flag.
   */
  private static int getMetricsHeight(BoringLayout.Metrics metrics, boolean includePadding) {
    if (includePadding) {
      return metrics.bottom - metrics.top;
    } else {
      return metrics.descent - metrics.ascent;
    }
  }
}
