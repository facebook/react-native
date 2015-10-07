/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
