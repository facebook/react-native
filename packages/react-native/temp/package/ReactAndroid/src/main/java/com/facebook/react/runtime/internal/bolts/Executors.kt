/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime.internal.bolts

import com.facebook.react.bridge.UiThreadUtil
import java.util.concurrent.Executor

/**
 * This was created because the helper methods in [java.util.concurrent.Executors] do not work as
 * people would normally expect.
 *
 * Normally, you would think that a cached thread pool would create new threads when necessary,
 * queue them when the pool is full, and kill threads when they've been inactive for a certain
 * period of time. This is not how [java.util.concurrent.Executors.newCachedThreadPool] works.
 *
 * Instead, [java.util.concurrent.Executors.newCachedThreadPool] executes all tasks on a new or
 * cached thread immediately because corePoolSize is 0, SynchronousQueue is a queue with size 0 and
 * maxPoolSize is Integer.MAX_VALUE. This is dangerous because it can create an unchecked amount of
 * threads.
 */
internal object Executors {
  @JvmField public val UI_THREAD: Executor = UIThreadExecutor()
  @JvmField public val IMMEDIATE: Executor = ImmediateExecutor()

  private class UIThreadExecutor : Executor {
    override fun execute(command: Runnable) {
      UiThreadUtil.runOnUiThread(command)
    }
  }

  /**
   * An [java.util.concurrent.Executor] that schedules tasks to run asynchronously on the UI thread.
   */
  private class ImmediateExecutor : Executor {
    override fun execute(command: Runnable) {
      command.run()
    }
  }
}
