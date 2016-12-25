/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.yoga;

import javax.annotation.Nullable;

import java.util.List;
import java.util.ArrayList;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@DoNotStrip
public class YogaNode implements YogaNodeAPI<YogaNode> {

  static {
    SoLoader.loadLibrary("yoga");
  }

  /**
   * Get native instance count. Useful for testing only.
   */
  static native int jni_YGNodeGetInstanceCount();
  static native void jni_YGLog(int level, String message);

  private static native void jni_YGSetLogger(Object logger);
  public static void setLogger(YogaLogger logger) {
    jni_YGSetLogger(logger);
  }

  private static native void jni_YGSetExperimentalFeatureEnabled(
      int feature,
      boolean enabled);
  public static void setExperimentalFeatureEnabled(
      YogaExperimentalFeature feature,
      boolean enabled) {
    jni_YGSetExperimentalFeatureEnabled(feature.intValue(), enabled);
  }

  private static native boolean jni_YGIsExperimentalFeatureEnabled(int feature);
  public static boolean isExperimentalFeatureEnabled(YogaExperimentalFeature feature) {
    return jni_YGIsExperimentalFeatureEnabled(feature.intValue());
  }

  private YogaNode mParent;
  private List<YogaNode> mChildren;
  private YogaMeasureFunction mMeasureFunction;
  private long mNativePointer;
  private Object mData;

  private boolean mHasSetPadding = false;
  private boolean mHasSetMargin = false;
  private boolean mHasSetBorder = false;
  private boolean mHasSetPosition = false;

  @DoNotStrip
  private float mWidth = YogaConstants.UNDEFINED;
  @DoNotStrip
  private float mHeight = YogaConstants.UNDEFINED;
  @DoNotStrip
  private float mTop = YogaConstants.UNDEFINED;
  @DoNotStrip
  private float mLeft = YogaConstants.UNDEFINED;
  @DoNotStrip
  private int mLayoutDirection = 0;

  private native long jni_YGNodeNew();
  public YogaNode() {
    mNativePointer = jni_YGNodeNew();
    if (mNativePointer == 0) {
      throw new IllegalStateException("Failed to allocate native memory");
    }
  }

  private native void jni_YGNodeFree(long nativePointer);
  @Override
  protected void finalize() throws Throwable {
    try {
      jni_YGNodeFree(mNativePointer);
    } finally {
      super.finalize();
    }
  }

  private native void jni_YGNodeReset(long nativePointer);
  @Override
  public void reset() {
    mHasSetPadding = false;
    mHasSetMargin = false;
    mHasSetBorder = false;
    mHasSetPosition = false;

    mWidth = YogaConstants.UNDEFINED;
    mHeight = YogaConstants.UNDEFINED;
    mTop = YogaConstants.UNDEFINED;
    mLeft = YogaConstants.UNDEFINED;
    mLayoutDirection = 0;

    mMeasureFunction = null;
    mData = null;

    jni_YGNodeReset(mNativePointer);
  }

  @Override
  public int getChildCount() {
    return mChildren == null ? 0 : mChildren.size();
  }

  @Override
  public YogaNode getChildAt(int i) {
    return mChildren.get(i);
  }

  private native void jni_YGNodeInsertChild(long nativePointer, long childPointer, int index);
  @Override
  public void addChildAt(YogaNode child, int i) {
    if (child.mParent != null) {
      throw new IllegalStateException("Child already has a parent, it must be removed first.");
    }

    if (mChildren == null) {
      mChildren = new ArrayList<>(4);
    }
    mChildren.add(i, child);
    child.mParent = this;
    jni_YGNodeInsertChild(mNativePointer, child.mNativePointer, i);
  }

  private native void jni_YGNodeRemoveChild(long nativePointer, long childPointer);
  @Override
  public YogaNode removeChildAt(int i) {

    final YogaNode child = mChildren.remove(i);
    child.mParent = null;
    jni_YGNodeRemoveChild(mNativePointer, child.mNativePointer);
    return child;
  }

  @Override
  public @Nullable
  YogaNode getParent() {
    return mParent;
  }

  @Override
  public int indexOf(YogaNode child) {
    return mChildren == null ? -1 : mChildren.indexOf(child);
  }

  private native void jni_YGNodeCalculateLayout(long nativePointer);
  @Override
  public void calculateLayout() {
    jni_YGNodeCalculateLayout(mNativePointer);
  }

  private native boolean jni_YGNodeHasNewLayout(long nativePointer);
  @Override
  public boolean hasNewLayout() {
    return jni_YGNodeHasNewLayout(mNativePointer);
  }

