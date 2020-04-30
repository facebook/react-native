/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.style.BackgroundColorSpan;

/*
 * Wraps {@link BackgroundColorSpan} as a {@link ReactSpan}.
 */
public class ReactBackgroundColorSpan extends BackgroundColorSpan implements ReactSpan {
  public ReactBackgroundColorSpan(int color) {
    super(color);
  }
}
