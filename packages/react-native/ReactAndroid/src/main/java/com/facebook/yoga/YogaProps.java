/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

public interface YogaProps {

  /* Width properties */

  void setWidth(float width);

  void setWidthPercent(float percent);

  void setWidthAuto();

  void setWidthMaxContent();

  void setWidthFitContent();

  void setWidthStretch();

  void setMinWidth(float minWidth);

  void setMinWidthPercent(float percent);

  void setMinWidthMaxContent();

  void setMinWidthFitContent();

  void setMinWidthStretch();

  void setMaxWidth(float maxWidth);

  void setMaxWidthPercent(float percent);

  void setMaxWidthMaxContent();

  void setMaxWidthFitContent();

  void setMaxWidthStretch();

  /* Height properties */

  void setHeight(float height);

  void setHeightPercent(float percent);

  void setHeightAuto();

  void setHeightMaxContent();

  void setHeightFitContent();

  void setHeightStretch();

  void setMinHeight(float minHeight);

  void setMinHeightPercent(float percent);

  void setMinHeightMaxContent();

  void setMinHeightFitContent();

  void setMinHeightStretch();

  void setMaxHeight(float maxHeight);

  void setMaxHeightPercent(float percent);

  void setMaxHeightMaxContent();

  void setMaxHeightFitContent();

  void setMaxHeightStretch();

  /* Margin properties */

  void setMargin(YogaEdge edge, float margin);

  void setMarginPercent(YogaEdge edge, float percent);

  void setMarginAuto(YogaEdge edge);

  /* Padding properties */

  void setPadding(YogaEdge edge, float padding);

  void setPaddingPercent(YogaEdge edge, float percent);

  /* Position properties */

  void setPositionType(YogaPositionType positionType);

  void setPosition(YogaEdge edge, float position);

  void setPositionPercent(YogaEdge edge, float percent);

  /* Alignment properties */

  void setAlignContent(YogaAlign alignContent);

  void setAlignItems(YogaAlign alignItems);

  void setAlignSelf(YogaAlign alignSelf);

  /* Flex properties */

  void setFlex(float flex);

  void setFlexBasisAuto();

  void setFlexBasisPercent(float percent);

  void setFlexBasis(float flexBasis);

  void setFlexBasisMaxContent();

  void setFlexBasisFitContent();

  void setFlexBasisStretch();

  void setFlexDirection(YogaFlexDirection direction);

  void setFlexGrow(float flexGrow);

  void setFlexShrink(float flexShrink);

  /* Other properties */

  void setJustifyContent(YogaJustify justifyContent);

  void setDirection(YogaDirection direction);

  void setBorder(YogaEdge edge, float value);

  void setWrap(YogaWrap wrap);

  void setAspectRatio(float aspectRatio);

  void setIsReferenceBaseline(boolean isReferenceBaseline);

  void setMeasureFunction(YogaMeasureFunction measureFunction);

  void setBaselineFunction(YogaBaselineFunction yogaBaselineFunction);

  void setBoxSizing(YogaBoxSizing boxSizing);

  /* Getters */

  YogaValue getWidth();

  YogaValue getMinWidth();

  YogaValue getMaxWidth();

  YogaValue getHeight();

  YogaValue getMinHeight();

  YogaValue getMaxHeight();

  YogaDirection getStyleDirection();

  YogaFlexDirection getFlexDirection();

  YogaJustify getJustifyContent();

  YogaAlign getAlignItems();

  YogaAlign getAlignSelf();

  YogaAlign getAlignContent();

  YogaPositionType getPositionType();

  float getFlexGrow();

  float getFlexShrink();

  YogaValue getFlexBasis();

  float getAspectRatio();

  YogaValue getMargin(YogaEdge edge);

  YogaValue getPadding(YogaEdge edge);

  YogaValue getPosition(YogaEdge edge);

  float getBorder(YogaEdge edge);

  YogaBoxSizing getBoxSizing();
}
