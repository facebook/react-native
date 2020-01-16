/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/**
 * Extends RuntimeException so that it may be caught by a {@link ReactSoftExceptionListener}. Any
 * {@link ReactSoftExceptionListener} that catches a ReactNoCrashSoftException should log it only
 * and not crash, no matter what.
 */
public class ReactNoCrashSoftException extends RuntimeException {
  public ReactNoCrashSoftException(String detailMessage) {
    super(detailMessage);
  }
}
