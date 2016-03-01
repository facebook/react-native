/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

/**
 * Implementation of javascript callback function that use Bridge to schedule method execution
 */
public final class CallbackImpl implements Callback {

  private final CatalystInstance mCatalystInstance;
  private final ExecutorToken mExecutorToken;
  private final int mCallbackId;

  public CallbackImpl(CatalystInstance bridge, ExecutorToken executorToken, int callbackId) {
    mCatalystInstance = bridge;
    mExecutorToken = executorToken;
    mCallbackId = callbackId;
  }

  @Override
  public void invoke(Object... args) {
    mCatalystInstance.invokeCallback(mExecutorToken, mCallbackId, Arguments.fromJavaArgs(args));
  }
}
