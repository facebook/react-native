/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal

import android.view.Choreographer.FrameCallback

public interface ChoreographerProvider {
  /**
   * The interface to a android.view.Choreographer-like object, that can either use the
   * android.view.Choreographer or a mock one for testing purposes, or override built-in
   * android.view.Choreographer's behaviors.
   */
  public interface Choreographer {
    /** Posts a frame callback to run on the next frame. */
    public fun postFrameCallback(callback: FrameCallback)

    /** Removes a previously posted frame callback. */
    public fun removeFrameCallback(callback: FrameCallback)
  }

  /**
   * Get an instance of Choreographer.
   *
   * @return An instance of Choreographer.
   */
  public fun getChoreographer(): Choreographer
}
