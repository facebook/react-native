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
  static {
    SoLoader.loadLibrary("reactnativejni");
  }

  public static void staticInit() {
    // This method only exists to trigger the static initializer above
  }
}
