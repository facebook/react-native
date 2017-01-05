/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.scroll;

public interface FpsListener {

  /**
   * Clients should call this method when they want the listener to begin recording data.
   *
   * @param tag
   */
  void enable(String tag);

  /**
   * Clients should call this method when they want the listener to stop recording data.
   * The listener will then report the data it collected.
   *
   * Calling disable on a listener that has already been disabled is a no-op.
   *
   * @param tag
   */
  void disable(String tag);

  /**
   * Reports whether this listener is recording data.
   */
  boolean isEnabled();
}
