/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

/**
 * Interface for receiving notification for bridge idle/busy events. Should not affect application
 * logic and should only be used for debug/monitoring/testing purposes.  Call
 * {@link CatalystInstance#addBridgeIdleDebugListener} to start monitoring.
 *
 * NB: onTransitionToBridgeIdle and onTransitionToBridgeBusy may be called from different threads,
 * and those threads may not be the same thread on which the listener was originally registered.
 */
public interface NotThreadSafeBridgeIdleDebugListener {

  /**
   * Called once all pending JS calls have resolved via an onBatchComplete call in the bridge and
   * the requested native module calls have also run. The bridge will not become busy again until
   * a timer, touch event, etc. causes a Java->JS call to be enqueued again.
   */
  void onTransitionToBridgeIdle();

  /**
   * Called when the bridge was in an idle state and executes a JS call or callback.
   */
  void onTransitionToBridgeBusy();
}
