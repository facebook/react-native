/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.yoga;

public abstract class YogaConfigJNIBase extends YogaConfig {

  long mNativePointer;
  private YogaLogger mLogger;
  private boolean useVanillaJNI = false;

  private YogaConfigJNIBase(long nativePointer) {
    if (nativePointer == 0) {
      throw new IllegalStateException("Failed to allocate native memory");
    }
    mNativePointer = nativePointer;
  }

  YogaConfigJNIBase() {
    this(YogaNative.jni_YGConfigNew());
  }

  YogaConfigJNIBase(boolean useVanillaJNI) {
    this(useVanillaJNI ? YogaNative.jni_YGConfigNewJNI() : YogaNative.jni_YGConfigNew());
    this.useVanillaJNI = useVanillaJNI;
  }

  public void setExperimentalFeatureEnabled(YogaExperimentalFeature feature, boolean enabled) {
    if (useVanillaJNI)
      YogaNative.jni_YGConfigSetExperimentalFeatureEnabledJNI(mNativePointer, feature.intValue(), enabled);
    else
      YogaNative.jni_YGConfigSetExperimentalFeatureEnabled(mNativePointer, feature.intValue(), enabled);
  }

  public void setUseWebDefaults(boolean useWebDefaults) {
    if (useVanillaJNI)
      YogaNative.jni_YGConfigSetUseWebDefaultsJNI(mNativePointer, useWebDefaults);
    else
      YogaNative.jni_YGConfigSetUseWebDefaults(mNativePointer, useWebDefaults);
  }

  public void setPrintTreeFlag(boolean enable) {
    if (useVanillaJNI)
      YogaNative.jni_YGConfigSetPrintTreeFlagJNI(mNativePointer, enable);
    else
      YogaNative.jni_YGConfigSetPrintTreeFlag(mNativePointer, enable);
  }

  public void setPointScaleFactor(float pixelsInPoint) {
    if (useVanillaJNI)
      YogaNative.jni_YGConfigSetPointScaleFactorJNI(mNativePointer, pixelsInPoint);
    else
      YogaNative.jni_YGConfigSetPointScaleFactor(mNativePointer, pixelsInPoint);
  }

  /**
   * Yoga previously had an error where containers would take the maximum space possible instead of the minimum
   * like they are supposed to. In practice this resulted in implicit behaviour similar to align-self: stretch;
   * Because this was such a long-standing bug we must allow legacy users to switch back to this behaviour.
   */
  public void setUseLegacyStretchBehaviour(boolean useLegacyStretchBehaviour) {
    if (useVanillaJNI)
      YogaNative.jni_YGConfigSetUseLegacyStretchBehaviourJNI(mNativePointer, useLegacyStretchBehaviour);
    else
      YogaNative.jni_YGConfigSetUseLegacyStretchBehaviour(mNativePointer, useLegacyStretchBehaviour);
  }

  /**
   * If this flag is set then yoga would diff the layout without legacy flag and would set a bool in
   * YogaNode(mDoesLegacyStretchFlagAffectsLayout) with true if the layouts were different and false
   * if not
   */
  public void setShouldDiffLayoutWithoutLegacyStretchBehaviour(
      boolean shouldDiffLayoutWithoutLegacyStretchBehaviour) {
    if (useVanillaJNI)
      YogaNative.jni_YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviourJNI(
          mNativePointer, shouldDiffLayoutWithoutLegacyStretchBehaviour);
    else
      YogaNative.jni_YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
          mNativePointer, shouldDiffLayoutWithoutLegacyStretchBehaviour);
  }

  public void setLogger(YogaLogger logger) {
    mLogger = logger;
    YogaNative.jni_YGConfigSetLogger(mNativePointer, logger);
  }

  public YogaLogger getLogger() {
    return mLogger;
  }

  long getNativePointer() {
    return mNativePointer;
  }

  @Override
  public boolean useVanillaJNI() {
    return this.useVanillaJNI;
  }
}
