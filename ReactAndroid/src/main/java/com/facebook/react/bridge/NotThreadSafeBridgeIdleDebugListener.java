/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

/**
 * Interface for receiving notification for bridge idle/busy events. Should not affect application
 * logic and should only be used for debug/monitoring/testing purposes. Call {@link
 * CatalystInstance#addBridgeIdleDebugListener} to start monitoring.
 *
 * <p>NB: onTransitionToBridgeIdle and onTransitionToBridgeBusy may be called from different
 * threads, and those threads may not be the same thread on which the listener was originally
 * registered.
 */
public interface NotThreadSafeBridgeIdleDebugListener {

  /**
   * Called once all pending JS calls have resolved via an onBatchComplete call in the bridge and
   * the requested native module calls have also run. The bridge will not become busy again until a
   * timer, touch event, etc. causes a Java->JS call to be enqueued again.
   */
  void onTransitionToBridgeIdle();

  /** Called when the bridge was in an idle state and executes a JS call or callback. */
  void onTransitionToBridgeBusy();

  /** Called when the bridge is destroyed */
  void onBridgeDestroyed();
}
