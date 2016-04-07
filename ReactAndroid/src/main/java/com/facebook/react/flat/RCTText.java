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
import android.text.BoringLayout;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.text.TextUtils;

import com.facebook.csslayout.CSSMeasureMode;
import com.facebook.csslayout.CSSNode;
import com.facebook.csslayout.MeasureOutput;
import com.facebook.csslayout.Spacing;
import com.facebook.fbui.widget.text.staticlayouthelper.StaticLayoutHelper;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;

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
      CSSNode node,
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
    }

    mText = text;

    // technically, width should never be negative, but there is currently a bug in
    boolean unconstrainedWidth = widthMode == CSSMeasureMode.UNDEFINED || width < 0;

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
      if (unconstrainedWidth || measuredWidth <= width) {
        measureOutput.width = measuredWidth;
        measureOutput.height = getMetricsHeight(metrics, INCLUDE_PADDING);

        // to indicate that text layout was not created during the measure pass
        mDrawCommand = null;

        return;
      }

      // width < measuredWidth -> more that a single line -> not boring
    }

    int maximumWidth = unconstrainedWidth ? Integer.MAX_VALUE : (int) width;

    // Make sure we update the paint's text size. If we don't do this, ellipsis might be measured
    // incorrecly (but drawn correctly, which almost feels like an Android bug, because width of the
    // created layout may exceed the requested width). This is safe to do without making a copy per
    // RCTText instance because that size is ONLY used to measure the ellipsis but not to draw it.
    PAINT.setTextSize(getFontSize());

    // at this point we need to create a StaticLayout to measure the text
    StaticLayout layout = StaticLayoutHelper.make(
        text,
        0,
        text.length(),
        PAINT,
        maximumWidth,
        mAlignment,
        mSpacingMult,
        mSpacingAdd,
        INCLUDE_PADDING,
        TextUtils.TruncateAt.END,
        maximumWidth,
        mNumberOfLines,
        TextDirectionHeuristicsCompat.FIRSTSTRONG_LTR);

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
      // nothing to draw (empty text).
      return;
    }

    if (mDrawCommand == null) {
      // Layout was not created during the measure pass, must be Boring, create it now
      mDrawCommand = new DrawTextLayout(new BoringLayout(
          mText,
          PAINT,
          (int) (right - left),
          mAlignment,
          mSpacingMult,
          mSpacingAdd,
          mBoringLayoutMetrics,
          INCLUDE_PADDING));
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
    if (mDrawCommand == null) {
      super.updateNodeRegion(left, top, right, bottom, isVirtual);
      return;
    }

    NodeRegion nodeRegion = getNodeRegion();
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
