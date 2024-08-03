/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import com.facebook.react.uimanager.ReactAccessibilityDelegate

/**
 * Interface for an entity providing basic text attributes of a text node/fragment. "Basic" means
 * that they can be provided trivially, without processing the parent element.
 */
internal interface BasicTextAttributeProvider {
  val role: ReactAccessibilityDelegate.Role?

  val accessibilityRole: ReactAccessibilityDelegate.AccessibilityRole?

  val isBackgroundColorSet: Boolean

  val backgroundColor: Int

  val isColorSet: Boolean

  val color: Int

  val fontStyle: Int

  val fontWeight: Int

  val fontFamily: String?

  val fontFeatureSettings: String?

  val isUnderlineTextDecorationSet: Boolean

  val isLineThroughTextDecorationSet: Boolean

  val textShadowOffsetDx: Float

  val textShadowOffsetDy: Float

  val textShadowRadius: Float

  val textShadowColor: Int
}
