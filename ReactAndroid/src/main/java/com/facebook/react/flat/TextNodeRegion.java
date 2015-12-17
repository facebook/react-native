/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import android.text.Layout;
import android.text.Spanned;

/* package */ final class TextNodeRegion extends NodeRegion {
  private final Layout mLayout;

  TextNodeRegion(float left, float top, float right, float bottom, int tag, Layout layout) {
    super(left, top, right, bottom, tag);
    mLayout = layout;
  }

  /* package */ Layout getLayout() {
    return mLayout;
  }

  /* package */ int getReactTag(float touchX, float touchY) {
    int y = Math.round(touchY - mTop);
    if (y >= mLayout.getLineTop(0) && y < mLayout.getLineBottom(mLayout.getLineCount() - 1)) {
      float x = Math.round(touchX - mLeft);
      int line = mLayout.getLineForVertical(y);

      if (mLayout.getLineLeft(line) <= x && x <= mLayout.getLineRight(line)) {
        int off = mLayout.getOffsetForHorizontal(line, x);

        Spanned text = (Spanned) mLayout.getText();
        RCTRawText[] link = text.getSpans(off, off, RCTRawText.class);

        if (link.length != 0) {
          return link[0].getReactTag();
        }
      }
    }

    return super.getReactTag(touchX, touchY);
  }
}
