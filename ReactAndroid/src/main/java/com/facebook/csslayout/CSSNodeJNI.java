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

public class CSSNodeJNI implements CSSNodeAPI<CSSNodeJNI> {

  static {
    try {
      SoLoader.loadLibrary("csslayout");
    } catch (Exception ignored) {
      // The user probably didn't call SoLoader.init(). Fall back to System.loadLibrary() instead.
      System.out.println("Falling back to System.loadLibrary()");
      System.loadLibrary("csslayout");
    }
  }

  private CSSNodeJNI mParent;
  private List<CSSNodeJNI> mChildren;
  private MeasureFunction mMeasureFunction;
  private int mNativePointer;
  private Object mData;

  private void assertNativeInstance() {
    if (mNativePointer == 0) {
      throw new IllegalStateException("Null native pointer");
    }
  }

  private native int jni_CSSNodeNew();
  @Override
  public void init() {
    if (mNativePointer != 0) {
      throw new IllegalStateException("Allready initialized node");
    }

    mNativePointer = jni_CSSNodeNew();
    mChildren = new ArrayList<>(4);
  }

  private native void jni_CSSNodeFree(int nativePointer);
  @Override
  public void reset() {
    assertNativeInstance();

    jni_CSSNodeFree(mNativePointer);
    mNativePointer = 0;
    mChildren = null;
    mParent = null;
    mMeasureFunction = null;
  }

  @Override
  public int getChildCount() {
    return mChildren.size();
  }

  @Override
  public CSSNodeJNI getChildAt(int i) {
    return mChildren.get(i);
  }

  private native void jni_CSSNodeInsertChild(int nativePointer, int childPointer, int index);
  @Override
  public void addChildAt(CSSNodeJNI child, int i) {
    assertNativeInstance();

    mChildren.add(i, child);
    child.mParent = this;
    jni_CSSNodeInsertChild(mNativePointer, child.mNativePointer, i);
  }

  private native void jni_CSSNodeRemoveChild(int nativePointer, int childPointer);
  @Override
  public CSSNodeJNI removeChildAt(int i) {
    assertNativeInstance();

    final CSSNodeJNI child = mChildren.remove(i);
    child.mParent = null;
    jni_CSSNodeRemoveChild(mNativePointer, child.mNativePointer);
    return child;
  }

  @Override
  public @Nullable CSSNodeJNI getParent() {
    return mParent;
  }

  @Override
  public int indexOf(CSSNodeJNI child) {
    return mChildren.indexOf(child);
  }

  private native void jni_CSSNodeSetIsTextNode(int nativePointer, boolean isTextNode);
  @Override
  public void setIsTextNode(boolean isTextNode) {
    assertNativeInstance();
    jni_CSSNodeSetIsTextNode(mNativePointer, isTextNode);
  }

  private native boolean jni_CSSNodeGetIsTextNode(int nativePointer);
  @Override
  public boolean isTextNode() {
    assertNativeInstance();
    return jni_CSSNodeGetIsTextNode(mNativePointer);
  }

  private native void jni_CSSNodeCalculateLayout(int nativePointer);
  @Override
  public void calculateLayout(CSSLayoutContext layoutContext) {
    assertNativeInstance();
    jni_CSSNodeCalculateLayout(mNativePointer);
  }

  private native boolean jni_CSSNodeHasNewLayout(int nativePointer);
  @Override
  public boolean hasNewLayout() {
    assertNativeInstance();
    return jni_CSSNodeHasNewLayout(mNativePointer);
  }

  private native void jni_CSSNodeMarkDirty(int nativePointer);
  @Override
  public void dirty() {
    assertNativeInstance();
    jni_CSSNodeMarkDirty(mNativePointer);
  }

  private native boolean jni_CSSNodeIsDirty(int nativePointer);
  @Override
  public boolean isDirty() {
    return jni_CSSNodeIsDirty(mNativePointer);
  }

