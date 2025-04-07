/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger

/**
 * Class responsible for handling layout view deletion animation, applied to view whenever a valid
 * config was supplied for the layout animation of DELETE type.
 */
@LegacyArchitecture
internal class LayoutDeleteAnimation : BaseLayoutAnimation() {

  override fun isReverse(): Boolean = true

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "LayoutDeleteAnimation", LegacyArchitectureLogLevel.WARNING)
    }
  }
}
