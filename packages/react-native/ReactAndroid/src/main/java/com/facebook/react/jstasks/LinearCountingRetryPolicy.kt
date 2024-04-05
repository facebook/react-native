/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.jstasks

public class LinearCountingRetryPolicy(
    private val retryAttempts: Int,
    private val delayBetweenAttemptsInMs: Int
) : HeadlessJsTaskRetryPolicy {

  override public fun canRetry(): Boolean = retryAttempts > 0

  override public fun getDelay(): Int = delayBetweenAttemptsInMs

  override public fun update(): HeadlessJsTaskRetryPolicy {
    val remainingRetryAttempts = retryAttempts - 1

    return if (remainingRetryAttempts > 0) {
      LinearCountingRetryPolicy(remainingRetryAttempts, delayBetweenAttemptsInMs)
    } else {
      NoRetryPolicy.INSTANCE
    }
  }

  override public fun copy(): HeadlessJsTaskRetryPolicy =
      LinearCountingRetryPolicy(retryAttempts, delayBetweenAttemptsInMs)
}
