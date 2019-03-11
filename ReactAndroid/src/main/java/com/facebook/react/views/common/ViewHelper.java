// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.views.common;

import android.graphics.drawable.Drawable;
import android.os.Build;
import android.view.View;

/** Helper class for Views */
public class ViewHelper {

  /**
   * Set the background to a given Drawable, or remove the background. It calls {@link
   * View#setBackground(Drawable)} or {@link View#setBackgroundDrawable(Drawable)} based on the sdk
   * version.
   *
   * @param view {@link View} to apply the background.
   * @param drawable {@link Drawable} The Drawable to use as the background, or null to remove the
   *     background
   */
  public static void setBackground(View view, Drawable drawable) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
      view.setBackground(drawable);
    } else {
      view.setBackgroundDrawable(drawable);
    }
  }
}
