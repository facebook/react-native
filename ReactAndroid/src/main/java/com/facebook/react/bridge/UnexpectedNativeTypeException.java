/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Exception thrown from native code when a type retrieved from a map or array (e.g. via
 * {@link NativeArrayParameter#getString(int)}) does not match the expected type.
 */
@DoNotStrip
public class UnexpectedNativeTypeException extends RuntimeException {

  @DoNotStrip
  public UnexpectedNativeTypeException(String msg) {
    super(msg);
  }
}
