/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import android.util.Log;

import com.facebook.react.common.ReactConstants;
import com.facebook.soloader.SoLoader;

public class ReactBridge {
  private static boolean sDidInit = false;

  // Office implementation of RN can work with two JS Engines: V8 and JSC.
  // There is a compile time flag to decide which one will be used and V8 is the default one.
  // We are exposing an API from ReactBridge so that consumer can choose JSC if required.
  private static boolean sUseJSC = false;

  public static void staticInit() {
    // No locking required here, worst case we'll call into SoLoader twice
    // which will do its own locking internally
    if (!sDidInit) {
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
      sDidInit = true;
    }
  }

  public static void useJSC() {
    sUseJSC = true;
  }
}