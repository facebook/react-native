/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;
import java.lang.reflect.Field;
import sun.misc.Unsafe;

@DoNotStrip
public class YogaNodePropertiesUnsafe implements YogaNodeProperties {

  private static final int TRUE_BITS = 0x01000001;
  private static final int FLOAT_SIZE = 4;
  private static final int AUTO = YogaUnit.AUTO.intValue();
  private static final int POINT = YogaUnit.POINT.intValue();
  private static final int PERCENT = YogaUnit.PERCENT.intValue();
  private static final int UNDEFINED = YogaUnit.UNDEFINED.intValue();
  private static final int RTL = YogaDirection.RTL.intValue();
  private static final Unsafe UNSAFE;

  private final long mNativePointer;
  private final long mStyleNativePointer;
  private final long mLayoutNativePointer;
  private boolean mHasBorderSet = false;
  private boolean mHasNewLayout = true;
  private boolean mIsFreed = false;

  static {
    SoLoader.loadLibrary("yoga");
    Field instanceField = null;
    try {
      instanceField = Unsafe.class.getDeclaredField("theUnsafe");
    } catch (NoSuchFieldException e) {
      throw new RuntimeException(e);
    }
    instanceField.setAccessible(true);
    try {
      UNSAFE = (Unsafe) instanceField.get(null);
    } catch (IllegalAccessException e) {
      throw new RuntimeException(e);
    }
  }

  private static native long jni_YGNodeNewNoProps(YogaNode node);
  private static native long jni_YGNodeNewNoPropsWithConfig(YogaNode node, long configPointer);
  private static native long jni_YGNodeStylePointer(long nativePointer);
  private static native long jni_YGNodeLayoutPointer(long nativePointer);

  public YogaNodePropertiesUnsafe(YogaNode node) {
    this(jni_YGNodeNewNoProps(node));
  }

  public YogaNodePropertiesUnsafe(YogaNode node, YogaConfig config) {
    this(jni_YGNodeNewNoPropsWithConfig(node, config.mNativePointer));
  }

  public YogaNodePropertiesUnsafe(long nativePointer) {
    mNativePointer = nativePointer;
    mStyleNativePointer = jni_YGNodeStylePointer(nativePointer);
    mLayoutNativePointer = jni_YGNodeLayoutPointer(nativePointer);
  }

  private static native long jni_YGNodeCloneNoProps(long nativePointer, YogaNode newNode);

  @Override
  public YogaNodeProperties clone(YogaNode node) {
    long clonedNativePointer = jni_YGNodeCloneNoProps(getNativePointer(), node);
    YogaNodePropertiesUnsafe clone =
      new YogaNodePropertiesUnsafe(clonedNativePointer);
    clone.mHasBorderSet = mHasBorderSet;
    clone.mHasNewLayout = mHasNewLayout;
    return clone;
  }

  @Override
  public long getNativePointer() {
    return mNativePointer;
  }

  @Override
  public void onAfterCalculateLayout(boolean hasNewLayout) {
    mHasNewLayout = hasNewLayout;
  }

  private static native void jni_YGNodeReset(long nativePointer);

  @Override
  public void reset() {
    mHasNewLayout = true;
    jni_YGNodeReset(getNativePointer());
  }

  @Override
  public boolean hasNewLayout() {
    return mHasNewLayout;
  }

  private static native boolean jni_YGNodeIsDirty(long nativePointer);

  @Override
  public boolean isDirty() {
    return jni_YGNodeIsDirty(mNativePointer);
  }

  @Override
  public void markLayoutSeen() {
    mHasNewLayout = false;
  }

  @Override
  public YogaDirection getStyleDirection() {
    return YogaDirection.fromInt(getStyleInt(YogaNodeMemoryLayout.styleDirection));
  }

  @Override
  public void setDirection(YogaDirection direction) {
    putStyleInt(YogaNodeMemoryLayout.styleDirection, direction.intValue());
  }

  @Override
  public YogaFlexDirection getFlexDirection() {
    return YogaFlexDirection.fromInt(getStyleInt(YogaNodeMemoryLayout.styleFlexDirection));
  }

  @Override
  public void setFlexDirection(YogaFlexDirection flexDirection) {
    putStyleInt(YogaNodeMemoryLayout.styleFlexDirection, flexDirection.intValue());
  }

  @Override
  public YogaJustify getJustifyContent() {
    return YogaJustify.fromInt(getStyleInt(YogaNodeMemoryLayout.styleJustifyContent));
  }

  @Override
  public void setJustifyContent(YogaJustify justifyContent) {
    putStyleInt(YogaNodeMemoryLayout.styleJustifyContent, justifyContent.intValue());
  }

