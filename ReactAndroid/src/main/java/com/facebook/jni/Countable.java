// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.jni;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

/**
 * A Java Object that has native memory allocated corresponding to this instance.
 *
 * NB: THREAD SAFETY (this comment also exists at Countable.cpp)
 *
 * {@link #dispose} deletes the corresponding native object on whatever thread the method is called
 * on. In the common case when this is called by Countable#finalize(), this will be called on the
 * system finalizer thread. If you manually call dispose on the Java object, the native object
 * will be deleted synchronously on that thread.
 */
@DoNotStrip
public class Countable {

  static {
    SoLoader.loadLibrary("fb");
  }

  // Private C++ instance
  @DoNotStrip
  private long mInstance = 0;

  public native void dispose();

  protected void finalize() throws Throwable {
    dispose();
    super.finalize();
  }
}
