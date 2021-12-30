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

  public void setPrintTreeFlag(boolean enable) {
    YogaNative.jni_YGConfigSetPrintTreeFlagJNI(mNativePointer, enable);
  }

  public void setPointScaleFactor(float pixelsInPoint) {
    YogaNative.jni_YGConfigSetPointScaleFactorJNI(mNativePointer, pixelsInPoint);
  }

  /**
   * Yoga previously had an error where containers would take the maximum space possible instead of the minimum
   * like they are supposed to. In practice this resulted in implicit behaviour similar to align-self: stretch;
   * Because this was such a long-standing bug we must allow legacy users to switch back to this behaviour.
   */
  public void setUseLegacyStretchBehaviour(boolean useLegacyStretchBehaviour) {
    YogaNative.jni_YGConfigSetUseLegacyStretchBehaviourJNI(mNativePointer, useLegacyStretchBehaviour);
  }

  /**
   * If this flag is set then yoga would diff the layout without legacy flag and would set a bool in
   * YogaNode(mDoesLegacyStretchFlagAffectsLayout) with true if the layouts were different and false
   * if not
   */
  public void setShouldDiffLayoutWithoutLegacyStretchBehaviour(
      boolean shouldDiffLayoutWithoutLegacyStretchBehaviour) {
      YogaNative.jni_YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviourJNI(
          mNativePointer, shouldDiffLayoutWithoutLegacyStretchBehaviour);
  }

  public void setLogger(YogaLogger logger) {
    mLogger = logger;
    YogaNative.jni_YGConfigSetLoggerJNI(mNativePointer, logger);
  }

  public YogaLogger getLogger() {
    return mLogger;
  }

  long getNativePointer() {
    return mNativePointer;
  }
}
