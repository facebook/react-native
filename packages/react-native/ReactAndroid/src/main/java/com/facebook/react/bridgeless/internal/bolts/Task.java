/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridgeless.internal.bolts;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CancellationException;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Represents the result of an asynchronous operation.
 *
 * @param <TResult> The type of the result of the task.
 */
public class Task<TResult> {
  /** An {@link java.util.concurrent.Executor} that executes tasks in parallel. */
  public static final ExecutorService BACKGROUND_EXECUTOR = BoltsExecutors.background();

  /**
   * An {@link java.util.concurrent.Executor} that executes tasks in the current thread unless the
   * stack runs too deep, at which point it will delegate to {@link Task#BACKGROUND_EXECUTOR} in
   * order to trim the stack.
   */
  private static final Executor IMMEDIATE_EXECUTOR = BoltsExecutors.immediate();

  /** An {@link java.util.concurrent.Executor} that executes tasks on the UI thread. */
  public static final Executor UI_THREAD_EXECUTOR = AndroidExecutors.uiThread();

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
    void unobservedException(@NonNull Task<?> t, @NonNull UnobservedTaskException e);
  }

  // null unless explicitly set
  private static volatile UnobservedExceptionHandler unobservedExceptionHandler;

  /** Returns the handler invoked when a task has an unobserved exception or {@code null}. */
  public static @Nullable UnobservedExceptionHandler getUnobservedExceptionHandler() {
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
  @Nullable private TResult result;
  @Nullable private Exception error;
  private boolean errorHasBeenObserved;
  @Nullable private UnobservedErrorNotifier unobservedErrorNotifier;
  @Nullable private List<Continuation<TResult, Void>> continuations = new ArrayList<>();

  /* package */ Task() {}

  private Task(@Nullable TResult result) {
    trySetResult(result);
  }

  private Task(boolean cancelled) {
    if (cancelled) {
      trySetCancelled();
    } else {
      trySetResult(null);
    }
  }

  public static @NonNull <TResult> TaskCompletionSource create() {
    Task<TResult> task = new Task<>();
    return new TaskCompletionSource();
  }

  /**
   * @return {@code true} if the task completed (has a result, an error, or was cancelled. {@code
   *     false} otherwise.
   */
  public boolean isCompleted() {
    synchronized (lock) {
      return complete;
    }
  }

  /** @return {@code true} if the task was cancelled, {@code false} otherwise. */
  public boolean isCancelled() {
    synchronized (lock) {
      return cancelled;
    }
  }

  /** @return {@code true} if the task has an error, {@code false} otherwise. */
  public boolean isFaulted() {
    synchronized (lock) {
      return getError() != null;
    }
  }

  /** @return The result of the task, if set. {@code null} otherwise. */
  public @Nullable TResult getResult() {
    synchronized (lock) {
      return result;
    }
  }

  /** @return The error for the task, if set. {@code null} otherwise. */
  public @Nullable Exception getError() {
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
  public boolean waitForCompletion(long duration, @NonNull TimeUnit timeUnit)
      throws InterruptedException {
    synchronized (lock) {
      if (!isCompleted()) {
        lock.wait(timeUnit.toMillis(duration));
      }
      return isCompleted();
    }
  }

  /** Creates a completed task with the given value. */
  @SuppressWarnings("unchecked")
  public static @NonNull <TResult> Task<TResult> forResult(@Nullable TResult value) {
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
  public static @NonNull <TResult> Task<TResult> forError(@Nullable Exception error) {
    TaskCompletionSource<TResult> tcs = new TaskCompletionSource<>();
    tcs.setError(error);
    return tcs.getTask();
  }

  /** Creates a cancelled task. */
  @SuppressWarnings("unchecked")
  public static @NonNull <TResult> Task<TResult> cancelled() {
    return (Task<TResult>) TASK_CANCELLED;
  }

  /**
   * Creates a task that completes after a time delay.
   *
   * @param delay The number of milliseconds to wait before completing the returned task. Zero and
   *     negative values are treated as requests for immediate execution.
   */
  public static @NonNull Task<Void> delay(long delay) {
    return delay(delay, BoltsExecutors.scheduled(), null);
  }

  /**
   * Creates a task that completes after a time delay.
   *
   * @param delay The number of milliseconds to wait before completing the returned task. Zero and
   *     negative values are treated as requests for immediate execution.
   * @param cancellationToken The optional cancellation token that will be checked prior to
   *     completing the returned task.
   */
  public static @NonNull Task<Void> delay(
      long delay, @Nullable CancellationToken cancellationToken) {
    return delay(delay, BoltsExecutors.scheduled(), cancellationToken);
  }

  /* package */ static @NonNull Task<Void> delay(
      long delay,
      @NonNull ScheduledExecutorService executor,
      @Nullable final CancellationToken cancellationToken) {
    if (cancellationToken != null && cancellationToken.isCancellationRequested()) {
      return Task.cancelled();
    }

    if (delay <= 0) {
      return Task.forResult(null);
    }

    final TaskCompletionSource<Void> tcs = new TaskCompletionSource<>();
    final ScheduledFuture<?> scheduled =
        executor.schedule(
            new Runnable() {
              @Override
              public void run() {
                tcs.trySetResult(null);
              }
            },
            delay,
            TimeUnit.MILLISECONDS);

    if (cancellationToken != null) {
      cancellationToken.register(
          new Runnable() {
            @Override
            public void run() {
              scheduled.cancel(true);
              tcs.trySetCancelled();
            }
          });
    }

    return tcs.getTask();
  }

  /**
   * Makes a fluent cast of a Task's result possible, avoiding an extra continuation just to cast
   * the type of the result.
   */
  public @NonNull <TOut> Task<TOut> cast() {
    @SuppressWarnings("unchecked")
    Task<TOut> task = (Task<TOut>) this;
    return task;
  }

  /** Turns a Task<T> into a Task<Void>, dropping any result. */
  public @NonNull Task<Void> makeVoid() {
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

  /**
   * Invokes the callable on a background thread, returning a Task to represent the operation.
   *
   * <p>If you want to cancel the resulting Task throw a {@link
   * java.util.concurrent.CancellationException} from the callable.
   */
  public static @NonNull <TResult> Task<TResult> callInBackground(
      @NonNull Callable<TResult> callable) {
    return call(callable, BACKGROUND_EXECUTOR, null);
  }

  /** Invokes the callable on a background thread, returning a Task to represent the operation. */
  public static @NonNull <TResult> Task<TResult> callInBackground(
      @NonNull Callable<TResult> callable, @Nullable CancellationToken ct) {
    return call(callable, BACKGROUND_EXECUTOR, ct);
  }

  /**
   * Invokes the callable using the given executor, returning a Task to represent the operation.
   *
   * <p>If you want to cancel the resulting Task throw a {@link
   * java.util.concurrent.CancellationException} from the callable.
   */
  public static @NonNull <TResult> Task<TResult> call(
      @NonNull final Callable<TResult> callable, @NonNull Executor executor) {
    return call(callable, executor, null);
  }

  /** Invokes the callable using the given executor, returning a Task to represent the operation. */
  public static @NonNull <TResult> Task<TResult> call(
      @NonNull final Callable<TResult> callable,
      @NonNull Executor executor,
      @Nullable final CancellationToken ct) {
    final TaskCompletionSource<TResult> tcs = new TaskCompletionSource<>();
    try {
      executor.execute(
          new Runnable() {
            @Override
            public void run() {
              if (ct != null && ct.isCancellationRequested()) {
                tcs.setCancelled();
                return;
              }

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
  public static @NonNull <TResult> Task<TResult> call(@NonNull final Callable<TResult> callable) {
    return call(callable, IMMEDIATE_EXECUTOR, null);
  }

  /** Invokes the callable on the current thread, producing a Task. */
  public static @NonNull <TResult> Task<TResult> call(
      @NonNull final Callable<TResult> callable, @Nullable CancellationToken ct) {
    return call(callable, IMMEDIATE_EXECUTOR, ct);
  }

  /**
   * Creates a task that will complete when any of the supplied tasks have completed.
   *
   * <p>The returned task will complete when any of the supplied tasks has completed. The returned
   * task will always end in the completed state with its result set to the first task to complete.
   * This is true even if the first task to complete ended in the canceled or faulted state.
   *
   * @param tasks The tasks to wait on for completion.
   * @return A task that represents the completion of one of the supplied tasks. The return task's
   *     result is the task that completed.
   */
  public static @NonNull <TResult> Task<Task<TResult>> whenAnyResult(
      @NonNull Collection<? extends Task<TResult>> tasks) {
    if (tasks.size() == 0) {
      return Task.forResult(null);
    }

    final TaskCompletionSource<Task<TResult>> firstCompleted = new TaskCompletionSource<>();
    final AtomicBoolean isAnyTaskComplete = new AtomicBoolean(false);

    for (Task<TResult> task : tasks) {
      task.continueWith(
          new Continuation<TResult, Void>() {
            @Override
            public Void then(Task<TResult> task) {
              if (isAnyTaskComplete.compareAndSet(false, true)) {
                firstCompleted.setResult(task);
              } else {
                Throwable ensureObserved = task.getError();
              }
              return null;
            }
          });
    }
    return firstCompleted.getTask();
  }

  /**
   * Creates a task that will complete when any of the supplied tasks have completed.
   *
   * <p>The returned task will complete when any of the supplied tasks has completed. The returned
   * task will always end in the completed state with its result set to the first task to complete.
   * This is true even if the first task to complete ended in the canceled or faulted state.
   *
   * @param tasks The tasks to wait on for completion.
   * @return A task that represents the completion of one of the supplied tasks. The return task's
   *     Result is the task that completed.
   */
  @SuppressWarnings("unchecked")
  public static @NonNull Task<Task<?>> whenAny(@NonNull Collection<? extends Task<?>> tasks) {
    if (tasks.size() == 0) {
      return Task.forResult(null);
    }

    final TaskCompletionSource<Task<?>> firstCompleted = new TaskCompletionSource<>();
    final AtomicBoolean isAnyTaskComplete = new AtomicBoolean(false);

    for (Task<?> task : tasks) {
      ((Task<Object>) task)
          .continueWith(
              new Continuation<Object, Void>() {
                @Override
                public Void then(Task<Object> task) {
                  if (isAnyTaskComplete.compareAndSet(false, true)) {
                    firstCompleted.setResult(task);
                  } else {
                    Throwable ensureObserved = task.getError();
                  }
                  return null;
                }
              });
    }
    return firstCompleted.getTask();
  }

  /**
   * Creates a task that completes when all of the provided tasks are complete.
   *
   * <p>If any of the supplied tasks completes in a faulted state, the returned task will also
   * complete in a faulted state, where its exception will resolve to that {@link
   * java.lang.Exception} if a single task fails or an {@link AggregateException} of all the {@link
   * java.lang.Exception}s if multiple tasks fail.
   *
   * <p>If none of the supplied tasks faulted but at least one of them was cancelled, the returned
   * task will end as cancelled.
   *
   * <p>If none of the tasks faulted and none of the tasks were cancelled, the resulting task will
   * end completed. The result of the returned task will be set to a list containing all of the
   * results of the supplied tasks in the same order as they were provided (e.g. if the input tasks
   * collection contained t1, t2, t3, the output task's result will return an {@code
   * List&lt;TResult&gt;} where {@code list.get(0) == t1.getResult(), list.get(1) == t2.getResult(),
   * and list.get(2) == t3.getResult()}).
   *
   * <p>If the supplied collection contains no tasks, the returned task will immediately transition
   * to a completed state before it's returned to the caller. The returned {@code
   * List&lt;TResult&gt;} will contain 0 elements.
   *
   * @param tasks The tasks that the return value will wait for before completing.
   * @return A Task that will resolve to {@code List&lt;TResult&gt;} when all the tasks are
   *     resolved.
   */
  public static @NonNull <TResult> Task<List<TResult>> whenAllResult(
      @NonNull final Collection<? extends Task<TResult>> tasks) {
    return whenAll(tasks)
        .onSuccess(
            new Continuation<Void, List<TResult>>() {
              @Override
              public List<TResult> then(Task<Void> task) throws Exception {
                if (tasks.size() == 0) {
                  return Collections.emptyList();
                }

                List<TResult> results = new ArrayList<>();
                for (Task<TResult> individualTask : tasks) {
                  results.add(individualTask.getResult());
                }
                return results;
              }
            });
  }

  /**
   * Creates a task that completes when all of the provided tasks are complete.
   *
   * <p>If any of the supplied tasks completes in a faulted state, the returned task will also
   * complete in a faulted state, where its exception will resolve to that {@link
   * java.lang.Exception} if a single task fails or an {@link AggregateException} of all the {@link
   * java.lang.Exception}s if multiple tasks fail.
   *
   * <p>If none of the supplied tasks faulted but at least one of them was cancelled, the returned
   * task will end as cancelled.
   *
   * <p>If none of the tasks faulted and none of the tasks were canceled, the resulting task will
   * end in the completed state.
   *
   * <p>If the supplied collection contains no tasks, the returned task will immediately transition
   * to a completed state before it's returned to the caller.
   *
   * @param tasks The tasks that the return value will wait for before completing.
   * @return A Task that will resolve to {@code Void} when all the tasks are resolved.
   */
  public static @NonNull Task<Void> whenAll(@NonNull Collection<? extends Task<?>> tasks) {
    if (tasks.size() == 0) {
      return Task.forResult(null);
    }

    final TaskCompletionSource<Void> allFinished = new TaskCompletionSource<>();
    final ArrayList<Exception> causes = new ArrayList<>();
    final Object errorLock = new Object();
    final AtomicInteger count = new AtomicInteger(tasks.size());
    final AtomicBoolean isCancelled = new AtomicBoolean(false);

    for (Task<?> task : tasks) {
      @SuppressWarnings("unchecked")
      Task<Object> t = (Task<Object>) task;
      t.continueWith(
          new Continuation<Object, Void>() {
            @Override
            public Void then(Task<Object> task) {
              if (task.isFaulted()) {
                synchronized (errorLock) {
                  causes.add(task.getError());
                }
              }

              if (task.isCancelled()) {
                isCancelled.set(true);
              }

              if (count.decrementAndGet() == 0) {
                if (causes.size() != 0) {
                  if (causes.size() == 1) {
                    allFinished.setError(causes.get(0));
                  } else {
                    Exception error =
                        new AggregateException(
                            String.format("There were %d exceptions.", causes.size()), causes);
                    allFinished.setError(error);
                  }
                } else if (isCancelled.get()) {
                  allFinished.setCancelled();
                } else {
                  allFinished.setResult(null);
                }
              }
              return null;
            }
          });
    }

    return allFinished.getTask();
  }

  /**
   * Continues a task with the equivalent of a Task-based while loop, where the body of the loop is
   * a task continuation.
   */
  public @NonNull Task<Void> continueWhile(
      @NonNull Callable<Boolean> predicate, @NonNull Continuation<Void, Task<Void>> continuation) {
    return continueWhile(predicate, continuation, IMMEDIATE_EXECUTOR, null);
  }

  /**
   * Continues a task with the equivalent of a Task-based while loop, where the body of the loop is
   * a task continuation.
   */
  public @NonNull Task<Void> continueWhile(
      @NonNull Callable<Boolean> predicate,
      @NonNull Continuation<Void, Task<Void>> continuation,
      @Nullable CancellationToken ct) {
    return continueWhile(predicate, continuation, IMMEDIATE_EXECUTOR, ct);
  }

  /**
   * Continues a task with the equivalent of a Task-based while loop, where the body of the loop is
   * a task continuation.
   */
  public @NonNull Task<Void> continueWhile(
      @NonNull final Callable<Boolean> predicate,
      @NonNull final Continuation<Void, Task<Void>> continuation,
      @NonNull final Executor executor) {
    return continueWhile(predicate, continuation, executor, null);
  }

  /**
   * Continues a task with the equivalent of a Task-based while loop, where the body of the loop is
   * a task continuation.
   */
  public @NonNull Task<Void> continueWhile(
      @NonNull final Callable<Boolean> predicate,
      @NonNull final Continuation<Void, Task<Void>> continuation,
      @NonNull final Executor executor,
      @Nullable final CancellationToken ct) {
    final Capture<Continuation<Void, Task<Void>>> predicateContinuation = new Capture<>();
    predicateContinuation.set(
        new Continuation<Void, Task<Void>>() {
          @Override
          public Task<Void> then(Task<Void> task) throws Exception {
            if (ct != null && ct.isCancellationRequested()) {
              return Task.cancelled();
            }

            if (predicate.call()) {
              return Task.<Void>forResult(null)
                  .onSuccessTask(continuation, executor)
                  .onSuccessTask(predicateContinuation.get(), executor);
            }
            return Task.forResult(null);
          }
        });
    return makeVoid().continueWithTask(predicateContinuation.get(), executor);
  }

  /**
   * Adds a continuation that will be scheduled using the executor, returning a new task that
   * completes after the continuation has finished running. This allows the continuation to be
   * scheduled on different thread.
   */
  public @NonNull <TContinuationResult> Task<TContinuationResult> continueWith(
      @NonNull final Continuation<TResult, TContinuationResult> continuation,
      @NonNull final Executor executor) {
    return continueWith(continuation, executor, null);
  }

  /**
   * Adds a continuation that will be scheduled using the executor, returning a new task that
   * completes after the continuation has finished running. This allows the continuation to be
   * scheduled on different thread.
   */
  public @NonNull <TContinuationResult> Task<TContinuationResult> continueWith(
      @NonNull final Continuation<TResult, TContinuationResult> continuation,
      @NonNull final Executor executor,
      @Nullable final CancellationToken ct) {
    boolean completed;
    final TaskCompletionSource<TContinuationResult> tcs = new TaskCompletionSource<>();
    synchronized (lock) {
      completed = this.isCompleted();
      if (!completed) {
        this.continuations.add(
            new Continuation<TResult, Void>() {
              @Override
              public Void then(Task<TResult> task) {
                completeImmediately(tcs, continuation, task, executor, ct);
                return null;
              }
            });
      }
    }
    if (completed) {
      completeImmediately(tcs, continuation, this, executor, ct);
    }
    return tcs.getTask();
  }

  /**
   * Adds a synchronous continuation to this task, returning a new task that completes after the
   * continuation has finished running.
   */
  public @NonNull <TContinuationResult> Task<TContinuationResult> continueWith(
      @NonNull Continuation<TResult, TContinuationResult> continuation) {
    return continueWith(continuation, IMMEDIATE_EXECUTOR, null);
  }

  /**
   * Adds a synchronous continuation to this task, returning a new task that completes after the
   * continuation has finished running.
   */
  public @NonNull <TContinuationResult> Task<TContinuationResult> continueWith(
      @NonNull Continuation<TResult, TContinuationResult> continuation,
      @Nullable CancellationToken ct) {
    return continueWith(continuation, IMMEDIATE_EXECUTOR, ct);
  }

  /**
   * Adds an Task-based continuation to this task that will be scheduled using the executor,
   * returning a new task that completes after the task returned by the continuation has completed.
   */
  public @NonNull <TContinuationResult> Task<TContinuationResult> continueWithTask(
      @NonNull final Continuation<TResult, Task<TContinuationResult>> continuation,
      @NonNull final Executor executor) {
    return continueWithTask(continuation, executor, null);
  }

  /**
   * Adds an Task-based continuation to this task that will be scheduled using the executor,
   * returning a new task that completes after the task returned by the continuation has completed.
   */
  public @NonNull <TContinuationResult> Task<TContinuationResult> continueWithTask(
      @NonNull final Continuation<TResult, Task<TContinuationResult>> continuation,
      @NonNull final Executor executor,
      @Nullable final CancellationToken ct) {
    boolean completed;
    final TaskCompletionSource<TContinuationResult> tcs = new TaskCompletionSource<>();
    synchronized (lock) {
      completed = this.isCompleted();
      if (!completed) {
        this.continuations.add(
            new Continuation<TResult, Void>() {
              @Override
              public Void then(Task<TResult> task) {
                completeAfterTask(tcs, continuation, task, executor, ct);
                return null;
              }
            });
      }
    }
    if (completed) {
      completeAfterTask(tcs, continuation, this, executor, ct);
    }
    return tcs.getTask();
  }

  /**
   * Adds an asynchronous continuation to this task, returning a new task that completes after the
   * task returned by the continuation has completed.
   */
  public @NonNull <TContinuationResult> Task<TContinuationResult> continueWithTask(
      @NonNull Continuation<TResult, Task<TContinuationResult>> continuation) {
    return continueWithTask(continuation, IMMEDIATE_EXECUTOR, null);
  }

  /**
   * Adds an asynchronous continuation to this task, returning a new task that completes after the
   * task returned by the continuation has completed.
   */
  public @NonNull <TContinuationResult> Task<TContinuationResult> continueWithTask(
      @NonNull Continuation<TResult, Task<TContinuationResult>> continuation,
      @Nullable CancellationToken ct) {
    return continueWithTask(continuation, IMMEDIATE_EXECUTOR, ct);
  }

  /**
   * Runs a continuation when a task completes successfully, forwarding along {@link
   * java.lang.Exception} or cancellation.
   */
  public @NonNull <TContinuationResult> Task<TContinuationResult> onSuccess(
      @NonNull final Continuation<TResult, TContinuationResult> continuation,
      @NonNull Executor executor) {
    return onSuccess(continuation, executor, null);
  }

  /**
   * Runs a continuation when a task completes successfully, forwarding along {@link
   * java.lang.Exception} or cancellation.
   */
  public @NonNull <TContinuationResult> Task<TContinuationResult> onSuccess(
      @NonNull final Continuation<TResult, TContinuationResult> continuation,
      @NonNull Executor executor,
      @Nullable final CancellationToken ct) {
    return continueWithTask(
        new Continuation<TResult, Task<TContinuationResult>>() {
          @Override
          public Task<TContinuationResult> then(Task<TResult> task) {
            if (ct != null && ct.isCancellationRequested()) {
              return Task.cancelled();
            }

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
  public @NonNull <TContinuationResult> Task<TContinuationResult> onSuccess(
      @NonNull final Continuation<TResult, TContinuationResult> continuation) {
    return onSuccess(continuation, IMMEDIATE_EXECUTOR, null);
  }

  /**
   * Runs a continuation when a task completes successfully, forwarding along {@link
   * java.lang.Exception}s or cancellation.
   */
  public @NonNull <TContinuationResult> Task<TContinuationResult> onSuccess(
      @NonNull final Continuation<TResult, TContinuationResult> continuation,
      @Nullable CancellationToken ct) {
    return onSuccess(continuation, IMMEDIATE_EXECUTOR, ct);
  }

  /**
   * Runs a continuation when a task completes successfully, forwarding along {@link
   * java.lang.Exception}s or cancellation.
   */
  public @NonNull <TContinuationResult> Task<TContinuationResult> onSuccessTask(
      @NonNull final Continuation<TResult, Task<TContinuationResult>> continuation,
      @NonNull Executor executor) {
    return onSuccessTask(continuation, executor, null);
  }

  /**
   * Runs a continuation when a task completes successfully, forwarding along {@link
   * java.lang.Exception}s or cancellation.
   */
  public @NonNull <TContinuationResult> Task<TContinuationResult> onSuccessTask(
      @NonNull final Continuation<TResult, Task<TContinuationResult>> continuation,
      @NonNull Executor executor,
      @Nullable final CancellationToken ct) {
    return continueWithTask(
        new Continuation<TResult, Task<TContinuationResult>>() {
          @Override
          public Task<TContinuationResult> then(Task<TResult> task) {
            if (ct != null && ct.isCancellationRequested()) {
              return Task.cancelled();
            }

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
  public @NonNull <TContinuationResult> Task<TContinuationResult> onSuccessTask(
      @NonNull final Continuation<TResult, Task<TContinuationResult>> continuation) {
    return onSuccessTask(continuation, IMMEDIATE_EXECUTOR);
  }

  /**
   * Runs a continuation when a task completes successfully, forwarding along {@link
   * java.lang.Exception}s or cancellation.
   */
  public @NonNull <TContinuationResult> Task<TContinuationResult> onSuccessTask(
      @NonNull final Continuation<TResult, Task<TContinuationResult>> continuation,
      @Nullable CancellationToken ct) {
    return onSuccessTask(continuation, IMMEDIATE_EXECUTOR, ct);
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
      @NonNull final TaskCompletionSource<TContinuationResult> tcs,
      @NonNull final Continuation<TResult, TContinuationResult> continuation,
      @NonNull final Task<TResult> task,
      @NonNull Executor executor,
      @Nullable final CancellationToken ct) {
    try {
      executor.execute(
          new Runnable() {
            @Override
            public void run() {
              if (ct != null && ct.isCancellationRequested()) {
                tcs.setCancelled();
                return;
              }

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
      @NonNull final TaskCompletionSource<TContinuationResult> tcs,
      @NonNull final Continuation<TResult, Task<TContinuationResult>> continuation,
      @NonNull final Task<TResult> task,
      @NonNull final Executor executor,
      @Nullable final CancellationToken ct) {
    try {
      executor.execute(
          new Runnable() {
            @Override
            public void run() {
              if (ct != null && ct.isCancellationRequested()) {
                tcs.setCancelled();
                return;
              }

              try {
                Task<TContinuationResult> result = continuation.then(task);
                if (result == null) {
                  tcs.setResult(null);
                } else {
                  result.continueWith(
                      new Continuation<TContinuationResult, Void>() {
                        @Override
                        public Void then(@NonNull Task<TContinuationResult> task) {
                          if (ct != null && ct.isCancellationRequested()) {
                            tcs.setCancelled();
                            return null;
                          }

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
  /* package */ boolean trySetResult(@Nullable TResult result) {
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
  /* package */ boolean trySetError(@Nullable Exception error) {
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

  private static final Task<?> TASK_NULL = new Task<>(null);
  private static final Task<Boolean> TASK_TRUE = new Task<>((Boolean) true);
  private static final Task<Boolean> TASK_FALSE = new Task<>((Boolean) false);
  private static final Task<?> TASK_CANCELLED = new Task(true);
}
