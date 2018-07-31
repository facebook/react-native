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
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

@DoNotStrip
public class YogaNodePropertiesByteBuffer implements YogaNodeProperties, Cloneable {

  static {
    SoLoader.loadLibrary("yoga");
  }

  private static final int RTL = YogaDirection.RTL.intValue();
  private final ByteBuffer mStyleBuffer;
  private final ByteBuffer mLayoutBuffer;
  private final long mNativePointer;
  private boolean mHasBorderSet = false;
  private boolean mHasNewLayout = true;

  private static native ByteBuffer jni_getStyleBuffer(long nativePointer);

  private static native ByteBuffer jni_getLayoutBuffer(long nativePointer);

  private static native long jni_YGNodeNewByteBuffer(YogaNode node);

  public YogaNodePropertiesByteBuffer(YogaNode node) {
    this(jni_YGNodeNewByteBuffer(node));
  }

  private static native long jni_YGNodeNewByteBufferWithConfig(YogaNode node, long configPointer);

  public YogaNodePropertiesByteBuffer(YogaNode node, YogaConfig config) {
    this(jni_YGNodeNewByteBufferWithConfig(node, config.mNativePointer));
  }

  public YogaNodePropertiesByteBuffer(long nativePointer) {
    mNativePointer = nativePointer;
    mStyleBuffer = jni_getStyleBuffer(nativePointer).order(ByteOrder.LITTLE_ENDIAN);
    mLayoutBuffer = jni_getLayoutBuffer(nativePointer).order(ByteOrder.LITTLE_ENDIAN);
  }

  private static native void jni_YGNodeFree(long nativePointer);

  @Override
  protected void finalize() throws Throwable {
    try {
      jni_YGNodeFree(getNativePointer());
    } finally {
      super.finalize();
    }
  }

  private static native long jni_YGNodeCloneNoProps(long nativePointer, YogaNode newNode);

  @Override
  public YogaNodeProperties clone(YogaNode node) {
    long clonedNativePointer = jni_YGNodeCloneNoProps(getNativePointer(), node);
    YogaNodePropertiesByteBuffer clone = new YogaNodePropertiesByteBuffer(clonedNativePointer);
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
    mHasBorderSet = false;
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
    return YogaDirection.fromInt(mStyleBuffer.getInt(YogaNodeMemoryLayout.styleDirection));
  }

  @Override
  public YogaValue getPosition(YogaEdge edge) {
    return YogaNodeMemoryLayout.getValue(
        mStyleBuffer, YogaNodeMemoryLayout.stylePositionOffset(edge));
  }

  @Override
  public YogaValue getMargin(YogaEdge edge) {
    return YogaNodeMemoryLayout.getValue(
        mStyleBuffer, YogaNodeMemoryLayout.styleMarginOffset(edge));
  }

  @Override
  public YogaValue getPadding(YogaEdge edge) {
    return YogaNodeMemoryLayout.getValue(
        mStyleBuffer, YogaNodeMemoryLayout.stylePaddingOffset(edge));
  }

  @Override
  public float getBorder(YogaEdge edge) {
    return mHasBorderSet
        ? mStyleBuffer.getFloat(YogaNodeMemoryLayout.styleBorderOffset(edge))
        : YogaConstants.UNDEFINED;
  }

