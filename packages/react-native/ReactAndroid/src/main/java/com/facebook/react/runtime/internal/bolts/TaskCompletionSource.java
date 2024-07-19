/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime.internal.bolts;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Allows safe orchestration of a task's completion, preventing the consumer from prematurely
 * completing the task. Essentially, it represents the producer side of a Task<TResult>, providing
 * access to the consumer side through the getTask() method while isolating the Task's completion
 * mechanisms from the consumer.
 */
public class TaskCompletionSource<TResult> {

  @NonNull private final Task<TResult> task;

  /**
   * Creates a TaskCompletionSource that orchestrates a Task. This allows the creator of a task to
   * be solely responsible for its completion.
   */
  public TaskCompletionSource() {
    task = new Task<>();
  }

  /**
   * @return the Task associated with this TaskCompletionSource.
   */
  public @NonNull Task<TResult> getTask() {
    return task;
  }

  /** Sets the cancelled flag on the Task if the Task hasn't already been completed. */
  public boolean trySetCancelled() {
    return task.trySetCancelled();
  }

  /** Sets the result on the Task if the Task hasn't already been completed. */
  public boolean trySetResult(@Nullable TResult result) {
    return task.trySetResult(result);
  }

  /** Sets the error on the Task if the Task hasn't already been completed. */
  public boolean trySetError(@Nullable Exception error) {
    return task.trySetError(error);
  }

  /** Sets the cancelled flag on the task, throwing if the Task has already been completed. */
  public void setCancelled() {
    if (!trySetCancelled()) {
      throw new IllegalStateException("Cannot cancel a completed task.");
    }
  }

  /** Sets the result of the Task, throwing if the Task has already been completed. */
  public void setResult(@Nullable TResult result) {
    if (!trySetResult(result)) {
      throw new IllegalStateException("Cannot set the result of a completed task.");
    }
  }

  /** Sets the error of the Task, throwing if the Task has already been completed. */
  public void setError(@Nullable Exception error) {
    if (!trySetError(error)) {
      throw new IllegalStateException("Cannot set the error on a completed task.");
    }
  }
}
