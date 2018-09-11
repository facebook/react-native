/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import com.facebook.thecount.api.CountEnum;

/**
 * Scroll event types that JS module RCTEventEmitter can understand
 */
@CountEnum
public enum ScrollEventType {
  BEGIN_DRAG("topScrollBeginDrag"),
  END_DRAG("topScrollEndDrag"),
  SCROLL("topScroll"),
  MOMENTUM_BEGIN("topMomentumScrollBegin"),
  MOMENTUM_END("topMomentumScrollEnd");

  private final String mJSEventName;

  ScrollEventType(String jsEventName) {
    mJSEventName = jsEventName;
  }

  public String getJSEventName() {
    return mJSEventName;
  }
}
