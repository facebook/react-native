/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.text.style.ReplacementSpan;
import java.text.BreakIterator;

public class CustomTextTransformSpan extends ReplacementSpan {

  /**
   * A {@link ReplacementSpan} that allows declarative changing of text casing.
   * CustomTextTransformSpan will change e.g. "foo" to "FOO", when passed UPPERCASE.
   *
   * This needs to be a Span in order to achieve correctly nested transforms
   * (for Text nodes within Text nodes, each with separate needed transforms)
   */

  private final TextTransform mTransform;

  public CustomTextTransformSpan(TextTransform transform) {
    mTransform = transform;
  }

  @Override
  public void draw(Canvas canvas, CharSequence text, int start, int end, float x, int top, int y, int bottom, Paint paint) {
    CharSequence transformedText = transformText(text);
    canvas.drawText(transformedText, start, end, x, y, paint);
  }

	@Override
  public int getSize(Paint paint, CharSequence text, int start, int end, Paint.FontMetricsInt fm) {
    CharSequence transformedText = transformText(text);
    return Math.round(paint.measureText(transformedText, start, end));
  }

  private CharSequence transformText(CharSequence text) {
    CharSequence transformed;

    switch(mTransform) {
      case UPPERCASE:
        transformed = (CharSequence) text.toString().toUpperCase();
        break;
      case LOWERCASE:
       transformed = (CharSequence) text.toString().toLowerCase();
       break;
      case CAPITALIZE:
       transformed = (CharSequence) capitalize(text.toString());
       break;
      default:
        transformed = text;
    }

    return transformed;
  }

  private String capitalize(String text) {
    BreakIterator wordIterator = BreakIterator.getWordInstance();
    wordIterator.setText(text);

    StringBuilder res = new StringBuilder(text.length());
    int start = wordIterator.first();
    for (int end = wordIterator.next(); end != BreakIterator.DONE; end = wordIterator.next()) {
      String word = text.substring(start, end);
      if (Character.isLetterOrDigit(word.charAt(0))) {
        res.append(Character.toUpperCase(word.charAt(0)));
        res.append(word.substring(1).toLowerCase());
      } else {
        res.append(word);
      }
      start = end;
    }

    return res.toString();
  }

}
