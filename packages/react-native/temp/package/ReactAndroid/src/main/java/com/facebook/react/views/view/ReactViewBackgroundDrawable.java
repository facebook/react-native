/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view;

import android.content.Context;
import com.facebook.react.uimanager.drawable.CSSBackgroundDrawable;

/**
 * @deprecated Please use {@link CSSBackgroundDrawable} instead
 */
@Deprecated(since = "0.75.0", forRemoval = true)
public class ReactViewBackgroundDrawable extends CSSBackgroundDrawable {
  /**
   * @deprecated Please use {@link CSSBackgroundDrawable} instead
   */
  @Deprecated(since = "0.75.0", forRemoval = true)
  public ReactViewBackgroundDrawable(Context context) {
    super(context);
  }
}
