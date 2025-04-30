/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

/** Interface used to listen to [ValueAnimatedNode] updates. */
public fun interface AnimatedNodeValueListener {
  public fun onValueUpdate(value: Double, offset: Double)
}
