/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.csslayout;

import javax.annotation.Nullable;

import java.util.List;
import java.util.ArrayList;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

public class CSSNode implements CSSNodeAPI<CSSNode> {

  static {
    try {
      SoLoader.loadLibrary("csslayout");
    } catch (Exception ignored) {
      // The user probably didn't call SoLoader.init(). Fall back to System.loadLibrary() instead.
      System.out.println("Falling back to System.loadLibrary()");
      System.loadLibrary("csslayout");
    }
  }

  /**
   * Get native instance count. Useful for testing only.
   */
  static native int jni_CSSNodeGetInstanceCount();

  private CSSNode mParent;
  private List<CSSNode> mChildren;
  private MeasureFunction mMeasureFunction;
  private long mNativePointer;
  private Object mData;

  private boolean mHasSetPadding = false;
  private boolean mHasSetMargin = false;
  private boolean mHasSetBorder = false;
  private boolean mHasSetPosition = false;

  @DoNotStrip
  private float mWidth = CSSConstants.UNDEFINED;
  @DoNotStrip
  private float mHeight = CSSConstants.UNDEFINED;
  @DoNotStrip
  private float mTop = CSSConstants.UNDEFINED;
  @DoNotStrip
  private float mLeft = CSSConstants.UNDEFINED;
  @DoNotStrip
  private int mLayoutDirection = 0;

  private native long jni_CSSNodeNew();
  public CSSNode() {
    mNativePointer = jni_CSSNodeNew();
    if (mNativePointer == 0) {
      throw new IllegalStateException("Failed to allocate native memory");
    }

    mChildren = new ArrayList<>(4);
  }

  private native void jni_CSSNodeFree(long nativePointer);
  @Override
  protected void finalize() throws Throwable {
    try {
      jni_CSSNodeFree(mNativePointer);
    } finally {
      super.finalize();
    }
  }

  private native void jni_CSSNodeReset(long nativePointer);
  @Override
  public void reset() {
    mHasSetPadding = false;
    mHasSetMargin = false;
    mHasSetBorder = false;
    mHasSetPosition = false;

    mWidth = CSSConstants.UNDEFINED;
    mHeight = CSSConstants.UNDEFINED;
    mTop = CSSConstants.UNDEFINED;
    mLeft = CSSConstants.UNDEFINED;
    mLayoutDirection = 0;

    mMeasureFunction = null;
    mData = null;

    jni_CSSNodeReset(mNativePointer);
  }

  @Override
  public int getChildCount() {
    return mChildren.size();
  }

  @Override
  public CSSNode getChildAt(int i) {
    return mChildren.get(i);
  }

  private native void jni_CSSNodeInsertChild(long nativePointer, long childPointer, int index);
  @Override
  public void addChildAt(CSSNode child, int i) {
    if (child.mParent != null) {
      throw new IllegalStateException("Child already has a parent, it must be removed first.");
    }

    mChildren.add(i, child);
    child.mParent = this;
    jni_CSSNodeInsertChild(mNativePointer, child.mNativePointer, i);
  }

  private native void jni_CSSNodeRemoveChild(long nativePointer, long childPointer);
  @Override
  public CSSNode removeChildAt(int i) {

    final CSSNode child = mChildren.remove(i);
    child.mParent = null;
    jni_CSSNodeRemoveChild(mNativePointer, child.mNativePointer);
    return child;
  }

  @Override
  public @Nullable
  CSSNode getParent() {
    return mParent;
  }

  @Override
  public int indexOf(CSSNode child) {
    return mChildren.indexOf(child);
  }

  private native void jni_CSSNodeSetIsTextNode(long nativePointer, boolean isTextNode);
  @Override
  public void setIsTextNode(boolean isTextNode) {
    jni_CSSNodeSetIsTextNode(mNativePointer, isTextNode);
  }

  private native boolean jni_CSSNodeGetIsTextNode(long nativePointer);
  @Override
  public boolean isTextNode() {
    return jni_CSSNodeGetIsTextNode(mNativePointer);
  }

