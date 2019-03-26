/*
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
