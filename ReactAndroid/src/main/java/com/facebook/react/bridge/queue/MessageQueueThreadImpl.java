/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue;

import java.util.concurrent.Callable;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicBoolean;

import android.os.Looper;
import android.os.Process;

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

  /**
   * Runs the given Runnable on this Thread synchronously. The calling thread will be blocked
   * until the Runnable is finished executing.
   */
  @DoNotStrip
  @Override
  public void runOnQueueSync(Runnable runnable) {
    if (mIsFinished) {
      FLog.w(
          ReactConstants.TAG,
          "Tried to enqueue runnable on already finished thread: '" + getName() +
              "... dropping Runnable.");
    }

    if (mLooper.getThread() == Thread.currentThread()) {
      runnable.run();
      return;
    }

    final AtomicBoolean finished = new AtomicBoolean(false);

    mHandler.post(runnable);
    // This will be executed right after the runnable is finished running
    // and is used to notify the current thread to stop waiting.
    mHandler.post(new Runnable() {
      @Override
      public void run() {
        synchronized (finished) {
          finished.set(true);
          finished.notify();
        }
      }
    });

    // Blocks until the runnable is finished.
    boolean interrupted = false;
    try {
      synchronized (finished) {
        while (!finished.get()) {
          try {
            finished.wait();
          } catch (InterruptedException e) {
            // Keep waiting before sending the interrupt signal again.
            interrupted = true;
          }
        }
      }
    } finally {
      if (interrupted) {
        Thread.currentThread().interrupt();
      }
    }
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
  @DoNotStrip
  @Override
  public boolean isOnThread() {
    return mLooper.getThread() == Thread.currentThread();
  }

  /**
   * Asserts {@link #isOnThread()}, throwing a {@link AssertionException} (NOT an
   * {@link AssertionError}) if the assertion fails.
   */
  @DoNotStrip
  @Override
  public void assertIsOnThread() {
    SoftAssertions.assertCondition(isOnThread(), mAssertionErrorMessage);
  }

  /**
   * Asserts {@link #isOnThread()}, throwing a {@link AssertionException} (NOT an
   * {@link AssertionError}) if the assertion fails.
   */
  @DoNotStrip
  @Override
  public void assertIsOnThread(String message) {
    SoftAssertions.assertCondition(
      isOnThread(),
      new StringBuilder().append(mAssertionErrorMessage).append(" ").append(message).toString());
  }

  /**
   * Quits this queue's Looper. If that Looper was running on a different Thread than the current
   * Thread, also waits for the last message being processed to finish and the Thread to die.
   */
  @DoNotStrip
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
        return startNewBackgroundThread(spec.getName(), spec.getStackSize(), exceptionHandler);
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

    if (UiThreadUtil.isOnUiThread()) {
      Process.setThreadPriority(Process.THREAD_PRIORITY_DISPLAY);
    } else {
      UiThreadUtil.runOnUiThread(
          new Runnable() {
            @Override
            public void run() {
              Process.setThreadPriority(Process.THREAD_PRIORITY_DISPLAY);
            }
          });
    }
    return mqt;
  }

  /**
   * Creates and starts a new MessageQueueThreadImpl encapsulating a new Thread with a new Looper
   * running on it. Give it a name for easier debugging and optionally a suggested stack size.
   * When this method exits, the new MessageQueueThreadImpl is ready to receive events.
   */
  private static MessageQueueThreadImpl startNewBackgroundThread(
      final String name,
      long stackSize,
      QueueThreadExceptionHandler exceptionHandler) {
    final SimpleSettableFuture<Looper> looperFuture = new SimpleSettableFuture<>();
    Thread bgThread = new Thread(null,
        new Runnable() {
          @Override
          public void run() {
            Process.setThreadPriority(Process.THREAD_PRIORITY_DISPLAY);
            Looper.prepare();

            looperFuture.set(Looper.myLooper());
            Looper.loop();
          }
        }, "mqt_" + name, stackSize);
    bgThread.start();

    Looper myLooper = looperFuture.getOrThrow();
    return new MessageQueueThreadImpl(name, myLooper, exceptionHandler);
  }
}
