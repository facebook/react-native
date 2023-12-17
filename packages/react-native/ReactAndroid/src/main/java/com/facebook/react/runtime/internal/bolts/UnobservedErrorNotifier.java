/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime.internal.bolts;

import androidx.annotation.Nullable;

/**
 * This class is used to retain a faulted task until either its error is observed or it is
 * finalized. If it is finalized with a task, then the uncaught exception handler is exected with an
 * UnobservedTaskException.
 */
class UnobservedErrorNotifier {
  @Nullable private Task<?> task;

  public UnobservedErrorNotifier(@Nullable Task<?> task) {
    this.task = task;
  }

  @Override
  protected void finalize() throws Throwable {
    try {
      Task faultedTask = this.task;
      if (faultedTask != null) {
        Task.UnobservedExceptionHandler ueh = Task.getUnobservedExceptionHandler();
        if (ueh != null) {
          ueh.unobservedException(faultedTask, new UnobservedTaskException(faultedTask.getError()));
        }
      }
    } finally {
      super.finalize();
    }
  }

  public void setObserved() {
    task = null;
  }
}
