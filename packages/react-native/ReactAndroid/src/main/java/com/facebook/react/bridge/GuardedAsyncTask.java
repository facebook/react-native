/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import android.os.AsyncTask;
import com.facebook.infer.annotation.Nullsafe;

/**
 * Abstract base for a AsyncTask that should have any RuntimeExceptions it throws handled by the
 * {@link JSExceptionHandler} registered if the app is in dev mode.
 *
 * <p>This class doesn't allow doInBackground to return a results. If you need this use
 * GuardedResultAsyncTask instead.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public abstract class GuardedAsyncTask<Params, Progress> extends AsyncTask<Params, Progress, Void> {

  private final JSExceptionHandler mExceptionHandler;

  protected GuardedAsyncTask(ReactContext reactContext) {
    this(reactContext.getExceptionHandler());
  }

  protected GuardedAsyncTask(JSExceptionHandler exceptionHandler) {
    mExceptionHandler = exceptionHandler;
  }

  @Override
  protected final Void doInBackground(Params... params) {
    try {
      doInBackgroundGuarded(params);
    } catch (RuntimeException e) {
      mExceptionHandler.handleException(e);
    }
    return null;
  }

  protected abstract void doInBackgroundGuarded(Params... params);
}
