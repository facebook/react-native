/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import java.util.Objects

/**
 * Represents the identifying criteria of a synchronous event that was sent directly on the main
 * thread. Used to determine if subsequent events are duplicates and should not be emitted.
 */
internal class SynchronousEvent(
    val surfaceId: Int,
    val viewTag: Int,
    val eventName: String,
) {

  override fun equals(other: Any?): Boolean {
    if (this === other) {
      return true
    }
    if (javaClass != other?.javaClass) {
      return false
    }
    other as SynchronousEvent
    return (surfaceId == other.surfaceId &&
        viewTag == other.viewTag &&
        eventName == other.eventName)
  }

  override fun hashCode(): Int = Objects.hash(surfaceId, viewTag, eventName)
}
