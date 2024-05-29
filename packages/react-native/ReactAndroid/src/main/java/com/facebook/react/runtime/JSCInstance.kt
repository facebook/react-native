/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.facebook.jni.annotations.DoNotStripAny
import com.facebook.soloader.SoLoader

@DoNotStripAny
public class JSCInstance : JSRuntimeFactory(initHybrid()) {
  private companion object {
    init {
      SoLoader.loadLibrary("jscinstance")
    }

    @DoNotStrip @JvmStatic private external fun initHybrid(): HybridData
  }
}
