/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import com.facebook.react.common.ReactConstants

/**
 * Implementation of [EffectiveTextAttributeProvider] that provides effective text attributes based
 * on a [ReactBaseTextShadowNode] instance and its parent.
 */
internal class HierarchicTextAttributeProvider(
    private val textShadowNode: ReactBaseTextShadowNode,
    private val parentTextAttributes: TextAttributes?,
    private val textAttributes: TextAttributes
) : EffectiveTextAttributeProvider, BasicTextAttributeProvider by textShadowNode {
  override val textTransform: TextTransform
    get() = textAttributes.textTransform

  override val effectiveLetterSpacing: Float
    get() {
      val letterSpacing = textAttributes.effectiveLetterSpacing

      val isParentLetterSpacingDifferent =
          parentTextAttributes == null ||
              parentTextAttributes.effectiveLetterSpacing != letterSpacing

      return if (!letterSpacing.isNaN() && isParentLetterSpacingDifferent) {
        letterSpacing
      } else {
        Float.NaN
      }
    }

  override val effectiveFontSize: Int
    get() {
      val fontSize = textAttributes.effectiveFontSize

      return if (parentTextAttributes == null ||
          parentTextAttributes.effectiveFontSize != fontSize) {
        fontSize
      } else {
        ReactConstants.UNSET
      }
    }

  override val effectiveLineHeight: Float
    get() {
      val lineHeight = textAttributes.effectiveLineHeight
      val isParentLineHeightDifferent =
          parentTextAttributes == null || parentTextAttributes.effectiveLineHeight != lineHeight

      return if (!lineHeight.isNaN() && isParentLineHeightDifferent) {
        lineHeight
      } else {
        Float.NaN
      }
    }
}
