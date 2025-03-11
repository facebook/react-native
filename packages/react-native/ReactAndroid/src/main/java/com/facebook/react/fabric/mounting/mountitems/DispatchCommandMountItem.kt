/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

import androidx.annotation.UiThread

/**
 * This is a common interface for View Command operations. Once we delete the deprecated {@link
 * DispatchIntCommandMountItem}, we can delete this interface too. It provides a set of common
 * operations to simplify generic operations on all types of ViewCommands.
 */
internal abstract class DispatchCommandMountItem : MountItem {
  private var numRetries: Int = 0

  @UiThread
  fun incrementRetries() {
    numRetries++
  }

  @UiThread fun getRetries(): Int = numRetries
}
