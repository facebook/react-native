/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.interfaces.ReactHostInterface

@OptIn(UnstableReactNativeAPI::class)
/** Interface that represents an instance of a React Native application */
interface ReactApplication {
  /** Get the default [ReactNativeHost] for this app. */
  val reactNativeHost: ReactNativeHost

  /**
   * Get the default [ReactHostInterface] for this app. This method will be used by the new
   * architecture of react native
   */
  val reactHostInterface: ReactHostInterface?
    get() = null
}
