/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/**
 * Like {@link AssertionError} but extends RuntimeException so that it may be caught by a {@link
 * NativeModuleCallExceptionHandler}. See that class for more details. Used in conjunction with
 * {@link SoftAssertions}.
 */
public class AssertionException extends RuntimeException {

  public AssertionException(String detailMessage) {
    super(detailMessage);
  }
}
