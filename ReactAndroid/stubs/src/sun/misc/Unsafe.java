/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package sun.misc;

/**
 * Stub for sun.misc.Unsafe, which is not exposed by the Android SDK.
 *
 * This only contains the methods and fields we need for Yoga.
 */
public final class Unsafe {
  private static final Unsafe theUnsafe = null;

  public final int getInt(Object object, long offset) {
    throw new RuntimeException("Stub!");
  }

  public final void putInt(Object object, long offset, int value) {
    throw new RuntimeException("Stub!");
  }
}

