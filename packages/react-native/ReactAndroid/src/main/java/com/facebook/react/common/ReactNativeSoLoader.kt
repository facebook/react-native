/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

import com.facebook.react.BuildConfig
import com.facebook.soloader.SoLoader

public object ReactNativeSoLoader {

  private var isReactNativeSoLoaded = false

  private fun shouldLoadOnlyReactNativeSo(): Boolean = BuildConfig.IS_INTERNAL_BUILD.not()

  @JvmStatic
  public fun loadLibrary(shortName: String?): Boolean =
      if (shouldLoadOnlyReactNativeSo()) {
        if (!isReactNativeSoLoaded) {
          // We don't need to use SoLoader at all at this point as we're handling the
          // merging of the .so libraries manually.
          System.loadLibrary("reactnative")
          isReactNativeSoLoaded = true
        }
        true
      } else {
        SoLoader.loadLibrary(shortName)
      }
}
