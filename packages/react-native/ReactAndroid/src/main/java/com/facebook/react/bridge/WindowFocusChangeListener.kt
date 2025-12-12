/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/*
 * Listener for receiving window focus events.
 */
public interface WindowFocusChangeListener {
  public fun onWindowFocusChange(hasFocus: Boolean)
}
