/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.ParcelableSpan;
import androidx.annotation.Nullable;

/*
 * Enables us to distinguish between spans that were added by React Native and spans that were
 * added by something else. All spans that React Native adds should implement this interface.
 *
 * ReactSpans should not directly extend system provided spans which implement ParcelableSpan.
 */
public interface ReactSpan {
  /** Returns a system-provided ParcelableSpan to represent the span when copied to clipboard. */
  @Nullable
  ParcelableSpan asParcelable();
}
