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
        CSSMeasureMode widthMode,
        float height,
        CSSMeasureMode heightMode);
  }

  int getChildCount();
  CSSNodeType getChildAt(int i);
  void addChildAt(CSSNodeType child, int i);
  CSSNodeType removeChildAt(int i);
  CSSNodeType getParent();
  int indexOf(CSSNodeType child);
  void setMeasureFunction(MeasureFunction measureFunction);
  boolean isMeasureDefined();
  void setIsTextNode(boolean isTextNode);
  boolean isTextNode();
  void calculateLayout(CSSLayoutContext layoutContext);
  boolean isDirty();
  boolean hasNewLayout();
  void dirty();
  void markLayoutSeen();
  boolean valuesEqual(float f1, float f2);
  CSSDirection getStyleDirection();
  void setDirection(CSSDirection direction);
  CSSFlexDirection getFlexDirection();
  void setFlexDirection(CSSFlexDirection flexDirection);
  CSSJustify getJustifyContent();
  void setJustifyContent(CSSJustify justifyContent);
  CSSAlign getAlignItems();
  void setAlignItems(CSSAlign alignItems);
  CSSAlign getAlignSelf();
  void setAlignSelf(CSSAlign alignSelf);
  CSSAlign getAlignContent();
  void setAlignContent(CSSAlign alignContent);
  CSSPositionType getPositionType();
  void setPositionType(CSSPositionType positionType);
  void setWrap(CSSWrap flexWrap);
  void setFlex(float flex);
  float getFlexGrow();
  void setFlexGrow(float flexGrow);
  float getFlexShrink();
  void setFlexShrink(float flexShrink);
  float getFlexBasis();
  void setFlexBasis(float flexBasis);
  float getMargin(int spacingType);
  void setMargin(int spacingType, float margin);
  float getPadding(int spacingType);
  void setPadding(int spacingType, float padding);
  float getBorder(int spacingType);
  void setBorder(int spacingType, float border);
  float getPosition(int spacingType);
  void setPosition(int spacingType, float position);
  float getStyleWidth();
  void setStyleWidth(float width);
  float getStyleHeight();
  void setStyleHeight(float height);
  float getStyleMaxWidth();
  void setStyleMaxWidth(float maxWidth);
  float getStyleMinWidth();
  void setStyleMinWidth(float minWidth);
  float getStyleMaxHeight();
  void setStyleMaxHeight(float maxHeight);
  float getStyleMinHeight();
  void setStyleMinHeight(float minHeight);
  float getLayoutX();
  float getLayoutY();
  float getLayoutWidth();
  float getLayoutHeight();
  CSSDirection getLayoutDirection();
  CSSOverflow getOverflow();
  void setOverflow(CSSOverflow overflow);
  void setData(Object data);
  Object getData();
  void reset();
}