  private native void jni_YGNodeMarkDirty(long nativePointer);
  @Override
  public void dirty() {
    jni_YGNodeMarkDirty(mNativePointer);
  }

  private native boolean jni_YGNodeIsDirty(long nativePointer);
  @Override
  public boolean isDirty() {
    return jni_YGNodeIsDirty(mNativePointer);
  }

  private native void jni_YGNodeMarkLayoutSeen(long nativePointer);
  @Override
  public void markLayoutSeen() {
    jni_YGNodeMarkLayoutSeen(mNativePointer);
  }

  private native void jni_YGNodeCopyStyle(long dstNativePointer, long srcNativePointer);
  @Override
  public void copyStyle(YogaNode srcNode) {
    jni_YGNodeCopyStyle(mNativePointer, srcNode.mNativePointer);
  }

  private native int jni_YGNodeStyleGetDirection(long nativePointer);
  @Override
  public YogaDirection getStyleDirection() {
    return YogaDirection.values()[jni_YGNodeStyleGetDirection(mNativePointer)];
  }

  private native void jni_YGNodeStyleSetDirection(long nativePointer, int direction);
  @Override
  public void setDirection(YogaDirection direction) {
    jni_YGNodeStyleSetDirection(mNativePointer, direction.intValue());
  }

  private native int jni_YGNodeStyleGetFlexDirection(long nativePointer);
  @Override
  public YogaFlexDirection getFlexDirection() {
    return YogaFlexDirection.values()[jni_YGNodeStyleGetFlexDirection(mNativePointer)];
  }

  private native void jni_YGNodeStyleSetFlexDirection(long nativePointer, int flexDirection);
  @Override
  public void setFlexDirection(YogaFlexDirection flexDirection) {
    jni_YGNodeStyleSetFlexDirection(mNativePointer, flexDirection.intValue());
  }

  private native int jni_YGNodeStyleGetJustifyContent(long nativePointer);
  @Override
  public YogaJustify getJustifyContent() {
    return YogaJustify.values()[jni_YGNodeStyleGetJustifyContent(mNativePointer)];
  }

  private native void jni_YGNodeStyleSetJustifyContent(long nativePointer, int justifyContent);
  @Override
  public void setJustifyContent(YogaJustify justifyContent) {
    jni_YGNodeStyleSetJustifyContent(mNativePointer, justifyContent.intValue());
  }

  private native int jni_YGNodeStyleGetAlignItems(long nativePointer);
  @Override
  public YogaAlign getAlignItems() {
    return YogaAlign.values()[jni_YGNodeStyleGetAlignItems(mNativePointer)];
  }

  private native void jni_YGNodeStyleSetAlignItems(long nativePointer, int alignItems);
  @Override
  public void setAlignItems(YogaAlign alignItems) {
    jni_YGNodeStyleSetAlignItems(mNativePointer, alignItems.intValue());
  }

  private native int jni_YGNodeStyleGetAlignSelf(long nativePointer);
  @Override
  public YogaAlign getAlignSelf() {
    return YogaAlign.values()[jni_YGNodeStyleGetAlignSelf(mNativePointer)];
  }

  private native void jni_YGNodeStyleSetAlignSelf(long nativePointer, int alignSelf);
  @Override
  public void setAlignSelf(YogaAlign alignSelf) {
    jni_YGNodeStyleSetAlignSelf(mNativePointer, alignSelf.intValue());
  }

  private native int jni_YGNodeStyleGetAlignContent(long nativePointer);
  @Override
  public YogaAlign getAlignContent() {
    return YogaAlign.values()[jni_YGNodeStyleGetAlignContent(mNativePointer)];
  }

  private native void jni_YGNodeStyleSetAlignContent(long nativePointer, int alignContent);
  @Override
  public void setAlignContent(YogaAlign alignContent) {
    jni_YGNodeStyleSetAlignContent(mNativePointer, alignContent.intValue());
  }

  private native int jni_YGNodeStyleGetPositionType(long nativePointer);
  @Override
  public YogaPositionType getPositionType() {
    return YogaPositionType.values()[jni_YGNodeStyleGetPositionType(mNativePointer)];
  }

  private native void jni_YGNodeStyleSetPositionType(long nativePointer, int positionType);
  @Override
  public void setPositionType(YogaPositionType positionType) {
    jni_YGNodeStyleSetPositionType(mNativePointer, positionType.intValue());
  }

  private native void jni_YGNodeStyleSetFlexWrap(long nativePointer, int wrapType);
  @Override
  public void setWrap(YogaWrap flexWrap) {
    jni_YGNodeStyleSetFlexWrap(mNativePointer, flexWrap.intValue());
  }

