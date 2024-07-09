/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime.internal.bolts;

import androidx.annotation.Nullable;
import com.facebook.react.interfaces.TaskInterface;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CancellationException;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;

/**
 * Represents the result of an asynchronous operation.
 *
 * @param <TResult> The type of the result of the task.
 */
public class Task<TResult> implements TaskInterface<TResult> {
  /**
   * An {@link java.util.concurrent.Executor} that executes tasks in the current thread unless the
   * stack runs too deep, at which point it will delegate to {@link Task#BACKGROUND_EXECUTOR} in
   * order to trim the stack.
   */
  public static final Executor IMMEDIATE_EXECUTOR = Executors.IMMEDIATE;

  /** An {@link java.util.concurrent.Executor} that executes tasks on the UI thread. */
  public static final Executor UI_THREAD_EXECUTOR = Executors.UI_THREAD;

  /**
   * Interface for handlers invoked when a failed {@code Task} is about to be finalized, but the
   * exception has not been consumed.
   *
   * <p>The handler will execute in the GC thread, so if the handler needs to do anything time
   * consuming or complex it is a good idea to fire off a {@code Task} to handle the exception.
   *
   * @see #getUnobservedExceptionHandler
   * @see #setUnobservedExceptionHandler
   */
  public interface UnobservedExceptionHandler {
    /**
     * Method invoked when the given task has an unobserved exception.
     *
     * <p>Any exception thrown by this method will be ignored.
     *
     * @param t the task
     * @param e the exception
     */
    void unobservedException(Task<?> t, UnobservedTaskException e);
  }

  // null unless explicitly set
  private static volatile UnobservedExceptionHandler unobservedExceptionHandler;

  /** Returns the handler invoked when a task has an unobserved exception or {@code null}. */
  public static UnobservedExceptionHandler getUnobservedExceptionHandler() {
    return unobservedExceptionHandler;
  }

  /**
   * Set the handler invoked when a task has an unobserved exception.
   *
   * @param eh the object to use as an unobserved exception handler. If <tt>null</tt> then
   *     unobserved exceptions will be ignored.
   */
  public static void setUnobservedExceptionHandler(UnobservedExceptionHandler eh) {
    unobservedExceptionHandler = eh;
  }

  private final Object lock = new Object();
  private boolean complete;
  private boolean cancelled;
  private TResult result;
  private Exception error;
  private boolean errorHasBeenObserved;
  private UnobservedErrorNotifier unobservedErrorNotifier;
  private List<Continuation<TResult, Void>> continuations = new ArrayList<>();

  /* package */ Task() {}

  private Task(TResult result) {
    trySetResult(result);
  }

  private Task(boolean cancelled) {
    if (cancelled) {
      trySetCancelled();
    } else {
      trySetResult(null);
    }
  }

  public static <TResult> TaskCompletionSource create() {
    Task<TResult> task = new Task<>();
    return new TaskCompletionSource();
  }

  /**
   * @return {@code true} if the task completed (has a result, an error, or was cancelled. {@code
   *     false} otherwise.
   */
  @Override
  public boolean isCompleted() {
    synchronized (lock) {
      return complete;
    }
  }

  /**
   * @return {@code true} if the task was cancelled, {@code false} otherwise.
   */
  @Override
  public boolean isCancelled() {
    synchronized (lock) {
      return cancelled;
    }
  }

  /**
   * @return {@code true} if the task has an error, {@code false} otherwise.
   */
  @Override
  public boolean isFaulted() {
    synchronized (lock) {
      return getError() != null;
    }
  }

  /**
   * @return The result of the task, if set. {@code null} otherwise.
   */
  @Override
  public TResult getResult() {
    synchronized (lock) {
      return result;
    }
  }

  /**
   * @return The error for the task, if set. {@code null} otherwise.
   */
  @Override
  public Exception getError() {
    synchronized (lock) {
      if (error != null) {
        errorHasBeenObserved = true;
        if (unobservedErrorNotifier != null) {
          unobservedErrorNotifier.setObserved();
          unobservedErrorNotifier = null;
        }
      }
      return error;
    }
  }

