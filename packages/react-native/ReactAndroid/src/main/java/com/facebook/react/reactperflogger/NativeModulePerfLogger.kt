/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.reactperflogger

import com.facebook.jni.HybridData

internal abstract class NativeModulePerfLogger protected constructor() {

  @Suppress("NoHungarianNotation") private val mHybridData: HybridData

  init {
    maybeLoadOtherSoLibraries()
    mHybridData = initHybrid()
  }

  protected abstract fun initHybrid(): HybridData

  abstract fun moduleDataCreateStart(moduleName: String, id: Int)

  abstract fun moduleDataCreateEnd(moduleName: String, id: Int)

  abstract fun moduleCreateStart(moduleName: String, id: Int)

  abstract fun moduleCreateCacheHit(moduleName: String, id: Int)

  abstract fun moduleCreateConstructStart(moduleName: String, id: Int)

  abstract fun moduleCreateConstructEnd(moduleName: String, id: Int)

  abstract fun moduleCreateSetUpStart(moduleName: String, id: Int)

  abstract fun moduleCreateSetUpEnd(moduleName: String, id: Int)

  abstract fun moduleCreateEnd(moduleName: String, id: Int)

  abstract fun moduleCreateFail(moduleName: String, id: Int)

  /** Subclasses will override this method to load their own SO libraries. */
  @Synchronized
  protected fun maybeLoadOtherSoLibraries() {
    // No-op by default.
  }
}
