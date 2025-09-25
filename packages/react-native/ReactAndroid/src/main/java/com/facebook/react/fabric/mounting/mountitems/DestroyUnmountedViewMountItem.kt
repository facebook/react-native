/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

import com.facebook.react.fabric.mounting.MountingManager

/**
 * Destroyes the view asociated to the [reactTag] if exists. This MountItem is meant to be used ONLY
 * for views that were preallcated but never mounted on the screen.
 */
internal class DestroyUnmountedViewMountItem(
    private val surfaceId: Int,
    private val reactTag: Int,
) : MountItem {

  override fun execute(mountingManager: MountingManager) {
    val surfaceMountingManager = mountingManager.getSurfaceManager(surfaceId) ?: return
    surfaceMountingManager.deleteView(reactTag)
  }

  override fun getSurfaceId(): Int = surfaceId
}
