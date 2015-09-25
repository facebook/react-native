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

/**
 * This object holds a native C++ member for hybrid Java/C++ objects.
 *
 * NB: THREAD SAFETY
 *
 * {@link #dispose} deletes the corresponding native object on whatever thread
 * the method is called on. In the common case when this is called by
 * HybridData#finalize(), this will be called on the system finalizer
 * thread. If you manually call resetNative() on the Java object, the C++
 * object will be deleted synchronously on that thread.
 */
@DoNotStrip
public class HybridData {
  // Private C++ instance
  @DoNotStrip
  private long mNativePointer = 0;

  public HybridData() {
    Prerequisites.ensure();
  }

  /**
   * To explicitly delete the instance, call resetNative().  If the C++
   * instance is referenced after this is called, a NullPointerException will
   * be thrown.  resetNative() may be called multiple times safely.  Because
   * {@link #finalize} calls resetNative, the instance will not leak if this is
   * not called, but timing of deletion and the thread the C++ dtor is called
   * on will be at the whim of the Java GC.  If you want to control the thread
   * and timing of the destructor, you should call resetNative() explicitly.
   */
  public native void resetNative();

  protected void finalize() throws Throwable {
    resetNative();
    super.finalize();
  }
}
