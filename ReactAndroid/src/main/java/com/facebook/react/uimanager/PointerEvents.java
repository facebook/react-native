/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import java.util.Locale;

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

  public static PointerEvents parsePointerEvents(String pointerEventsStr) {
    if (pointerEventsStr == null) {
      return PointerEvents.AUTO;
    } else {
      return PointerEvents.valueOf(pointerEventsStr.toUpperCase(Locale.US).replace("-", "_"));
    }
  }

  public static boolean canBeTouchTarget(PointerEvents pointerEvents) {
    return pointerEvents == AUTO || pointerEvents == PointerEvents.BOX_ONLY;
  }

  public static boolean canChildrenBeTouchTarget(PointerEvents pointerEvents) {
    return pointerEvents == PointerEvents.AUTO || pointerEvents == PointerEvents.BOX_NONE;
  }
}
