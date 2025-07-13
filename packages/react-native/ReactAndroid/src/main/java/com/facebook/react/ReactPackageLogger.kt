/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel

/** Interface for the bridge to call for TTI start and end markers. */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
internal interface ReactPackageLogger {
  fun startProcessPackage(): Unit

  fun endProcessPackage(): Unit
}
