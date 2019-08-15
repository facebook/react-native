/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@DoNotStrip
public class YogaNative {
  static {
    SoLoader.loadLibrary("yoga");
  }

  // YGConfig related
  static native long jni_YGConfigNew();
  static native void jni_YGConfigFree(long nativePointer);
  static native void jni_YGConfigSetExperimentalFeatureEnabled(long nativePointer, int feature, boolean enabled);
  static native void jni_YGConfigSetUseWebDefaults(long nativePointer, boolean useWebDefaults);
  static native void jni_YGConfigSetPrintTreeFlag(long nativePointer, boolean enable);
  static native void jni_YGConfigSetPointScaleFactor(long nativePointer, float pixelsInPoint);
  static native void jni_YGConfigSetUseLegacyStretchBehaviour(long nativePointer, boolean useLegacyStretchBehaviour);
  static native void jni_YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(long nativePointer, boolean shouldDiffLayoutWithoutLegacyStretchBehaviour);
  static native void jni_YGConfigSetLogger(long nativePointer, Object logger);


  // YGNode related
  static native long jni_YGNodeNew(boolean useBatchingForLayoutOutputs);
  static native long jni_YGNodeNewWithConfig(long configPointer, boolean useBatchingForLayoutOutputs);
  static native void jni_YGNodeFree(long nativePointer);
  static native void jni_YGNodeReset(long nativePointer);
  static native void jni_YGNodeInsertChild(long nativePointer, long childPointer, int index);
  static native void jni_YGNodeSetIsReferenceBaseline(long nativePointer, boolean isReferenceBaseline);
  static native boolean jni_YGNodeIsReferenceBaseline(long nativePointer);
  static native void jni_YGNodeClearChildren(long nativePointer);
  static native void jni_YGNodeRemoveChild(long nativePointer, long childPointer);
  static native void jni_YGNodeCalculateLayout(long nativePointer, float width, float height, long[] nativePointers, YogaNodeJNIBase[] nodes);
  static native void jni_YGNodeMarkDirty(long nativePointer);
  static native void jni_YGNodeMarkDirtyAndPropogateToDescendants(long nativePointer);
  static native boolean jni_YGNodeIsDirty(long nativePointer);
  static native void jni_YGNodeCopyStyle(long dstNativePointer, long srcNativePointer);
  static native int jni_YGNodeStyleGetDirection(long nativePointer);
  static native void jni_YGNodeStyleSetDirection(long nativePointer, int direction);
  static native int jni_YGNodeStyleGetFlexDirection(long nativePointer);
  static native void jni_YGNodeStyleSetFlexDirection(long nativePointer, int flexDirection);
  static native int jni_YGNodeStyleGetJustifyContent(long nativePointer);
  static native void jni_YGNodeStyleSetJustifyContent(long nativePointer, int justifyContent);
  static native int jni_YGNodeStyleGetAlignItems(long nativePointer);
  static native void jni_YGNodeStyleSetAlignItems(long nativePointer, int alignItems);
  static native int jni_YGNodeStyleGetAlignSelf(long nativePointer);
  static native void jni_YGNodeStyleSetAlignSelf(long nativePointer, int alignSelf);
  static native int jni_YGNodeStyleGetAlignContent(long nativePointer);
  static native void jni_YGNodeStyleSetAlignContent(long nativePointer, int alignContent);
  static native int jni_YGNodeStyleGetPositionType(long nativePointer);
  static native void jni_YGNodeStyleSetPositionType(long nativePointer, int positionType);
  static native int jni_YGNodeStyleGetFlexWrap(long nativePointer);
  static native void jni_YGNodeStyleSetFlexWrap(long nativePointer, int wrapType);
  static native int jni_YGNodeStyleGetOverflow(long nativePointer);
  static native void jni_YGNodeStyleSetOverflow(long nativePointer, int overflow);
  static native int jni_YGNodeStyleGetDisplay(long nativePointer);
  static native void jni_YGNodeStyleSetDisplay(long nativePointer, int display);
  static native float jni_YGNodeStyleGetFlex(long nativePointer);
  static native void jni_YGNodeStyleSetFlex(long nativePointer, float flex);
  static native float jni_YGNodeStyleGetFlexGrow(long nativePointer);
  static native void jni_YGNodeStyleSetFlexGrow(long nativePointer, float flexGrow);
  static native float jni_YGNodeStyleGetFlexShrink(long nativePointer);
  static native void jni_YGNodeStyleSetFlexShrink(long nativePointer, float flexShrink);
  static native long jni_YGNodeStyleGetFlexBasis(long nativePointer);
  static native void jni_YGNodeStyleSetFlexBasis(long nativePointer, float flexBasis);
  static native void jni_YGNodeStyleSetFlexBasisPercent(long nativePointer, float percent);
  static native void jni_YGNodeStyleSetFlexBasisAuto(long nativePointer);
  static native long jni_YGNodeStyleGetMargin(long nativePointer, int edge);
  static native void jni_YGNodeStyleSetMargin(long nativePointer, int edge, float margin);
  static native void jni_YGNodeStyleSetMarginPercent(long nativePointer, int edge, float percent);
  static native void jni_YGNodeStyleSetMarginAuto(long nativePointer, int edge);
  static native long jni_YGNodeStyleGetPadding(long nativePointer, int edge);
  static native void jni_YGNodeStyleSetPadding(long nativePointer, int edge, float padding);
  static native void jni_YGNodeStyleSetPaddingPercent(long nativePointer, int edge, float percent);
  static native float jni_YGNodeStyleGetBorder(long nativePointer, int edge);
  static native void jni_YGNodeStyleSetBorder(long nativePointer, int edge, float border);
  static native long jni_YGNodeStyleGetPosition(long nativePointer, int edge);
  static native void jni_YGNodeStyleSetPosition(long nativePointer, int edge, float position);
  static native void jni_YGNodeStyleSetPositionPercent(long nativePointer, int edge, float percent);
  static native long jni_YGNodeStyleGetWidth(long nativePointer);
  static native void jni_YGNodeStyleSetWidth(long nativePointer, float width);
  static native void jni_YGNodeStyleSetWidthPercent(long nativePointer, float percent);
  static native void jni_YGNodeStyleSetWidthAuto(long nativePointer);
  static native long jni_YGNodeStyleGetHeight(long nativePointer);
  static native void jni_YGNodeStyleSetHeight(long nativePointer, float height);
  static native void jni_YGNodeStyleSetHeightPercent(long nativePointer, float percent);
  static native void jni_YGNodeStyleSetHeightAuto(long nativePointer);
  static native long jni_YGNodeStyleGetMinWidth(long nativePointer);
  static native void jni_YGNodeStyleSetMinWidth(long nativePointer, float minWidth);
  static native void jni_YGNodeStyleSetMinWidthPercent(long nativePointer, float percent);
  static native long jni_YGNodeStyleGetMinHeight(long nativePointer);
  static native void jni_YGNodeStyleSetMinHeight(long nativePointer, float minHeight);
  static native void jni_YGNodeStyleSetMinHeightPercent(long nativePointer, float percent);
  static native long jni_YGNodeStyleGetMaxWidth(long nativePointer);
  static native void jni_YGNodeStyleSetMaxWidth(long nativePointer, float maxWidth);
  static native void jni_YGNodeStyleSetMaxWidthPercent(long nativePointer, float percent);
  static native long jni_YGNodeStyleGetMaxHeight(long nativePointer);
  static native void jni_YGNodeStyleSetMaxHeight(long nativePointer, float maxheight);
  static native void jni_YGNodeStyleSetMaxHeightPercent(long nativePointer, float percent);
  static native float jni_YGNodeStyleGetAspectRatio(long nativePointer);
  static native void jni_YGNodeStyleSetAspectRatio(long nativePointer, float aspectRatio);
  static native void jni_YGNodeSetHasMeasureFunc(long nativePointer, boolean hasMeasureFunc);
  static native void jni_YGNodeSetHasBaselineFunc(long nativePointer, boolean hasMeasureFunc);
  static native void jni_YGNodePrint(long nativePointer);
  static native void jni_YGNodeSetStyleInputs(long nativePointer, float[] styleInputsArray, int size);
  static native long jni_YGNodeClone(long nativePointer);
}
