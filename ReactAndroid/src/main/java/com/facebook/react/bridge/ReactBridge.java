/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

import android.os.SystemClock;
import com.facebook.soloader.SoLoader;
import com.facebook.systrace.Systrace;

import com.facebook.react.BuildConfig;

public class ReactBridge {
  private static volatile long sLoadStartTime = 0;
  private static volatile long sLoadEndTime = 0;

  private static boolean sDidInit = false;

  // Office implementation of RN can work with two JS Engines: V8 and JSC.
  // There is a compile time flag to decide which one will be used and V8 is the default one.
  // We are exposing an API from ReactBridge so that consumer can choose JSC if required.
  private static boolean sUseJSC = false;

  public static void staticInit() {
    if (sDidInit) {
      return;
    }
    sDidInit = true;

    if(BuildConfig.JS_ENGINE_USED.equals("JSC")){
      sUseJSC = true;
    }

    sLoadStartTime = SystemClock.uptimeMillis();
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "ReactBridge.staticInit::load:reactnativejni");
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_START);

    if (sUseJSC) {
      SoLoader.loadLibrary("icu_common");
      SoLoader.loadLibrary("jsc");
    }
    else {
      SoLoader.loadLibrary("v8_libbase.cr");
      SoLoader.loadLibrary("v8_libplatform.cr");
      SoLoader.loadLibrary("v8.cr");
    }

    SoLoader.loadLibrary("glog_init");
    SoLoader.loadLibrary("privatedata");
    SoLoader.loadLibrary("fb");
    SoLoader.loadLibrary("yoga");
    SoLoader.loadLibrary("reactnativejni");
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_END);
    Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    sLoadEndTime = SystemClock.uptimeMillis();
  }

  public static long getLoadStartTime() {
    return sLoadStartTime;
  }

  public static long getLoadEndTime() {
    return sLoadEndTime;
  }
}