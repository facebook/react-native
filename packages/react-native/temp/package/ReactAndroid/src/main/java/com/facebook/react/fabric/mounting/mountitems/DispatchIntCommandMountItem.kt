/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.fabric.mounting.MountingManager

internal class DispatchIntCommandMountItem(
    private val surfaceId: Int,
    private val reactTag: Int,
    private val commandId: Int,
    private val commandArgs: ReadableArray?
) : DispatchCommandMountItem() {

  override public fun getSurfaceId(): Int = surfaceId

  override public fun execute(mountingManager: MountingManager) {
    @Suppress("DEPRECATION")
    mountingManager.receiveCommand(surfaceId, reactTag, commandId, commandArgs)
  }

  override public fun toString(): String = "DispatchIntCommandMountItem [$reactTag] $commandId"
}
