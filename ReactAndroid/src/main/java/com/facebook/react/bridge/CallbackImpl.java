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
  private final int mCallbackId;

  public CallbackImpl(CatalystInstance bridge, int callbackId) {
    mCatalystInstance = bridge;
    mCallbackId = callbackId;
  }

  @Override
  public void invoke(Object... args) {
    mCatalystInstance.invokeCallback(mCallbackId, Arguments.fromJavaArgs(args));
  }
}
