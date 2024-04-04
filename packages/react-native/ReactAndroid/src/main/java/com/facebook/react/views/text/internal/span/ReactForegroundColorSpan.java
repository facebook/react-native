/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span;

import android.text.style.ForegroundColorSpan;
import com.facebook.infer.annotation.Nullsafe;

/*
 * Wraps {@link ForegroundColorSpan} as a {@link ReactSpan}.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactForegroundColorSpan extends ForegroundColorSpan implements ReactSpan {
  public ReactForegroundColorSpan(int color) {
    super(color);
  }
}
