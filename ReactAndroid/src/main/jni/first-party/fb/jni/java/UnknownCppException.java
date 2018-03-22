/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.jni;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public class UnknownCppException extends CppException {
  @DoNotStrip
  public UnknownCppException() {
    super("Unknown");
  }

  @DoNotStrip
  public UnknownCppException(String message) {
    super(message);
  }
}
