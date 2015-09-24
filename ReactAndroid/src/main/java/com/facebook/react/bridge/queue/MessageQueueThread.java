/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge.queue;

import android.os.Looper;

import com.facebook.common.logging.FLog;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.AssertionException;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.futures.SimpleSettableFuture;

/**
 * Encapsulates a Thread that has a {@link Looper} running on it that can accept Runnables.
 */
@DoNotStrip
public class MessageQueueThread {

  private final String mName;
  private final Looper mLooper;
  private final MessageQueueThreadHandler mHandler;
  private final String mAssertionErrorMessage;
  private volatile boolean mIsFinished = false;

  private MessageQueueThread(
      String name,
      Looper looper,
      QueueThreadExceptionHandler exceptionHandler) {
    mName = name;
    mLooper = looper;
    mHandler = new MessageQueueThreadHandler(looper, exceptionHandler);
    mAssertionErrorMessage = "Expected to be called from the '" + getName() + "' thread!";
  }

  /**
   * Runs the given Runnable on this Thread. It will be submitted to the end of the event queue even
   * if it is being submitted from the same queue Thread.
   */
  @DoNotStrip
  public void runOnQueue(Runnable runnable) {
    if (mIsFinished) {
      FLog.w(
          ReactConstants.TAG,
          "Tried to enqueue runnable on already finished thread: '" + getName() +
              "... dropping Runnable.");
    }
    mHandler.post(runnable);
  }

  /**
   * @return whether the current Thread is also the Thread associated with this MessageQueueThread.
   */
  public boolean isOnThread() {
    return mLooper.getThread() == Thread.currentThread();
  }

  /**
   * Asserts {@link #isOnThread()}, throwing a {@link AssertionException} (NOT an
   * {@link AssertionError}) if the assertion fails.
   */
  public void assertIsOnThread() {
    SoftAssertions.assertCondition(isOnThread(), mAssertionErrorMessage);
  }

  /**
   * Quits this queue's Looper. If that Looper was running on a different Thread than the current
   * Thread, also waits for the last message being processed to finish and the Thread to die.
   */
  public void quitSynchronous() {
    mIsFinished = true;
    mLooper.quit();
    if (mLooper.getThread() != Thread.currentThread()) {
      try {
        mLooper.getThread().join();
      } catch (InterruptedException e) {
        throw new RuntimeException("Got interrupted waiting to join thread " + mName);
      }
    }
  }

  public Looper getLooper() {
    return mLooper;
  }

  public String getName() {
    return mName;
  }

  public static MessageQueueThread create(
      MessageQueueThreadSpec spec,
      QueueThreadExceptionHandler exceptionHandler) {
    switch (spec.getThreadType()) {
      case MAIN_UI:
        return createForMainThread(spec.getName(), exceptionHandler);
      case NEW_BACKGROUND:
        return startNewBackgroundThread(spec.getName(), exceptionHandler);
      default:
        throw new RuntimeException("Unknown thread type: " + spec.getThreadType());
    }
  }

  /**
   * @return a MessageQueueThread corresponding to Android's main UI thread.
   */
  private static MessageQueueThread createForMainThread(
      String name,
      QueueThreadExceptionHandler exceptionHandler) {
    Looper mainLooper = Looper.getMainLooper();
    return new MessageQueueThread(name, mainLooper, exceptionHandler);
  }

  /**
   * Creates  and starts a new MessageQueueThread encapsulating a new Thread with a new Looper
   * running on it. Give it a name for easier debugging. When this method exits, the new
   * MessageQueueThread is ready to receive events.
   */
  private static MessageQueueThread startNewBackgroundThread(
      String name,
      QueueThreadExceptionHandler exceptionHandler) {
    final SimpleSettableFuture<Looper> simpleSettableFuture = new SimpleSettableFuture<>();
    Thread bgThread = new Thread(
        new Runnable() {
          @Override
          public void run() {
            Looper.prepare();

            simpleSettableFuture.set(Looper.myLooper());

            Looper.loop();
          }
        }, "mqt_" + name);
    bgThread.start();

    return new MessageQueueThread(name, simpleSettableFuture.get(5000), exceptionHandler);
  }
}
