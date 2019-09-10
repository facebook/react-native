/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.jni;

import androidx.annotation.Keep;
import androidx.annotation.Nullable;
import java.util.Iterator;

/**
 * To iterate over an Iterator from C++ requires two calls per entry: hasNext() and next(). This
 * helper reduces it to one call and one field get per entry. It does not use a generic argument,
 * since in C++, the types will be erased, anyway. This is *not* a {@link java.util.Iterator}.
 */
@Keep
public class IteratorHelper {
  private final Iterator mIterator;

  // This is private, but accessed via JNI.
  @Keep private @Nullable Object mElement;

  @Keep
  public IteratorHelper(Iterator iterator) {
    mIterator = iterator;
  }

  @Keep
  public IteratorHelper(Iterable iterable) {
    mIterator = iterable.iterator();
  }

  /**
   * Moves the helper to the next entry in the map, if any. Returns true iff there is an entry to
   * read.
   */
  @Keep
  boolean hasNext() {
    if (mIterator.hasNext()) {
      mElement = mIterator.next();
      return true;
    } else {
      mElement = null;
      return false;
    }
  }
}
