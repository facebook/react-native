/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

/** Touch event types that JS module RCTEventEmitter can understand */
public enum class TouchEventType(private val jsName: String) {
  START("topTouchStart"),
  END("topTouchEnd"),
  MOVE("topTouchMove"),
  CANCEL("topTouchCancel");

  public fun getJsName(): String = jsName

  public companion object {
    @JvmStatic public fun getJSEventName(type: TouchEventType): String = type.getJsName()
  }
}