  @Override
  public YogaAlign getAlignItems() {
    return YogaAlign.fromInt(getStyleInt(YogaNodeMemoryLayout.styleAlignItems));
  }

  @Override
  public void setAlignItems(YogaAlign alignItems) {
    putStyleInt(YogaNodeMemoryLayout.styleAlignItems, alignItems.intValue());
  }

  @Override
  public YogaAlign getAlignSelf() {
    return YogaAlign.fromInt(getStyleInt(YogaNodeMemoryLayout.styleAlignSelf));
  }

  @Override
  public void setAlignSelf(YogaAlign alignSelf) {
    putStyleInt(YogaNodeMemoryLayout.styleAlignSelf, alignSelf.intValue());
  }

  @Override
  public YogaAlign getAlignContent() {
    return YogaAlign.fromInt(getStyleInt(YogaNodeMemoryLayout.styleAlignContent));
  }

  @Override
  public void setAlignContent(YogaAlign alignContent) {
    putStyleInt(YogaNodeMemoryLayout.styleAlignContent, alignContent.intValue());
  }

  @Override
  public YogaPositionType getPositionType() {
    return YogaPositionType.fromInt(getStyleInt(YogaNodeMemoryLayout.stylePositionType));
  }

  @Override
  public void setPositionType(YogaPositionType positionType) {
    putStyleInt(YogaNodeMemoryLayout.stylePositionType, positionType.intValue());
  }

  @Override
  public void setWrap(YogaWrap flexWrap) {
    putStyleInt(YogaNodeMemoryLayout.styleFlexWrap, flexWrap.intValue());
  }

  @Override
  public YogaOverflow getOverflow() {
    return YogaOverflow.fromInt(getStyleInt(YogaNodeMemoryLayout.styleOverflow));
  }

  @Override
  public void setOverflow(YogaOverflow overflow) {
    putStyleInt(YogaNodeMemoryLayout.styleOverflow, overflow.intValue());
  }

  @Override
  public YogaDisplay getDisplay() {
    return YogaDisplay.fromInt(getStyleInt(YogaNodeMemoryLayout.styleDisplay));
  }

  @Override
  public void setDisplay(YogaDisplay display) {
    putStyleInt(YogaNodeMemoryLayout.styleDisplay, display.intValue());
  }

  @Override
  public void setFlex(float flex) {
    putStyleOptional(YogaNodeMemoryLayout.styleFlex, flex);
  }

  @Override
  public float getFlexGrow() {
    return getStyleFloat(YogaNodeMemoryLayout.styleFlexGrow);
  }

  @Override
  public void setFlexGrow(float flexGrow) {
    putStyleOptional(YogaNodeMemoryLayout.styleFlexGrow, flexGrow);
  }

  @Override
  public float getFlexShrink() {
    return getStyleFloat(YogaNodeMemoryLayout.styleFlexShrink);
  }

  @Override
  public void setFlexShrink(float flexShrink) {
    putStyleOptional(YogaNodeMemoryLayout.styleFlexShrink, flexShrink);
  }

  @Override
  public YogaValue getFlexBasis() {
    return getStyleValue(YogaNodeMemoryLayout.styleFlexBasis);
  }

  @Override
  public void setFlexBasis(float flexBasis) {
    putStylePoints(YogaNodeMemoryLayout.styleFlexBasis, flexBasis);
  }

  @Override
  public void setFlexBasisPercent(float percent) {
    putStylePercent(YogaNodeMemoryLayout.styleFlexBasis, percent);
  }

  @Override
  public void setFlexBasisAuto() {
    putStyleAuto(YogaNodeMemoryLayout.styleFlexBasis);
  }

  @Override
  public YogaValue getMargin(YogaEdge edge) {
    return getStyleValue(YogaNodeMemoryLayout.styleMarginOffset(edge));
  }

  @Override
  public void setMargin(YogaEdge edge, float margin) {
    putStylePoints(YogaNodeMemoryLayout.styleMarginOffset(edge), margin);
  }

  @Override
  public void setMarginPercent(YogaEdge edge, float percent) {
    putStylePercent(YogaNodeMemoryLayout.styleMarginOffset(edge), percent);
  }

  @Override
  public void setMarginAuto(YogaEdge edge) {
    putStyleAuto(YogaNodeMemoryLayout.styleMarginOffset(edge));
  }

  @Override
  public YogaValue getPadding(YogaEdge edge) {
    return getStyleValue(YogaNodeMemoryLayout.stylePaddingOffset(edge));
  }

  @Override
  public void setPadding(YogaEdge edge, float padding) {
    putStylePoints(YogaNodeMemoryLayout.stylePaddingOffset(edge), padding);
  }

