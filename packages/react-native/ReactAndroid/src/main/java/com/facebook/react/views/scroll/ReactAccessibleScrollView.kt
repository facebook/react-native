/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.view.View

/** Shared interface for the [ReactScrollViewAccessibilityDelegate] */
internal interface ReactAccessibleScrollView {

  val scrollEnabled: Boolean

  /** Returns whether the given descendent is partially scrolled in view */
  fun isPartiallyScrolledInView(view: View): Boolean
}
