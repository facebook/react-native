/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

/**
 * Scroll event types that JS module RCTEventEmitter can understand
 */
public enum ScrollEventType {
  BEGIN_DRAG,
  END_DRAG,
  SCROLL,
  MOMENTUM_BEGIN,
  MOMENTUM_END;

  public static String getJSEventName(ScrollEventType type) {
    switch (type) {
      case BEGIN_DRAG:
        return "topScrollBeginDrag";
      case END_DRAG:
        return "topScrollEndDrag";
      case SCROLL:
        return "topScroll";
      case MOMENTUM_BEGIN:
        return "topMomentumScrollBegin";
      case MOMENTUM_END:
        return "topMomentumScrollEnd";
      default:
        throw new IllegalArgumentException("Unsupported ScrollEventType: " + type);
    }
  }
}
