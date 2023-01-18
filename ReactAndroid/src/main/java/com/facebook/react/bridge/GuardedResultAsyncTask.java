/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import android.os.AsyncTask;

/**
 * Abstract base for a AsyncTask with result support that should have any RuntimeExceptions it
 * throws handled by the {@link JSExceptionHandler} registered if the app is in dev mode.
 */
public abstract class GuardedResultAsyncTask<Result> extends AsyncTask<Void, Void, Result> {

  private final JSExceptionHandler mExceptionHandler;

  @Deprecated
  protected GuardedResultAsyncTask(ReactContext reactContext) {
    this(reactContext.getExceptionHandler());
  }

  protected GuardedResultAsyncTask(JSExceptionHandler exceptionHandler) {
    mExceptionHandler = exceptionHandler;
  }

  @Override
  protected final Result doInBackground(Void... params) {
    try {
      return doInBackgroundGuarded();
    } catch (RuntimeException e) {
      mExceptionHandler.handleException(e);
      throw e;
    }
  }

  @Override
  protected final void onPostExecute(Result result) {
    try {
      onPostExecuteGuarded(result);
    } catch (RuntimeException e) {
      mExceptionHandler.handleException(e);
    }
  }

  protected abstract Result doInBackgroundGuarded();

  protected abstract void onPostExecuteGuarded(Result result);
}
