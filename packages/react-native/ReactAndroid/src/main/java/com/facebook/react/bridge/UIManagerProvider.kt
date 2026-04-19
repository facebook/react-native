/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel

/**
 * [UIManagerProvider] is used to create UIManager objects during the initialization of React
 * Native.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
public fun interface UIManagerProvider {

  /* Provides a [com.facebook.react.bridge.UIManager] for the context received as a parameter. */
  public fun createUIManager(context: ReactApplicationContext): UIManager?
}
