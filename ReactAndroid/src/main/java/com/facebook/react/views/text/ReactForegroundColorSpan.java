/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.style.ForegroundColorSpan;

/*
 * Wraps {@link ForegroundColorSpan} as a {@link ReactSpan}.
 */
public class ReactForegroundColorSpan extends ForegroundColorSpan implements ReactSpan {
  public ReactForegroundColorSpan(int color) {
    super(color);
  }
}
