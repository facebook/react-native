/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import android.os.AsyncTask;

/**
 * Abstract base for a AsyncTask that should have any RuntimeExceptions it throws
 * handled by the {@link com.facebook.react.bridge.NativeModuleCallExceptionHandler} registered if
 * the app is in dev mode.
 *
 * This class doesn't allow doInBackground to return a results. This is mostly because when this
 * class was written that functionality wasn't used and it would require some extra code to make
 * work correctly with caught exceptions. Don't let that stop you from adding it if you need it :)
 */
public abstract class GuardedAsyncTask<Params, Progress>
    extends AsyncTask<Params, Progress, Void> {

  private final ReactContext mReactContext;

  protected GuardedAsyncTask(ReactContext reactContext) {
    mReactContext = reactContext;
  }

  @Override
  protected final Void doInBackground(Params... params) {
    try {
      doInBackgroundGuarded(params);
    } catch (RuntimeException e) {
      mReactContext.handleException(e);
    }
    return null;
  }

  protected abstract void doInBackgroundGuarded(Params... params);
}
