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

  private static final String REACT_NATIVE_LIB = "reactnativejni";
  private static final String XREACT_NATIVE_LIB = "reactnativejnifb";

  static {
    staticInit();
  }

  public static void staticInit() {
    SoLoader.loadLibrary(REACT_NATIVE_LIB);
    SoLoader.loadLibrary(XREACT_NATIVE_LIB);
  }
}
