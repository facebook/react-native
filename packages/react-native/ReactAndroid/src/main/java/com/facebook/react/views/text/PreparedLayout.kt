/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.text.Layout
import android.text.Spanned
import com.facebook.proguard.annotations.DoNotStrip

/**
 * Encapsulates an [android.text.Layout] along with the full source text and any additional state
 * needed to render or measure it.
 */
@DoNotStrip
internal class PreparedLayout(
    val layout: Layout,
    val sourceText: Spanned,
    val maximumNumberOfLines: Int,
    val verticalOffset: Float,
    val reactTags: IntArray,
    val textBreakStrategy: Int,
    val justificationMode: Int,
) {
  fun copyWithReactTags(reactTags: IntArray): PreparedLayout =
      PreparedLayout(
          layout,
          sourceText,
          maximumNumberOfLines,
          verticalOffset,
          reactTags,
          textBreakStrategy,
          justificationMode,
      )
}
