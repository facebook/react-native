/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue

import android.os.Handler
import android.os.Looper
import android.os.Message

/** Handler that can catch and dispatch Exceptions to an Exception handler. */
internal class MessageQueueThreadHandler(
    looper: Looper,
    private val exceptionHandler: QueueThreadExceptionHandler
) : Handler(looper) {
  override fun dispatchMessage(msg: Message) {
    try {
      super.dispatchMessage(msg)
    } catch (e: Exception) {
      exceptionHandler.handleException(e)
    }
  }
}
