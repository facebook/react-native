/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.fabric.FabricSoLoader

/**
 * A utility class that provides users a ComponentRegistry they can customize with a C++
 * implementation of its native methods.
 *
 * This class works together with the [DefaultNewArchitectureEntryPoint] and it's C++ implementation
 * is hosted inside the React Native framework
 *
 * TODO(T186951312): Should this be @UnstableReactNativeAPI?
 */
@DoNotStrip
public object DefaultComponentsRegistry {
  init {
    FabricSoLoader.staticInit()
    AppModulesSoLoader.maybeLoadSoLibrary()
  }

  @JvmStatic @DoNotStrip public external fun register(componentFactory: ComponentFactory): Unit
}
