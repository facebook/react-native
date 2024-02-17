/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.bridge.ReactContext

/** Interface to subscribe for react instance events */
public interface ReactInstanceEventListener {
  /**
   * Called when the react context is initialized (all modules registered). Always called on the UI
   * thread.
   */
  public fun onReactContextInitialized(context: ReactContext)
}
