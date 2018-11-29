/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Exception thrown by {@link ReadableMapKeySetIterator#nextKey()} when the iterator tries
 * to iterate over elements after the end of the key set.
 */
@DoNotStrip
public class InvalidIteratorException extends RuntimeException {

  @DoNotStrip
  public InvalidIteratorException(String msg) {
    super(msg);
  }
}
