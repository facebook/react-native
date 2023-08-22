/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.style.AbsoluteSizeSpan;

/*
 * Wraps {@link AbsoluteSizeSpan} as a {@link ReactSpan}.
 */
public class ReactAbsoluteSizeSpan extends AbsoluteSizeSpan implements ReactSpan {
  public ReactAbsoluteSizeSpan(int size) {
    super(size);
  }
}
