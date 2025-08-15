/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.interfaces

import java.util.concurrent.TimeUnit

/**
 * This is the public interface for Task which represents the result of an asynchronous computation.
 */
public interface TaskInterface<TResult> {

  /** Blocks until the task is complete. */
  @Throws(InterruptedException::class) public fun waitForCompletion()

  /**
   * Blocks until the task is complete or times out.
   *
   * @return true if the task completed (has a result, an error, or was cancelled). false otherwise.
   */
  @Throws(InterruptedException::class)
  public fun waitForCompletion(duration: Long, timeUnit: TimeUnit): Boolean

  /** @return The result of the task, if set. null otherwise. */
  public fun getResult(): TResult?

  /** @return The error for the task, if set. null otherwise. */
  public fun getError(): Exception?

  /**
   * @return true if the task completed (has a result, an error, or was cancelled. false otherwise.
   */
  public fun isCompleted(): Boolean

  /** @return true if the task was cancelled, false otherwise. */
  public fun isCancelled(): Boolean

  /** @return true if the task has an error, false otherwise. */
  public fun isFaulted(): Boolean
}