  private native void jni_CSSNodeCalculateLayout(long nativePointer);
  @Override
  public void calculateLayout(CSSLayoutContext layoutContext) {
    jni_CSSNodeCalculateLayout(mNativePointer);
  }

  private native boolean jni_CSSNodeHasNewLayout(long nativePointer);
  @Override
  public boolean hasNewLayout() {
    return jni_CSSNodeHasNewLayout(mNativePointer);
  }

  private native void jni_CSSNodeMarkDirty(long nativePointer);
  @Override
  public void dirty() {
    jni_CSSNodeMarkDirty(mNativePointer);
  }

  private native boolean jni_CSSNodeIsDirty(long nativePointer);
  @Override
  public boolean isDirty() {
    return jni_CSSNodeIsDirty(mNativePointer);
  }

  private native void jni_CSSNodeMarkLayoutSeen(long nativePointer);
  @Override
  public void markLayoutSeen() {
    jni_CSSNodeMarkLayoutSeen(mNativePointer);
  }

  private native int jni_CSSNodeStyleGetDirection(long nativePointer);
  @Override
  public CSSDirection getStyleDirection() {
    return CSSDirection.values()[jni_CSSNodeStyleGetDirection(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetDirection(long nativePointer, int direction);
  @Override
  public void setDirection(CSSDirection direction) {
    jni_CSSNodeStyleSetDirection(mNativePointer, direction.ordinal());
  }

  private native int jni_CSSNodeStyleGetFlexDirection(long nativePointer);
  @Override
  public CSSFlexDirection getFlexDirection() {
    return CSSFlexDirection.values()[jni_CSSNodeStyleGetFlexDirection(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetFlexDirection(long nativePointer, int flexDirection);
  @Override
  public void setFlexDirection(CSSFlexDirection flexDirection) {
    jni_CSSNodeStyleSetFlexDirection(mNativePointer, flexDirection.ordinal());
  }

  private native int jni_CSSNodeStyleGetJustifyContent(long nativePointer);
  @Override
  public CSSJustify getJustifyContent() {
    return CSSJustify.values()[jni_CSSNodeStyleGetJustifyContent(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetJustifyContent(long nativePointer, int justifyContent);
  @Override
  public void setJustifyContent(CSSJustify justifyContent) {
    jni_CSSNodeStyleSetJustifyContent(mNativePointer, justifyContent.ordinal());
  }

  private native int jni_CSSNodeStyleGetAlignItems(long nativePointer);
  @Override
  public CSSAlign getAlignItems() {
    return CSSAlign.values()[jni_CSSNodeStyleGetAlignItems(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetAlignItems(long nativePointer, int alignItems);
  @Override
  public void setAlignItems(CSSAlign alignItems) {
    jni_CSSNodeStyleSetAlignItems(mNativePointer, alignItems.ordinal());
  }

  private native int jni_CSSNodeStyleGetAlignSelf(long nativePointer);
  @Override
  public CSSAlign getAlignSelf() {
    return CSSAlign.values()[jni_CSSNodeStyleGetAlignSelf(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetAlignSelf(long nativePointer, int alignSelf);
  @Override
  public void setAlignSelf(CSSAlign alignSelf) {
    jni_CSSNodeStyleSetAlignSelf(mNativePointer, alignSelf.ordinal());
  }

  private native int jni_CSSNodeStyleGetAlignContent(long nativePointer);
  @Override
  public CSSAlign getAlignContent() {
    return CSSAlign.values()[jni_CSSNodeStyleGetAlignContent(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetAlignContent(long nativePointer, int alignContent);
  @Override
  public void setAlignContent(CSSAlign alignContent) {
    jni_CSSNodeStyleSetAlignContent(mNativePointer, alignContent.ordinal());
  }

  private native int jni_CSSNodeStyleGetPositionType(long nativePointer);
  @Override
  public CSSPositionType getPositionType() {
    return CSSPositionType.values()[jni_CSSNodeStyleGetPositionType(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetPositionType(long nativePointer, int positionType);
  @Override
  public void setPositionType(CSSPositionType positionType) {
    jni_CSSNodeStyleSetPositionType(mNativePointer, positionType.ordinal());
  }

  private native void jni_CSSNodeStyleSetFlexWrap(long nativePointer, int wrapType);
  @Override
  public void setWrap(CSSWrap flexWrap) {
    jni_CSSNodeStyleSetFlexWrap(mNativePointer, flexWrap.ordinal());
  }

  private native int jni_CSSNodeStyleGetOverflow(long nativePointer);
  @Override
  public CSSOverflow getOverflow() {
    return CSSOverflow.values()[jni_CSSNodeStyleGetOverflow(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetOverflow(long nativePointer, int overflow);
  @Override
  public void setOverflow(CSSOverflow overflow) {
    jni_CSSNodeStyleSetOverflow(mNativePointer, overflow.ordinal());
  }

  private native void jni_CSSNodeStyleSetFlex(long nativePointer, float flex);
  @Override
  public void setFlex(float flex) {
    jni_CSSNodeStyleSetFlex(mNativePointer, flex);
  }

  private native float jni_CSSNodeStyleGetFlexGrow(long nativePointer);
  @Override
  public float getFlexGrow() {
    return jni_CSSNodeStyleGetFlexGrow(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetFlexGrow(long nativePointer, float flexGrow);
  @Override
  public void setFlexGrow(float flexGrow) {
    jni_CSSNodeStyleSetFlexGrow(mNativePointer, flexGrow);
  }

  private native float jni_CSSNodeStyleGetFlexShrink(long nativePointer);
  @Override
  public float getFlexShrink() {
    return jni_CSSNodeStyleGetFlexShrink(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetFlexShrink(long nativePointer, float flexShrink);
  @Override
  public void setFlexShrink(float flexShrink) {
    jni_CSSNodeStyleSetFlexShrink(mNativePointer, flexShrink);
  }

  private native float jni_CSSNodeStyleGetFlexBasis(long nativePointer);
  @Override
  public float getFlexBasis() {
    return jni_CSSNodeStyleGetFlexBasis(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetFlexBasis(long nativePointer, float flexBasis);
  @Override
  public void setFlexBasis(float flexBasis) {
    jni_CSSNodeStyleSetFlexBasis(mNativePointer, flexBasis);
  }

  private native float jni_CSSNodeStyleGetMargin(long nativePointer, int edge);
  @Override
  public float getMargin(int spacingType) {
    if (!mHasSetMargin) {
      return spacingType < Spacing.START ? 0 : CSSConstants.UNDEFINED;
    }
    return jni_CSSNodeStyleGetMargin(mNativePointer, spacingType);
  }

  private native void jni_CSSNodeStyleSetMargin(long nativePointer, int edge, float margin);
  @Override
  public void setMargin(int spacingType, float margin) {
    mHasSetMargin = true;
    jni_CSSNodeStyleSetMargin(mNativePointer, spacingType, margin);
  }

  private native float jni_CSSNodeStyleGetPadding(long nativePointer, int edge);
  @Override
  public float getPadding(int spacingType) {
    if (!mHasSetPadding) {
      return spacingType < Spacing.START ? 0 : CSSConstants.UNDEFINED;
    }
    return jni_CSSNodeStyleGetPadding(mNativePointer, spacingType);
  }

  private native void jni_CSSNodeStyleSetPadding(long nativePointer, int edge, float padding);
  @Override
  public void setPadding(int spacingType, float padding) {
    mHasSetPadding = true;
    jni_CSSNodeStyleSetPadding(mNativePointer, spacingType, padding);
  }

  private native float jni_CSSNodeStyleGetBorder(long nativePointer, int edge);
  @Override
  public float getBorder(int spacingType) {
    if (!mHasSetBorder) {
      return spacingType < Spacing.START ? 0 : CSSConstants.UNDEFINED;
    }
    return jni_CSSNodeStyleGetBorder(mNativePointer, spacingType);
  }

  private native void jni_CSSNodeStyleSetBorder(long nativePointer, int edge, float border);
  @Override
  public void setBorder(int spacingType, float border) {
    mHasSetBorder = true;
    jni_CSSNodeStyleSetBorder(mNativePointer, spacingType, border);
  }

  private native float jni_CSSNodeStyleGetPosition(long nativePointer, int edge);
  @Override
  public float getPosition(int spacingType) {
    if (!mHasSetPosition) {
      return CSSConstants.UNDEFINED;
    }
    return jni_CSSNodeStyleGetPosition(mNativePointer, spacingType);
  }

  private native void jni_CSSNodeStyleSetPosition(long nativePointer, int edge, float position);
  @Override
  public void setPosition(int spacingType, float position) {
    mHasSetPosition = true;
    jni_CSSNodeStyleSetPosition(mNativePointer, spacingType, position);
  }

  private native float jni_CSSNodeStyleGetWidth(long nativePointer);
  @Override
  public float getStyleWidth() {
    return jni_CSSNodeStyleGetWidth(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetWidth(long nativePointer, float width);
  @Override
  public void setStyleWidth(float width) {
    jni_CSSNodeStyleSetWidth(mNativePointer, width);
  }

  private native float jni_CSSNodeStyleGetHeight(long nativePointer);
  @Override
  public float getStyleHeight() {
    return jni_CSSNodeStyleGetHeight(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetHeight(long nativePointer, float height);
  @Override
  public void setStyleHeight(float height) {
    jni_CSSNodeStyleSetHeight(mNativePointer, height);
  }

  private native float jni_CSSNodeStyleGetMinWidth(long nativePointer);
  @Override
  public float getStyleMinWidth() {
    return jni_CSSNodeStyleGetMinWidth(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetMinWidth(long nativePointer, float minWidth);
  @Override
  public void setStyleMinWidth(float minWidth) {
    jni_CSSNodeStyleSetMinWidth(mNativePointer, minWidth);
  }

  private native float jni_CSSNodeStyleGetMinHeight(long nativePointer);
  @Override
  public float getStyleMinHeight() {
    return jni_CSSNodeStyleGetMinHeight(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetMinHeight(long nativePointer, float minHeight);
  @Override
  public void setStyleMinHeight(float minHeight) {
    jni_CSSNodeStyleSetMinHeight(mNativePointer, minHeight);
  }

  private native float jni_CSSNodeStyleGetMaxWidth(long nativePointer);
  @Override
  public float getStyleMaxWidth() {
    return jni_CSSNodeStyleGetMaxWidth(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetMaxWidth(long nativePointer, float maxWidth);
  @Override
  public void setStyleMaxWidth(float maxWidth) {
    jni_CSSNodeStyleSetMaxWidth(mNativePointer, maxWidth);
  }

  private native float jni_CSSNodeStyleGetMaxHeight(long nativePointer);
  @Override
  public float getStyleMaxHeight() {
    return jni_CSSNodeStyleGetMaxHeight(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetMaxHeight(long nativePointer, float maxheight);
  @Override
  public void setStyleMaxHeight(float maxheight) {
    jni_CSSNodeStyleSetMaxHeight(mNativePointer, maxheight);
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
  public CSSDirection getLayoutDirection() {
    return CSSDirection.values()[mLayoutDirection];
  }

  private native void jni_CSSNodeSetHasMeasureFunc(long nativePointer, boolean hasMeasureFunc);
  @Override
  public void setMeasureFunction(MeasureFunction measureFunction) {
    mMeasureFunction = measureFunction;
    jni_CSSNodeSetHasMeasureFunc(mNativePointer, measureFunction != null);
  }

  @DoNotStrip
  public long measure(float width, int widthMode, float height, int heightMode) {
    if (!isMeasureDefined()) {
      throw new RuntimeException("Measure function isn't defined!");
    }

    return mMeasureFunction.measure(
          this,
          width,
          CSSMeasureMode.values()[widthMode],
          height,
          CSSMeasureMode.values()[heightMode]);
  }

  @Override
  public boolean isMeasureDefined() {
    return mMeasureFunction != null;
  }

  @Override
  public boolean valuesEqual(float f1, float f2) {
    return FloatUtil.floatsEqual(f1, f2);
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
