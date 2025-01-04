/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // Suppressing as we want to fake a RCTEventEmitter here

package com.facebook.react.bridge.interop

import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.uimanager.events.RCTEventEmitter

@UnstableReactNativeAPI
class FakeRCTEventEmitter : RCTEventEmitter {

  @Deprecated("Deprecated in Java")
  override fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?) = Unit

  @Deprecated("Deprecated in Java")
  override fun receiveTouches(
      eventName: String,
      touches: WritableArray,
      changedIndices: WritableArray
  ) = Unit
}
