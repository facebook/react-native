/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.RetryableMountingLayerException
import com.facebook.react.fabric.mounting.MountingManager

internal class SendAccessibilityEventMountItem(
    private val _surfaceId: Int,
    private val reactTag: Int,
    private val eventType: Int,
) : MountItem {

  private val TAG = "Fabric.SendAccessibilityEvent"

  override fun execute(mountingManager: MountingManager) {
    try {
      mountingManager.sendAccessibilityEvent(_surfaceId, reactTag, eventType)
    } catch (e: RetryableMountingLayerException) {
      // Accessibility events are similar to commands in that they're imperative
      // calls from JS, disconnected from the commit lifecycle, and therefore
      // inherently unpredictable and dangerous. If we encounter a "retryable"
      // error, that is, a known category of errors that this is likely to hit
      // due to race conditions (like the view disappearing after the event is
      // queued and before it executes), we log a soft exception and continue along.
      // Other categories of errors will still cause a hard crash.
      ReactSoftExceptionLogger.logSoftException(TAG, ReactNoCrashSoftException(e))
    }
  }

  override fun getSurfaceId(): Int = _surfaceId

  override fun toString(): String = "SendAccessibilityEventMountItem [$reactTag] $eventType"
}
