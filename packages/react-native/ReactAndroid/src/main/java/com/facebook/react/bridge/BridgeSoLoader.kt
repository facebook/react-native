/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.soloader.SoLoader
import com.facebook.systrace.Systrace
import com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE

@LegacyArchitecture
internal object BridgeSoLoader {
  init {
    LegacyArchitectureLogger.assertWhenLegacyArchitectureMinifyingEnabled("BridgeSoLoader")
  }

  @JvmStatic
  @Synchronized
  fun staticInit() {
    if (initialized) {
      return
    }
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "BridgeSoLoader")
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_START)
    SoLoader.loadLibrary("reactnativejni")
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_END)
    Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE)
    initialized = true
  }

  @get:JvmStatic
  @get:JvmName("isInitialized")
  @Volatile
  var initialized: Boolean = false
    private set
}
