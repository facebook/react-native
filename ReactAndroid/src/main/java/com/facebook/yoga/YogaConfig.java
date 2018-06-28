/*
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@DoNotStrip
public class YogaConfig {

  public static int SPACING_TYPE = 1;

  static {
      SoLoader.loadLibrary("yoga");
  }

  long mNativePointer;
  private YogaLogger mLogger;
  private YogaNodeCloneFunction mYogaNodeCloneFunction;

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

  private native void jni_YGConfigSetPointScaleFactor(long nativePointer, float pixelsInPoint);
  public void setPointScaleFactor(float pixelsInPoint) {
    jni_YGConfigSetPointScaleFactor(mNativePointer, pixelsInPoint);
  }

  private native void jni_YGConfigSetUseLegacyStretchBehaviour(long nativePointer, boolean useLegacyStretchBehaviour);

  /**
   * Yoga previously had an error where containers would take the maximum space possible instead of the minimum
   * like they are supposed to. In practice this resulted in implicit behaviour similar to align-self: stretch;
   * Because this was such a long-standing bug we must allow legacy users to switch back to this behaviour.
   */
  public void setUseLegacyStretchBehaviour(boolean useLegacyStretchBehaviour) {
    jni_YGConfigSetUseLegacyStretchBehaviour(mNativePointer, useLegacyStretchBehaviour);
  }

  private native void jni_YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
      long nativePointer, boolean shouldDiffLayoutWithoutLegacyStretchBehaviour);
  /**
   * If this flag is set then yoga would diff the layout without legacy flag and would set a bool in
   * YogaNode(mDoesLegacyStretchFlagAffectsLayout) with true if the layouts were different and false
   * if not
   */
  public void setShouldDiffLayoutWithoutLegacyStretchBehaviour(
      boolean shouldDiffLayoutWithoutLegacyStretchBehaviour) {
    jni_YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
        mNativePointer, shouldDiffLayoutWithoutLegacyStretchBehaviour);
  }

  private native void jni_YGConfigSetLogger(long nativePointer, Object logger);
  public void setLogger(YogaLogger logger) {
    mLogger = logger;
    jni_YGConfigSetLogger(mNativePointer, logger);
  }

  public YogaLogger getLogger() {
    return mLogger;
  }

  private native void jni_YGConfigSetHasCloneNodeFunc(long nativePointer, boolean hasClonedFunc);

  public void setOnCloneNode(YogaNodeCloneFunction cloneYogaNodeFunction) {
    mYogaNodeCloneFunction = cloneYogaNodeFunction;
    jni_YGConfigSetHasCloneNodeFunc(mNativePointer, cloneYogaNodeFunction != null);
  }

  @DoNotStrip
  private final YogaNode cloneNode(YogaNode oldNode, YogaNode parent, int childIndex) {
    return mYogaNodeCloneFunction.cloneNode(oldNode, parent, childIndex);
  }
}
