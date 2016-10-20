/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.common;

/**
 * Lifecycle state for an Activity. The state right after pause and right before resume are the
 * basically the same so this enum is in terms of the forward lifecycle progression (onResume, etc).
 * Eventually, if necessary, it could contain something like:
 *
 * BEFORE_CREATE,
 * CREATED,
 * VIEW_CREATED,
 * STARTED,
 * RESUMED
 */
public enum LifecycleState {
  BEFORE_CREATE,
  BEFORE_RESUME,
  RESUMED,
}
