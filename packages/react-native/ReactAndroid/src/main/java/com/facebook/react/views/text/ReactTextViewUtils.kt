/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.graphics.Typeface
import android.widget.TextView

fun TextView.findEffectiveTypeface(fontAttributeProvider: FontAttributeProvider): Typeface =
  fontAttributeProvider.findEffectiveTypeface(
    baseTypeface = typeface,
    assetManager = context.assets,
  )
