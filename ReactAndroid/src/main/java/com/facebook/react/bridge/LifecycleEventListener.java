/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

/**
 * Listener for receiving activity lifecycle events.
 *
 * <p>When multiple activities share a react instance, only the most recent one's lifecycle events
 * get forwarded to listeners. Consider the following scenarios:
 *
 * <ol>
 *   <li>Navigating from Activity A to B will trigger two events: A#onHostPause and B#onHostResume.
 *       Any subsequent lifecycle events coming from Activity A, such as onHostDestroy, will be
 *       ignored.
 *   <li>Navigating back from Activity B to Activity A will trigger the same events: B#onHostPause
 *       and A#onHostResume. Any subsequent events coming from Activity B, such as onHostDestroy,
 *       are ignored.
 *   <li>Navigating back from Activity A to a non-React Activity or to the home screen will trigger
 *       two events: onHostPause and onHostDestroy.
 *   <li>Navigating from Activity A to a non-React Activity B will trigger one event: onHostPause.
 *       Later, if Activity A is destroyed (e.g. because of resource contention), onHostDestroy is
 *       triggered.
 * </ol>
 */
public interface LifecycleEventListener {

  /**
   * Called either when the host activity receives a resume event (e.g. {@link Activity#onResume} or
   * if the native module that implements this is initialized while the host activity is already
   * resumed. Always called for the most current activity.
   */
  void onHostResume();

  /**
   * Called when host activity receives pause event (e.g. {@link Activity#onPause}. Always called
   * for the most current activity.
   */
  void onHostPause();

  /**
   * Called when host activity receives destroy event (e.g. {@link Activity#onDestroy}. Only called
   * for the last React activity to be destroyed.
   */
  void onHostDestroy();
}
