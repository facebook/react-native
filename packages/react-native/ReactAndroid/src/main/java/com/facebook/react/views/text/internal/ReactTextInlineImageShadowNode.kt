/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.text.internal

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.views.text.internal.span.TextInlineImageSpan
import com.facebook.yoga.YogaNode

/** Base class for [YogaNode]s that represent inline images. */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
internal abstract class ReactTextInlineImageShadowNode : LayoutShadowNode() {
  /**
   * Build a [TextInlineImageSpan] from this node. This will be added to the TextView in place of
   * this node.
   */
  abstract fun buildInlineImageSpan(): TextInlineImageSpan
}
