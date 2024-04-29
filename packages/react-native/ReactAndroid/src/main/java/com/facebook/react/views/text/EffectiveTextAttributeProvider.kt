/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import com.facebook.react.common.ReactConstants.UNSET

/** Interface for an entity providing effective text attributes of a text node/fragment */
internal interface EffectiveTextAttributeProvider : BasicTextAttributeProvider {
  val textTransform: TextTransform

  val effectiveLetterSpacing: Float

  /** @return The effective font size, or [UNSET] if not set */
  val effectiveFontSize: Int

  val effectiveLineHeight: Float
}