  @Override
  public void setDirection(YogaDirection direction) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleDirection, direction.intValue());
  }

  @Override
  public YogaFlexDirection getFlexDirection() {
    return YogaFlexDirection.fromInt(mStyleBuffer.getInt(YogaNodeMemoryLayout.styleFlexDirection));
  }

  @Override
  public void setFlexDirection(YogaFlexDirection flexDirection) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleFlexDirection, flexDirection.intValue());
  }

  @Override
  public YogaJustify getJustifyContent() {
    return YogaJustify.fromInt(mStyleBuffer.getInt(YogaNodeMemoryLayout.styleJustifyContent));
  }

  @Override
  public void setJustifyContent(YogaJustify justifyContent) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleJustifyContent, justifyContent.intValue());
  }

  @Override
  public YogaAlign getAlignItems() {
    return YogaAlign.fromInt(mStyleBuffer.getInt(YogaNodeMemoryLayout.styleAlignItems));
  }

  @Override
  public void setAlignItems(YogaAlign alignItems) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleAlignItems, alignItems.intValue());
  }

  @Override
  public YogaAlign getAlignSelf() {
    return YogaAlign.fromInt(mStyleBuffer.getInt(YogaNodeMemoryLayout.styleAlignSelf));
  }

  @Override
  public void setAlignSelf(YogaAlign alignSelf) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleAlignSelf, alignSelf.intValue());
  }

  @Override
  public YogaAlign getAlignContent() {
    return YogaAlign.fromInt(mStyleBuffer.getInt(YogaNodeMemoryLayout.styleAlignContent));
  }

  @Override
  public void setAlignContent(YogaAlign alignContent) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleAlignContent, alignContent.intValue());
  }

  @Override
  public YogaPositionType getPositionType() {
    return YogaPositionType.fromInt(mStyleBuffer.getInt(YogaNodeMemoryLayout.stylePositionType));
  }

  @Override
  public void setPositionType(YogaPositionType positionType) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.stylePositionType, positionType.intValue());
  }

  @Override
  public void setWrap(YogaWrap flexWrap) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleFlexWrap, flexWrap.intValue());
  }

  @Override
  public YogaOverflow getOverflow() {
    return YogaOverflow.fromInt(mStyleBuffer.getInt(YogaNodeMemoryLayout.styleOverflow));
  }

  @Override
  public void setOverflow(YogaOverflow overflow) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleOverflow, overflow.intValue());
  }

  @Override
  public YogaDisplay getDisplay() {
    return YogaDisplay.fromInt(mStyleBuffer.getInt(YogaNodeMemoryLayout.styleDisplay));
  }

  @Override
  public void setDisplay(YogaDisplay display) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleDisplay, display.intValue());
  }

  @Override
  public void setFlex(float flex) {
    YogaNodeMemoryLayout.putOptional(mStyleBuffer, YogaNodeMemoryLayout.styleFlex, flex);
  }

  @Override
  public float getFlexGrow() {
    return mStyleBuffer.getFloat(YogaNodeMemoryLayout.styleFlexGrow);
  }

  @Override
  public void setFlexGrow(float flexGrow) {
    YogaNodeMemoryLayout.putOptional(mStyleBuffer, YogaNodeMemoryLayout.styleFlexGrow, flexGrow);
  }

  @Override
  public float getFlexShrink() {
    return mStyleBuffer.getFloat(YogaNodeMemoryLayout.styleFlexShrink);
  }

  @Override
  public void setFlexShrink(float flexShrink) {
    YogaNodeMemoryLayout.putOptional(
        mStyleBuffer, YogaNodeMemoryLayout.styleFlexShrink, flexShrink);
  }

  @Override
  public YogaValue getFlexBasis() {
    return YogaNodeMemoryLayout.getValue(mStyleBuffer, YogaNodeMemoryLayout.styleFlexBasis);
  }

  @Override
  public void setFlexBasis(float flexBasis) {
    YogaNodeMemoryLayout.putPointValue(
        mStyleBuffer, YogaNodeMemoryLayout.styleFlexBasis, flexBasis);
  }

  @Override
  public void setFlexBasisPercent(float percent) {
    YogaNodeMemoryLayout.putPercentValue(
        mStyleBuffer, YogaNodeMemoryLayout.styleFlexBasis, percent);
  }

  @Override
  public void setFlexBasisAuto() {
    YogaNodeMemoryLayout.putAutoValue(mStyleBuffer, YogaNodeMemoryLayout.styleFlexBasis);
  }

  @Override
  public void setMargin(YogaEdge edge, float margin) {
    YogaNodeMemoryLayout.putPointValue(
        mStyleBuffer, YogaNodeMemoryLayout.styleMarginOffset(edge), margin);
  }

  @Override
  public void setMarginPercent(YogaEdge edge, float percent) {
    YogaNodeMemoryLayout.putPercentValue(
        mStyleBuffer, YogaNodeMemoryLayout.styleMarginOffset(edge), percent);
  }

  @Override
  public void setMarginAuto(YogaEdge edge) {
    YogaNodeMemoryLayout.putAutoValue(mStyleBuffer, YogaNodeMemoryLayout.styleMarginOffset(edge));
  }

  @Override
  public void setPadding(YogaEdge edge, float padding) {
    YogaNodeMemoryLayout.putPointValue(
        mStyleBuffer, YogaNodeMemoryLayout.stylePaddingOffset(edge), padding);
  }

  @Override
  public void setPaddingPercent(YogaEdge edge, float percent) {
    YogaNodeMemoryLayout.putPercentValue(
        mStyleBuffer, YogaNodeMemoryLayout.stylePaddingOffset(edge), percent);
  }

  @Override
  public void setBorder(YogaEdge edge, float border) {
    mHasBorderSet = true;
    YogaNodeMemoryLayout.putPointValue(
        mStyleBuffer, YogaNodeMemoryLayout.styleBorderOffset(edge), border);
  }

  @Override
  public void setPosition(YogaEdge edge, float position) {
    YogaNodeMemoryLayout.putPointValue(
        mStyleBuffer, YogaNodeMemoryLayout.stylePositionOffset(edge), position);
  }

  @Override
  public void setPositionPercent(YogaEdge edge, float percent) {
    YogaNodeMemoryLayout.putPercentValue(
        mStyleBuffer, YogaNodeMemoryLayout.stylePositionOffset(edge), percent);
  }

  @Override
  public YogaValue getWidth() {
    return YogaNodeMemoryLayout.getValue(mStyleBuffer, YogaNodeMemoryLayout.styleWidth);
  }

  @Override
  public void setWidth(float width) {
    YogaNodeMemoryLayout.putPointValue(mStyleBuffer, YogaNodeMemoryLayout.styleWidth, width);
  }

  @Override
  public void setWidthPercent(float percent) {
    YogaNodeMemoryLayout.putPercentValue(mStyleBuffer, YogaNodeMemoryLayout.styleWidth, percent);
  }

  @Override
  public void setWidthAuto() {
    YogaNodeMemoryLayout.putAutoValue(mStyleBuffer, YogaNodeMemoryLayout.styleWidth);
  }

  @Override
  public YogaValue getHeight() {
    return YogaNodeMemoryLayout.getValue(mStyleBuffer, YogaNodeMemoryLayout.styleHeight);
  }

  @Override
  public void setHeight(float height) {
    YogaNodeMemoryLayout.putPointValue(mStyleBuffer, YogaNodeMemoryLayout.styleHeight, height);
  }

  @Override
  public void setHeightPercent(float percent) {
    YogaNodeMemoryLayout.putPercentValue(mStyleBuffer, YogaNodeMemoryLayout.styleHeight, percent);
  }

  @Override
  public void setHeightAuto() {
    YogaNodeMemoryLayout.putAutoValue(mStyleBuffer, YogaNodeMemoryLayout.styleHeight);
  }

  @Override
  public YogaValue getMinWidth() {
    return YogaNodeMemoryLayout.getValue(mStyleBuffer, YogaNodeMemoryLayout.styleMinWidth);
  }

  @Override
  public void setMinWidth(float minWidth) {
    YogaNodeMemoryLayout.putPointValue(mStyleBuffer, YogaNodeMemoryLayout.styleMinWidth, minWidth);
  }

  @Override
  public void setMinWidthPercent(float percent) {
    YogaNodeMemoryLayout.putPercentValue(mStyleBuffer, YogaNodeMemoryLayout.styleMinWidth, percent);
  }

  @Override
  public YogaValue getMinHeight() {
    return YogaNodeMemoryLayout.getValue(mStyleBuffer, YogaNodeMemoryLayout.styleMinHeight);
  }

  @Override
  public void setMinHeight(float minHeight) {
    YogaNodeMemoryLayout.putPointValue(
        mStyleBuffer, YogaNodeMemoryLayout.styleMinHeight, minHeight);
  }

  @Override
  public void setMinHeightPercent(float percent) {
    YogaNodeMemoryLayout.putPercentValue(
        mStyleBuffer, YogaNodeMemoryLayout.styleMinHeight, percent);
  }

  @Override
  public YogaValue getMaxWidth() {
    return YogaNodeMemoryLayout.getValue(mStyleBuffer, YogaNodeMemoryLayout.styleMaxWidth);
  }

  @Override
  public void setMaxWidth(float maxWidth) {
    YogaNodeMemoryLayout.putPointValue(mStyleBuffer, YogaNodeMemoryLayout.styleMaxWidth, maxWidth);
  }

  @Override
  public void setMaxWidthPercent(float percent) {
    YogaNodeMemoryLayout.putPercentValue(mStyleBuffer, YogaNodeMemoryLayout.styleMaxWidth, percent);
  }

  @Override
  public YogaValue getMaxHeight() {
    return YogaNodeMemoryLayout.getValue(mStyleBuffer, YogaNodeMemoryLayout.styleMaxHeight);
  }

  @Override
  public void setMaxHeight(float maxHeight) {
    YogaNodeMemoryLayout.putPointValue(
        mStyleBuffer, YogaNodeMemoryLayout.styleMaxHeight, maxHeight);
  }

  @Override
  public void setMaxHeightPercent(float percent) {
    YogaNodeMemoryLayout.putPercentValue(
        mStyleBuffer, YogaNodeMemoryLayout.styleMaxHeight, percent);
  }

  @Override
  public float getAspectRatio() {
    return YogaNodeMemoryLayout.getOptional(mStyleBuffer, YogaNodeMemoryLayout.styleAspectRatio);
  }

  @Override
  public void setAspectRatio(float aspectRatio) {
    YogaNodeMemoryLayout.putOptional(
        mStyleBuffer, YogaNodeMemoryLayout.styleAspectRatio, aspectRatio);
  }

  @Override
  public float getLayoutX() {
    return mLayoutBuffer.getFloat(YogaNodeMemoryLayout.layoutX);
  }

  @Override
  public float getLayoutY() {
    return mLayoutBuffer.getFloat(YogaNodeMemoryLayout.layoutY);
  }

  @Override
  public float getLayoutWidth() {
    return mLayoutBuffer.getFloat(YogaNodeMemoryLayout.layoutWidth);
  }

  @Override
  public float getLayoutHeight() {
    return mLayoutBuffer.getFloat(YogaNodeMemoryLayout.layoutHeight);
  }

  @Override
  public boolean getDoesLegacyStretchFlagAffectsLayout() {
    return YogaNodeMemoryLayout.getBoolean(
        mLayoutBuffer, YogaNodeMemoryLayout.layoutDoesLegacyStretchFlagAffectsLayout);
  }

  @Override
  public float getLayoutMargin(YogaEdge edge) {
    return mLayoutBuffer.getFloat(YogaNodeMemoryLayout.layoutMarginOffset(layoutEdge(edge)));
  }

  @Override
  public float getLayoutPadding(YogaEdge edge) {
    return mLayoutBuffer.getFloat(YogaNodeMemoryLayout.layoutPaddingOffset(layoutEdge(edge)));
  }

  @Override
  public float getLayoutBorder(YogaEdge edge) {
    return mLayoutBuffer.getFloat(YogaNodeMemoryLayout.layoutBorderOffset(layoutEdge(edge)));
  }

  @Override
  public YogaDirection getLayoutDirection() {
    return YogaDirection.fromInt(getLayoutDirectionInt());
  }

  @Override
  public void freeNatives() {
    jni_YGNodeFree(mNativePointer);
  }

  private int getLayoutDirectionInt() {
    return mLayoutBuffer.getInt(YogaNodeMemoryLayout.layoutDirection);
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
}
