/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.soloader.SoLoader;

@Nullsafe(Nullsafe.Mode.LOCAL)
class DevSupportSoLoader {
  private static volatile boolean sDidInit = false;

  public static synchronized void staticInit() {
    if (sDidInit) {
      return;
    }
    SoLoader.loadLibrary("react_devsupportjni");
    sDidInit = true;
  }
}
