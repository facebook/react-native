/**
 * Copyright (c) 2015-present, Facebook, Inc.
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
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

public class FontMetricsUtil {
  public static WritableArray getFontMetrics(CharSequence text, Layout layout, TextPaint paint, Context context) {
    DisplayMetrics dm = context.getResources().getDisplayMetrics();
    WritableArray lines = Arguments.createArray();
    for (int i = 0; i < layout.getLineCount(); i++) {
      Rect bounds = new Rect();
      layout.getLineBounds(i, bounds);

      WritableMap line = Arguments.createMap();
      TextPaint paintCopy = new TextPaint(paint);
      paintCopy.setTextSize(paintCopy.getTextSize() * 100);
      Rect capHeightBounds = new Rect();
      paintCopy.getTextBounds("T", 0, 1, capHeightBounds);
      Rect xHeightBounds = new Rect();
      paintCopy.getTextBounds("x", 0, 1, xHeightBounds);
      line.putDouble("x", bounds.left / dm.density);
      line.putDouble("y", bounds.top / dm.density);
      line.putDouble("width", layout.getLineWidth(i) / dm.density);
      line.putDouble("height", bounds.height() / dm.density);
      line.putDouble("descender", layout.getLineDescent(i) / dm.density);
      line.putDouble("ascender", -layout.getLineAscent(i) / dm.density);
      line.putDouble("baseline", layout.getLineBaseline(i) / dm.density);
      line.putDouble(
          "capHeight", capHeightBounds.height() / 100 * paint.getTextSize() / dm.density);
      line.putDouble("xHeight", xHeightBounds.height() / 100 * paint.getTextSize() / dm.density);
      line.putString(
          "text", text.subSequence(layout.getLineStart(i), layout.getLineEnd(i)).toString());
      lines.pushMap(line);
    }
    return lines;
  }
}
