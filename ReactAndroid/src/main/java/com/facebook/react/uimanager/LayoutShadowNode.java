// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager;

import javax.annotation.Nullable;

import java.util.Locale;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableType;

import com.facebook.yoga.YogaAlign;
import com.facebook.yoga.YogaConstants;
import com.facebook.yoga.YogaFlexDirection;
import com.facebook.yoga.YogaJustify;
import com.facebook.yoga.YogaOverflow;
import com.facebook.yoga.YogaPositionType;
import com.facebook.yoga.YogaValue;
import com.facebook.yoga.YogaUnit;
import com.facebook.yoga.YogaWrap;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;

/**
 * Supply setters for base view layout properties such as width, height, flex properties,
 * borders, etc.
 *
 * Checking for isVirtual everywhere is a hack to get around the fact that some virtual nodes still
 * have layout properties set on them in JS: for example, a component that returns a <Text> may
 * or may not be embedded in a parent text. There are better solutions that should probably be
 * explored, namely using the VirtualText class in JS and setting the correct set of validAttributes
 */
public class LayoutShadowNode extends ReactShadowNode {

  private static boolean dynamicIsPercent(Dynamic dynamic) {
    return dynamic.getType() == ReadableType.String && dynamic.asString().endsWith("%");
  }

  private static float getDynamicAsPercent(Dynamic dynamic) {
    final String value = dynamic.asString();
    return Float.parseFloat(value.substring(0, value.length() - 1));
  }

  private static float getDynamicAsFloat(Dynamic dynamic) {
    return (float) PixelUtil.toPixelFromDIP(dynamic.asDouble());
  }

  private static boolean isNull(Dynamic d) {
    return d == null || d.isNull();
  }

  @ReactProp(name = ViewProps.WIDTH)
  public void setWidth(Dynamic width) {
    if (isVirtual()) {
      return;
    }

    if (!isNull(width) && dynamicIsPercent(width)) {
      setStyleWidthPercent(getDynamicAsPercent(width));
    } else {
      setStyleWidth(isNull(width) ? YogaConstants.UNDEFINED : getDynamicAsFloat(width));
    }

    width.recycle();
  }

  @ReactProp(name = ViewProps.MIN_WIDTH)
  public void setMinWidth(Dynamic minWidth) {
    if (isVirtual()) {
      return;
    }

    if (!isNull(minWidth) && dynamicIsPercent(minWidth)) {
      setStyleMinWidthPercent(getDynamicAsPercent(minWidth));
    } else {
      setStyleMinWidth(isNull(minWidth) ? YogaConstants.UNDEFINED : getDynamicAsFloat(minWidth));
    }

    minWidth.recycle();
  }

  @ReactProp(name = ViewProps.MAX_WIDTH)
  public void setMaxWidth(Dynamic maxWidth) {
    if (isVirtual()) {
      return;
    }

    if (!isNull(maxWidth) && dynamicIsPercent(maxWidth)) {
      setStyleMaxWidthPercent(getDynamicAsPercent(maxWidth));
    } else {
      setStyleMaxWidth(isNull(maxWidth) ? YogaConstants.UNDEFINED : getDynamicAsFloat(maxWidth));
    }

    maxWidth.recycle();
  }

  @ReactProp(name = ViewProps.HEIGHT)
  public void setHeight(Dynamic height) {
    if (isVirtual()) {
      return;
    }

    if (!isNull(height) && dynamicIsPercent(height)) {
      setStyleHeightPercent(getDynamicAsPercent(height));
    } else {
      setStyleHeight(isNull(height) ? YogaConstants.UNDEFINED : getDynamicAsFloat(height));
    }

    height.recycle();
  }

  @ReactProp(name = ViewProps.MIN_HEIGHT)
  public void setMinHeight(Dynamic minHeight) {
    if (isVirtual()) {
      return;
    }

    if (!isNull(minHeight) && dynamicIsPercent(minHeight)) {
      setStyleMinHeightPercent(getDynamicAsPercent(minHeight));
    } else {
      setStyleMinHeight(isNull(minHeight) ? YogaConstants.UNDEFINED : getDynamicAsFloat(minHeight));
    }

    minHeight.recycle();
  }

