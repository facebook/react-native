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

import android.os.Looper;

import com.facebook.common.logging.FLog;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.AssertionException;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.futures.SimpleSettableFuture;

/**
 * Encapsulates a Thread that has a {@link Looper} running on it that can accept Runnables.
 */
@DoNotStrip
public class MessageQueueThreadImpl implements MessageQueueThread {

  private final String mName;
  private final Looper mLooper;
  private final MessageQueueThreadHandler mHandler;
  private final String mAssertionErrorMessage;
  private volatile boolean mIsFinished = false;

  private MessageQueueThreadImpl(
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
  @Override
  public void runOnQueue(Runnable runnable) {
    if (mIsFinished) {
      FLog.w(
          ReactConstants.TAG,
          "Tried to enqueue runnable on already finished thread: '" + getName() +
              "... dropping Runnable.");
    }
    mHandler.post(runnable);
  }


  @DoNotStrip
  @Override
  public <T> Future<T> callOnQueue(final Callable<T> callable) {
    final SimpleSettableFuture<T> future = new SimpleSettableFuture<>();
    runOnQueue(
        new Runnable() {
          @Override
          public void run() {
            try {
              future.set(callable.call());
            } catch (Exception e) {
              future.setException(e);
            }
          }
        });
    return future;
  }

  /**
   * @return whether the current Thread is also the Thread associated with this MessageQueueThread.
   */
  @Override
  public boolean isOnThread() {
    return mLooper.getThread() == Thread.currentThread();
  }

  /**
   * Asserts {@link #isOnThread()}, throwing a {@link AssertionException} (NOT an
   * {@link AssertionError}) if the assertion fails.
   */
  @Override
  public void assertIsOnThread() {
    SoftAssertions.assertCondition(isOnThread(), mAssertionErrorMessage);
  }

  /**
   * Quits this queue's Looper. If that Looper was running on a different Thread than the current
   * Thread, also waits for the last message being processed to finish and the Thread to die.
   */
  @Override
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

  public static MessageQueueThreadImpl create(
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
   * @return a MessageQueueThreadImpl corresponding to Android's main UI thread.
   */
  private static MessageQueueThreadImpl createForMainThread(
      String name,
      QueueThreadExceptionHandler exceptionHandler) {
    Looper mainLooper = Looper.getMainLooper();
    final MessageQueueThreadImpl mqt =
        new MessageQueueThreadImpl(name, mainLooper, exceptionHandler);

    // Ensure that the MQT is registered by the time this method returns
    if (UiThreadUtil.isOnUiThread()) {
      MessageQueueThreadRegistry.register(mqt);
    } else {
      final SimpleSettableFuture<Void> registrationFuture = new SimpleSettableFuture<>();
      UiThreadUtil.runOnUiThread(
          new Runnable() {
            @Override
            public void run() {
              MessageQueueThreadRegistry.register(mqt);
              registrationFuture.set(null);
            }
          });
      registrationFuture.getOrThrow();
    }
    return mqt;
  }

  /**
   * Creates  and starts a new MessageQueueThreadImpl encapsulating a new Thread with a new Looper
   * running on it. Give it a name for easier debugging. When this method exits, the new
   * MessageQueueThreadImpl is ready to receive events.
   */
  public static MessageQueueThreadImpl startNewBackgroundThread(
      final String name,
      QueueThreadExceptionHandler exceptionHandler) {
    final SimpleSettableFuture<Looper> looperFuture = new SimpleSettableFuture<>();
    final SimpleSettableFuture<MessageQueueThread> mqtFuture = new SimpleSettableFuture<>();
    Thread bgThread = new Thread(
        new Runnable() {
          @Override
          public void run() {
            Looper.prepare();

            looperFuture.set(Looper.myLooper());
            MessageQueueThreadRegistry.register(mqtFuture.getOrThrow());

            Looper.loop();
          }
        }, "mqt_" + name);
    bgThread.start();

    Looper myLooper = looperFuture.getOrThrow();
    MessageQueueThreadImpl mqt = new MessageQueueThreadImpl(name, myLooper, exceptionHandler);
    mqtFuture.set(mqt);

    return mqt;
  }
}
