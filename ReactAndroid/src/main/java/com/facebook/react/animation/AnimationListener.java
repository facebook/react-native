/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animation;

/**
 * Interface for getting animation lifecycle updates. It is guaranteed that for a given animation,
 * only one of onFinished and onCancel will be called, and it will be called exactly once.
 */
public interface AnimationListener {

  /**
   * Called once animation is finished
   */
  public void onFinished();

  /**
   * Called in case when animation was cancelled
   */
  public void onCancel();
}
