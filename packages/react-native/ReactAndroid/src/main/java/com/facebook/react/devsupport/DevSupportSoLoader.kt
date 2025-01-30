/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import com.facebook.soloader.SoLoader

internal object DevSupportSoLoader {
  @Volatile private var didInit: Boolean = false

  @JvmStatic
  @Synchronized
  fun staticInit() {
    if (didInit) {
      return
    }
    SoLoader.loadLibrary("react_devsupportjni")
    didInit = true
  }
}
