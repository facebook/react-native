/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue;

import android.os.Looper;
import android.os.Process;
import android.os.SystemClock;
import android.util.Pair;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.AssertionException;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.futures.SimpleSettableFuture;
import java.util.concurrent.Callable;
import java.util.concurrent.Future;

/** Encapsulates a Thread that has a {@link Looper} running on it that can accept Runnables. */
@DoNotStrip
public class MessageQueueThreadImpl implements MessageQueueThread {

  private final String mName;
  private final Looper mLooper;
  private final MessageQueueThreadHandler mHandler;
  private final String mAssertionErrorMessage;
  private final @Nullable MessageQueueThreadPerfStats mPerfStats;
  private volatile boolean mIsFinished = false;

  private MessageQueueThreadImpl(
      String name, Looper looper, QueueThreadExceptionHandler exceptionHandler) {
    this(name, looper, exceptionHandler, null);
  }

  private MessageQueueThreadImpl(
      String name,
      Looper looper,
      QueueThreadExceptionHandler exceptionHandler,
      @Nullable MessageQueueThreadPerfStats stats) {
    mName = name;
    mLooper = looper;
    mHandler = new MessageQueueThreadHandler(looper, exceptionHandler);
    mPerfStats = stats;
    mAssertionErrorMessage = "Expected to be called from the '" + getName() + "' thread!";
  }

  /**
   * Runs the given Runnable on this Thread. It will be submitted to the end of the event queue even
   * if it is being submitted from the same queue Thread.
   */
  @DoNotStrip
  @Override
  public boolean runOnQueue(Runnable runnable) {
    if (mIsFinished) {
      FLog.w(
          ReactConstants.TAG,
          "Tried to enqueue runnable on already finished thread: '"
              + getName()
              + "... dropping Runnable.");
      return false;
    }
    mHandler.post(runnable);
    return true;
  }

  @DoNotStrip
  @Override
  public <T> Future<T> callOnQueue(final Callable<T> callable) {
    final SimpleSettableFuture<T> future = new SimpleSettableFuture<>();
    runOnQueue(
        () -> {
          try {
            future.set(callable.call());
          } catch (Exception e) {
            future.setException(e);
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
   * Asserts {@link #isOnThread()}, throwing a {@link AssertionException} (NOT an {@link
   * AssertionError}) if the assertion fails.
   */
  @DoNotStrip
  @Override
  public void assertIsOnThread() {
    SoftAssertions.assertCondition(isOnThread(), mAssertionErrorMessage);
  }

  /**
   * Asserts {@link #isOnThread()}, throwing a {@link AssertionException} (NOT an {@link
   * AssertionError}) if the assertion fails.
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

  @Nullable
  @DoNotStrip
  @Override
  public MessageQueueThreadPerfStats getPerfStats() {
    return mPerfStats;
  }

  @DoNotStrip
  @Override
  public void resetPerfStats() {
    assignToPerfStats(mPerfStats, -1, -1);
    runOnQueue(
        () -> {
          long wallTime = SystemClock.uptimeMillis();
          long cpuTime = SystemClock.currentThreadTimeMillis();
          assignToPerfStats(mPerfStats, wallTime, cpuTime);
        });
  }

  @DoNotStrip
  @Override
  public boolean isIdle() {
    return mLooper.getQueue().isIdle();
  }

  private static void assignToPerfStats(
      @Nullable MessageQueueThreadPerfStats stats, long wall, long cpu) {
    if (stats == null) {
      return;
    }
    stats.wallTime = wall;
    stats.cpuTime = cpu;
  }

  public Looper getLooper() {
    return mLooper;
  }

  public String getName() {
    return mName;
  }

  public static MessageQueueThreadImpl create(
      MessageQueueThreadSpec spec, QueueThreadExceptionHandler exceptionHandler) {
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
      String name, QueueThreadExceptionHandler exceptionHandler) {
    return new MessageQueueThreadImpl(name, Looper.getMainLooper(), exceptionHandler);
  }

  /**
   * Creates and starts a new MessageQueueThreadImpl encapsulating a new Thread with a new Looper
   * running on it. Give it a name for easier debugging and optionally a suggested stack size. When
   * this method exits, the new MessageQueueThreadImpl is ready to receive events.
   */
  private static MessageQueueThreadImpl startNewBackgroundThread(
      final String name, long stackSize, QueueThreadExceptionHandler exceptionHandler) {
    final SimpleSettableFuture<Pair<Looper, MessageQueueThreadPerfStats>> dataFuture =
        new SimpleSettableFuture<>();
    Thread bgThread =
        new Thread(
            null,
            () -> {
              Process.setThreadPriority(Process.THREAD_PRIORITY_DISPLAY);
              Looper.prepare();
              MessageQueueThreadPerfStats stats = new MessageQueueThreadPerfStats();
              long wallTime = SystemClock.uptimeMillis();
              long cpuTime = SystemClock.currentThreadTimeMillis();
              assignToPerfStats(stats, wallTime, cpuTime);
              dataFuture.set(new Pair<>(Looper.myLooper(), stats));
              Looper.loop();
            },
            "mqt_" + name,
            stackSize);
    bgThread.start();

    Pair<Looper, MessageQueueThreadPerfStats> pair = dataFuture.getOrThrow();
    return new MessageQueueThreadImpl(name, pair.first, exceptionHandler, pair.second);
  }
}
