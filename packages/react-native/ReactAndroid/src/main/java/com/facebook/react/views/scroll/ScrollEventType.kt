/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

/** Scroll event types that JS module RCTEventEmitter can understand */
public enum class ScrollEventType {
  BEGIN_DRAG,
  END_DRAG,
  SCROLL,
  MOMENTUM_BEGIN,
  MOMENTUM_END;

  public companion object {
    @JvmStatic
    public fun getJSEventName(type: ScrollEventType): String =
        when (type) {
          BEGIN_DRAG -> "topScrollBeginDrag"
          END_DRAG -> "topScrollEndDrag"
          SCROLL -> "topScroll"
          MOMENTUM_BEGIN -> "topMomentumScrollBegin"
          MOMENTUM_END -> "topMomentumScrollEnd"
        }
  }
}
