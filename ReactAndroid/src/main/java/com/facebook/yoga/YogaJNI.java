/*
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.yoga;

import com.facebook.soloader.SoLoader;

public class YogaJNI {
  // set before loading any other Yoga code
  public static boolean useFastCall = false;

  private static native void jni_bindNativeMethods(boolean useFastCall);

  static boolean init() {
    if (SoLoader.loadLibrary("yoga")) {
      jni_bindNativeMethods(useFastCall);
      return true;
    }

    return false;
  }
}
