/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.common.ClearableSynchronizedPool
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.yoga.YogaNode

/** Static holder for a recycling pool of YogaNodes. */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
internal object YogaNodePool {
  init {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "YogaNodePool",
        LegacyArchitectureLogLevel.ERROR,
    )
  }

  private val pool: ClearableSynchronizedPool<YogaNode> by
      lazy(LazyThreadSafetyMode.SYNCHRONIZED) { ClearableSynchronizedPool(1024) }

  @JvmStatic fun get(): ClearableSynchronizedPool<YogaNode> = pool
}
