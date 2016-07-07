/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.jni;

import com.facebook.proguard.annotations.DoNotStrip;

import javax.annotation.Nullable;

import java.util.Iterator;

/**
 * To iterate over an Iterator from C++ requires two calls per entry: hasNext()
 * and next().  This helper reduces it to one call and one field get per entry.
 * It does not use a generic argument, since in C++, the types will be erased,
 * anyway.  This is *not* a {@link java.util.Iterator}.
 */
@DoNotStrip
public class IteratorHelper {
  private final Iterator mIterator;

  // This is private, but accessed via JNI.
  @DoNotStrip
  private @Nullable Object mElement;

  @DoNotStrip
  public IteratorHelper(Iterator iterator) {
    mIterator = iterator;
  }

  @DoNotStrip
  public IteratorHelper(Iterable iterable) {
    mIterator = iterable.iterator();
  }

  /**
   * Moves the helper to the next entry in the map, if any.  Returns true iff
   * there is an entry to read.
   */
  @DoNotStrip
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
