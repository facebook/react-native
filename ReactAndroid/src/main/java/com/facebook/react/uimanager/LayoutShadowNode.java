// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager;

import javax.annotation.Nullable;

import java.util.Locale;

import com.facebook.csslayout.CSSAlign;
import com.facebook.csslayout.CSSConstants;
import com.facebook.csslayout.CSSFlexDirection;
import com.facebook.csslayout.CSSJustify;
import com.facebook.csslayout.CSSPositionType;
import com.facebook.csslayout.CSSWrap;

/**
 * Supply setters for base view layout properties such as width, height, flex properties,
 * borders, etc.
 */
public class LayoutShadowNode extends ReactShadowNode {

  @ReactProp(name = ViewProps.WIDTH, defaultFloat = CSSConstants.UNDEFINED)
  public void setWidth(float width) {
    setStyleWidth(CSSConstants.isUndefined(width) ? width : PixelUtil.toPixelFromDIP(width));
  }

  @ReactProp(name = ViewProps.HEIGHT, defaultFloat = CSSConstants.UNDEFINED)
  public void setHeight(float height) {
    setStyleHeight(CSSConstants.isUndefined(height) ? height : PixelUtil.toPixelFromDIP(height));
  }

  @ReactProp(name = ViewProps.LEFT, defaultFloat = CSSConstants.UNDEFINED)
  public void setLeft(float left) {
    setPositionLeft(CSSConstants.isUndefined(left) ? left : PixelUtil.toPixelFromDIP(left));
  }

  @ReactProp(name = ViewProps.TOP, defaultFloat = CSSConstants.UNDEFINED)
  public void setTop(float top) {
    setPositionTop(CSSConstants.isUndefined(top) ? top : PixelUtil.toPixelFromDIP(top));
  }

  @ReactProp(name = ViewProps.BOTTOM, defaultFloat = CSSConstants.UNDEFINED)
  public void setBottom(float bottom) {
    setPositionBottom(CSSConstants.isUndefined(bottom) ? bottom : PixelUtil.toPixelFromDIP(bottom));
  }

  @ReactProp(name = ViewProps.RIGHT, defaultFloat = CSSConstants.UNDEFINED)
  public void setRight(float right) {
    setPositionRight(CSSConstants.isUndefined(right) ? right : PixelUtil.toPixelFromDIP(right));
  }

  @ReactProp(name = ViewProps.FLEX, defaultFloat = 0f)
  public void setFlex(float flex) {
    super.setFlex(flex);
  }

  @ReactProp(name = ViewProps.FLEX_DIRECTION)
  public void setFlexDirection(@Nullable String flexDirection) {
    setFlexDirection(
        flexDirection == null ? CSSFlexDirection.COLUMN : CSSFlexDirection.valueOf(
            flexDirection.toUpperCase(Locale.US)));
  }

  @ReactProp(name = ViewProps.FLEX_WRAP)
  public void setFlexWrap(@Nullable String flexWrap) {
    setWrap(flexWrap == null ? CSSWrap.NOWRAP : CSSWrap.valueOf(flexWrap.toUpperCase(Locale.US)));
  }

  @ReactProp(name = ViewProps.ALIGN_SELF)
  public void setAlignSelf(@Nullable String alignSelf) {
    setAlignSelf(alignSelf == null ? CSSAlign.AUTO : CSSAlign.valueOf(
            alignSelf.toUpperCase(Locale.US).replace("-", "_")));
  }

  @ReactProp(name = ViewProps.ALIGN_ITEMS)
  public void setAlignItems(@Nullable String alignItems) {
    setAlignItems(
        alignItems == null ? CSSAlign.STRETCH : CSSAlign.valueOf(
            alignItems.toUpperCase(Locale.US).replace("-", "_")));
  }

  @ReactProp(name = ViewProps.JUSTIFY_CONTENT)
  public void setJustifyContent(@Nullable String justifyContent) {
    setJustifyContent(justifyContent == null ? CSSJustify.FLEX_START : CSSJustify.valueOf(
            justifyContent.toUpperCase(Locale.US).replace("-", "_")));
  }

  @ReactPropGroup(names = {
      ViewProps.MARGIN,
      ViewProps.MARGIN_VERTICAL,
      ViewProps.MARGIN_HORIZONTAL,
      ViewProps.MARGIN_LEFT,
      ViewProps.MARGIN_RIGHT,
      ViewProps.MARGIN_TOP,
      ViewProps.MARGIN_BOTTOM,
  }, defaultFloat = 0f)
  public void setMargins(int index, float margin) {
    setMargin(ViewProps.PADDING_MARGIN_SPACING_TYPES[index], PixelUtil.toPixelFromDIP(margin));
  }

  @ReactPropGroup(names = {
      ViewProps.PADDING,
      ViewProps.PADDING_VERTICAL,
      ViewProps.PADDING_HORIZONTAL,
      ViewProps.PADDING_LEFT,
      ViewProps.PADDING_RIGHT,
      ViewProps.PADDING_TOP,
      ViewProps.PADDING_BOTTOM,
  }, defaultFloat = CSSConstants.UNDEFINED)
  public void setPaddings(int index, float padding) {
    setPadding(
        ViewProps.PADDING_MARGIN_SPACING_TYPES[index],
        CSSConstants.isUndefined(padding) ? padding : PixelUtil.toPixelFromDIP(padding));
  }

  @ReactPropGroup(names = {
      ViewProps.BORDER_WIDTH,
      ViewProps.BORDER_LEFT_WIDTH,
      ViewProps.BORDER_RIGHT_WIDTH,
      ViewProps.BORDER_TOP_WIDTH,
      ViewProps.BORDER_BOTTOM_WIDTH,
  }, defaultFloat = 0f)
  public void setBorderWidths(int index, float borderWidth) {
    setBorder(ViewProps.BORDER_SPACING_TYPES[index], PixelUtil.toPixelFromDIP(borderWidth));
  }

  @ReactProp(name = ViewProps.POSITION)
  public void setPosition(@Nullable String position) {
    CSSPositionType positionType = position == null ?
        CSSPositionType.RELATIVE : CSSPositionType.valueOf(position.toUpperCase(Locale.US));
    setPositionType(positionType);
  }

  @Override
  @ReactProp(name = "onLayout")
  public void setShouldNotifyOnLayout(boolean shouldNotifyOnLayout) {
    super.setShouldNotifyOnLayout(shouldNotifyOnLayout);
  }
}
