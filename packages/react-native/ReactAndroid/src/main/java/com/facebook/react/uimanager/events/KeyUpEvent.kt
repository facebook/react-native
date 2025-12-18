/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import android.view.KeyEvent as AndroidKeyEvent

/** An event representing a key release (keyup). Corresponds to W3C KeyboardEvent specification. */
internal class KeyUpEvent(
    surfaceId: Int,
    viewTag: Int,
    keyEvent: AndroidKeyEvent,
) : KeyEvent(surfaceId, viewTag, keyEvent) {

  override fun getEventName(): String = EVENT_NAME

  companion object {
    private const val EVENT_NAME: String = "topKeyUp"
  }
}
