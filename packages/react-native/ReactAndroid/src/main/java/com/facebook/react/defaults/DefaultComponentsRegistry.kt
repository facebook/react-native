/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.ComponentFactory

/**
 * A utility class that provides users a ComponentRegistry they can customize with a C++
 * implementation of its native methods.
 *
 * This class works together with the [DefaultNewArchitectureEntryPoint] and it's C++ implementation
 * is hosted inside the React Native framework
 */
@Suppress("UNUSED_PARAMETER")
@UnstableReactNativeAPI
public object DefaultComponentsRegistry {
  init {
    AppModulesSoLoader.maybeLoadSoLibrary()
  }

  @JvmStatic
  @Deprecated(
      "This call is no longer necessary. registerComponentDescriptorsFromEntryPoint will be used by default.")
  public fun register(componentFactory: ComponentFactory): Unit {
    // No-op
  }
}
