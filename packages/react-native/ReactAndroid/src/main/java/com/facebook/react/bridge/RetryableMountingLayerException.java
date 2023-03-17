/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/**
 * ViewCommands can throw this Exception. If this is caught during the execution of a ViewCommand
 * mounting instruction, it indicates that the mount item can be safely retried.
 */
public class RetryableMountingLayerException extends RuntimeException {
  public RetryableMountingLayerException(String msg, Throwable e) {
    super(msg, e);
  }

  public RetryableMountingLayerException(Throwable e) {
    super(e);
  }

  public RetryableMountingLayerException(String msg) {
    super(msg);
  }
}
