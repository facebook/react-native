/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress(
    "DEPRECATION") // Suppressing deprecation of NotThreadSafeViewHierarchyUpdateDebugListener

package com.facebook.react.modules.debug

import com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener
import com.facebook.react.uimanager.debug.NotThreadSafeViewHierarchyUpdateDebugListener

/**
 * Debug object that listens to bridge busy/idle events and UiManagerModule dispatches and uses it
 * to calculate whether JS was able to update the UI during a given frame. After being installed on
 * a [ReactBridge] and a [com.facebook.react.uimanager.UIManagerModule],
 * [getDidJSHitFrameAndCleanup] should be called once per frame via a
 * [android.view.Choreographer.FrameCallback].
 */
internal class DidJSUpdateUiDuringFrameDetector :
    NotThreadSafeBridgeIdleDebugListener, NotThreadSafeViewHierarchyUpdateDebugListener {
  private val transitionToIdleEvents = ArrayList<Long>(20)
  private val transitionToBusyEvents = ArrayList<Long>(20)
  private val viewHierarchyUpdateEnqueuedEvents = ArrayList<Long>(20)
  private val viewHierarchyUpdateFinishedEvents = ArrayList<Long>(20)
  @Volatile private var wasIdleAtEndOfLastFrame = true

  @Synchronized
  override fun onTransitionToBridgeIdle() {
    transitionToIdleEvents.add(System.nanoTime())
  }

  @Synchronized
  override fun onTransitionToBridgeBusy() {
    transitionToBusyEvents.add(System.nanoTime())
  }

  @Synchronized
  override fun onBridgeDestroyed() {
    // do nothing
  }

  @Synchronized
  override fun onViewHierarchyUpdateEnqueued() {
    viewHierarchyUpdateEnqueuedEvents.add(System.nanoTime())
  }

  @Synchronized
  override fun onViewHierarchyUpdateFinished() {
    viewHierarchyUpdateFinishedEvents.add(System.nanoTime())
  }

  /**
   * Designed to be called from a [android.view.Choreographer.FrameCallback.doFrame] call.
   *
   * There are two 'success' cases that will cause [getDidJSHitFrameAndCleanup] to return true for a
   * given frame:
   * 1. UIManagerModule finished dispatching a batched UI update on the UI thread during the frame.
   *    This means that during the next hierarchy traversal, new UI will be drawn if needed (good).
   * 1. The bridge ended the frame idle (meaning there were no JS nor native module calls still in
   *    flight) AND there was no UiManagerModule update enqueued that didn't also finish. NB: if
   *    there was one enqueued that actually finished, we'd have case 1), so effectively we just
   *    look for whether one was enqueued.
   *
   * NB: This call can only be called once for a given frame time range because it cleans up events
   * it recorded for that frame.
   *
   * NB2: This makes the assumption that [onViewHierarchyUpdateEnqueued] is called from the
   * [com.facebook.react.uimanager.UIManagerModule.onBatchComplete], e.g. while the bridge is still
   * considered busy, which means there is no race condition where the bridge has gone idle but a
   * hierarchy update is waiting to be enqueued.
   *
   * @param frameStartTimeNanos the time in nanos that the last frame started
   * @param frameEndTimeNanos the time in nanos that the last frame ended
   */
  @Synchronized
  fun getDidJSHitFrameAndCleanup(frameStartTimeNanos: Long, frameEndTimeNanos: Long): Boolean {
    // Case 1: We dispatched a UI update
    val finishedUiUpdate =
        hasEventBetweenTimestamps(
            viewHierarchyUpdateFinishedEvents, frameStartTimeNanos, frameEndTimeNanos)
    val didEndFrameIdle = didEndFrameIdle(frameStartTimeNanos, frameEndTimeNanos)
    val hitFrame =
        if (finishedUiUpdate) {
          true
        } else {
          // Case 2: Ended idle but no UI was enqueued during that frame
          (didEndFrameIdle &&
              !hasEventBetweenTimestamps(
                  viewHierarchyUpdateEnqueuedEvents, frameStartTimeNanos, frameEndTimeNanos))
        }
    cleanUp(transitionToIdleEvents, frameEndTimeNanos)
    cleanUp(transitionToBusyEvents, frameEndTimeNanos)
    cleanUp(viewHierarchyUpdateEnqueuedEvents, frameEndTimeNanos)
    cleanUp(viewHierarchyUpdateFinishedEvents, frameEndTimeNanos)
    wasIdleAtEndOfLastFrame = didEndFrameIdle
    return hitFrame
  }

  private fun didEndFrameIdle(startTime: Long, endTime: Long): Boolean {
    val lastIdleTransition =
        getLastEventBetweenTimestamps(transitionToIdleEvents, startTime, endTime)
    val lastBusyTransition =
        getLastEventBetweenTimestamps(transitionToBusyEvents, startTime, endTime)
    return if (lastIdleTransition == -1L && lastBusyTransition == -1L) {
      wasIdleAtEndOfLastFrame
    } else lastIdleTransition > lastBusyTransition
  }
}

private fun hasEventBetweenTimestamps(
    eventArray: ArrayList<Long>,
    startTime: Long,
    endTime: Long
): Boolean = eventArray.any { time -> time in startTime until endTime }

private fun getLastEventBetweenTimestamps(
    eventArray: ArrayList<Long>,
    startTime: Long,
    endTime: Long
): Long {
  var lastEvent: Long = -1
  for (time in eventArray) {
    if (time in startTime until endTime) {
      lastEvent = time
    } else if (time >= endTime) {
      break
    }
  }
  return lastEvent
}

private fun cleanUp(eventArray: ArrayList<Long>, endTime: Long) {
  val size = eventArray.size
  var indicesToRemove = 0
  for (i in 0 until size) {
    if (eventArray[i] < endTime) {
      indicesToRemove++
    }
  }
  if (indicesToRemove > 0) {
    for (i in 0 until size - indicesToRemove) {
      eventArray[i] = eventArray[i + indicesToRemove]
    }
    eventArray.dropLast(indicesToRemove)
  }
}
