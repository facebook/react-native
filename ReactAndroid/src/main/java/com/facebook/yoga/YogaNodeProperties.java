/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.yoga;

public interface YogaNodeProperties {

  YogaNodeProperties clone(YogaNode node);

  long getNativePointer();

  void onAfterCalculateLayout();

  void reset();

  boolean hasNewLayout();

  boolean isDirty();

  void markLayoutSeen();

  YogaDirection getStyleDirection();

  void setDirection(YogaDirection direction);

  YogaFlexDirection getFlexDirection();

  void setFlexDirection(YogaFlexDirection flexDirection);

  YogaJustify getJustifyContent();

  void setJustifyContent(YogaJustify justifyContent);

  YogaAlign getAlignItems();

  void setAlignItems(YogaAlign alignItems);

  YogaAlign getAlignSelf();

  void setAlignSelf(YogaAlign alignSelf);

  YogaAlign getAlignContent();

  void setAlignContent(YogaAlign alignContent);

  YogaPositionType getPositionType();

  void setPositionType(YogaPositionType positionType);

  void setWrap(YogaWrap flexWrap);

  YogaOverflow getOverflow();

  void setOverflow(YogaOverflow overflow);

  YogaDisplay getDisplay();

  void setDisplay(YogaDisplay display);

  void setFlex(float flex);

  float getFlexGrow();

  void setFlexGrow(float flexGrow);

  float getFlexShrink();

  void setFlexShrink(float flexShrink);

  YogaValue getFlexBasis();

  void setFlexBasis(float flexBasis);

  void setFlexBasisPercent(float percent);

  void setFlexBasisAuto();

  YogaValue getMargin(YogaEdge edge);

  void setMargin(YogaEdge edge, float margin);

  void setMarginPercent(YogaEdge edge, float percent);

  void setMarginAuto(YogaEdge edge);

  YogaValue getPadding(YogaEdge edge);

  void setPadding(YogaEdge edge, float padding);

  void setPaddingPercent(YogaEdge edge, float percent);

  float getBorder(YogaEdge edge);

  void setBorder(YogaEdge edge, float border);

  YogaValue getPosition(YogaEdge edge);

  void setPosition(YogaEdge edge, float position);

  void setPositionPercent(YogaEdge edge, float percent);

  YogaValue getWidth();

  void setWidth(float width);

  void setWidthPercent(float percent);

  void setWidthAuto();

  YogaValue getHeight();

  void setHeight(float height);

  void setHeightPercent(float percent);

  void setHeightAuto();

  YogaValue getMinWidth();

  void setMinWidth(float minWidth);

  void setMinWidthPercent(float percent);

  YogaValue getMinHeight();

  void setMinHeight(float minHeight);

  void setMinHeightPercent(float percent);

  YogaValue getMaxWidth();

  void setMaxWidth(float maxWidth);

  void setMaxWidthPercent(float percent);

  YogaValue getMaxHeight();

  void setMaxHeight(float maxheight);

  void setMaxHeightPercent(float percent);

  float getAspectRatio();

  void setAspectRatio(float aspectRatio);

  float getLayoutX();

  float getLayoutY();

  float getLayoutWidth();

  float getLayoutHeight();

  boolean getDoesLegacyStretchFlagAffectsLayout();

  float getLayoutMargin(YogaEdge edge);

  float getLayoutPadding(YogaEdge edge);

  float getLayoutBorder(YogaEdge edge);

  YogaDirection getLayoutDirection();

  void freeNatives();
}
