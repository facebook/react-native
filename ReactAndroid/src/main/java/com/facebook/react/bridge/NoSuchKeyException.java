/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import androidx.annotation.Keep;

/** Exception thrown by {@link ReadableNativeMap} when a key that does not exist is requested. */
@Keep
public class NoSuchKeyException extends RuntimeException {

  @Keep
  public NoSuchKeyException(String msg) {
    super(msg);
  }
}
