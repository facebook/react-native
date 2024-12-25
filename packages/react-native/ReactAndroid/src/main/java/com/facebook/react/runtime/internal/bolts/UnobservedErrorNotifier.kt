/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime.internal.bolts

/**
 * This class is used to retain a faulted task until either its error is observed or it is
 * finalized. If it is finalized with a task, then the uncaught exception handler is executed with
 * an UnobservedTaskException.
 */
internal class UnobservedErrorNotifier(private var task: Task<*>?) {

  protected fun finalize() {
    task?.let { faultedTask ->
      Task.getUnobservedExceptionHandler()
          ?.unobservedException(faultedTask, UnobservedTaskException(faultedTask.getError()))
    }
  }

  public fun setObserved(): Unit {
    task = null
  }
}
