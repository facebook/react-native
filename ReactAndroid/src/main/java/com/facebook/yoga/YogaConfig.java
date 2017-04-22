/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@DoNotStrip
public class YogaConfig {

  static {
    SoLoader.loadLibrary("yoga");
  }

  long mNativePointer;

  private native long jni_YGConfigNew();
  public YogaConfig() {
    mNativePointer = jni_YGConfigNew();
    if (mNativePointer == 0) {
      throw new IllegalStateException("Failed to allocate native memory");
    }
  }

  private native void jni_YGConfigFree(long nativePointer);
  @Override
  protected void finalize() throws Throwable {
    try {
      jni_YGConfigFree(mNativePointer);
    } finally {
      super.finalize();
    }
  }

  private native void jni_YGConfigSetExperimentalFeatureEnabled(
      long nativePointer,
      int feature,
      boolean enabled);
  public void setExperimentalFeatureEnabled(YogaExperimentalFeature feature, boolean enabled) {
    jni_YGConfigSetExperimentalFeatureEnabled(mNativePointer, feature.intValue(), enabled);
  }

  private native void jni_YGConfigSetUseWebDefaults(long nativePointer, boolean useWebDefaults);
  public void setUseWebDefaults(boolean useWebDefaults) {
    jni_YGConfigSetUseWebDefaults(mNativePointer, useWebDefaults);
  }
}
