/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Implementation of two javascript functions that can be used to resolve or reject a js promise.
 */
package com.facebook.react.bridge;

import javax.annotation.Nullable;

public class PromiseImpl implements Promise {
  private @Nullable Callback mResolve;
  private @Nullable Callback mReject;

  public PromiseImpl(@Nullable Callback resolve, @Nullable Callback reject) {
    mResolve = resolve;
    mReject = reject;
  }

  @Override
  public void resolve(Object value) {
    if (mResolve != null) {
      mResolve.invoke(value);
    }
  }

  @Override
  public void reject(String reason) {
    if (mReject != null) {
      // The JavaScript side expects a map with at least the error message.
      // It is possible to expose all kind of information. It will be available on the JS
      // error instance.
      // TODO(8850038): add more useful information, e.g. the native stack trace.
      WritableNativeMap errorInfo = new WritableNativeMap();
      errorInfo.putString("message", reason);
      mReject.invoke(errorInfo);
    }
  }
}
