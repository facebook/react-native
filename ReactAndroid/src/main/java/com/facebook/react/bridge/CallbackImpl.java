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

  private final JSInstance mJSInstance;
  private final int mCallbackId;
  private boolean mInvoked;

  public CallbackImpl(JSInstance jsInstance, int callbackId) {
    mJSInstance = jsInstance;
    mCallbackId = callbackId;
    mInvoked = false;
  }

  @Override
  public void invoke(Object... args) {
    if (mInvoked) {
      throw new RuntimeException("Illegal callback invocation from native "+
        "module. This callback type only permits a single invocation from "+
        "native code.");
    }
    mJSInstance.invokeCallback(mCallbackId, Arguments.fromJavaArgs(args));
    mInvoked = true;
  }
}
