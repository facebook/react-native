/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

/**
 * Touch event types that JS module RCTEventEmitter can understand
 */
public enum TouchEventType {
  START("topTouchStart"),
  END("topTouchEnd"),
  MOVE("topTouchMove"),
  CANCEL("topTouchCancel");

  private final String mJSEventName;

  TouchEventType(String jsEventName) {
    mJSEventName = jsEventName;
  }

  public String getJSEventName() {
    return mJSEventName;
  }
}