  @Override
  public void setPaddingPercent(YogaEdge edge, float percent) {
    putStylePercent(YogaNodeMemoryLayout.stylePaddingOffset(edge), percent);
  }

  @Override
  public float getBorder(YogaEdge edge) {
    return mHasBorderSet
      ? getStyleFloat(YogaNodeMemoryLayout.styleBorderOffset(edge))
      : YogaConstants.UNDEFINED;
  }

  @Override
  public void setBorder(YogaEdge edge, float border) {
    mHasBorderSet = true;
    putStylePoints(YogaNodeMemoryLayout.styleBorderOffset(edge), border);
  }

  @Override
  public YogaValue getPosition(YogaEdge edge) {
    return getStyleValue(YogaNodeMemoryLayout.stylePositionOffset(edge));
  }

  @Override
  public void setPosition(YogaEdge edge, float position) {
    putStylePoints(YogaNodeMemoryLayout.stylePositionOffset(edge), position);
  }

  @Override
  public void setPositionPercent(YogaEdge edge, float percent) {
    putStylePercent(YogaNodeMemoryLayout.stylePositionOffset(edge), percent);
  }

  @Override
  public YogaValue getWidth() {
    return getStyleValue(YogaNodeMemoryLayout.styleWidth);
  }

  @Override
  public void setWidth(float width) {
    putStylePoints(YogaNodeMemoryLayout.styleWidth, width);
  }

  @Override
  public void setWidthPercent(float percent) {
    putStylePercent(YogaNodeMemoryLayout.styleWidth, percent);
  }

  @Override
  public void setWidthAuto() {
    putStyleAuto(YogaNodeMemoryLayout.styleWidth);
  }

  @Override
  public YogaValue getHeight() {
    return getStyleValue(YogaNodeMemoryLayout.styleHeight);
  }

  @Override
  public void setHeight(float height) {
    putStylePoints(YogaNodeMemoryLayout.styleHeight, height);
  }

  @Override
  public void setHeightPercent(float percent) {
    putStylePercent(YogaNodeMemoryLayout.styleHeight, percent);
  }

  @Override
  public void setHeightAuto() {
    putStyleAuto(YogaNodeMemoryLayout.styleHeight);
  }

  @Override
  public YogaValue getMinWidth() {
    return getStyleValue(YogaNodeMemoryLayout.styleMinWidth);
  }

  @Override
  public void setMinWidth(float minWidth) {
    putStylePoints(YogaNodeMemoryLayout.styleMinWidth, minWidth);
  }

  @Override
  public void setMinWidthPercent(float percent) {
    putStylePercent(YogaNodeMemoryLayout.styleMinWidth, percent);
  }

  @Override
  public YogaValue getMinHeight() {
    return getStyleValue(YogaNodeMemoryLayout.styleMinHeight);
  }

  @Override
  public void setMinHeight(float minHeight) {
    putStylePoints(YogaNodeMemoryLayout.styleMinHeight, minHeight);
  }

  @Override
  public void setMinHeightPercent(float percent) {
    putStylePercent(YogaNodeMemoryLayout.styleMinHeight, percent);
  }

  @Override
  public YogaValue getMaxWidth() {
    return getStyleValue(YogaNodeMemoryLayout.styleMaxWidth);
  }

  @Override
  public void setMaxWidth(float maxWidth) {
    putStylePoints(YogaNodeMemoryLayout.styleMaxWidth, maxWidth);
  }

  @Override
  public void setMaxWidthPercent(float percent) {
    putStylePercent(YogaNodeMemoryLayout.styleMaxWidth, percent);
  }

  @Override
  public YogaValue getMaxHeight() {
    return getStyleValue(YogaNodeMemoryLayout.styleMaxHeight);
  }

  @Override
  public void setMaxHeight(float maxHeight) {
    putStylePoints(YogaNodeMemoryLayout.styleMaxHeight, maxHeight);
  }

  @Override
  public void setMaxHeightPercent(float percent) {
    putStylePercent(YogaNodeMemoryLayout.styleMaxHeight, percent);
  }

  @Override
  public float getAspectRatio() {
    return getStyleOptional(YogaNodeMemoryLayout.styleAspectRatio);
  }

  @Override
  public void setAspectRatio(float aspectRatio) {
    putStyleOptional(YogaNodeMemoryLayout.styleAspectRatio, aspectRatio);
  }

  @Override
  public float getLayoutX() {
    return getLayoutFloat(YogaNodeMemoryLayout.layoutX);
  }

  @Override
  public float getLayoutY() {
    return getLayoutFloat(YogaNodeMemoryLayout.layoutY);
  }

