/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.csslayout;

public interface CSSNodeAPI<CSSNodeType extends CSSNodeAPI> {

  interface MeasureFunction {
    /**
     * Return a value created by MeasureOutput.make(width, height);
     */
    long measure(
        CSSNodeAPI node,
        float width,
        YogaMeasureMode widthMode,
        float height,
        YogaMeasureMode heightMode);
  }

  int getChildCount();
  CSSNodeType getChildAt(int i);
  void addChildAt(CSSNodeType child, int i);
  CSSNodeType removeChildAt(int i);
  CSSNodeType getParent();
  int indexOf(CSSNodeType child);
  void setMeasureFunction(MeasureFunction measureFunction);
  boolean isMeasureDefined();
  void calculateLayout();
  boolean isDirty();
  boolean hasNewLayout();
  void dirty();
  void markLayoutSeen();
  void copyStyle(CSSNodeType srcNode);
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
  void setFlex(float flex);
  float getFlexGrow();
  void setFlexGrow(float flexGrow);
  float getFlexShrink();
  void setFlexShrink(float flexShrink);
  float getFlexBasis();
  void setFlexBasis(float flexBasis);
  float getMargin(YogaEdge edge);
  void setMargin(YogaEdge edge, float margin);
  float getPadding(YogaEdge edge);
  void setPadding(YogaEdge edge, float padding);
  float getBorder(YogaEdge edge);
  void setBorder(YogaEdge edge, float border);
  float getPosition(YogaEdge edge);
  void setPosition(YogaEdge edge, float position);
  float getWidth();
  void setWidth(float width);
  float getHeight();
  void setHeight(float height);
  float getMaxWidth();
  void setMaxWidth(float maxWidth);
  float getMinWidth();
  void setMinWidth(float minWidth);
  float getMaxHeight();
  void setMaxHeight(float maxHeight);
  float getMinHeight();
  void setMinHeight(float minHeight);
  float getLayoutX();
  float getLayoutY();
  float getLayoutWidth();
  float getLayoutHeight();
  YogaDirection getLayoutDirection();
  YogaOverflow getOverflow();
  void setOverflow(YogaOverflow overflow);
  void setData(Object data);
  Object getData();
  void reset();
}
