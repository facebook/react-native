/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/** Crashy crashy exception handler. */
public class DefaultNativeModuleCallExceptionHandler implements NativeModuleCallExceptionHandler {

  @Override
  public void handleException(Exception e) {
    if (e instanceof RuntimeException) {
      // Because we are rethrowing the original exception, the original stacktrace will be
      // preserved.
      throw (RuntimeException) e;
    } else {
      throw new RuntimeException(e);
    }
  }
}
