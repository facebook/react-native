/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger

/** Exception thrown when a native module method call receives unexpected arguments from JS. */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
internal class NativeArgumentsParseException : JSApplicationCausedNativeException {

  constructor(detailMessage: String) : super(detailMessage)

  constructor(detailMessage: String, throwable: Throwable?) : super(detailMessage, throwable)

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "NativeArgumentsParseException", logLevel = LegacyArchitectureLogLevel.ERROR)
    }
  }
}
