/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

import com.facebook.soloader.SoLoader;
import com.facebook.systrace.Systrace;

public class ReactBridge {
  private static boolean sDidInit = false;
  public static void staticInit() {
    // No locking required here, worst case we'll call into SoLoader twice
    // which will do its own locking internally
    if (!sDidInit) {
      Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "ReactBridge.staticInit::load:reactnativejni");
      SoLoader.loadLibrary("reactnativejni");
      sDidInit = true;
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }
}
