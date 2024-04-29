/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import com.facebook.react.runtime.internal.bolts.CancellationTokenSource;
import com.facebook.react.runtime.internal.bolts.Task;
import java.util.concurrent.CancellationException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * This class is a {@link Future} that holds an instance of {@link Task}. The implementation of this
 * class delegates its behavior on the held task, following the {@link Future} interface defined in
 * {@link "https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Future.html"}
 *
 * @param <T> The type of the result of the task.
 */
class BoltsFutureTask<T> implements Future<T> {
  private final Task<T> mTask;
  private boolean isTaskCancelled = false;
  private final CancellationTokenSource mCancellationTokenSource;

  private BoltsFutureTask(Task<T> task) {
    this(task, new CancellationTokenSource());
  }

  /**
   * Creates a new instance of {@link BoltsFutureTask} for a task that handles cancellation. For
   * more details about bolts cancellation refer to {@link
   * "https://github.com/BoltsFramework/Bolts-Android#cancelling-tasks"}
   *
   * @param task {@link Task} to be held by BoltsFutureTask
   * @param cancellationTokenSource {@link CancellationTokenSource} object that is used by the task
   *     received by parameter to handle cancellation.
   */
  private BoltsFutureTask(Task<T> task, CancellationTokenSource cancellationTokenSource) {
    mTask = task;
    mCancellationTokenSource = cancellationTokenSource;
  }

  @Override
  public boolean cancel(boolean mayInterruptIfRunning) {
    try {
      if (!isDone()) {
        mCancellationTokenSource.cancel();
      }
      return true;
    } finally {
      isTaskCancelled = true;
    }
  }

  @Override
  public boolean isCancelled() {
    return isTaskCancelled || mTask.isCancelled();
  }

  @Override
  public boolean isDone() {
    return isTaskCancelled || mTask.isCancelled() || mTask.isFaulted() || mTask.isCompleted();
  }

  @Override
  public T get() throws ExecutionException, InterruptedException {
    mTask.waitForCompletion();
    return getResult(mTask);
  }

  @Override
  public T get(long timeout, TimeUnit unit)
      throws ExecutionException, InterruptedException, TimeoutException {
    if (mTask.waitForCompletion(timeout, unit)) {
      return getResult(mTask);
    }
    throw new TimeoutException();
  }

  private T getResult(Task<T> task) throws ExecutionException {
    if (task.isFaulted()) {
      throw new ExecutionException("", new Throwable());
    } else if (task.isCancelled()) {
      throw new CancellationException("");
    }
    return task.getResult();
  }
}
