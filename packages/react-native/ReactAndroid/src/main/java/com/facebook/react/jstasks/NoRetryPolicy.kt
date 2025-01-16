/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.jstasks

internal class NoRetryPolicy private constructor() : HeadlessJsTaskRetryPolicy {

  override fun canRetry(): Boolean = false

  override val delay: Int
    get() = throw IllegalStateException("Should not retrieve delay as canRetry is: ${canRetry()}")

  override fun update(): HeadlessJsTaskRetryPolicy {
    throw IllegalStateException("Should not update as canRetry is: ${canRetry()}")
  }

  // Class is immutable so no need to copy
  override fun copy(): HeadlessJsTaskRetryPolicy = this

  companion object {
    @JvmField val INSTANCE: NoRetryPolicy = NoRetryPolicy()
  }
}
