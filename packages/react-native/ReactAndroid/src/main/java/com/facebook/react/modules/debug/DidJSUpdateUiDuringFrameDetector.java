/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.debug;

import android.view.Choreographer;
import com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener;
import com.facebook.react.bridge.ReactBridge;
import com.facebook.react.common.LongArray;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.debug.NotThreadSafeViewHierarchyUpdateDebugListener;

/**
 * Debug object that listens to bridge busy/idle events and UiManagerModule dispatches and uses it
 * to calculate whether JS was able to update the UI during a given frame. After being installed on
 * a {@link ReactBridge} and a {@link UIManagerModule}, {@link #getDidJSHitFrameAndCleanup} should
 * be called once per frame via a {@link Choreographer.FrameCallback}.
 */
class DidJSUpdateUiDuringFrameDetector
    implements NotThreadSafeBridgeIdleDebugListener, NotThreadSafeViewHierarchyUpdateDebugListener {

  private final LongArray mTransitionToIdleEvents = LongArray.createWithInitialCapacity(20);
  private final LongArray mTransitionToBusyEvents = LongArray.createWithInitialCapacity(20);
  private final LongArray mViewHierarchyUpdateEnqueuedEvents =
      LongArray.createWithInitialCapacity(20);
  private final LongArray mViewHierarchyUpdateFinishedEvents =
      LongArray.createWithInitialCapacity(20);
  private volatile boolean mWasIdleAtEndOfLastFrame = true;

  @Override
  public synchronized void onTransitionToBridgeIdle() {
    mTransitionToIdleEvents.add(System.nanoTime());
  }

  @Override
  public synchronized void onTransitionToBridgeBusy() {
    mTransitionToBusyEvents.add(System.nanoTime());
  }

  @Override
  public synchronized void onBridgeDestroyed() {
    // do nothing
  }

  @Override
  public synchronized void onViewHierarchyUpdateEnqueued() {
    mViewHierarchyUpdateEnqueuedEvents.add(System.nanoTime());
  }

  @Override
  public synchronized void onViewHierarchyUpdateFinished() {
    mViewHierarchyUpdateFinishedEvents.add(System.nanoTime());
  }

  /**
   * Designed to be called from a {@link Choreographer.FrameCallback#doFrame} call.
   *
   * <p>There are two 'success' cases that will cause {@link #getDidJSHitFrameAndCleanup} to return
   * true for a given frame:
   *
   * <ol>
   *   <li>UIManagerModule finished dispatching a batched UI update on the UI thread during the
   *       frame. This means that during the next hierarchy traversal, new UI will be drawn if
   *       needed (good).
   *   <li>The bridge ended the frame idle (meaning there were no JS nor native module calls still
   *       in flight) AND there was no UiManagerModule update enqueued that didn't also finish. NB:
   *       if there was one enqueued that actually finished, we'd have case 1), so effectively we
   *       just look for whether one was enqueued.
   * </ol>
   *
   * <p>NB: This call can only be called once for a given frame time range because it cleans up
   * events it recorded for that frame.
   *
   * <p>NB2: This makes the assumption that onViewHierarchyUpdateEnqueued is called from the {@link
   * UIManagerModule#onBatchComplete()}, e.g. while the bridge is still considered busy, which means
   * there is no race condition where the bridge has gone idle but a hierarchy update is waiting to
   * be enqueued.
   *
   * @param frameStartTimeNanos the time in nanos that the last frame started
   * @param frameEndTimeNanos the time in nanos that the last frame ended
   */
  public synchronized boolean getDidJSHitFrameAndCleanup(
      long frameStartTimeNanos, long frameEndTimeNanos) {
    // Case 1: We dispatched a UI update
    boolean finishedUiUpdate =
        hasEventBetweenTimestamps(
            mViewHierarchyUpdateFinishedEvents, frameStartTimeNanos, frameEndTimeNanos);
    boolean didEndFrameIdle = didEndFrameIdle(frameStartTimeNanos, frameEndTimeNanos);

    boolean hitFrame;
    if (finishedUiUpdate) {
      hitFrame = true;
    } else {
      // Case 2: Ended idle but no UI was enqueued during that frame
      hitFrame =
          didEndFrameIdle
              && !hasEventBetweenTimestamps(
                  mViewHierarchyUpdateEnqueuedEvents, frameStartTimeNanos, frameEndTimeNanos);
    }

    cleanUp(mTransitionToIdleEvents, frameEndTimeNanos);
    cleanUp(mTransitionToBusyEvents, frameEndTimeNanos);
    cleanUp(mViewHierarchyUpdateEnqueuedEvents, frameEndTimeNanos);
    cleanUp(mViewHierarchyUpdateFinishedEvents, frameEndTimeNanos);

    mWasIdleAtEndOfLastFrame = didEndFrameIdle;

    return hitFrame;
  }

  private static boolean hasEventBetweenTimestamps(
      LongArray eventArray, long startTime, long endTime) {
    for (int i = 0; i < eventArray.size(); i++) {
      long time = eventArray.get(i);
      if (time >= startTime && time < endTime) {
        return true;
      }
    }
    return false;
  }

  private static long getLastEventBetweenTimestamps(
      LongArray eventArray, long startTime, long endTime) {
    long lastEvent = -1;
    for (int i = 0; i < eventArray.size(); i++) {
      long time = eventArray.get(i);
      if (time >= startTime && time < endTime) {
        lastEvent = time;
      } else if (time >= endTime) {
        break;
      }
    }
    return lastEvent;
  }

  private boolean didEndFrameIdle(long startTime, long endTime) {
    long lastIdleTransition =
        getLastEventBetweenTimestamps(mTransitionToIdleEvents, startTime, endTime);
    long lastBusyTransition =
        getLastEventBetweenTimestamps(mTransitionToBusyEvents, startTime, endTime);

    if (lastIdleTransition == -1 && lastBusyTransition == -1) {
      return mWasIdleAtEndOfLastFrame;
    }

    return lastIdleTransition > lastBusyTransition;
  }

  private static void cleanUp(LongArray eventArray, long endTime) {
    int size = eventArray.size();
    int indicesToRemove = 0;
    for (int i = 0; i < size; i++) {
      if (eventArray.get(i) < endTime) {
        indicesToRemove++;
      }
    }

    if (indicesToRemove > 0) {
      for (int i = 0; i < size - indicesToRemove; i++) {
        eventArray.set(i, eventArray.get(i + indicesToRemove));
      }
      eventArray.dropTail(indicesToRemove);
    }
  }
}
