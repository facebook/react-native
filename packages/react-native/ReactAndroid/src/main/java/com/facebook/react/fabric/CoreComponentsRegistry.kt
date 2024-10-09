/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStripAny

@DoNotStripAny
public class CoreComponentsRegistry private constructor(componentFactory: ComponentFactory) {

  @Suppress("NoHungarianNotation")
  private val mHybridData: HybridData = initHybrid(componentFactory)

  private external fun initHybrid(componentFactory: ComponentFactory): HybridData

  public companion object {
    init {
      FabricSoLoader.staticInit()
    }

    @JvmStatic
    public fun register(componentFactory: ComponentFactory): CoreComponentsRegistry =
        CoreComponentsRegistry(componentFactory)
  }
}
