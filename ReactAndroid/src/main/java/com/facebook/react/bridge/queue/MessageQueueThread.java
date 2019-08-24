/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge.queue;

import androidx.annotation.Keep;
import java.util.concurrent.Callable;
import java.util.concurrent.Future;

/** Encapsulates a Thread that can accept Runnables. */
@Keep
public interface MessageQueueThread {
  /**
   * Runs the given Runnable on this Thread. It will be submitted to the end of the event queue even
   * if it is being submitted from the same queue Thread.
   */
  @Keep
  void runOnQueue(Runnable runnable);

  /**
   * Runs the given Callable on this Thread. It will be submitted to the end of the event queue even
   * if it is being submitted from the same queue Thread.
   */
  @Keep
  <T> Future<T> callOnQueue(final Callable<T> callable);

  /**
   * @return whether the current Thread is also the Thread associated with this MessageQueueThread.
   */
  @Keep
  boolean isOnThread();

  /**
   * Asserts {@link #isOnThread()}, throwing a {@link AssertionException} (NOT an {@link
   * AssertionError}) if the assertion fails.
   */
  @Keep
  void assertIsOnThread();

  /**
   * Asserts {@link #isOnThread()}, throwing a {@link AssertionException} (NOT an {@link
   * AssertionError}) if the assertion fails. The given message is appended to the error.
   */
  @Keep
  void assertIsOnThread(String message);

  /**
   * Quits this MessageQueueThread. If called from this MessageQueueThread, this will be the last
   * thing the thread runs. If called from a separate thread, this will block until the thread can
   * be quit and joined.
   */
  @Keep
  void quitSynchronous();

  /**
   * Returns the perf counters taken when the framework was started. This method is intended to be
   * used for instrumentation purposes.
   */
  @Keep
  MessageQueueThreadPerfStats getPerfStats();

  /**
   * Resets the perf counters. This is useful if the RN threads are being re-used. This method is
   * intended to be used for instrumentation purposes.
   */
  @Keep
  void resetPerfStats();
}
