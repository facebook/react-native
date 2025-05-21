/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.annotations.internal.InteropLegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger

/**
 * A Java Object which represents a cross-platform C++ module
 *
 * This module implements the [NativeModule] interface but will never be invoked from Java, instead
 * the underlying Cxx module will be extracted by the bridge and called directly.
 */
@DoNotStrip
@InteropLegacyArchitecture
public open class CxxModuleWrapperBase
protected constructor(
    // For creating a wrapper from C++, or from a derived class.
    @Suppress("NoHungarianNotation") @DoNotStrip private var mHybridData: HybridData
) : NativeModule {
  external override fun getName(): String

  override fun initialize() {
    // do nothing
  }

  override fun canOverrideExistingModule(): Boolean = false

  override fun invalidate() {
    mHybridData.resetNative()
  }

  // Replace the current native module held by this wrapper by a new instance
  protected fun resetModule(hd: HybridData) {
    if (hd !== mHybridData) {
      mHybridData.resetNative()
      mHybridData = hd
    }
  }

  private companion object {
    init {
      BridgeSoLoader.staticInit()
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "CxxModuleWrapperBase", LegacyArchitectureLogLevel.WARNING)
    }
  }
}
