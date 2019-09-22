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

  private YogaConfigJNIBase(long nativePointer) {
    if (nativePointer == 0) {
      throw new IllegalStateException("Failed to allocate native memory");
    }
    mNativePointer = nativePointer;
  }

  YogaConfigJNIBase() {
    this(YogaNative.jni_YGConfigNew());
  }

  public void setExperimentalFeatureEnabled(YogaExperimentalFeature feature, boolean enabled) {
    YogaNative.jni_YGConfigSetExperimentalFeatureEnabled(mNativePointer, feature.intValue(), enabled);
  }

  public void setUseWebDefaults(boolean useWebDefaults) {
    YogaNative.jni_YGConfigSetUseWebDefaults(mNativePointer, useWebDefaults);
  }

  public void setPrintTreeFlag(boolean enable) {
    YogaNative.jni_YGConfigSetPrintTreeFlag(mNativePointer, enable);
  }

  public void setPointScaleFactor(float pixelsInPoint) {
    YogaNative.jni_YGConfigSetPointScaleFactor(mNativePointer, pixelsInPoint);
  }

  /**
   * Yoga previously had an error where containers would take the maximum space possible instead of the minimum
   * like they are supposed to. In practice this resulted in implicit behaviour similar to align-self: stretch;
   * Because this was such a long-standing bug we must allow legacy users to switch back to this behaviour.
   */
  public void setUseLegacyStretchBehaviour(boolean useLegacyStretchBehaviour) {
    YogaNative.jni_YGConfigSetUseLegacyStretchBehaviour(mNativePointer, useLegacyStretchBehaviour);
  }

  /**
   * If this flag is set then yoga would diff the layout without legacy flag and would set a bool in
   * YogaNode(mDoesLegacyStretchFlagAffectsLayout) with true if the layouts were different and false
   * if not
   */
  public void setShouldDiffLayoutWithoutLegacyStretchBehaviour(
      boolean shouldDiffLayoutWithoutLegacyStretchBehaviour) {
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
}
