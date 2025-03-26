/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // Need to migrate away from AsyncTasks

package com.facebook.react.bridge

import android.os.AsyncTask
import java.util.concurrent.Executor

/**
 * Abstract base for a AsyncTask that should have any RuntimeExceptions it throws handled by the
 * [JSExceptionHandler] registered if the app is in dev mode.
 *
 * This class doesn't allow doInBackground to return a results. If you need this use
 * GuardedResultAsyncTask instead.
 */
public abstract class GuardedAsyncTask<Params, Progress>
protected constructor(private val exceptionHandler: JSExceptionHandler) :
    AsyncTask<Params, Progress, Void>() {
  protected constructor(reactContext: ReactContext) : this(reactContext.exceptionHandler)

  @Deprecated("AsyncTask is deprecated.")
  override protected final fun doInBackground(vararg params: Params): Void? {
    try {
      doInBackgroundGuarded(*params)
    } catch (e: RuntimeException) {
      exceptionHandler.handleException(e)
    }
    return null
  }

  protected abstract fun doInBackgroundGuarded(vararg params: Params)

  public companion object {
    @JvmField public val THREAD_POOL_EXECUTOR: Executor = AsyncTask.THREAD_POOL_EXECUTOR
  }
}
