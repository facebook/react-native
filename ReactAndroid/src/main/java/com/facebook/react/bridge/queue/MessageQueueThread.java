/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge.queue;

import java.util.concurrent.Callable;
import java.util.concurrent.Future;

import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Encapsulates a Thread that can accept Runnables.
 */
@DoNotStrip
public interface MessageQueueThread {
  /**
   * Runs the given Runnable on this Thread. It will be submitted to the end of the event queue even
   * if it is being submitted from the same queue Thread.
   */
  @DoNotStrip
  void runOnQueue(Runnable runnable);

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
   * Asserts {@link #isOnThread()}, throwing a {@link AssertionException} (NOT an
   * {@link AssertionError}) if the assertion fails.
   */
  @DoNotStrip
  void assertIsOnThread();

  /**
   * Quits this MessageQueueThread. If called from this MessageQueueThread, this will be the last
   * thing the thread runs. If called from a separate thread, this will block until the thread can
   * be quit and joined.
   */
  @DoNotStrip
  void quitSynchronous();
}
