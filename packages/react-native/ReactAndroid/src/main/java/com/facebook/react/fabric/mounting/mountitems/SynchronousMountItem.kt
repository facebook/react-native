/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

import android.view.View
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.fabric.FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT
import com.facebook.react.fabric.mounting.MountingManager

internal class SynchronousMountItem(private val reactTag: Int, private val props: ReadableMap) :
    MountItem {

  override fun execute(mountingManager: MountingManager) {
    try {
      mountingManager.storeSynchronousMountPropsOverride(reactTag, props)
      mountingManager.updatePropsSynchronously(reactTag, props)
    } catch (ex: Exception) {
      // TODO T42943890: Fix animations in Fabric and remove this try/catch?
      // There might always be race conditions between surface teardown and
      // animations/other operations, so it may not be feasible to remove this.
      // Practically 100% of reported errors from this point are because the
      // surface has stopped by this point, but the MountItem was queued before
      // the surface was stopped. It's likely not feasible to prevent all such races.
    }
  }

  override fun toString(): String {
    val propsString = if (IS_DEVELOPMENT_ENVIRONMENT) props.toHashMap().toString() else "<hidden>"
    return "SYNC UPDATE PROPS [$reactTag]: $propsString"
  }

  override fun getSurfaceId(): Int = View.NO_ID
}
