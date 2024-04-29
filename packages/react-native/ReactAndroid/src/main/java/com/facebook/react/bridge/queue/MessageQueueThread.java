/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue;

import com.facebook.proguard.annotations.DoNotStrip;
import java.util.concurrent.Callable;
import java.util.concurrent.Future;

/** Encapsulates a Thread that can accept Runnables. */
@DoNotStrip
public interface MessageQueueThread {
  /**
   * Runs the given Runnable on this Thread. It will be submitted to the end of the event queue even
   * if it is being submitted from the same queue Thread.
   */
  @DoNotStrip
  boolean runOnQueue(Runnable runnable);

  /**
   * Runs the given Callable on this Thread. It will be submitted to the end of the event queue even
   * if it is being submitted from the same queue Thread.
   */
  @DoNotStrip
  <T> Future<T> callOnQueue(final Callable<T> callable);

  /**
   * @return whether the current Thread is also the Thread associated with this MessageQueueThread.
   */
  @DoNotStrip
  boolean isOnThread();

  /**
   * Asserts {@link #isOnThread()}, throwing a {@link AssertionException} (NOT an {@link
   * AssertionError}) if the assertion fails.
   */
  @DoNotStrip
  void assertIsOnThread();

  /**
   * Asserts {@link #isOnThread()}, throwing a {@link AssertionException} (NOT an {@link
   * AssertionError}) if the assertion fails. The given message is appended to the error.
   */
  @DoNotStrip
  void assertIsOnThread(String message);

  /**
   * Quits this MessageQueueThread. If called from this MessageQueueThread, this will be the last
   * thing the thread runs. If called from a separate thread, this will block until the thread can
   * be quit and joined.
   */
  @DoNotStrip
  void quitSynchronous();

  /**
   * Returns the perf counters taken when the framework was started. This method is intended to be
   * used for instrumentation purposes.
   */
  @DoNotStrip
  MessageQueueThreadPerfStats getPerfStats();

  /**
   * Resets the perf counters. This is useful if the RN threads are being re-used. This method is
   * intended to be used for instrumentation purposes.
   */
  @DoNotStrip
  void resetPerfStats();

  /** Returns true if the message queue is idle */
  @DoNotStrip
  boolean isIdle();
}
