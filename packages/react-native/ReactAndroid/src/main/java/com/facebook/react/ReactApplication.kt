/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

/** Interface that represents an instance of a React Native application */
public interface ReactApplication {
  /** Get the default [ReactNativeHost] for this app. */
  public val reactNativeHost: ReactNativeHost

  /**
   * Get the default [ReactHost] for this app. This method will be used by the new architecture of
   * react native
   */
  public val reactHost: ReactHost?
    get() = null
}
