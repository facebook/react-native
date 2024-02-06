/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span;

import android.graphics.Color;
import android.text.style.ForegroundColorSpan;
import android.text.TextPaint;
import androidx.annotation.NonNull;

/*
 * Wraps {@link ForegroundColorSpan} as a {@link ReactSpan}.
 */
public class ReactForegroundColorSpan extends ForegroundColorSpan implements ReactSpan {
  private long mColor = 0;

  public ReactForegroundColorSpan(int color) {
    super(color);
  }

  public ReactForegroundColorSpan(long color) {
    super(Color.toArgb(color));
    this.mColor = color;
  }

  @Override
  public void updateDrawState(@NonNull TextPaint tp) {
    super.updateDrawState(tp);
    if (mColor != 0) {
      tp.setColor(mColor);
    }
  }
}