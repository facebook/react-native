/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.view.View;

/**
 * Shared utility for asserting on MeasureSpecs.
 */
public class MeasureSpecAssertions {

  public static final void assertExplicitMeasureSpec(int widthMeasureSpec, int heightMeasureSpec) {
    int widthMode = View.MeasureSpec.getMode(widthMeasureSpec);
    int heightMode = View.MeasureSpec.getMode(heightMeasureSpec);

    if (widthMode == View.MeasureSpec.UNSPECIFIED || heightMode == View.MeasureSpec.UNSPECIFIED) {
      throw new IllegalStateException(
          "A catalyst view must have an explicit width and height given to it. This should " +
              "normally happen as part of the standard catalyst UI framework.");
    }
  }
}
