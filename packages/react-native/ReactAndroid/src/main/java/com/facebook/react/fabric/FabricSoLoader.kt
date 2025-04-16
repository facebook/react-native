/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.soloader.SoLoader
import com.facebook.systrace.Systrace

internal object FabricSoLoader {
  @Volatile private var didInit = false

  @JvmStatic
  fun staticInit() {
    if (didInit) {
      return
    }
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "FabricSoLoader")
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_START)
    SoLoader.loadLibrary("fabricjni")
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_END)
    Systrace.endSection(Systrace.TRACE_TAG_REACT)
    didInit = true
  }
}
