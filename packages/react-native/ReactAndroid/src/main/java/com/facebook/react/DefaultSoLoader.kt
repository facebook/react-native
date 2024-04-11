/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.soloader.SoLoader

public class DefaultSoLoader {
  public companion object {
    @Synchronized
    @JvmStatic
    public fun maybeLoadSoLibrary() {
      SoLoader.loadLibrary("react_newarchdefaults")
      try {
        SoLoader.loadLibrary("appmodules")
      } catch (e: UnsatisfiedLinkError) {
        // ignore: DefaultTurboModuleManagerDelegate is still used in apps that don't have
        // appmodules.so
      }
    }
  }
}
