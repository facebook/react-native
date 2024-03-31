/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.graphics.drawable.Drawable
import android.graphics.drawable.LayerDrawable

/** Overlays multiple background effects, along with any user-set background drawable */
public class CompositeBackgroundDrawable(
    public val viewBackground: Drawable?,
    public val cssBackground: CSSBackgroundDrawable?,
    public val decorations: List<DecorationDrawable>,
) :
    LayerDrawable(
        arrayOf(viewBackground, cssBackground, *decorations.toTypedArray()).apply {
          filterNotNull()
        })