  /** Blocks until the task is complete. */
  @Override
  public void waitForCompletion() throws InterruptedException {
    synchronized (lock) {
      if (!isCompleted()) {
        lock.wait();
      }
    }
  }

  /**
   * Blocks until the task is complete or times out.
   *
   * @return {@code true} if the task completed (has a result, an error, or was cancelled). {@code
   *     false} otherwise.
   */
  @Override
  public boolean waitForCompletion(long duration, TimeUnit timeUnit) throws InterruptedException {
    synchronized (lock) {
      if (!isCompleted()) {
        lock.wait(timeUnit.toMillis(duration));
      }
      return isCompleted();
    }
  }

  /** Creates a completed task with the given value. */
  @SuppressWarnings("unchecked")
  public static <TResult> Task<TResult> forResult(@Nullable TResult value) {
    if (value == null) {
      return (Task<TResult>) TASK_NULL;
    }
    if (value instanceof Boolean) {
      return (Task<TResult>) ((Boolean) value ? TASK_TRUE : TASK_FALSE);
    }
    TaskCompletionSource<TResult> tcs = new TaskCompletionSource<>();
    tcs.setResult(value);
    return tcs.getTask();
  }

  /** Creates a faulted task with the given error. */
  public static <TResult> Task<TResult> forError(Exception error) {
    TaskCompletionSource<TResult> tcs = new TaskCompletionSource<>();
    tcs.setError(error);
    return tcs.getTask();
  }

  /** Creates a cancelled task. */
  @SuppressWarnings("unchecked")
  public static <TResult> Task<TResult> cancelled() {
    return (Task<TResult>) TASK_CANCELLED;
  }

  /** Turns a Task<T> into a Task<Void>, dropping any result. */
  public Task<Void> makeVoid() {
    return this.continueWithTask(
        new Continuation<TResult, Task<Void>>() {
          @Override
          public Task<Void> then(Task<TResult> task) throws Exception {
            if (task.isCancelled()) {
              return Task.cancelled();
            }
            if (task.isFaulted()) {
              return Task.forError(task.getError());
            }
            return Task.forResult(null);
          }
        });
  }

  /** Invokes the callable using the given executor, returning a Task to represent the operation. */
  public static <TResult> Task<TResult> call(final Callable<TResult> callable, Executor executor) {
    final TaskCompletionSource<TResult> tcs = new TaskCompletionSource<>();
    try {
      executor.execute(
          new Runnable() {
            @Override
            public void run() {
              try {
                tcs.setResult(callable.call());
              } catch (CancellationException e) {
                tcs.setCancelled();
              } catch (Exception e) {
                tcs.setError(e);
              }
            }
          });
    } catch (Exception e) {
      tcs.setError(new ExecutorException(e));
    }

    return tcs.getTask();
  }

  /**
   * Invokes the callable on the current thread, producing a Task.
   *
   * <p>If you want to cancel the resulting Task throw a {@link
   * java.util.concurrent.CancellationException} from the callable.
   */
  public static <TResult> Task<TResult> call(final Callable<TResult> callable) {
    return call(callable, IMMEDIATE_EXECUTOR);
  }

  /**
   * Adds a continuation that will be scheduled using the executor, returning a new task that
   * completes after the continuation has finished running. This allows the continuation to be
   * scheduled on different thread.
   */
  public <TContinuationResult> Task<TContinuationResult> continueWith(
      final Continuation<TResult, TContinuationResult> continuation, final Executor executor) {
    boolean completed;
    final TaskCompletionSource<TContinuationResult> tcs = new TaskCompletionSource<>();
    synchronized (lock) {
      completed = this.isCompleted();
      if (!completed) {
        continuations.add(
            new Continuation<TResult, Void>() {
              @Override
              public Void then(Task<TResult> task) {
                completeImmediately(tcs, continuation, task, executor);
                return null;
              }
            });
      }
    }
    if (completed) {
      completeImmediately(tcs, continuation, this, executor);
    }
    return tcs.getTask();
  }

