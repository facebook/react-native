/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal.turbomodule.core

import com.facebook.soloader.SoLoader

public class NativeModuleSoLoader {
  public companion object {
    private var isSoLibraryLoaded = false

    @Synchronized
    @JvmStatic
    public fun maybeLoadSoLibrary() {
      if (!isSoLibraryLoaded) {
        SoLoader.loadLibrary("turbomodulejsijni")
        isSoLibraryLoaded = true
      }
    }
  }
}
