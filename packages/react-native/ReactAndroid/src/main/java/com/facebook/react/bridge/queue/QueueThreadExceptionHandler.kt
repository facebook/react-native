/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue

/**
 * Interface for a class that knows how to handle an Exception thrown while executing a Runnable
 * submitted via [MessageQueueThread.runOnQueue].
 */
public fun interface QueueThreadExceptionHandler {
  public fun handleException(e: Exception)
}
