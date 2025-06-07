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

@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
public class ReactNoCrashBridgeNotAllowedSoftException : ReactNoCrashSoftException {

  public constructor(m: String) : super(m)

  public constructor(e: Throwable) : super(e)

  public constructor(m: String, e: Throwable) : super(m, e)

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "ReactNoCrashBridgeNotAllowedSoftException", LegacyArchitectureLogLevel.ERROR)
    }
  }
}