  @Override
  public float getLayoutWidth() {
    return getLayoutFloat(YogaNodeMemoryLayout.layoutWidth);
  }

  @Override
  public float getLayoutHeight() {
    return getLayoutFloat(YogaNodeMemoryLayout.layoutHeight);
  }

  @Override
  public boolean getDoesLegacyStretchFlagAffectsLayout() {
    return getBool(mLayoutNativePointer + YogaNodeMemoryLayout.layoutDoesLegacyStretchFlagAffectsLayout);
  }

  @Override
  public float getLayoutMargin(YogaEdge edge) {
    return getLayoutFloat(YogaNodeMemoryLayout.layoutMarginOffset(layoutEdge(edge)));
  }

  @Override
  public float getLayoutPadding(YogaEdge edge) {
    return getLayoutFloat(YogaNodeMemoryLayout.layoutPaddingOffset(layoutEdge(edge)));
  }

  @Override
  public float getLayoutBorder(YogaEdge edge) {
    return getLayoutFloat(YogaNodeMemoryLayout.layoutBorderOffset(layoutEdge(edge)));
  }

  @Override
  public YogaDirection getLayoutDirection() {
    return YogaDirection.fromInt(getLayoutDirectionInt());
  }

  private static native void jni_YGNodeFree(long nativePointer);

  @Override
  public void freeNatives() {
    if (!mIsFreed) {
      mIsFreed = true;
      jni_YGNodeFree(mNativePointer);
    }
  }

  private int getLayoutDirectionInt() {
    return UNSAFE.getInt(null, mLayoutNativePointer + YogaNodeMemoryLayout.layoutDirection);
  }

  private YogaEdge layoutEdge(YogaEdge edge) {
    int layoutDirection = getLayoutDirectionInt();
    switch (edge) {
      case LEFT:
        return layoutDirection == RTL ? YogaEdge.END : YogaEdge.START;
      case RIGHT:
        return layoutDirection == RTL ? YogaEdge.START : YogaEdge.END;
      case TOP:
      case BOTTOM:
      case START:
      case END:
        return edge;
      default:
        throw new IllegalArgumentException("Cannot get layout properties of multi-edge shorthands");
    }
  }

  private int getStyleInt(int offset) {
    return UNSAFE.getInt(null, mStyleNativePointer + offset);
  }

  private void putStyleInt(int offset, int value) {
    UNSAFE.putInt(null, mStyleNativePointer + offset, value);
  }

  private float getStyleFloat(int offset) {
    return getFloat(mStyleNativePointer + offset);
  }

  private void putStyleFloat(int offset, float value) {
    putFloat(mStyleNativePointer + offset, value);
  }

  private void putStylePoints(int offset, float value) {
    putStyleValue(offset, value, POINT);
  }

  private void putStylePercent(int offset, float value) {
    putStyleValue(offset, value, PERCENT);
  }

  private void putStyleAuto(int offset) {
    putStyleValue(offset, 0, AUTO);
  }

  private void putStyleValue(int offset, float value, int unit) {
    if (YogaConstants.isUndefined(value)) {
      value = YogaConstants.UNDEFINED;
      unit = UNDEFINED;
    }
    putStyleFloat(offset, value);
    putStyleInt(offset + FLOAT_SIZE, unit);
  }

  private YogaValue getStyleValue(int offset) {
    float value = getStyleFloat(offset);
    int unit = getStyleInt(offset + FLOAT_SIZE);
    return new YogaValue(value, YogaUnit.fromInt(unit));
  }

  private void putStyleOptional(int offset, float value) {
    int isUndefinedBits = YogaConstants.isUndefined(value) ? TRUE_BITS : 0;
    putStyleFloat(offset, value);
    putStyleInt(offset + FLOAT_SIZE, isUndefinedBits);
  }

  private float getStyleOptional(int offset) {
    boolean isUndefined = getBool(mStyleNativePointer + offset + FLOAT_SIZE);
    return isUndefined
      ? YogaConstants.UNDEFINED
      : getStyleFloat(offset);
  }

  private float getLayoutFloat(int offset) {
    return getFloat(mLayoutNativePointer + offset);
  }

  private static float getFloat(long offset) {
    int intBits = UNSAFE.getInt(null, offset);
    return Float.intBitsToFloat(intBits);
  }

  private static void putFloat(long offset, float value) {
    int intBits = Float.floatToRawIntBits(value);
    UNSAFE.putInt(null, offset, intBits);
  }

  private static boolean getBool(long offset) {
    // assumes little endian
    return (UNSAFE.getInt(null, offset) & 0xFF) != 0;
  }

}
