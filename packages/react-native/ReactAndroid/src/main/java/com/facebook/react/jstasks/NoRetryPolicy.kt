/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.jstasks

internal class NoRetryPolicy private constructor() : HeadlessJsTaskRetryPolicy {

  override public fun canRetry(): Boolean = false

  override public fun getDelay(): Int {
    throw IllegalStateException("Should not retrieve delay as canRetry is: ${canRetry()}")
  }

  override public fun update(): HeadlessJsTaskRetryPolicy {
    throw IllegalStateException("Should not update as canRetry is: ${canRetry()}")
  }

  // Class is immutable so no need to copy
  override public fun copy(): HeadlessJsTaskRetryPolicy = this

  public companion object {
    @JvmField public val INSTANCE: NoRetryPolicy = NoRetryPolicy()
  }
}
