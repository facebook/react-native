/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.art;

import javax.annotation.Nullable;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.text.TextUtils;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual ARTText view
 */
public class ARTTextShadowNode extends ARTShapeShadowNode {

  private static final String PROP_LINES = "lines";

  private static final String PROP_FONT = "font";
  private static final String PROP_FONT_FAMILY = "fontFamily";
  private static final String PROP_FONT_SIZE = "fontSize";
  private static final String PROP_FONT_STYLE = "fontStyle";
  private static final String PROP_FONT_WEIGHT = "fontWeight";

  private static final int DEFAULT_FONT_SIZE = 12;

  private static final int TEXT_ALIGNMENT_CENTER = 2;
  private static final int TEXT_ALIGNMENT_LEFT = 0;
  private static final int TEXT_ALIGNMENT_RIGHT = 1;

  private @Nullable ReadableMap mFrame;
  private int mTextAlignment = TEXT_ALIGNMENT_LEFT;

  public ARTTextShadowNode() { }

  public ARTTextShadowNode(ARTTextShadowNode node) {
    super(node);
    mTextAlignment = node.mTextAlignment;
    mFrame = node.mFrame; // copy reference as mFrame is already immutable
  }

  @Override
  protected ARTShapeShadowNode copy() {
    return new ARTTextShadowNode(this);
  }

  @ReactProp(name = "frame")
  public void setFrame(@Nullable ReadableMap frame) {
    mFrame = frame;
  }

  @ReactProp(name = "alignment", defaultInt = TEXT_ALIGNMENT_LEFT)
  public void setAlignment(int alignment) {
    mTextAlignment = alignment;
  }

  @Override
  public void draw(Canvas canvas, Paint paint, float opacity) {
    if (mFrame == null) {
      return;
    }
    opacity *= mOpacity;
    if (opacity <= MIN_OPACITY_FOR_DRAW) {
      return;
    }
    if (!mFrame.hasKey(PROP_LINES)) {
      return;
    }
    ReadableArray linesProp = mFrame.getArray(PROP_LINES);
    if (linesProp == null || linesProp.size() == 0) {
      return;
    }

    // only set up the canvas if we have something to draw
    saveAndSetupCanvas(canvas);
    String[] lines = new String[linesProp.size()];
    for (int i = 0; i < lines.length; i++) {
      lines[i] = linesProp.getString(i);
    }
    String text = TextUtils.join("\n", lines);
    if (setupStrokePaint(paint, opacity)) {
      applyTextPropertiesToPaint(paint);
      if (mPath == null) {
        canvas.drawText(text, 0, -paint.ascent(), paint);
      } else {
        canvas.drawTextOnPath(text, mPath, 0, 0, paint);
      }
    }
    if (setupFillPaint(paint, opacity)) {
      applyTextPropertiesToPaint(paint);
      if (mPath == null) {
        canvas.drawText(text, 0, -paint.ascent(), paint);
      } else {
        canvas.drawTextOnPath(text, mPath, 0, 0, paint);
      }
    }
    restoreCanvas(canvas);
    markUpdateSeen();
  }

  private void applyTextPropertiesToPaint(Paint paint) {
    int alignment = mTextAlignment;
    switch (alignment) {
      case TEXT_ALIGNMENT_LEFT:
        paint.setTextAlign(Paint.Align.LEFT);
        break;
      case TEXT_ALIGNMENT_RIGHT:
        paint.setTextAlign(Paint.Align.RIGHT);
        break;
      case TEXT_ALIGNMENT_CENTER:
        paint.setTextAlign(Paint.Align.CENTER);
        break;
    }
    if (mFrame != null) {
      if (mFrame.hasKey(PROP_FONT)) {
        ReadableMap font = mFrame.getMap(PROP_FONT);
        if (font != null) {
          float fontSize = DEFAULT_FONT_SIZE;
          if (font.hasKey(PROP_FONT_SIZE)) {
            fontSize = (float) font.getDouble(PROP_FONT_SIZE);
          }
          paint.setTextSize(fontSize * mScale);
          boolean isBold =
              font.hasKey(PROP_FONT_WEIGHT) && "bold".equals(font.getString(PROP_FONT_WEIGHT));
          boolean isItalic =
              font.hasKey(PROP_FONT_STYLE) && "italic".equals(font.getString(PROP_FONT_STYLE));
          int fontStyle;
          if (isBold && isItalic) {
            fontStyle = Typeface.BOLD_ITALIC;
          } else if (isBold) {
            fontStyle = Typeface.BOLD;
          } else if (isItalic) {
            fontStyle = Typeface.ITALIC;
          } else {
            fontStyle = Typeface.NORMAL;
          }
          // NB: if the font family is null / unsupported, the default one will be used
          paint.setTypeface(Typeface.create(font.getString(PROP_FONT_FAMILY), fontStyle));
        }
      }
    }
  }
}
