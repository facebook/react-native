/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

import androidx.annotation.AnyThread
import androidx.annotation.UiThread
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.fabric.mounting.MountingManager

@DoNotStripAny
internal interface MountItem {
  /** Execute this [MountItem] into the operation queue received by parameter. */
  @UiThread fun execute(mountingManager: MountingManager)

  @AnyThread fun getSurfaceId(): Int
}
