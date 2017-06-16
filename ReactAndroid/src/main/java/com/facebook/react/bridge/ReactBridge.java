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
  public static void staticInit() {
    // Ideally we'd put this in static and only run it once, but that causes this method to get stripped
    SoLoader.loadLibrary("reactnativejni");
  }
}
