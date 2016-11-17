/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import com.facebook.proguard.annotations.DoNotStrip;

/**
 * This represents an error evaluating JavaScript.  It includes the usual
 * message, and the raw JS stack where the error occurred (which may be empty).
 */

@DoNotStrip
public class JSException extends Exception {
  private final String mStack;

  @DoNotStrip
  public JSException(String message, String stack, Throwable cause) {
    super(message, cause);
    mStack = stack;
  }

  public JSException(String message, String stack) {
    super(message);
    mStack = stack;
  }

  public String getStack() {
    return mStack;
  }
}
