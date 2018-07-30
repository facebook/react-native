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
public class YogaNodePropertiesHybrid extends YogaNodePropertiesJNI {

  static {
    SoLoader.loadLibrary("yoga");
  }

  private ByteBuffer mStyleBuffer;

  private static native ByteBuffer jni_getStyleBuffer(long nativePointer);

  public YogaNodePropertiesHybrid(YogaNode node) {
    super(node);
    mStyleBuffer = jni_getStyleBuffer(getNativePointer()).order(ByteOrder.LITTLE_ENDIAN);
  }

  public YogaNodePropertiesHybrid(YogaNode node, YogaConfig config) {
    super(node, config);
    mStyleBuffer = jni_getStyleBuffer(getNativePointer()).order(ByteOrder.LITTLE_ENDIAN);
  }

  @Override
  public void setDirection(YogaDirection direction) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleDirection, direction.intValue());
  }

  @Override
  public void setFlexDirection(YogaFlexDirection flexDirection) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleFlexDirection, flexDirection.intValue());
  }

  @Override
  public void setJustifyContent(YogaJustify justifyContent) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleJustifyContent, justifyContent.intValue());
  }

  @Override
  public void setAlignItems(YogaAlign alignItems) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleAlignItems, alignItems.intValue());
  }

  @Override
  public void setAlignSelf(YogaAlign alignSelf) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleAlignSelf, alignSelf.intValue());
  }

  @Override
  public void setAlignContent(YogaAlign alignContent) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleAlignContent, alignContent.intValue());
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
  public void setOverflow(YogaOverflow overflow) {
    mStyleBuffer.putInt(YogaNodeMemoryLayout.styleOverflow, overflow.intValue());
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
  public void setFlexGrow(float flexGrow) {
    YogaNodeMemoryLayout.putOptional(mStyleBuffer, YogaNodeMemoryLayout.styleFlexGrow, flexGrow);
  }

  @Override
  public void setFlexShrink(float flexShrink) {
    YogaNodeMemoryLayout.putOptional(
        mStyleBuffer, YogaNodeMemoryLayout.styleFlexShrink, flexShrink);
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
    mEdgeSetFlag |= MARGIN;
    YogaNodeMemoryLayout.putPointValue(
        mStyleBuffer, YogaNodeMemoryLayout.styleMarginOffset(edge), margin);
  }

  @Override
  public void setMarginPercent(YogaEdge edge, float percent) {
    mEdgeSetFlag |= MARGIN;
    YogaNodeMemoryLayout.putPercentValue(
        mStyleBuffer, YogaNodeMemoryLayout.styleMarginOffset(edge), percent);
  }

  @Override
  public void setMarginAuto(YogaEdge edge) {
    mEdgeSetFlag |= MARGIN;
    YogaNodeMemoryLayout.putAutoValue(mStyleBuffer, YogaNodeMemoryLayout.styleMarginOffset(edge));
  }

  @Override
  public void setPadding(YogaEdge edge, float padding) {
    mEdgeSetFlag |= PADDING;
    YogaNodeMemoryLayout.putPointValue(
        mStyleBuffer, YogaNodeMemoryLayout.stylePaddingOffset(edge), padding);
  }

  @Override
  public void setPaddingPercent(YogaEdge edge, float percent) {
    mEdgeSetFlag |= PADDING;
    YogaNodeMemoryLayout.putPercentValue(
        mStyleBuffer, YogaNodeMemoryLayout.stylePaddingOffset(edge), percent);
  }

  @Override
  public void setBorder(YogaEdge edge, float border) {
    mEdgeSetFlag |= BORDER;
    YogaNodeMemoryLayout.putPointValue(
        mStyleBuffer, YogaNodeMemoryLayout.styleBorderOffset(edge), border);
  }

  @Override
  public void setPosition(YogaEdge edge, float position) {
    mHasSetPosition = true;
    YogaNodeMemoryLayout.putPointValue(
        mStyleBuffer, YogaNodeMemoryLayout.stylePositionOffset(edge), position);
  }

  @Override
  public void setPositionPercent(YogaEdge edge, float percent) {
    mHasSetPosition = true;
    YogaNodeMemoryLayout.putPercentValue(
        mStyleBuffer, YogaNodeMemoryLayout.stylePositionOffset(edge), percent);
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
  public void setMinWidth(float minWidth) {
    YogaNodeMemoryLayout.putPointValue(mStyleBuffer, YogaNodeMemoryLayout.styleMinWidth, minWidth);
  }

  @Override
  public void setMinWidthPercent(float percent) {
    YogaNodeMemoryLayout.putPercentValue(mStyleBuffer, YogaNodeMemoryLayout.styleMinWidth, percent);
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
  public void setMaxWidth(float maxWidth) {
    YogaNodeMemoryLayout.putPointValue(mStyleBuffer, YogaNodeMemoryLayout.styleMaxWidth, maxWidth);
  }

  @Override
  public void setMaxWidthPercent(float percent) {
    YogaNodeMemoryLayout.putPercentValue(mStyleBuffer, YogaNodeMemoryLayout.styleMaxWidth, percent);
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
  public void setAspectRatio(float aspectRatio) {
    YogaNodeMemoryLayout.putOptional(
        mStyleBuffer, YogaNodeMemoryLayout.styleAspectRatio, aspectRatio);
  }

  @Override
  public YogaNodeProperties clone(YogaNode node) {
    YogaNodePropertiesHybrid clone = (YogaNodePropertiesHybrid) super.clone(node);
    clone.mStyleBuffer =
        jni_getStyleBuffer(clone.getNativePointer()).order(ByteOrder.LITTLE_ENDIAN);
    return clone;
  }
}