  @ReactProp(name = ViewProps.MAX_HEIGHT)
  public void setMaxHeight(Dynamic maxHeight) {
    if (isVirtual()) {
      return;
    }

    if (!isNull(maxHeight) && dynamicIsPercent(maxHeight)) {
      setStyleMaxHeightPercent(getDynamicAsPercent(maxHeight));
    } else {
      setStyleMaxHeight(isNull(maxHeight) ? YogaConstants.UNDEFINED : getDynamicAsFloat(maxHeight));
    }

    maxHeight.recycle();
  }

  @ReactProp(name = ViewProps.FLEX, defaultFloat = 0f)
  public void setFlex(float flex) {
    if (isVirtual()) {
      return;
    }
    super.setFlex(flex);
  }

  @ReactProp(name = ViewProps.FLEX_GROW, defaultFloat = 0f)
  public void setFlexGrow(float flexGrow) {
    if (isVirtual()) {
      return;
    }
    super.setFlexGrow(flexGrow);
  }

  @ReactProp(name = ViewProps.FLEX_SHRINK, defaultFloat = 0f)
  public void setFlexShrink(float flexShrink) {
    if (isVirtual()) {
      return;
    }
    super.setFlexShrink(flexShrink);
  }

  @ReactProp(name = ViewProps.FLEX_BASIS)
  public void setFlexBasis(Dynamic flexBasis) {
    if (isVirtual()) {
      return;
    }

    if (!isNull(flexBasis) && dynamicIsPercent(flexBasis)) {
      setFlexBasisPercent(getDynamicAsPercent(flexBasis));
    } else {
      setFlexBasis(isNull(flexBasis) ? 0 : getDynamicAsFloat(flexBasis));
    }

    flexBasis.recycle();
  }

  @ReactProp(name = ViewProps.ASPECT_RATIO, defaultFloat = YogaConstants.UNDEFINED)
  public void setAspectRatio(float aspectRatio) {
    setStyleAspectRatio(aspectRatio);
  }

  @ReactProp(name = ViewProps.FLEX_DIRECTION)
  public void setFlexDirection(@Nullable String flexDirection) {
    if (isVirtual()) {
      return;
    }
    setFlexDirection(
        flexDirection == null ? YogaFlexDirection.COLUMN : YogaFlexDirection.valueOf(
            flexDirection.toUpperCase(Locale.US).replace("-", "_")));
  }

  @ReactProp(name = ViewProps.FLEX_WRAP)
  public void setFlexWrap(@Nullable String flexWrap) {
    if (isVirtual()) {
      return;
    }
    if (flexWrap == null || flexWrap.equals("nowrap")) {
      setFlexWrap(YogaWrap.NO_WRAP);
    } else if (flexWrap.equals("wrap")) {
      setFlexWrap(YogaWrap.WRAP);
    } else {
      throw new IllegalArgumentException("Unknown flexWrap value: " + flexWrap);
    }
  }

  @ReactProp(name = ViewProps.ALIGN_SELF)
  public void setAlignSelf(@Nullable String alignSelf) {
    if (isVirtual()) {
      return;
    }
    setAlignSelf(alignSelf == null ? YogaAlign.AUTO : YogaAlign.valueOf(
            alignSelf.toUpperCase(Locale.US).replace("-", "_")));
  }

  @ReactProp(name = ViewProps.ALIGN_ITEMS)
  public void setAlignItems(@Nullable String alignItems) {
    if (isVirtual()) {
      return;
    }
    setAlignItems(
        alignItems == null ? YogaAlign.STRETCH : YogaAlign.valueOf(
            alignItems.toUpperCase(Locale.US).replace("-", "_")));
  }

  @ReactProp(name = ViewProps.JUSTIFY_CONTENT)
  public void setJustifyContent(@Nullable String justifyContent) {
    if (isVirtual()) {
      return;
    }
    setJustifyContent(justifyContent == null ? YogaJustify.FLEX_START : YogaJustify.valueOf(
            justifyContent.toUpperCase(Locale.US).replace("-", "_")));
  }

