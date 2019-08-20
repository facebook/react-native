/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.devsupport;

import com.facebook.proguard.annotations.DoNotStrip;

/**
 * This represents an error evaluating JavaScript. It includes the usual message, and the raw JS
 * stack where the error occurred (which may be empty).
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
