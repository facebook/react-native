/*
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.jni;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public class CppSystemErrorException extends CppException {
  int errorCode;

  @DoNotStrip
  public CppSystemErrorException(String message, int errorCode) {
    super(message);
    this.errorCode = errorCode;
  }

  public int getErrorCode() {
    return errorCode;
  }
}
