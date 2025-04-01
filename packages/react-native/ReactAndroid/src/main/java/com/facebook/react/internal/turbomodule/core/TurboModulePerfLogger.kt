/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal.turbomodule.core

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.reactperflogger.NativeModulePerfLogger
import com.facebook.soloader.SoLoader

@DoNotStrip
internal object TurboModulePerfLogger {
  private var nativeModulePerfLogger: NativeModulePerfLogger? = null

  init {
    SoLoader.loadLibrary("turbomodulejsijni")
  }

  @JvmStatic
  fun moduleCreateStart(moduleName: String?, id: Int) {
    nativeModulePerfLogger?.moduleCreateStart(checkNotNull(moduleName), id)
  }

  @JvmStatic
  fun moduleCreateCacheHit(moduleName: String?, id: Int) {
    nativeModulePerfLogger?.moduleCreateCacheHit(checkNotNull(moduleName), id)
  }

  @JvmStatic
  fun moduleCreateConstructStart(moduleName: String?, id: Int) {
    nativeModulePerfLogger?.moduleCreateConstructStart(checkNotNull(moduleName), id)
  }

  @JvmStatic
  fun moduleCreateConstructEnd(moduleName: String?, id: Int) {
    nativeModulePerfLogger?.moduleCreateConstructEnd(checkNotNull(moduleName), id)
  }

  @JvmStatic
  fun moduleCreateSetUpStart(moduleName: String?, id: Int) {
    nativeModulePerfLogger?.moduleCreateSetUpStart(checkNotNull(moduleName), id)
  }

  @JvmStatic
  fun moduleCreateSetUpEnd(moduleName: String?, id: Int) {
    nativeModulePerfLogger?.moduleCreateSetUpEnd(checkNotNull(moduleName), id)
  }

  @JvmStatic
  fun moduleCreateEnd(moduleName: String?, id: Int) {
    nativeModulePerfLogger?.moduleCreateEnd(checkNotNull(moduleName), id)
  }

  @JvmStatic
  fun moduleCreateFail(moduleName: String?, id: Int) {
    nativeModulePerfLogger?.moduleCreateFail(checkNotNull(moduleName), id)
  }

  @DoNotStrip private external fun jniEnableCppLogging(perfLogger: NativeModulePerfLogger)

  fun enableLogging(perfLogger: NativeModulePerfLogger?) {
    if (perfLogger != null) {
      nativeModulePerfLogger = perfLogger
      jniEnableCppLogging(perfLogger)
    }
  }
}
