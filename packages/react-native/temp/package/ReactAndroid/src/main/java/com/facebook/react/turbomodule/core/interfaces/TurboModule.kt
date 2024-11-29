/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core.interfaces
/** All turbo modules should inherit from this interface */
public interface TurboModule {
  /** Initialize the TurboModule. */
  public fun initialize()

  /**
   * Called during the turn down process of ReactHost. This method is called before React Native is
   * stopped. Override this method to clean up resources used by the TurboModule.
   */
  public fun invalidate()
}
