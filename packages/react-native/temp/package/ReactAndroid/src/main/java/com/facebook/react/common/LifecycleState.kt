/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

/**
 * Lifecycle state for an Activity. The state right after pause and right before resume are the
 * basically the same so this enum is in terms of the forward lifecycle progression (onResume, etc).
 *
 * <p>BEFORE_CREATE is used before a ReactRootView is attached to ReactInstanceManager, or after all
 * the ReactRootView has been detached from the ReactInstanceManager.
 *
 * <p>BEFORE_RESUME is used after a ReactRootView is attached to ReactInstanceManager but before
 * it's activity is resumed, or after its activity has been paused and before the ReactRootView has
 * been detached from the ReactInstanceManager.
 *
 * <p>RESUMED is used when a ReactRootView is rendered on the screen and the user can interact with
 * it.
 */
public enum class LifecycleState {
  BEFORE_CREATE,
  BEFORE_RESUME,
  RESUMED,
}
