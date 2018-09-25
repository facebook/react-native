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

  // Known constants. 1-3 used in previous experiments. Do not reuse.
  public static int JNI_FAST_CALLS = 4;

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
