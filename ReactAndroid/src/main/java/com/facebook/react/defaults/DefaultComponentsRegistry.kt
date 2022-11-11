/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.fabric.ComponentFactory

/**
 * A utility class that provides users a ComponentRegistry they can customize with a C++
 * implementation of its native methods.
 *
 * This class works together with the [DefaultNewArchitectureEntryPoint] and it's C++ implementation
 * is hosted inside the React Native framework
 */
@DoNotStrip
class DefaultComponentsRegistry
@DoNotStrip
private constructor(componentFactory: ComponentFactory) {

  @DoNotStrip private val hybridData: HybridData = initHybrid(componentFactory)

  @DoNotStrip private external fun initHybrid(componentFactory: ComponentFactory): HybridData

  companion object {
    @JvmStatic
    @DoNotStrip
    fun register(componentFactory: ComponentFactory) = DefaultComponentsRegistry(componentFactory)
  }
}
