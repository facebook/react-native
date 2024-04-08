/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.reactperflogger

import com.facebook.jni.HybridData
import com.facebook.soloader.SoLoader

public abstract class NativeModulePerfLogger protected constructor() {

  @Suppress("NoHungarianNotation") private val mHybridData: HybridData

  init {
    maybeLoadOtherSoLibraries()
    maybeLoadSoLibrary()
    mHybridData = initHybrid()
  }

  protected abstract fun initHybrid(): HybridData

  public abstract fun moduleDataCreateStart(moduleName: String, id: Int)

  public abstract fun moduleDataCreateEnd(moduleName: String, id: Int)

  public abstract fun moduleCreateStart(moduleName: String, id: Int)

  public abstract fun moduleCreateCacheHit(moduleName: String, id: Int)

  public abstract fun moduleCreateConstructStart(moduleName: String, id: Int)

  public abstract fun moduleCreateConstructEnd(moduleName: String, id: Int)

  public abstract fun moduleCreateSetUpStart(moduleName: String, id: Int)

  public abstract fun moduleCreateSetUpEnd(moduleName: String, id: Int)

  public abstract fun moduleCreateEnd(moduleName: String, id: Int)

  public abstract fun moduleCreateFail(moduleName: String, id: Int)

  /** Subclasses will override this method to load their own SO libraries. */
  @Synchronized
  protected fun maybeLoadOtherSoLibraries() {
    // No-op by default.
  }

  private companion object {
    @Volatile private var isSoLibraryLoaded = false

    // Prevents issues with initializer interruptions. See T38996825 and D13793825 for more context.
    @Synchronized
    private fun maybeLoadSoLibrary() {
      if (!isSoLibraryLoaded) {
        SoLoader.loadLibrary("reactperfloggerjni")
        isSoLibraryLoaded = true
      }
    }
  }
}