  @ReactProp(name = ViewProps.OVERFLOW)
  public void setOverflow(@Nullable String overflow) {
    if (isVirtual()) {
      return;
    }
    setOverflow(overflow == null ? YogaOverflow.VISIBLE : YogaOverflow.valueOf(
            overflow.toUpperCase(Locale.US).replace("-", "_")));
  }

  @ReactPropGroup(names = {
      ViewProps.MARGIN,
      ViewProps.MARGIN_VERTICAL,
      ViewProps.MARGIN_HORIZONTAL,
      ViewProps.MARGIN_LEFT,
      ViewProps.MARGIN_RIGHT,
      ViewProps.MARGIN_TOP,
      ViewProps.MARGIN_BOTTOM,
  })
  public void setMargins(int index, Dynamic margin) {
    if (isVirtual()) {
      return;
    }

    if (!isNull(margin) && dynamicIsPercent(margin)) {
      setMarginPercent(ViewProps.PADDING_MARGIN_SPACING_TYPES[index], getDynamicAsPercent(margin));
    } else {
      setMargin(
          ViewProps.PADDING_MARGIN_SPACING_TYPES[index],
          isNull(margin) ? YogaConstants.UNDEFINED : getDynamicAsFloat(margin));
    }

    margin.recycle();
  }

  @ReactPropGroup(names = {
      ViewProps.PADDING,
      ViewProps.PADDING_VERTICAL,
      ViewProps.PADDING_HORIZONTAL,
      ViewProps.PADDING_LEFT,
      ViewProps.PADDING_RIGHT,
      ViewProps.PADDING_TOP,
      ViewProps.PADDING_BOTTOM,
  })
  public void setPaddings(int index, Dynamic padding) {
    if (isVirtual()) {
      return;
    }

    if (!isNull(padding) && dynamicIsPercent(padding)) {
      setPaddingPercent(
          ViewProps.PADDING_MARGIN_SPACING_TYPES[index], getDynamicAsPercent(padding));
    } else {
      setPadding(
          ViewProps.PADDING_MARGIN_SPACING_TYPES[index],
          isNull(padding) ? YogaConstants.UNDEFINED : getDynamicAsFloat(padding));
    }

    padding.recycle();
  }

  @ReactPropGroup(names = {
      ViewProps.BORDER_WIDTH,
      ViewProps.BORDER_LEFT_WIDTH,
      ViewProps.BORDER_RIGHT_WIDTH,
      ViewProps.BORDER_TOP_WIDTH,
      ViewProps.BORDER_BOTTOM_WIDTH,
  }, defaultFloat = YogaConstants.UNDEFINED)
  public void setBorderWidths(int index, float borderWidth) {
    if (isVirtual()) {
      return;
    }
    setBorder(ViewProps.BORDER_SPACING_TYPES[index], PixelUtil.toPixelFromDIP(borderWidth));
  }

  @ReactPropGroup(names = {
      ViewProps.LEFT,
      ViewProps.RIGHT,
      ViewProps.TOP,
      ViewProps.BOTTOM,
  })
  public void setPositionValues(int index, Dynamic position) {
    if (isVirtual()) {
      return;
    }

    if (!isNull(position) && dynamicIsPercent(position)) {
      setPositionPercent(ViewProps.POSITION_SPACING_TYPES[index], getDynamicAsPercent(position));
    } else {
      setPosition(
          ViewProps.POSITION_SPACING_TYPES[index],
          isNull(position) ? YogaConstants.UNDEFINED : getDynamicAsFloat(position));
    }

    position.recycle();
  }

  @ReactProp(name = ViewProps.POSITION)
  public void setPosition(@Nullable String position) {
    if (isVirtual()) {
      return;
    }
    YogaPositionType positionType = position == null ?
        YogaPositionType.RELATIVE : YogaPositionType.valueOf(position.toUpperCase(Locale.US));
    setPositionType(positionType);
  }

  @Override
  @ReactProp(name = "onLayout")
  public void setShouldNotifyOnLayout(boolean shouldNotifyOnLayout) {
    super.setShouldNotifyOnLayout(shouldNotifyOnLayout);
  }
}
