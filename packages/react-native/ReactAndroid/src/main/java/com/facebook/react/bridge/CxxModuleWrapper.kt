/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger

/** This does nothing interesting, except avoid breaking existing code. */
@DoNotStrip
@LegacyArchitecture
public open class CxxModuleWrapper protected constructor(hybridData: HybridData) :
    CxxModuleWrapperBase(hybridData) {
  init {
    LegacyArchitectureLogger.assertWhenLegacyArchitectureMinifyingEnabled("CxxModuleWrapper")
  }
}