  /**
   * Adds a synchronous continuation to this task, returning a new task that completes after the
   * continuation has finished running.
   */
  public <TContinuationResult> Task<TContinuationResult> continueWith(
      Continuation<TResult, TContinuationResult> continuation) {
    return continueWith(continuation, IMMEDIATE_EXECUTOR);
  }

  /**
   * Adds an Task-based continuation to this task that will be scheduled using the executor,
   * returning a new task that completes after the task returned by the continuation has completed.
   */
  public <TContinuationResult> Task<TContinuationResult> continueWithTask(
      final Continuation<TResult, Task<TContinuationResult>> continuation,
      final Executor executor) {
    boolean completed;
    final TaskCompletionSource<TContinuationResult> tcs = new TaskCompletionSource<>();
    synchronized (lock) {
      completed = this.isCompleted();
      if (!completed) {
        continuations.add(
            new Continuation<TResult, Void>() {
              @Override
              public Void then(Task<TResult> task) {
                completeAfterTask(tcs, continuation, task, executor);
                return null;
              }
            });
      }
    }
    if (completed) {
      completeAfterTask(tcs, continuation, this, executor);
    }
    return tcs.getTask();
  }

  /**
   * Adds an asynchronous continuation to this task, returning a new task that completes after the
   * task returned by the continuation has completed.
   */
  public <TContinuationResult> Task<TContinuationResult> continueWithTask(
      Continuation<TResult, Task<TContinuationResult>> continuation) {
    return continueWithTask(continuation, IMMEDIATE_EXECUTOR);
  }

  /**
   * Runs a continuation when a task completes successfully, forwarding along {@link
   * java.lang.Exception} or cancellation.
   */
  public <TContinuationResult> Task<TContinuationResult> onSuccess(
      final Continuation<TResult, TContinuationResult> continuation, Executor executor) {
    return continueWithTask(
        new Continuation<TResult, Task<TContinuationResult>>() {
          @Override
          public Task<TContinuationResult> then(Task<TResult> task) {
            if (task.isFaulted()) {
              return Task.forError(task.getError());
            } else if (task.isCancelled()) {
              return Task.cancelled();
            } else {
              return task.continueWith(continuation);
            }
          }
        },
        executor);
  }

  /**
   * Runs a continuation when a task completes successfully, forwarding along {@link
   * java.lang.Exception}s or cancellation.
   */
  public <TContinuationResult> Task<TContinuationResult> onSuccess(
      final Continuation<TResult, TContinuationResult> continuation) {
    return onSuccess(continuation, IMMEDIATE_EXECUTOR);
  }

  /**
   * Runs a continuation when a task completes successfully, forwarding along {@link
   * java.lang.Exception}s or cancellation.
   */
  public <TContinuationResult> Task<TContinuationResult> onSuccessTask(
      final Continuation<TResult, Task<TContinuationResult>> continuation, Executor executor) {
    return continueWithTask(
        new Continuation<TResult, Task<TContinuationResult>>() {
          @Override
          public Task<TContinuationResult> then(Task<TResult> task) {
            if (task.isFaulted()) {
              return Task.forError(task.getError());
            } else if (task.isCancelled()) {
              return Task.cancelled();
            } else {
              return task.continueWithTask(continuation);
            }
          }
        },
        executor);
  }

  /**
   * Runs a continuation when a task completes successfully, forwarding along {@link
   * java.lang.Exception}s or cancellation.
   */
  public <TContinuationResult> Task<TContinuationResult> onSuccessTask(
      final Continuation<TResult, Task<TContinuationResult>> continuation) {
    return onSuccessTask(continuation, IMMEDIATE_EXECUTOR);
  }

