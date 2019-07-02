/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.uimanager.events;

/** Touch event types that JS module RCTEventEmitter can understand */
public enum TouchEventType {
  START,
  END,
  MOVE,
  CANCEL;

  public static String getJSEventName(TouchEventType type) {
    switch (type) {
      case START:
        return "topTouchStart";
      case END:
        return "topTouchEnd";
      case MOVE:
        return "topTouchMove";
      case CANCEL:
        return "topTouchCancel";
      default:
        throw new IllegalArgumentException("Unexpected type " + type);
    }
  }
}
