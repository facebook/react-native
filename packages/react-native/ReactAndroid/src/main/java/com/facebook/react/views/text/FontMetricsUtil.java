/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.content.Context;
import android.graphics.Rect;
import android.text.Layout;
import android.text.TextPaint;
import android.util.DisplayMetrics;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.mapbuffer.MapBuffer;

public class FontMetricsUtil {

  private static final String CAP_HEIGHT_MEASUREMENT_TEXT = "T";
  private static final String X_HEIGHT_MEASUREMENT_TEXT = "x";
  private static final float AMPLIFICATION_FACTOR = 100;

  public static WritableMap getFontMetrics(
      CharSequence text, Layout layout, TextPaint paint, Context context, MapBuffer textLayoutRegions) {
    DisplayMetrics dm = context.getResources().getDisplayMetrics();
    WritableArray lines = Arguments.createArray();
    WritableArray regions = Arguments.createArray();
    // To calculate xHeight and capHeight we have to render an "x" and "T" and manually measure
    // their height.
    // In order to get more precision than Android offers, we blow up the text size by 100 and
    // measure it.
    // Luckily, text size affects rendering linearly, so we can do this trick.
    TextPaint paintCopy = new TextPaint(paint);
    paintCopy.setTextSize(paintCopy.getTextSize() * AMPLIFICATION_FACTOR);
    Rect capHeightBounds = new Rect();
    paintCopy.getTextBounds(
        CAP_HEIGHT_MEASUREMENT_TEXT, 0, CAP_HEIGHT_MEASUREMENT_TEXT.length(), capHeightBounds);
    double capHeight = capHeightBounds.height() / AMPLIFICATION_FACTOR / dm.density;
    Rect xHeightBounds = new Rect();
    paintCopy.getTextBounds(
        X_HEIGHT_MEASUREMENT_TEXT, 0, X_HEIGHT_MEASUREMENT_TEXT.length(), xHeightBounds);
    double xHeight = xHeightBounds.height() / AMPLIFICATION_FACTOR / dm.density;

    for (int i = 0; i < layout.getLineCount(); i++) {
      Rect bounds = new Rect();
      layout.getLineBounds(i, bounds);
      WritableMap line = Arguments.createMap();
      line.putDouble("x", layout.getLineLeft(i) / dm.density);
      line.putDouble("y", bounds.top / dm.density);
      line.putDouble("width", layout.getLineWidth(i) / dm.density);
      line.putDouble("height", bounds.height() / dm.density);
      line.putDouble("descender", layout.getLineDescent(i) / dm.density);
      line.putDouble("ascender", -layout.getLineAscent(i) / dm.density);
      line.putDouble("baseline", layout.getLineBaseline(i) / dm.density);
      line.putDouble("capHeight", capHeight);
      line.putDouble("xHeight", xHeight);
      line.putString(
          "text", text.subSequence(layout.getLineStart(i), layout.getLineEnd(i)).toString());

      lines.pushMap(line);
    }

    for (int j = 0; j < textLayoutRegions.getCount(); j++) {
      for (int i = 0; i < layout.getLineCount(); i++) {
        Rect bounds = new Rect();
        layout.getLineBounds(i, bounds);

        MapBuffer textLayoutRegion = textLayoutRegions.getMapBuffer(j);

        int offset = layout.getLineEnd(i) >= textLayoutRegion.getInt(1) ? 0 : 1; 
        int startIndex = Math.max(layout.getLineStart(i), textLayoutRegion.getInt(0));
        int endIndex = Math.min(layout.getLineEnd(i), textLayoutRegion.getInt(1)) - offset;

        if (startIndex > endIndex + 1) {
          break;
        }

        Rect regionBounds = new Rect(
          (int)layout.getPrimaryHorizontal(startIndex),
          bounds.top,
          (int)layout.getPrimaryHorizontal(endIndex),
          bounds.bottom);

        WritableMap region = Arguments.createMap();
        region.putDouble("x", regionBounds.left / dm.density);
        region.putDouble("y", regionBounds.top / dm.density);
        region.putDouble("width", regionBounds.width() / dm.density);
        region.putDouble("height", regionBounds.height() / dm.density);
        region.putString("text", text.subSequence(startIndex, endIndex).toString());
        region.putInt("region", j);
        region.putInt("line", i);
        regions.pushMap(region);
      }
    }

    WritableMap textLayoutMetrics = Arguments.createMap();
    textLayoutMetrics.putArray("lines", lines);
    textLayoutMetrics.putArray("regions", regions);

    return textLayoutMetrics;
  }
}
