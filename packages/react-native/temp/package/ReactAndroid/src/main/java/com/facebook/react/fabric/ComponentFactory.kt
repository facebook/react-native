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
public class ComponentFactory {

  @Suppress("NoHungarianNotation") private val mHybridData: HybridData = initHybrid()

  private companion object {
    init {
      FabricSoLoader.staticInit()
    }

    @JvmStatic private external fun initHybrid(): HybridData
  }
}
