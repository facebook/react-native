/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.library;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import androidx.annotation.Nullable;

public class ColoredView extends View {

  public ColoredView(Context context) {
    super(context);
  }

  public ColoredView(Context context, @Nullable AttributeSet attrs) {
    super(context, attrs);
  }

  public ColoredView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
    super(context, attrs, defStyleAttr);
  }
}
