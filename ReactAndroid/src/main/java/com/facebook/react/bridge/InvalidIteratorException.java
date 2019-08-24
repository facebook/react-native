/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import androidx.annotation.Keep;

/**
 * Exception thrown by {@link ReadableMapKeySetIterator#nextKey()} when the iterator tries to
 * iterate over elements after the end of the key set.
 */
@Keep
public class InvalidIteratorException extends RuntimeException {

  @Keep
  public InvalidIteratorException(String msg) {
    super(msg);
  }
}
