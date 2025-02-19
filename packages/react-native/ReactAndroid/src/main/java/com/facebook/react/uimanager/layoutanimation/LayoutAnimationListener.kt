/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

/** Listener invoked when a layout animation has completed. */
public fun interface LayoutAnimationListener {
  public fun onAnimationEnd()
}
