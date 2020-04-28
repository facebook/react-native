/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.uimanager;

/**
 * Possible values for pointer events that a view and its descendants should receive. See
 * https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events for more info.
 */
public enum PointerEvents {

  /** Neither the container nor its children receive events. */
  NONE,

  /** Container doesn't get events but all of its children do. */
  BOX_NONE,

  /** Container gets events but none of its children do. */
  BOX_ONLY,

  /** Container and all of its children receive touch events (like pointerEvents is unspecified). */
  AUTO,
  ;
}
