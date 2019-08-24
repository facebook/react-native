/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import androidx.annotation.Keep;

/**
 * Exception thrown from native code when a type retrieved from a map or array (e.g. via {@link
 * NativeArrayParameter#getString(int)}) does not match the expected type.
 */
@Keep
public class UnexpectedNativeTypeException extends RuntimeException {

  @Keep
  public UnexpectedNativeTypeException(String msg) {
    super(msg);
  }
}
