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
 * Listener for receiving activity/service lifecycle events.
 */
public interface LifecycleEventListener {

  /**
   * Called when host (activity/service) receives resume event (e.g. {@link Activity#onResume}
   */
  void onHostResume();

  /**
   * Called when host (activity/service) receives pause event (e.g. {@link Activity#onPause}
   */
  void onHostPause();

  /**
   * Called when host (activity/service) receives destroy event (e.g. {@link Activity#onDestroy}
   */
  void onHostDestroy();

}
