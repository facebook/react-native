/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

import com.facebook.react.common.annotations.internal.LegacyArchitecture

/** Listener invoked when a layout animation has completed. */
@LegacyArchitecture
public fun interface LayoutAnimationListener {
  public fun onAnimationEnd()
}
