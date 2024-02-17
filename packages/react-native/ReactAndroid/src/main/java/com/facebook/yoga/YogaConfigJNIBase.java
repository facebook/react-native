/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

public abstract class YogaConfigJNIBase extends YogaConfig {

  long mNativePointer;
  private YogaLogger mLogger;

  private YogaConfigJNIBase(long nativePointer) {
    if (nativePointer == 0) {
      throw new IllegalStateException("Failed to allocate native memory");
    }
    mNativePointer = nativePointer;
  }

  YogaConfigJNIBase() {
    this(YogaNative.jni_YGConfigNewJNI());
  }

  YogaConfigJNIBase(boolean useVanillaJNI) {
    this(YogaNative.jni_YGConfigNewJNI());
  }

  public void setExperimentalFeatureEnabled(YogaExperimentalFeature feature, boolean enabled) {
    YogaNative.jni_YGConfigSetExperimentalFeatureEnabledJNI(mNativePointer, feature.intValue(), enabled);
  }

  public void setUseWebDefaults(boolean useWebDefaults) {
    YogaNative.jni_YGConfigSetUseWebDefaultsJNI(mNativePointer, useWebDefaults);
  }

  public void setPointScaleFactor(float pixelsInPoint) {
    YogaNative.jni_YGConfigSetPointScaleFactorJNI(mNativePointer, pixelsInPoint);
  }

  public void setErrata(YogaErrata errata) {
    YogaNative.jni_YGConfigSetErrataJNI(mNativePointer, errata.intValue());
  }

  public YogaErrata getErrata() {
    return YogaErrata.fromInt(YogaNative.jni_YGConfigGetErrataJNI(mNativePointer));
  }

  public void setLogger(YogaLogger logger) {
    mLogger = logger;
    YogaNative.jni_YGConfigSetLoggerJNI(mNativePointer, logger);
  }

  public YogaLogger getLogger() {
    return mLogger;
  }

  protected long getNativePointer() {
    return mNativePointer;
  }
}