  private native int jni_YGNodeStyleGetOverflow(long nativePointer);
  @Override
  public YogaOverflow getOverflow() {
    return YogaOverflow.values()[jni_YGNodeStyleGetOverflow(mNativePointer)];
  }

  private native void jni_YGNodeStyleSetOverflow(long nativePointer, int overflow);
  @Override
  public void setOverflow(YogaOverflow overflow) {
    jni_YGNodeStyleSetOverflow(mNativePointer, overflow.intValue());
  }

  private native void jni_YGNodeStyleSetFlex(long nativePointer, float flex);
  @Override
  public void setFlex(float flex) {
    jni_YGNodeStyleSetFlex(mNativePointer, flex);
  }

  private native float jni_YGNodeStyleGetFlexGrow(long nativePointer);
  @Override
  public float getFlexGrow() {
    return jni_YGNodeStyleGetFlexGrow(mNativePointer);
  }

  private native void jni_YGNodeStyleSetFlexGrow(long nativePointer, float flexGrow);
  @Override
  public void setFlexGrow(float flexGrow) {
    jni_YGNodeStyleSetFlexGrow(mNativePointer, flexGrow);
  }

  private native float jni_YGNodeStyleGetFlexShrink(long nativePointer);
  @Override
  public float getFlexShrink() {
    return jni_YGNodeStyleGetFlexShrink(mNativePointer);
  }

  private native void jni_YGNodeStyleSetFlexShrink(long nativePointer, float flexShrink);
  @Override
  public void setFlexShrink(float flexShrink) {
    jni_YGNodeStyleSetFlexShrink(mNativePointer, flexShrink);
  }

  private native float jni_YGNodeStyleGetFlexBasis(long nativePointer);
  @Override
  public float getFlexBasis() {
    return jni_YGNodeStyleGetFlexBasis(mNativePointer);
  }

  private native void jni_YGNodeStyleSetFlexBasis(long nativePointer, float flexBasis);
  @Override
  public void setFlexBasis(float flexBasis) {
    jni_YGNodeStyleSetFlexBasis(mNativePointer, flexBasis);
  }

  private native float jni_YGNodeStyleGetMargin(long nativePointer, int edge);
  @Override
  public float getMargin(YogaEdge edge) {
    if (!mHasSetMargin) {
      return edge.intValue() < YogaEdge.START.intValue() ? 0 : YogaConstants.UNDEFINED;
    }
    return jni_YGNodeStyleGetMargin(mNativePointer, edge.intValue());
  }

  private native void jni_YGNodeStyleSetMargin(long nativePointer, int edge, float margin);
  @Override
  public void setMargin(YogaEdge edge, float margin) {
    mHasSetMargin = true;
    jni_YGNodeStyleSetMargin(mNativePointer, edge.intValue(), margin);
  }

  private native float jni_YGNodeStyleGetPadding(long nativePointer, int edge);
  @Override
  public float getPadding(YogaEdge edge) {
    if (!mHasSetPadding) {
      return edge.intValue() < YogaEdge.START.intValue() ? 0 : YogaConstants.UNDEFINED;
    }
    return jni_YGNodeStyleGetPadding(mNativePointer, edge.intValue());
  }

  private native void jni_YGNodeStyleSetPadding(long nativePointer, int edge, float padding);
  @Override
  public void setPadding(YogaEdge edge, float padding) {
    mHasSetPadding = true;
    jni_YGNodeStyleSetPadding(mNativePointer, edge.intValue(), padding);
  }

  private native float jni_YGNodeStyleGetBorder(long nativePointer, int edge);
  @Override
  public float getBorder(YogaEdge edge) {
    if (!mHasSetBorder) {
      return edge.intValue() < YogaEdge.START.intValue() ? 0 : YogaConstants.UNDEFINED;
    }
    return jni_YGNodeStyleGetBorder(mNativePointer, edge.intValue());
  }

  private native void jni_YGNodeStyleSetBorder(long nativePointer, int edge, float border);
  @Override
  public void setBorder(YogaEdge edge, float border) {
    mHasSetBorder = true;
    jni_YGNodeStyleSetBorder(mNativePointer, edge.intValue(), border);
  }

  private native float jni_YGNodeStyleGetPosition(long nativePointer, int edge);
  @Override
  public float getPosition(YogaEdge edge) {
    if (!mHasSetPosition) {
      return YogaConstants.UNDEFINED;
    }
    return jni_YGNodeStyleGetPosition(mNativePointer, edge.intValue());
  }

  private native void jni_YGNodeStyleSetPosition(long nativePointer, int edge, float position);
  @Override
  public void setPosition(YogaEdge edge, float position) {
    mHasSetPosition = true;
    jni_YGNodeStyleSetPosition(mNativePointer, edge.intValue(), position);
  }

