/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.share;

import com.facebook.react.bridge.Promise;

import javax.annotation.Nullable;

public class SimplePromise implements Promise {
  private static final String DEFAULT_ERROR = "EUNSPECIFIED";

  private int mResolved;
  private int mRejected;
  private Object mValue;
  private String mErrorCode;
  private String mErrorMessage;

  public int getResolved() {
    return mResolved;
  }

  public int getRejected() {
    return mRejected;
  }

  public Object getValue() {
    return mValue;
  }

  public String getErrorCode() {
    return mErrorCode;
  }

  public String getErrorMessage() {
    return mErrorMessage;
  }

  @Override
  public void resolve(Object value) {
    mResolved++;
    mValue = value;
  }

  @Override
  public void reject(String code, String message) {
    reject(code, message, /*Throwable*/null);
  }

  @Override
  @Deprecated
  public void reject(String message) {
    reject(DEFAULT_ERROR, message, /*Throwable*/null);
  }

  @Override
  public void reject(String code, Throwable e) {
    reject(code, e.getMessage(), e);
  }

  @Override
  public void reject(Throwable e) {
    reject(DEFAULT_ERROR, e.getMessage(), e);
  }

  @Override
  public void reject(String code, String message, @Nullable Throwable e) {
    mRejected++;
    mErrorCode = code;
    mErrorMessage = message;
  }
}