  /**
   * Handles the non-async (i.e. the continuation doesn't return a Task) continuation case, passing
   * the results of the given Task through to the given continuation and using the results of that
   * call to set the result of the TaskContinuationSource.
   *
   * @param tcs The TaskContinuationSource that will be orchestrated by this call.
   * @param continuation The non-async continuation.
   * @param task The task being completed.
   * @param executor The executor to use when running the continuation (allowing the continuation to
   *     be scheduled on a different thread).
   */
  private static <TContinuationResult, TResult> void completeImmediately(
      final TaskCompletionSource<TContinuationResult> tcs,
      final Continuation<TResult, TContinuationResult> continuation,
      final Task<TResult> task,
      Executor executor) {
    try {
      executor.execute(
          new Runnable() {
            @Override
            public void run() {
              try {
                TContinuationResult result = continuation.then(task);
                tcs.setResult(result);
              } catch (CancellationException e) {
                tcs.setCancelled();
              } catch (Exception e) {
                tcs.setError(e);
              }
            }
          });
    } catch (Exception e) {
      tcs.setError(new ExecutorException(e));
    }
  }

  /**
   * Handles the async (i.e. the continuation does return a Task) continuation case, passing the
   * results of the given Task through to the given continuation to get a new Task. The
   * TaskCompletionSource's results are only set when the new Task has completed, unwrapping the
   * results of the task returned by the continuation.
   *
   * @param tcs The TaskContinuationSource that will be orchestrated by this call.
   * @param continuation The async continuation.
   * @param task The task being completed.
   * @param executor The executor to use when running the continuation (allowing the continuation to
   *     be scheduled on a different thread).
   */
  private static <TContinuationResult, TResult> void completeAfterTask(
      final TaskCompletionSource<TContinuationResult> tcs,
      final Continuation<TResult, Task<TContinuationResult>> continuation,
      final Task<TResult> task,
      final Executor executor) {
    try {
      executor.execute(
          new Runnable() {
            @Override
            public void run() {
              try {
                Task<TContinuationResult> result = continuation.then(task);
                if (result == null) {
                  tcs.setResult(null);
                } else {
                  result.continueWith(
                      new Continuation<TContinuationResult, Void>() {
                        @Override
                        public Void then(Task<TContinuationResult> task) {
                          if (task.isCancelled()) {
                            tcs.setCancelled();
                          } else if (task.isFaulted()) {
                            tcs.setError(task.getError());
                          } else {
                            tcs.setResult(task.getResult());
                          }
                          return null;
                        }
                      });
                }
              } catch (CancellationException e) {
                tcs.setCancelled();
              } catch (Exception e) {
                tcs.setError(e);
              }
            }
          });
    } catch (Exception e) {
      tcs.setError(new ExecutorException(e));
    }
  }

  private void runContinuations() {
    synchronized (lock) {
      for (Continuation<TResult, ?> continuation : continuations) {
        try {
          continuation.then(this);
        } catch (RuntimeException e) {
          throw e;
        } catch (Exception e) {
          throw new RuntimeException(e);
        }
      }
      continuations = null;
    }
  }

  /** Sets the cancelled flag on the Task if the Task hasn't already been completed. */
  /* package */ boolean trySetCancelled() {
    synchronized (lock) {
      if (complete) {
        return false;
      }
      complete = true;
      cancelled = true;
      lock.notifyAll();
      runContinuations();
      return true;
    }
  }

  /** Sets the result on the Task if the Task hasn't already been completed. */
  /* package */ boolean trySetResult(TResult result) {
    synchronized (lock) {
      if (complete) {
        return false;
      }
      complete = true;
      Task.this.result = result;
      lock.notifyAll();
      runContinuations();
      return true;
    }
  }

  /** Sets the error on the Task if the Task hasn't already been completed. */
  /* package */ boolean trySetError(Exception error) {
    synchronized (lock) {
      if (complete) {
        return false;
      }
      complete = true;
      Task.this.error = error;
      errorHasBeenObserved = false;
      lock.notifyAll();
      runContinuations();
      if (!errorHasBeenObserved && getUnobservedExceptionHandler() != null)
        unobservedErrorNotifier = new UnobservedErrorNotifier(this);
      return true;
    }
  }

  private static Task<?> TASK_NULL = new Task<>(null);
  private static Task<Boolean> TASK_TRUE = new Task<>((Boolean) true);
  private static Task<Boolean> TASK_FALSE = new Task<>((Boolean) false);
  private static Task<?> TASK_CANCELLED = new Task(true);
}
