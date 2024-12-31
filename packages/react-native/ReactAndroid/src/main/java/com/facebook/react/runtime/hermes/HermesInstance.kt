/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime.hermes

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.facebook.react.runtime.JSRuntimeFactory
import com.facebook.soloader.SoLoader

public class HermesInstance(allocInOldGenBeforeTTI: Boolean) :
    JSRuntimeFactory(initHybrid(allocInOldGenBeforeTTI)) {

  public constructor() : this(false)

  public companion object {
    @JvmStatic
    @DoNotStrip
    protected external fun initHybrid(allocInOldGenBeforeTTI: Boolean): HybridData

    init {
      SoLoader.loadLibrary("hermesinstancejni")
    }
  }
}
