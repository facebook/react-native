/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/**
 * Extends RuntimeException so that it may be caught by a {@link ReactSoftExceptionListener}. Any
 * {@link ReactSoftExceptionListener} that catches a ReactNoCrashBridgeNotAllowedSoftException
 * should log it only and not crash, no matter what.
 */
public class ReactNoCrashBridgeNotAllowedSoftException extends ReactNoCrashSoftException {
  public ReactNoCrashBridgeNotAllowedSoftException(String m) {
    super(m);
  }

  public ReactNoCrashBridgeNotAllowedSoftException(Throwable e) {
    super(e);
  }

  public ReactNoCrashBridgeNotAllowedSoftException(String m, Throwable e) {
    super(m, e);
  }
}
