/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal;

public interface ChoreographerProvider {
  /**
   * The interface to a android.view.Choreographer-like object, that can either use the
   * android.view.Choreographer or a mock one for testing purposes, or override built-in
   * android.view.Choreographer's behaviors.
   */
  interface Choreographer {

    /** Posts a frame callback to run on the next frame. */
    void postFrameCallback(android.view.Choreographer.FrameCallback callback);
    /** Removes a previously posted frame callback. */
    void removeFrameCallback(android.view.Choreographer.FrameCallback callback);
  }

  /**
   * Get an instance of Choreographer.
   *
   * @return An instance of Choreographer.
   */
  Choreographer getChoreographer();
}
