/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.soloader.SoLoader

/** Base class for a Map whose keys and values are stored in native code (C++). */
@DoNotStrip
public abstract class NativeMap : HybridClassBase() {
  external override fun toString(): String

  private companion object {
    init {
      SoLoader.loadLibrary("reactnativejni_common")
    }
  }
}
