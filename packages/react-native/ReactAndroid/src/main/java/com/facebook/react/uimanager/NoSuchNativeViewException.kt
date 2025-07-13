/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger

/**
 * Exception thrown when a class tries to access a native view by a tag that has no native view
 * associated with it.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
internal class NoSuchNativeViewException(detailMessage: String) :
    IllegalViewOperationException(detailMessage) {

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "NoSuchNativeViewException", LegacyArchitectureLogLevel.ERROR)
    }
  }
}
