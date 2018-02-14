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

import android.text.Layout;
import android.text.Spanned;

/* package */ final class TextNodeRegion extends NodeRegion {
  private @Nullable Layout mLayout;

  /* package */ TextNodeRegion(
      float left,
      float top,
      float right,
      float bottom,
      int tag,
      boolean isVirtual,
      @Nullable Layout layout) {
    super(left, top, right, bottom, tag, isVirtual);
    mLayout = layout;
  }

  public void setLayout(Layout layout) {
    mLayout = layout;
  }

  /* package */ @Nullable Layout getLayout() {
    return mLayout;
  }

  /* package */ int getReactTag(float touchX, float touchY) {
    if (mLayout != null) {
      CharSequence text = mLayout.getText();
      if (text instanceof Spanned) {
        int y = Math.round(touchY - getTop());
        if (y >= mLayout.getLineTop(0) && y < mLayout.getLineBottom(mLayout.getLineCount() - 1)) {
          float x = Math.round(touchX - getLeft());
          int line = mLayout.getLineForVertical(y);

          if (mLayout.getLineLeft(line) <= x && x <= mLayout.getLineRight(line)) {
            int off = mLayout.getOffsetForHorizontal(line, x);

            Spanned spanned = (Spanned) text;
            RCTRawText[] link = spanned.getSpans(off, off, RCTRawText.class);

            if (link.length != 0) {
              return link[0].getReactTag();
            }
          }
        }
      }
    }

    return super.getReactTag(touchX, touchY);
  }

  @Override
  boolean matchesTag(int tag) {
    if (super.matchesTag(tag)) {
      return true;
    }

    if (mLayout != null) {
      CharSequence text = mLayout.getText();
      if (text instanceof Spanned) {
        Spanned spannedText = (Spanned) text;
        RCTRawText[] spans = spannedText.getSpans(0, text.length(), RCTRawText.class);
        for (RCTRawText span : spans) {
          if (span.getReactTag() == tag) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
