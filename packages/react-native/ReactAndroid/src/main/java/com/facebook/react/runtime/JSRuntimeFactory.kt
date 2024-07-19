/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.jni.HybridData
import com.facebook.soloader.SoLoader

public abstract class JSRuntimeFactory(private val mHybridData: HybridData) {
  private companion object {
    init {
      SoLoader.loadLibrary("rninstance")
    }
  }
}
