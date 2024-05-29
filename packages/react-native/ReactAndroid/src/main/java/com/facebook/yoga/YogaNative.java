/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

import com.facebook.yoga.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@DoNotStrip
public class YogaNative {
  static {
    SoLoader.loadLibrary("yoga");
  }

  // JNI methods that use Vanilla JNI
  // YGConfig related
  static native long jni_YGConfigNewJNI();
  static native void jni_YGConfigFreeJNI(long nativePointer);
  static native void jni_YGConfigSetExperimentalFeatureEnabledJNI(long nativePointer, int feature, boolean enabled);
  static native void jni_YGConfigSetUseWebDefaultsJNI(long nativePointer, boolean useWebDefaults);
  static native void jni_YGConfigSetPointScaleFactorJNI(long nativePointer, float pixelsInPoint);
  static native void jni_YGConfigSetErrataJNI(long nativePointer, int errata);
  static native int jni_YGConfigGetErrataJNI(long nativePointer);
  static native void jni_YGConfigSetLoggerJNI(long nativePointer, YogaLogger logger);

  // YGNode related
  static native long jni_YGNodeNewJNI();
  static native long jni_YGNodeNewWithConfigJNI(long configPointer);
  static native void jni_YGNodeFinalizeJNI(long nativePointer);
  static native void jni_YGNodeResetJNI(long nativePointer);
  static native void jni_YGNodeInsertChildJNI(long nativePointer, long childPointer, int index);
  static native void jni_YGNodeSwapChildJNI(long nativePointer, long childPointer, int index);
  static native void jni_YGNodeSetIsReferenceBaselineJNI(long nativePointer, boolean isReferenceBaseline);
  static native boolean jni_YGNodeIsReferenceBaselineJNI(long nativePointer);
  static native void jni_YGNodeRemoveAllChildrenJNI(long nativePointer);
  static native void jni_YGNodeRemoveChildJNI(long nativePointer, long childPointer);
  static native void jni_YGNodeCalculateLayoutJNI(long nativePointer, float width, float height, long[] nativePointers, YogaNodeJNIBase[] nodes);
  static native void jni_YGNodeMarkDirtyJNI(long nativePointer);
  static native boolean jni_YGNodeIsDirtyJNI(long nativePointer);
  static native void jni_YGNodeCopyStyleJNI(long dstNativePointer, long srcNativePointer);
  static native int jni_YGNodeStyleGetDirectionJNI(long nativePointer);
  static native void jni_YGNodeStyleSetDirectionJNI(long nativePointer, int direction);
  static native int jni_YGNodeStyleGetFlexDirectionJNI(long nativePointer);
  static native void jni_YGNodeStyleSetFlexDirectionJNI(long nativePointer, int flexDirection);
  static native int jni_YGNodeStyleGetJustifyContentJNI(long nativePointer);
  static native void jni_YGNodeStyleSetJustifyContentJNI(long nativePointer, int justifyContent);
  static native int jni_YGNodeStyleGetAlignItemsJNI(long nativePointer);
  static native void jni_YGNodeStyleSetAlignItemsJNI(long nativePointer, int alignItems);
  static native int jni_YGNodeStyleGetAlignSelfJNI(long nativePointer);
  static native void jni_YGNodeStyleSetAlignSelfJNI(long nativePointer, int alignSelf);
  static native int jni_YGNodeStyleGetAlignContentJNI(long nativePointer);
  static native void jni_YGNodeStyleSetAlignContentJNI(long nativePointer, int alignContent);
  static native int jni_YGNodeStyleGetPositionTypeJNI(long nativePointer);
  static native void jni_YGNodeStyleSetPositionTypeJNI(long nativePointer, int positionType);
  static native int jni_YGNodeStyleGetFlexWrapJNI(long nativePointer);
  static native void jni_YGNodeStyleSetFlexWrapJNI(long nativePointer, int wrapType);
  static native int jni_YGNodeStyleGetOverflowJNI(long nativePointer);
  static native void jni_YGNodeStyleSetOverflowJNI(long nativePointer, int overflow);
  static native int jni_YGNodeStyleGetDisplayJNI(long nativePointer);
  static native void jni_YGNodeStyleSetDisplayJNI(long nativePointer, int display);
  static native float jni_YGNodeStyleGetFlexJNI(long nativePointer);
  static native void jni_YGNodeStyleSetFlexJNI(long nativePointer, float flex);
  static native float jni_YGNodeStyleGetFlexGrowJNI(long nativePointer);
  static native void jni_YGNodeStyleSetFlexGrowJNI(long nativePointer, float flexGrow);
  static native float jni_YGNodeStyleGetFlexShrinkJNI(long nativePointer);
  static native void jni_YGNodeStyleSetFlexShrinkJNI(long nativePointer, float flexShrink);
  static native long jni_YGNodeStyleGetFlexBasisJNI(long nativePointer);
  static native void jni_YGNodeStyleSetFlexBasisJNI(long nativePointer, float flexBasis);
  static native void jni_YGNodeStyleSetFlexBasisPercentJNI(long nativePointer, float percent);
  static native void jni_YGNodeStyleSetFlexBasisAutoJNI(long nativePointer);
  static native long jni_YGNodeStyleGetMarginJNI(long nativePointer, int edge);
  static native void jni_YGNodeStyleSetMarginJNI(long nativePointer, int edge, float margin);
  static native void jni_YGNodeStyleSetMarginPercentJNI(long nativePointer, int edge, float percent);
  static native void jni_YGNodeStyleSetMarginAutoJNI(long nativePointer, int edge);
  static native long jni_YGNodeStyleGetPaddingJNI(long nativePointer, int edge);
  static native void jni_YGNodeStyleSetPaddingJNI(long nativePointer, int edge, float padding);
  static native void jni_YGNodeStyleSetPaddingPercentJNI(long nativePointer, int edge, float percent);
  static native float jni_YGNodeStyleGetBorderJNI(long nativePointer, int edge);
  static native void jni_YGNodeStyleSetBorderJNI(long nativePointer, int edge, float border);
  static native long jni_YGNodeStyleGetPositionJNI(long nativePointer, int edge);
  static native void jni_YGNodeStyleSetPositionJNI(long nativePointer, int edge, float position);
  static native void jni_YGNodeStyleSetPositionPercentJNI(long nativePointer, int edge, float percent);
  static native long jni_YGNodeStyleGetWidthJNI(long nativePointer);
  static native void jni_YGNodeStyleSetWidthJNI(long nativePointer, float width);
  static native void jni_YGNodeStyleSetWidthPercentJNI(long nativePointer, float percent);
  static native void jni_YGNodeStyleSetWidthAutoJNI(long nativePointer);
  static native long jni_YGNodeStyleGetHeightJNI(long nativePointer);
  static native void jni_YGNodeStyleSetHeightJNI(long nativePointer, float height);
  static native void jni_YGNodeStyleSetHeightPercentJNI(long nativePointer, float percent);
  static native void jni_YGNodeStyleSetHeightAutoJNI(long nativePointer);
  static native long jni_YGNodeStyleGetMinWidthJNI(long nativePointer);
  static native void jni_YGNodeStyleSetMinWidthJNI(long nativePointer, float minWidth);
  static native void jni_YGNodeStyleSetMinWidthPercentJNI(long nativePointer, float percent);
  static native long jni_YGNodeStyleGetMinHeightJNI(long nativePointer);
  static native void jni_YGNodeStyleSetMinHeightJNI(long nativePointer, float minHeight);
  static native void jni_YGNodeStyleSetMinHeightPercentJNI(long nativePointer, float percent);
  static native long jni_YGNodeStyleGetMaxWidthJNI(long nativePointer);
  static native void jni_YGNodeStyleSetMaxWidthJNI(long nativePointer, float maxWidth);
  static native void jni_YGNodeStyleSetMaxWidthPercentJNI(long nativePointer, float percent);
  static native long jni_YGNodeStyleGetMaxHeightJNI(long nativePointer);
  static native void jni_YGNodeStyleSetMaxHeightJNI(long nativePointer, float maxheight);
  static native void jni_YGNodeStyleSetMaxHeightPercentJNI(long nativePointer, float percent);
  static native float jni_YGNodeStyleGetAspectRatioJNI(long nativePointer);
  static native void jni_YGNodeStyleSetAspectRatioJNI(long nativePointer, float aspectRatio);
  static native float jni_YGNodeStyleGetGapJNI(long nativePointer, int gutter);
  static native void jni_YGNodeStyleSetGapJNI(long nativePointer, int gutter, float gapLength);
  static native void jni_YGNodeStyleSetGapPercentJNI(long nativePointer, int gutter, float gapLength);
  static native void jni_YGNodeSetHasMeasureFuncJNI(long nativePointer, boolean hasMeasureFunc);
  static native void jni_YGNodeSetHasBaselineFuncJNI(long nativePointer, boolean hasMeasureFunc);
  static native void jni_YGNodeSetStyleInputsJNI(long nativePointer, float[] styleInputsArray, int size);
  static native long jni_YGNodeCloneJNI(long nativePointer);
  static native void jni_YGNodeSetAlwaysFormsContainingBlockJNI(long nativePointer, boolean alwaysFormContainingBlock);
}
