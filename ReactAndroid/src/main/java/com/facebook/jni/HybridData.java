// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.jni;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

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

  static {
    SoLoader.loadLibrary("fb");
  }

  // Private C++ instance
  @DoNotStrip
  private long mNativePointer = 0;

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

  public boolean isValid() {
    return mNativePointer != 0;
  }
}
