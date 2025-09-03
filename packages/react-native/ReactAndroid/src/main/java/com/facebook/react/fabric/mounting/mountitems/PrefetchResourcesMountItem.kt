/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.mapbuffer.ReadableMapBuffer
import com.facebook.react.fabric.mounting.MountingManager

internal class PrefetchResourcesMountItem(
    private val reactApplicationContext: ReactApplicationContext,
    private val componentName: String,
    private val params: ReadableMapBuffer,
) : MountItem {

  @OptIn(UnstableReactNativeAPI::class, FrameworkAPI::class)
  override fun execute(mountingManager: MountingManager) {
    mountingManager.experimental_prefetchResources(
        reactApplicationContext,
        componentName,
        params,
    )
  }

  override fun getSurfaceId(): Int = -1 /* unused */

  override fun toString(): String = "PrefetchResourcesMountItem"
}
