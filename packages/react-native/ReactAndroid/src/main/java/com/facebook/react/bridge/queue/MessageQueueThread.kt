/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.bridge.queue

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.AssertionException
import java.util.concurrent.Callable
import java.util.concurrent.Future

/** Encapsulates a Thread that can accept Runnables.  */
@DoNotStrip
public interface MessageQueueThread {
    /**
     * Runs the given Runnable on this Thread. It will be submitted to the end of the event queue even
     * if it is being submitted from the same queue Thread.
     */
    @DoNotStrip
    public fun runOnQueue(runnable: Runnable): Boolean

    /**
     * Runs the given Callable on this Thread. It will be submitted to the end of the event queue even
     * if it is being submitted from the same queue Thread.
     */
    @DoNotStrip
    public fun <T> callOnQueue(callable: Callable<T>): Future<T?>

    @DoNotStrip
    public fun isOnThread(): Boolean

    /**
     * Asserts [.isOnThread], throwing a [AssertionException] (NOT an [ ]) if the assertion fails.
     */
    @DoNotStrip
    public fun assertIsOnThread()

    /**
     * Asserts [.isOnThread], throwing a [AssertionException] (NOT an [ ]) if the assertion fails. The given message is appended to the error.
     */
    @DoNotStrip
    public fun assertIsOnThread(message: String)

    /**
     * Quits this MessageQueueThread. If called from this MessageQueueThread, this will be the last
     * thing the thread runs. If called from a separate thread, this will block until the thread can
     * be quit and joined.
     */
    @DoNotStrip
    public fun quitSynchronous()

    @DoNotStrip
    public fun getPerfStats(): MessageQueueThreadPerfStats?

    /**
     * Resets the perf counters. This is useful if the RN threads are being re-used. This method is
     * intended to be used for instrumentation purposes.
     */
    @DoNotStrip
    public fun resetPerfStats()

    @DoNotStrip
    public fun isIdle(): Boolean
}
