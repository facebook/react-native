/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.mapbuffer

import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.common.annotations.StableReactNativeAPI
import com.facebook.soloader.SoLoader
import com.facebook.systrace.Systrace

@StableReactNativeAPI
public object MapBufferSoLoader {
  @Volatile private var didInit = false

  @JvmStatic
  public fun staticInit() {
    if (didInit) {
      return
    }
    didInit = true

    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "ReadableMapBufferSoLoader.staticInit::load:mapbufferjni")
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_MAPBUFFER_SO_FILE_START)
    SoLoader.loadLibrary("mapbufferjni")
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_MAPBUFFER_SO_FILE_END)
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)
  }
}