  private native float jni_YGNodeStyleGetWidth(long nativePointer);
  @Override
  public float getWidth() {
    return jni_YGNodeStyleGetWidth(mNativePointer);
  }

  private native void jni_YGNodeStyleSetWidth(long nativePointer, float width);
  @Override
  public void setWidth(float width) {
    jni_YGNodeStyleSetWidth(mNativePointer, width);
  }

  private native float jni_YGNodeStyleGetHeight(long nativePointer);
  @Override
  public float getHeight() {
    return jni_YGNodeStyleGetHeight(mNativePointer);
  }

  private native void jni_YGNodeStyleSetHeight(long nativePointer, float height);
  @Override
  public void setHeight(float height) {
    jni_YGNodeStyleSetHeight(mNativePointer, height);
  }

  private native float jni_YGNodeStyleGetMinWidth(long nativePointer);
  @Override
  public float getMinWidth() {
    return jni_YGNodeStyleGetMinWidth(mNativePointer);
  }

  private native void jni_YGNodeStyleSetMinWidth(long nativePointer, float minWidth);
  @Override
  public void setMinWidth(float minWidth) {
    jni_YGNodeStyleSetMinWidth(mNativePointer, minWidth);
  }

  private native float jni_YGNodeStyleGetMinHeight(long nativePointer);
  @Override
  public float getMinHeight() {
    return jni_YGNodeStyleGetMinHeight(mNativePointer);
  }

  private native void jni_YGNodeStyleSetMinHeight(long nativePointer, float minHeight);
  @Override
  public void setMinHeight(float minHeight) {
    jni_YGNodeStyleSetMinHeight(mNativePointer, minHeight);
  }

  private native float jni_YGNodeStyleGetMaxWidth(long nativePointer);
  @Override
  public float getMaxWidth() {
    return jni_YGNodeStyleGetMaxWidth(mNativePointer);
  }

  private native void jni_YGNodeStyleSetMaxWidth(long nativePointer, float maxWidth);
  @Override
  public void setMaxWidth(float maxWidth) {
    jni_YGNodeStyleSetMaxWidth(mNativePointer, maxWidth);
  }

  private native float jni_YGNodeStyleGetMaxHeight(long nativePointer);
  @Override
  public float getMaxHeight() {
    return jni_YGNodeStyleGetMaxHeight(mNativePointer);
  }

  private native void jni_YGNodeStyleSetMaxHeight(long nativePointer, float maxheight);
  @Override
  public void setMaxHeight(float maxheight) {
    jni_YGNodeStyleSetMaxHeight(mNativePointer, maxheight);
  }

  private native float jni_YGNodeStyleGetAspectRatio(long nativePointer);
  public float getAspectRatio() {
    return jni_YGNodeStyleGetAspectRatio(mNativePointer);
  }

  private native void jni_YGNodeStyleSetAspectRatio(long nativePointer, float aspectRatio);
  public void setAspectRatio(float aspectRatio) {
    jni_YGNodeStyleSetAspectRatio(mNativePointer, aspectRatio);
  }

  @Override
  public float getLayoutX() {
    return mLeft;
  }

  @Override
  public float getLayoutY() {
    return mTop;
  }

  @Override
  public float getLayoutWidth() {
    return mWidth;
  }

  @Override
  public float getLayoutHeight() {
    return mHeight;
  }

  @Override
  public YogaDirection getLayoutDirection() {
    return YogaDirection.values()[mLayoutDirection];
  }

  private native void jni_YGNodeSetHasMeasureFunc(long nativePointer, boolean hasMeasureFunc);
  @Override
  public void setMeasureFunction(YogaMeasureFunction measureFunction) {
    mMeasureFunction = measureFunction;
    jni_YGNodeSetHasMeasureFunc(mNativePointer, measureFunction != null);
  }

  // Implementation Note: Why this method needs to stay final
  //
  // We cache the jmethodid for this method in Yoga code. This means that even if a subclass
  // were to override measure, we'd still call this implementation from layout code since the
  // overriding method will have a different jmethodid. This is final to prevent that mistake.
  @DoNotStrip
  public final long measure(float width, int widthMode, float height, int heightMode) {
    if (!isMeasureDefined()) {
      throw new RuntimeException("Measure function isn't defined!");
    }

    return mMeasureFunction.measure(
          this,
          width,
          YogaMeasureMode.values()[widthMode],
          height,
          YogaMeasureMode.values()[heightMode]);
  }

  @Override
  public boolean isMeasureDefined() {
    return mMeasureFunction != null;
  }

  @Override
  public void setData(Object data) {
    mData = data;
  }

  @Override
  public Object getData() {
    return mData;
  }
}
