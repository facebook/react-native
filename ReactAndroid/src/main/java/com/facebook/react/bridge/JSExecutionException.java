// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Exception thrown when there is an error evaluating JS, e.g. a syntax error.
 */
@DoNotStrip
public class JSExecutionException extends RuntimeException {

  @DoNotStrip
  public JSExecutionException(String detailMessage) {
    super(detailMessage);
  }
}
