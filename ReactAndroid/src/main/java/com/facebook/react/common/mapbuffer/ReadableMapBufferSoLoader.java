/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.mapbuffer;

import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.soloader.SoLoader;
import com.facebook.systrace.Systrace;

public class ReadableMapBufferSoLoader {
  private static volatile boolean sDidInit = false;

  public static void staticInit() {
    if (sDidInit) {
      return;
    }
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "ReadableMapBufferSoLoader.staticInit::load:mapbufferjni");
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_MAPBUFFER_SO_FILE_START);
    SoLoader.loadLibrary("mapbufferjni");
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_MAPBUFFER_SO_FILE_END);
    Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    sDidInit = true;
  }
}
