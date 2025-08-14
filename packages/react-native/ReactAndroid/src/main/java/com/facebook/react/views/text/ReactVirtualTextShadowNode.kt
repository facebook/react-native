/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.text

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger

/** A virtual text node. */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
internal class ReactVirtualTextShadowNode : ReactBaseTextShadowNode() {

  override fun isVirtual(): Boolean = true

  internal companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "ReactVirtualTextShadowNode",
          LegacyArchitectureLogLevel.ERROR,
      )
    }
  }
}
