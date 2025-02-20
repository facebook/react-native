/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.os.SystemClock
import com.facebook.soloader.SoLoader
import com.facebook.systrace.Systrace
import com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE

internal object ReactBridge {
  @Volatile private var _loadStartTime: Long = 0
  @Volatile private var _loadEndTime: Long = 0
  @Volatile private var _didInit: Boolean = false

  @JvmStatic
  @Synchronized
  fun staticInit() {
    if (_didInit) {
      return
    }
    _loadStartTime = SystemClock.uptimeMillis()
    Systrace.beginSection(
        TRACE_TAG_REACT_JAVA_BRIDGE, "ReactBridge.staticInit::load:reactnativejni")
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_START)
    SoLoader.loadLibrary("reactnativejni")
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_END)
    Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE)
    _loadEndTime = SystemClock.uptimeMillis()
    _didInit = true
  }

  @JvmStatic
  val loadStartTime: Long
    get() = _loadStartTime

  @JvmStatic
  val loadEndTime: Long
    get() = _loadEndTime

  @JvmStatic
  val initialized: Boolean
    @JvmName("isInitialized") get() = _didInit
}
