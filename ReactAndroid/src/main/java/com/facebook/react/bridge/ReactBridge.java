/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import com.facebook.soloader.SoLoader;

public class ReactBridge {
  private static boolean sDidInit = false;
  public static void staticInit() {
    // No locking required here, worst case we'll call into SoLoader twice
    // which will do its own locking internally
    if (!sDidInit) {
      SoLoader.loadLibrary("reactnativejni");
      sDidInit = true;
    }
  }
}
