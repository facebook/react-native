/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.TextPaint;
import android.text.style.SubscriptSpan;

/** ratio 0 for center ratio 0.4 for top ratio */
public class ReactBottomAlignSpan extends SubscriptSpan implements ReactSpan {
  private static final String TAG = "ReactBottomAlignSpan";

  @Override
  public void updateDrawState(TextPaint ds) {
    ds.baselineShift += ds.getFontMetrics().descent / 2;
  }

  @Override
  public void updateMeasureState(TextPaint tp) {
    updateDrawState(tp);
  }
}
