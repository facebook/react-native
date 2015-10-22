/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;

import android.content.Context;
import android.text.Layout;
import android.text.Spanned;
import android.widget.TextView;

import com.facebook.react.uimanager.ReactCompoundView;

public class ReactTextView extends TextView implements ReactCompoundView {

  public ReactTextView(Context context) {
    super(context);
  }

  @Override
  public int reactTagForTouch(float touchX, float touchY) {
    Spanned text = (Spanned) getText();
    int target = getId();

    int x = (int) touchX;
    int y = (int) touchY;

    Layout layout = getLayout();
    int line = layout.getLineForVertical(y);

    int lineStartX = (int) layout.getLineLeft(line);
    int lineEndX = (int) layout.getLineRight(line);

    // TODO(5966918): Consider extending touchable area for text spans by some DP constant
    if (x >= lineStartX && x <= lineEndX) {
      int index = layout.getOffsetForHorizontal(line, x);

      // We choose the most inner span (shortest) containing character at the given index
      // if no such span can be found we will send the textview's react id as a touch handler
      // In case when there are more than one spans with same length we choose the last one
      // from the spans[] array, since it correspond to the most inner react element
      ReactTagSpan[] spans = text.getSpans(index, index, ReactTagSpan.class);

      if (spans != null) {
        int targetSpanTextLength = text.length();
        for (int i = 0; i < spans.length; i++) {
          int spanStart = text.getSpanStart(spans[i]);
          int spanEnd = text.getSpanEnd(spans[i]);
          if (spanEnd > index && (spanEnd - spanStart) <= targetSpanTextLength) {
            target = spans[i].getReactTag();
            targetSpanTextLength = (spanEnd - spanStart);
          }
        }
      }
    }

    return target;
  }
}
