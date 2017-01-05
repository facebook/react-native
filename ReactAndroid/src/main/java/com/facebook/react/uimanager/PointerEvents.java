/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

/**
 * Possible values for pointer events that a view and its descendants should receive. See
 * https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events for more info.
 */
public enum PointerEvents {

  /**
   * Neither the container nor its children receive events.
   */
  NONE,

  /**
   * Container doesn't get events but all of its children do.
   */
  BOX_NONE,

  /**
   * Container gets events but none of its children do.
   */
  BOX_ONLY,

  /**
   * Container and all of its children receive touch events (like pointerEvents is unspecified).
   */
  AUTO,
  ;
}
