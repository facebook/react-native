/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import com.facebook.infer.annotation.Nullsafe;

/** Touch event types that JS module RCTEventEmitter can understand */
@Nullsafe(Nullsafe.Mode.LOCAL)
public enum TouchEventType {
  START("topTouchStart"),
  END("topTouchEnd"),
  MOVE("topTouchMove"),
  CANCEL("topTouchCancel");

  private final String mJsName;

  TouchEventType(String jsName) {
    mJsName = jsName;
  }

  public String getJsName() {
    return mJsName;
  }

  public static String getJSEventName(TouchEventType type) {
    return type.getJsName();
  }
}
