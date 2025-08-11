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
@Deprecated("This class is deprecated and will be removed in the next major release.")
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
internal interface ReactPackageLogger {
  fun startProcessPackage()

  fun endProcessPackage()
}