  private native void jni_CSSNodeMarkLayoutSeen(int nativePointer);
  @Override
  public void markLayoutSeen() {
    assertNativeInstance();
    jni_CSSNodeMarkLayoutSeen(mNativePointer);
  }

  private native int jni_CSSNodeStyleGetDirection(int nativePointer);
  @Override
  public CSSDirection getStyleDirection() {
    assertNativeInstance();
    return CSSDirection.values()[jni_CSSNodeStyleGetDirection(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetDirection(int nativePointer, int direction);
  @Override
  public void setDirection(CSSDirection direction) {
    assertNativeInstance();
    jni_CSSNodeStyleSetDirection(mNativePointer, direction.ordinal());
  }

  private native int jni_CSSNodeLayoutGetDirection(int nativePointer);
  @Override
  public CSSDirection getLayoutDirection() {
    assertNativeInstance();
    return CSSDirection.values()[jni_CSSNodeLayoutGetDirection(mNativePointer)];
  }

  private native int jni_CSSNodeStyleGetFlexDirection(int nativePointer);
  @Override
  public CSSFlexDirection getFlexDirection() {
    assertNativeInstance();
    return CSSFlexDirection.values()[jni_CSSNodeStyleGetFlexDirection(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetFlexDirection(int nativePointer, int flexDirection);
  @Override
  public void setFlexDirection(CSSFlexDirection flexDirection) {
    assertNativeInstance();
    jni_CSSNodeStyleSetFlexDirection(mNativePointer, flexDirection.ordinal());
  }

  private native int jni_CSSNodeStyleGetJustifyContent(int nativePointer);
  @Override
  public CSSJustify getJustifyContent() {
    assertNativeInstance();
    return CSSJustify.values()[jni_CSSNodeStyleGetJustifyContent(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetJustifyContent(int nativePointer, int justifyContent);
  @Override
  public void setJustifyContent(CSSJustify justifyContent) {
    assertNativeInstance();
    jni_CSSNodeStyleSetJustifyContent(mNativePointer, justifyContent.ordinal());
  }

  private native int jni_CSSNodeStyleGetAlignItems(int nativePointer);
  @Override
  public CSSAlign getAlignItems() {
    assertNativeInstance();
    return CSSAlign.values()[jni_CSSNodeStyleGetAlignItems(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetAlignItems(int nativePointer, int alignItems);
  @Override
  public void setAlignItems(CSSAlign alignItems) {
    assertNativeInstance();
    jni_CSSNodeStyleSetAlignItems(mNativePointer, alignItems.ordinal());
  }

  private native int jni_CSSNodeStyleGetAlignSelf(int nativePointer);
  @Override
  public CSSAlign getAlignSelf() {
    assertNativeInstance();
    return CSSAlign.values()[jni_CSSNodeStyleGetAlignSelf(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetAlignSelf(int nativePointer, int alignSelf);
  @Override
  public void setAlignSelf(CSSAlign alignSelf) {
    assertNativeInstance();
    jni_CSSNodeStyleSetAlignSelf(mNativePointer, alignSelf.ordinal());
  }

  private native int jni_CSSNodeStyleGetPositionType(int nativePointer);
  @Override
  public CSSPositionType getPositionType() {
    assertNativeInstance();
    return CSSPositionType.values()[jni_CSSNodeStyleGetPositionType(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetPositionType(int nativePointer, int positionType);
  @Override
  public void setPositionType(CSSPositionType positionType) {
    assertNativeInstance();
    jni_CSSNodeStyleSetPositionType(mNativePointer, positionType.ordinal());
  }

  private native void jni_CSSNodeStyleSetFlexWrap(int nativePointer, int wrapType);
  @Override
  public void setWrap(CSSWrap flexWrap) {
    assertNativeInstance();
    jni_CSSNodeStyleSetFlexWrap(mNativePointer, flexWrap.ordinal());
  }

  private native int jni_CSSNodeStyleGetOverflow(int nativePointer);
  @Override
  public CSSOverflow getOverflow() {
    assertNativeInstance();
    return CSSOverflow.values()[jni_CSSNodeStyleGetOverflow(mNativePointer)];
  }

  private native void jni_CSSNodeStyleSetOverflow(int nativePointer, int overflow);
  @Override
  public void setOverflow(CSSOverflow overflow) {
    assertNativeInstance();
    jni_CSSNodeStyleSetOverflow(mNativePointer, overflow.ordinal());
  }

  private native float jni_CSSNodeStyleGetFlex(int nativePointer);
  @Override
  public float getFlex() {
    assertNativeInstance();
    return jni_CSSNodeStyleGetFlex(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetFlex(int nativePointer, float flex);
  @Override
  public void setFlex(float flex) {
    assertNativeInstance();
    jni_CSSNodeStyleSetFlex(mNativePointer, flex);
  }

  private native float jni_CSSNodeStyleGetMarginLeft(int nativePointer);
  private native float jni_CSSNodeStyleGetMarginTop(int nativePointer);
  private native float jni_CSSNodeStyleGetMarginRight(int nativePointer);
  private native float jni_CSSNodeStyleGetMarginBottom(int nativePointer);
  private native float jni_CSSNodeStyleGetMarginStart(int nativePointer);
  private native float jni_CSSNodeStyleGetMarginEnd(int nativePointer);
  @Override
  public Spacing getMargin() {
    assertNativeInstance();
    Spacing margin = new Spacing();
    margin.set(Spacing.LEFT, jni_CSSNodeStyleGetMarginLeft(mNativePointer));
    margin.set(Spacing.TOP, jni_CSSNodeStyleGetMarginTop(mNativePointer));
    margin.set(Spacing.RIGHT, jni_CSSNodeStyleGetMarginRight(mNativePointer));
    margin.set(Spacing.BOTTOM, jni_CSSNodeStyleGetMarginBottom(mNativePointer));
    margin.set(Spacing.START, jni_CSSNodeStyleGetMarginStart(mNativePointer));
    margin.set(Spacing.END, jni_CSSNodeStyleGetMarginEnd(mNativePointer));
    return margin;
  }

  private native void jni_CSSNodeStyleSetMarginLeft(int nativePointer, float marginLeft);
  private native void jni_CSSNodeStyleSetMarginTop(int nativePointer, float marginTop);
  private native void jni_CSSNodeStyleSetMarginRight(int nativePointer, float marginRight);
  private native void jni_CSSNodeStyleSetMarginBottom(int nativePointer, float marginBottom);
  private native void jni_CSSNodeStyleSetMarginStart(int nativePointer, float marginStart);
  private native void jni_CSSNodeStyleSetMarginEnd(int nativePointer, float marginEnd);
  @Override
  public void setMargin(int spacingType, float margin) {
    assertNativeInstance();
    switch (spacingType) {
      case Spacing.LEFT:
        jni_CSSNodeStyleSetMarginLeft(mNativePointer, margin);
        break;
      case Spacing.TOP:
        jni_CSSNodeStyleSetMarginTop(mNativePointer, margin);
        break;
      case Spacing.RIGHT:
        jni_CSSNodeStyleSetMarginRight(mNativePointer, margin);
        break;
      case Spacing.BOTTOM:
        jni_CSSNodeStyleSetMarginBottom(mNativePointer, margin);
        break;
      case Spacing.START:
        jni_CSSNodeStyleSetMarginStart(mNativePointer, margin);
        break;
      case Spacing.END:
        jni_CSSNodeStyleSetMarginEnd(mNativePointer, margin);
        break;
      case Spacing.HORIZONTAL:
        jni_CSSNodeStyleSetMarginLeft(mNativePointer, margin);
        jni_CSSNodeStyleSetMarginRight(mNativePointer, margin);
        jni_CSSNodeStyleSetMarginStart(mNativePointer, margin);
        jni_CSSNodeStyleSetMarginEnd(mNativePointer, margin);
        break;
      case Spacing.VERTICAL:
        jni_CSSNodeStyleSetMarginTop(mNativePointer, margin);
        jni_CSSNodeStyleSetMarginBottom(mNativePointer, margin);
        break;
      case Spacing.ALL:
        jni_CSSNodeStyleSetMarginLeft(mNativePointer, margin);
        jni_CSSNodeStyleSetMarginRight(mNativePointer, margin);
        jni_CSSNodeStyleSetMarginStart(mNativePointer, margin);
        jni_CSSNodeStyleSetMarginEnd(mNativePointer, margin);
        jni_CSSNodeStyleSetMarginTop(mNativePointer, margin);
        jni_CSSNodeStyleSetMarginBottom(mNativePointer, margin);
        break;
    }
  }

  private native float jni_CSSNodeStyleGetPaddingLeft(int nativePointer);
  private native float jni_CSSNodeStyleGetPaddingTop(int nativePointer);
  private native float jni_CSSNodeStyleGetPaddingRight(int nativePointer);
  private native float jni_CSSNodeStyleGetPaddingBottom(int nativePointer);
  private native float jni_CSSNodeStyleGetPaddingStart(int nativePointer);
  private native float jni_CSSNodeStyleGetPaddingEnd(int nativePointer);
  @Override
  public Spacing getPadding() {
    assertNativeInstance();
    Spacing padding = new Spacing();
    padding.set(Spacing.LEFT, jni_CSSNodeStyleGetPaddingLeft(mNativePointer));
    padding.set(Spacing.TOP, jni_CSSNodeStyleGetPaddingTop(mNativePointer));
    padding.set(Spacing.RIGHT, jni_CSSNodeStyleGetPaddingRight(mNativePointer));
    padding.set(Spacing.BOTTOM, jni_CSSNodeStyleGetPaddingBottom(mNativePointer));
    padding.set(Spacing.START, jni_CSSNodeStyleGetPaddingStart(mNativePointer));
    padding.set(Spacing.END, jni_CSSNodeStyleGetPaddingEnd(mNativePointer));
    return padding;
  }

  private native void jni_CSSNodeStyleSetPaddingLeft(int nativePointer, float paddingLeft);
  private native void jni_CSSNodeStyleSetPaddingTop(int nativePointer, float paddingTop);
  private native void jni_CSSNodeStyleSetPaddingRight(int nativePointer, float paddingRight);
  private native void jni_CSSNodeStyleSetPaddingBottom(int nativePointer, float paddingBottom);
  private native void jni_CSSNodeStyleSetPaddingStart(int nativePointer, float paddingStart);
  private native void jni_CSSNodeStyleSetPaddingEnd(int nativePointer, float paddingEnd);
  @Override
  public void setPadding(int spacingType, float padding) {
    assertNativeInstance();
    switch (spacingType) {
      case Spacing.LEFT:
        jni_CSSNodeStyleSetPaddingLeft(mNativePointer, padding);
        break;
      case Spacing.TOP:
        jni_CSSNodeStyleSetPaddingTop(mNativePointer, padding);
        break;
      case Spacing.RIGHT:
        jni_CSSNodeStyleSetPaddingRight(mNativePointer, padding);
        break;
      case Spacing.BOTTOM:
        jni_CSSNodeStyleSetPaddingBottom(mNativePointer, padding);
        break;
      case Spacing.START:
        jni_CSSNodeStyleSetPaddingStart(mNativePointer, padding);
        break;
      case Spacing.END:
        jni_CSSNodeStyleSetPaddingEnd(mNativePointer, padding);
        break;
      case Spacing.HORIZONTAL:
        jni_CSSNodeStyleSetPaddingLeft(mNativePointer, padding);
        jni_CSSNodeStyleSetPaddingRight(mNativePointer, padding);
        jni_CSSNodeStyleSetPaddingStart(mNativePointer, padding);
        jni_CSSNodeStyleSetPaddingEnd(mNativePointer, padding);
        break;
      case Spacing.VERTICAL:
        jni_CSSNodeStyleSetPaddingTop(mNativePointer, padding);
        jni_CSSNodeStyleSetPaddingBottom(mNativePointer, padding);
        break;
      case Spacing.ALL:
        jni_CSSNodeStyleSetPaddingLeft(mNativePointer, padding);
        jni_CSSNodeStyleSetPaddingRight(mNativePointer, padding);
        jni_CSSNodeStyleSetPaddingStart(mNativePointer, padding);
        jni_CSSNodeStyleSetPaddingEnd(mNativePointer, padding);
        jni_CSSNodeStyleSetPaddingTop(mNativePointer, padding);
        jni_CSSNodeStyleSetPaddingBottom(mNativePointer, padding);
        break;
    }
  }

  @Override
  public void setDefaultPadding(int spacingType, float padding) {
    // TODO
  }

  private native float jni_CSSNodeStyleGetBorderLeft(int nativePointer);
  private native float jni_CSSNodeStyleGetBorderTop(int nativePointer);
  private native float jni_CSSNodeStyleGetBorderRight(int nativePointer);
  private native float jni_CSSNodeStyleGetBorderBottom(int nativePointer);
  private native float jni_CSSNodeStyleGetBorderStart(int nativePointer);
  private native float jni_CSSNodeStyleGetBorderEnd(int nativePointer);
  @Override
  public Spacing getBorder() {
    assertNativeInstance();
    Spacing border = new Spacing();
    border.set(Spacing.LEFT, jni_CSSNodeStyleGetBorderLeft(mNativePointer));
    border.set(Spacing.TOP, jni_CSSNodeStyleGetBorderTop(mNativePointer));
    border.set(Spacing.RIGHT, jni_CSSNodeStyleGetBorderRight(mNativePointer));
    border.set(Spacing.BOTTOM, jni_CSSNodeStyleGetBorderBottom(mNativePointer));
    border.set(Spacing.START, jni_CSSNodeStyleGetBorderStart(mNativePointer));
    border.set(Spacing.END, jni_CSSNodeStyleGetBorderEnd(mNativePointer));
    return border;
  }

  private native void jni_CSSNodeStyleSetBorderLeft(int nativePointer, float borderLeft);
  private native void jni_CSSNodeStyleSetBorderTop(int nativePointer, float borderTop);
  private native void jni_CSSNodeStyleSetBorderRight(int nativePointer, float borderRight);
  private native void jni_CSSNodeStyleSetBorderBottom(int nativePointer, float borderBottom);
  private native void jni_CSSNodeStyleSetBorderStart(int nativePointer, float borderStart);
  private native void jni_CSSNodeStyleSetBorderEnd(int nativePointer, float borderEnd);
  @Override
  public void setBorder(int spacingType, float border) {
    assertNativeInstance();
    switch (spacingType) {
      case Spacing.LEFT:
        jni_CSSNodeStyleSetBorderLeft(mNativePointer, border);
        break;
      case Spacing.TOP:
        jni_CSSNodeStyleSetBorderTop(mNativePointer, border);
        break;
      case Spacing.RIGHT:
        jni_CSSNodeStyleSetBorderRight(mNativePointer, border);
        break;
      case Spacing.BOTTOM:
        jni_CSSNodeStyleSetBorderBottom(mNativePointer, border);
        break;
      case Spacing.START:
        jni_CSSNodeStyleSetBorderStart(mNativePointer, border);
        break;
      case Spacing.END:
        jni_CSSNodeStyleSetBorderEnd(mNativePointer, border);
        break;
      case Spacing.HORIZONTAL:
        jni_CSSNodeStyleSetBorderLeft(mNativePointer, border);
        jni_CSSNodeStyleSetBorderRight(mNativePointer, border);
        jni_CSSNodeStyleSetBorderStart(mNativePointer, border);
        jni_CSSNodeStyleSetBorderEnd(mNativePointer, border);
        break;
      case Spacing.VERTICAL:
        jni_CSSNodeStyleSetBorderTop(mNativePointer, border);
        jni_CSSNodeStyleSetBorderBottom(mNativePointer, border);
        break;
      case Spacing.ALL:
        jni_CSSNodeStyleSetBorderLeft(mNativePointer, border);
        jni_CSSNodeStyleSetBorderRight(mNativePointer, border);
        jni_CSSNodeStyleSetBorderStart(mNativePointer, border);
        jni_CSSNodeStyleSetBorderEnd(mNativePointer, border);
        jni_CSSNodeStyleSetBorderTop(mNativePointer, border);
        jni_CSSNodeStyleSetBorderBottom(mNativePointer, border);
        break;
    }
  }

  @Override
  public Spacing getPositionValue() {
    Spacing position = new Spacing();
    position.set(Spacing.LEFT, getPositionLeft());
    position.set(Spacing.TOP, getPositionTop());
    position.set(Spacing.RIGHT, getPositionRight());
    position.set(Spacing.BOTTOM, getPositionBottom());
    return position;
  }

  @Override
  public void setPositionValue(int spacingType, float position) {
    switch (spacingType) {
      case Spacing.LEFT:
        setPositionLeft(position);
        break;
      case Spacing.TOP:
        setPositionTop(position);
        break;
      case Spacing.RIGHT:
        setPositionRight(position);
        break;
      case Spacing.BOTTOM:
        setPositionBottom(position);
        break;
    }
  }

  private native float jni_CSSNodeStyleGetPositionTop(int nativePointer);
  @Override
  public float getPositionTop() {
    assertNativeInstance();
    return jni_CSSNodeStyleGetPositionTop(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetPositionTop(int nativePointer, float positionTop);
  @Override
  public void setPositionTop(float positionTop) {
    assertNativeInstance();
    jni_CSSNodeStyleSetPositionTop(mNativePointer, positionTop);
  }

  private native float jni_CSSNodeStyleGetPositionBottom(int nativePointer);
  @Override
  public float getPositionBottom() {
    assertNativeInstance();
    return jni_CSSNodeStyleGetPositionBottom(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetPositionBottom(int nativePointer, float positionBottom);
  @Override
  public void setPositionBottom(float positionBottom) {
    assertNativeInstance();
    jni_CSSNodeStyleSetPositionBottom(mNativePointer, positionBottom);
  }

  private native float jni_CSSNodeStyleGetPositionLeft(int nativePointer);
  @Override
  public float getPositionLeft() {
    assertNativeInstance();
    return jni_CSSNodeStyleGetPositionLeft(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetPositionLeft(int nativePointer, float positionLeft);
  @Override
  public void setPositionLeft(float positionLeft) {
    assertNativeInstance();
    jni_CSSNodeStyleSetPositionLeft(mNativePointer, positionLeft);
  }

  private native float jni_CSSNodeStyleGetPositionRight(int nativePointer);
  @Override
  public float getPositionRight() {
    assertNativeInstance();
    return jni_CSSNodeStyleGetPositionRight(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetPositionRight(int nativePointer, float positionRight);
  @Override
  public void setPositionRight(float positionRight) {
    assertNativeInstance();
    jni_CSSNodeStyleSetPositionRight(mNativePointer, positionRight);
  }

  private native float jni_CSSNodeStyleGetWidth(int nativePointer);
  @Override
  public float getStyleWidth() {
    assertNativeInstance();
    return jni_CSSNodeStyleGetWidth(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetWidth(int nativePointer, float width);
  @Override
  public void setStyleWidth(float width) {
    assertNativeInstance();
    jni_CSSNodeStyleSetWidth(mNativePointer, width);
  }

  private native float jni_CSSNodeStyleGetHeight(int nativePointer);
  @Override
  public float getStyleHeight() {
    assertNativeInstance();
    return jni_CSSNodeStyleGetHeight(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetHeight(int nativePointer, float height);
  @Override
  public void setStyleHeight(float height) {
    assertNativeInstance();
    jni_CSSNodeStyleSetHeight(mNativePointer, height);
  }

  private native float jni_CSSNodeStyleGetMinWidth(int nativePointer);
  @Override
  public float getStyleMinWidth() {
    assertNativeInstance();
    return jni_CSSNodeStyleGetMinWidth(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetMinWidth(int nativePointer, float minWidth);
  @Override
  public void setStyleMinWidth(float minWidth) {
    assertNativeInstance();
    jni_CSSNodeStyleSetMinWidth(mNativePointer, minWidth);
  }

  private native float jni_CSSNodeStyleGetMinHeight(int nativePointer);
  @Override
  public float getStyleMinHeight() {
    assertNativeInstance();
    return jni_CSSNodeStyleGetMinHeight(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetMinHeight(int nativePointer, float minHeight);
  @Override
  public void setStyleMinHeight(float minHeight) {
    assertNativeInstance();
    jni_CSSNodeStyleSetMinHeight(mNativePointer, minHeight);
  }

  private native float jni_CSSNodeStyleGetMaxWidth(int nativePointer);
  @Override
  public float getStyleMaxWidth() {
    assertNativeInstance();
    return jni_CSSNodeStyleGetMaxWidth(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetMaxWidth(int nativePointer, float maxWidth);
  @Override
  public void setStyleMaxWidth(float maxWidth) {
    assertNativeInstance();
    jni_CSSNodeStyleSetMaxWidth(mNativePointer, maxWidth);
  }

  private native float jni_CSSNodeStyleGetMaxHeight(int nativePointer);
  @Override
  public float getStyleMaxHeight() {
    assertNativeInstance();
    return jni_CSSNodeStyleGetMaxHeight(mNativePointer);
  }

  private native void jni_CSSNodeStyleSetMaxHeight(int nativePointer, float maxheight);
  @Override
  public void setStyleMaxHeight(float maxheight) {
    assertNativeInstance();
    jni_CSSNodeStyleSetMaxHeight(mNativePointer, maxheight);
  }

  private native float jni_CSSNodeLayoutGetLeft(int nativePointer);
  @Override
  public float getLayoutX() {
    assertNativeInstance();
    return jni_CSSNodeLayoutGetLeft(mNativePointer);
  }

  private native float jni_CSSNodeLayoutGetTop(int nativePointer);
  @Override
  public float getLayoutY() {
    assertNativeInstance();
    return jni_CSSNodeLayoutGetTop(mNativePointer);
  }

  private native float jni_CSSNodeLayoutGetWidth(int nativePointer);
  @Override
  public float getLayoutWidth() {
    assertNativeInstance();
    return jni_CSSNodeLayoutGetWidth(mNativePointer);
  }

  private native float jni_CSSNodeLayoutGetHeight(int nativePointer);
  @Override
  public float getLayoutHeight() {
    assertNativeInstance();
    return jni_CSSNodeLayoutGetHeight(mNativePointer);
  }

  private native void jni_CSSNodeSetHasMeasureFunc(int nativePointer, boolean hasMeasureFunc);
  @Override
  public void setMeasureFunction(MeasureFunction measureFunction) {
    assertNativeInstance();
    mMeasureFunction = measureFunction;
    jni_CSSNodeSetHasMeasureFunc(mNativePointer, measureFunction != null);
  }

  @DoNotStrip
  public long measure(float width, int widthMode, float height, int heightMode) {
    assertNativeInstance();
    if (!isMeasureDefined()) {
      throw new RuntimeException("Measure function isn't defined!");
    }

    MeasureOutput output = new MeasureOutput();
    mMeasureFunction.measure(
          this,
          width,
          CSSMeasureMode.values()[widthMode],
          height,
          CSSMeasureMode.values()[heightMode],
          output);
    return ((long) output.width) << 32 | ((long) output.height);
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
