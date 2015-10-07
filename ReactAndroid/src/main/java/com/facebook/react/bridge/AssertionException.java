/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

/**
 * Like {@link AssertionError} but extends RuntimeException so that it may be caught by a
 * {@link NativeModuleCallExceptionHandler}. See that class for more details. Used in
 * conjunction with {@link SoftAssertions}.
 */
public class AssertionException extends RuntimeException {

  public AssertionException(String detailMessage) {
    super(detailMessage);
  }
}
