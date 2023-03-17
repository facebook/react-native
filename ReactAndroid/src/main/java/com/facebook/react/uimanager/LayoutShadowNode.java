/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.yoga.YogaAlign;
import com.facebook.yoga.YogaConstants;
import com.facebook.yoga.YogaDisplay;
import com.facebook.yoga.YogaFlexDirection;
import com.facebook.yoga.YogaJustify;
import com.facebook.yoga.YogaOverflow;
import com.facebook.yoga.YogaPositionType;
import com.facebook.yoga.YogaUnit;
import com.facebook.yoga.YogaWrap;

/**
 * Supply setters for base view layout properties such as width, height, flex properties, borders,
 * etc.
 *
 * <p>Checking for isVirtual everywhere is a hack to get around the fact that some virtual nodes
 * still have layout properties set on them in JS: for example, a component that returns a <Text>
 * may or may not be embedded in a parent text. There are better solutions that should probably be
 * explored, namely using the VirtualText class in JS and setting the correct set of validAttributes
 */
public class LayoutShadowNode extends ReactShadowNodeImpl {

  /** A Mutable version of com.facebook.yoga.YogaValue */
  private static class MutableYogaValue {
    float value;
    YogaUnit unit;

    private MutableYogaValue() {}

    private MutableYogaValue(MutableYogaValue mutableYogaValue) {
      this.value = mutableYogaValue.value;
      this.unit = mutableYogaValue.unit;
    }

    void setFromDynamic(Dynamic dynamic) {
      if (dynamic.isNull()) {
        unit = YogaUnit.UNDEFINED;
        value = YogaConstants.UNDEFINED;
      } else if (dynamic.getType() == ReadableType.String) {
        final String s = dynamic.asString();
        if (s.equals("auto")) {
          unit = YogaUnit.AUTO;
          value = YogaConstants.UNDEFINED;
        } else if (s.endsWith("%")) {
          unit = YogaUnit.PERCENT;
          value = Float.parseFloat(s.substring(0, s.length() - 1));
        } else {
          FLog.w(ReactConstants.TAG, "Unknown value: " + s);
          unit = YogaUnit.UNDEFINED;
          value = YogaConstants.UNDEFINED;
        }
      } else if (dynamic.getType() == ReadableType.Number) {
        unit = YogaUnit.POINT;
        value = PixelUtil.toPixelFromDIP(dynamic.asDouble());
      } else {
        unit = YogaUnit.UNDEFINED;
        value = YogaConstants.UNDEFINED;
      }
    }
  }

  private final MutableYogaValue mTempYogaValue;

  public LayoutShadowNode() {
    mTempYogaValue = new MutableYogaValue();
  }

  @ReactProp(name = ViewProps.WIDTH)
  public void setWidth(Dynamic width) {
    if (isVirtual()) {
      return;
    }

    mTempYogaValue.setFromDynamic(width);
    switch (mTempYogaValue.unit) {
      case POINT:
      case UNDEFINED:
        setStyleWidth(mTempYogaValue.value);
        break;
      case AUTO:
        setStyleWidthAuto();
        break;
      case PERCENT:
        setStyleWidthPercent(mTempYogaValue.value);
        break;
    }

    width.recycle();
  }

  @ReactProp(name = ViewProps.MIN_WIDTH)
  public void setMinWidth(Dynamic minWidth) {
    if (isVirtual()) {
      return;
    }

    mTempYogaValue.setFromDynamic(minWidth);
    switch (mTempYogaValue.unit) {
      case POINT:
      case UNDEFINED:
        setStyleMinWidth(mTempYogaValue.value);
        break;
      case PERCENT:
        setStyleMinWidthPercent(mTempYogaValue.value);
        break;
    }

    minWidth.recycle();
  }

  boolean mCollapsable;

  @ReactProp(name = "collapsable")
  public void setCollapsable(boolean collapsable) {
    mCollapsable = collapsable;
  }

  @ReactProp(name = ViewProps.MAX_WIDTH)
  public void setMaxWidth(Dynamic maxWidth) {
    if (isVirtual()) {
      return;
    }

    mTempYogaValue.setFromDynamic(maxWidth);
    switch (mTempYogaValue.unit) {
      case POINT:
      case UNDEFINED:
        setStyleMaxWidth(mTempYogaValue.value);
        break;
      case PERCENT:
        setStyleMaxWidthPercent(mTempYogaValue.value);
        break;
    }

    maxWidth.recycle();
  }

  @ReactProp(name = ViewProps.HEIGHT)
  public void setHeight(Dynamic height) {
    if (isVirtual()) {
      return;
    }

    mTempYogaValue.setFromDynamic(height);
    switch (mTempYogaValue.unit) {
      case POINT:
      case UNDEFINED:
        setStyleHeight(mTempYogaValue.value);
        break;
      case AUTO:
        setStyleHeightAuto();
        break;
      case PERCENT:
        setStyleHeightPercent(mTempYogaValue.value);
        break;
    }

    height.recycle();
  }

  @ReactProp(name = ViewProps.MIN_HEIGHT)
  public void setMinHeight(Dynamic minHeight) {
    if (isVirtual()) {
      return;
    }

    mTempYogaValue.setFromDynamic(minHeight);
    switch (mTempYogaValue.unit) {
      case POINT:
      case UNDEFINED:
        setStyleMinHeight(mTempYogaValue.value);
        break;
      case PERCENT:
        setStyleMinHeightPercent(mTempYogaValue.value);
        break;
    }

    minHeight.recycle();
  }

  @ReactProp(name = ViewProps.MAX_HEIGHT)
  public void setMaxHeight(Dynamic maxHeight) {
    if (isVirtual()) {
      return;
    }

    mTempYogaValue.setFromDynamic(maxHeight);
    switch (mTempYogaValue.unit) {
      case POINT:
      case UNDEFINED:
        setStyleMaxHeight(mTempYogaValue.value);
        break;
      case PERCENT:
        setStyleMaxHeightPercent(mTempYogaValue.value);
        break;
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

  @ReactProp(name = ViewProps.ROW_GAP, defaultFloat = YogaConstants.UNDEFINED)
  public void setRowGap(float rowGap) {
    if (isVirtual()) {
      return;
    }
    super.setRowGap(PixelUtil.toPixelFromDIP(rowGap));
  }

  @ReactProp(name = ViewProps.COLUMN_GAP, defaultFloat = YogaConstants.UNDEFINED)
  public void setColumnGap(float columnGap) {
    if (isVirtual()) {
      return;
    }
    super.setColumnGap(PixelUtil.toPixelFromDIP(columnGap));
  }

  @ReactProp(name = ViewProps.GAP, defaultFloat = YogaConstants.UNDEFINED)
  public void setGap(float gap) {
    if (isVirtual()) {
      return;
    }
    super.setGap(PixelUtil.toPixelFromDIP(gap));
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

    mTempYogaValue.setFromDynamic(flexBasis);
    switch (mTempYogaValue.unit) {
      case POINT:
      case UNDEFINED:
        setFlexBasis(mTempYogaValue.value);
        break;
      case AUTO:
        setFlexBasisAuto();
        break;
      case PERCENT:
        setFlexBasisPercent(mTempYogaValue.value);
        break;
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

    if (flexDirection == null) {
      setFlexDirection(YogaFlexDirection.COLUMN);
      return;
    }

    switch (flexDirection) {
      case "column":
        {
          setFlexDirection(YogaFlexDirection.COLUMN);
          break;
        }
      case "column-reverse":
        {
          setFlexDirection(YogaFlexDirection.COLUMN_REVERSE);
          break;
        }
      case "row":
        {
          setFlexDirection(YogaFlexDirection.ROW);
          break;
        }
      case "row-reverse":
        {
          setFlexDirection(YogaFlexDirection.ROW_REVERSE);
          break;
        }
      default:
        {
          FLog.w(ReactConstants.TAG, "invalid value for flexDirection: " + flexDirection);
          setFlexDirection(YogaFlexDirection.COLUMN);
          break;
        }
    }
  }

  @ReactProp(name = ViewProps.FLEX_WRAP)
  public void setFlexWrap(@Nullable String flexWrap) {
    if (isVirtual()) {
      return;
    }

    if (flexWrap == null) {
      setFlexWrap(YogaWrap.NO_WRAP);
      return;
    }

    switch (flexWrap) {
      case "nowrap":
        {
          setFlexWrap(YogaWrap.NO_WRAP);
          break;
        }
      case "wrap":
        {
          setFlexWrap(YogaWrap.WRAP);
          break;
        }
      case "wrap-reverse":
        {
          setFlexWrap(YogaWrap.WRAP_REVERSE);
          break;
        }
      default:
        {
          FLog.w(ReactConstants.TAG, "invalid value for flexWrap: " + flexWrap);
          setFlexWrap(YogaWrap.NO_WRAP);
          break;
        }
    }
  }

  @ReactProp(name = ViewProps.ALIGN_SELF)
  public void setAlignSelf(@Nullable String alignSelf) {
    if (isVirtual()) {
      return;
    }

    if (alignSelf == null) {
      setAlignSelf(YogaAlign.AUTO);
      return;
    }

    switch (alignSelf) {
      case "auto":
        {
          setAlignSelf(YogaAlign.AUTO);
          return;
        }
      case "flex-start":
        {
          setAlignSelf(YogaAlign.FLEX_START);
          return;
        }
      case "center":
        {
          setAlignSelf(YogaAlign.CENTER);
          return;
        }
      case "flex-end":
        {
          setAlignSelf(YogaAlign.FLEX_END);
          return;
        }
      case "stretch":
        {
          setAlignSelf(YogaAlign.STRETCH);
          return;
        }
      case "baseline":
        {
          setAlignSelf(YogaAlign.BASELINE);
          return;
        }
      case "space-between":
        {
          setAlignSelf(YogaAlign.SPACE_BETWEEN);
          return;
        }
      case "space-around":
        {
          setAlignSelf(YogaAlign.SPACE_AROUND);
          return;
        }
      default:
        {
          FLog.w(ReactConstants.TAG, "invalid value for alignSelf: " + alignSelf);
          setAlignSelf(YogaAlign.AUTO);
          return;
        }
    }
  }

  @ReactProp(name = ViewProps.ALIGN_ITEMS)
  public void setAlignItems(@Nullable String alignItems) {
    if (isVirtual()) {
      return;
    }

    if (alignItems == null) {
      setAlignItems(YogaAlign.STRETCH);
      return;
    }

    switch (alignItems) {
      case "auto":
        {
          setAlignItems(YogaAlign.AUTO);
          return;
        }
      case "flex-start":
        {
          setAlignItems(YogaAlign.FLEX_START);
          return;
        }
      case "center":
        {
          setAlignItems(YogaAlign.CENTER);
          return;
        }
      case "flex-end":
        {
          setAlignItems(YogaAlign.FLEX_END);
          return;
        }
      case "stretch":
        {
          setAlignItems(YogaAlign.STRETCH);
          return;
        }
      case "baseline":
        {
          setAlignItems(YogaAlign.BASELINE);
          return;
        }
      case "space-between":
        {
          setAlignItems(YogaAlign.SPACE_BETWEEN);
          return;
        }
      case "space-around":
        {
          setAlignItems(YogaAlign.SPACE_AROUND);
          return;
        }
      default:
        {
          FLog.w(ReactConstants.TAG, "invalid value for alignItems: " + alignItems);
          setAlignItems(YogaAlign.STRETCH);
          return;
        }
    }
  }

  @ReactProp(name = ViewProps.ALIGN_CONTENT)
  public void setAlignContent(@Nullable String alignContent) {
    if (isVirtual()) {
      return;
    }

    if (alignContent == null) {
      setAlignContent(YogaAlign.FLEX_START);
      return;
    }

    switch (alignContent) {
      case "auto":
        {
          setAlignContent(YogaAlign.AUTO);
          return;
        }
      case "flex-start":
        {
          setAlignContent(YogaAlign.FLEX_START);
          return;
        }
      case "center":
        {
          setAlignContent(YogaAlign.CENTER);
          return;
        }
      case "flex-end":
        {
          setAlignContent(YogaAlign.FLEX_END);
          return;
        }
      case "stretch":
        {
          setAlignContent(YogaAlign.STRETCH);
          return;
        }
      case "baseline":
        {
          setAlignContent(YogaAlign.BASELINE);
          return;
        }
      case "space-between":
        {
          setAlignContent(YogaAlign.SPACE_BETWEEN);
          return;
        }
      case "space-around":
        {
          setAlignContent(YogaAlign.SPACE_AROUND);
          return;
        }
      default:
        {
          FLog.w(ReactConstants.TAG, "invalid value for alignContent: " + alignContent);
          setAlignContent(YogaAlign.FLEX_START);
          return;
        }
    }
  }

  @ReactProp(name = ViewProps.JUSTIFY_CONTENT)
  public void setJustifyContent(@Nullable String justifyContent) {
    if (isVirtual()) {
      return;
    }

    if (justifyContent == null) {
      setJustifyContent(YogaJustify.FLEX_START);
      return;
    }

    switch (justifyContent) {
      case "flex-start":
        {
          setJustifyContent(YogaJustify.FLEX_START);
          break;
        }
      case "center":
        {
          setJustifyContent(YogaJustify.CENTER);
          break;
        }
      case "flex-end":
        {
          setJustifyContent(YogaJustify.FLEX_END);
          break;
        }
      case "space-between":
        {
          setJustifyContent(YogaJustify.SPACE_BETWEEN);
          break;
        }
      case "space-around":
        {
          setJustifyContent(YogaJustify.SPACE_AROUND);
          break;
        }
      case "space-evenly":
        {
          setJustifyContent(YogaJustify.SPACE_EVENLY);
          break;
        }
      default:
        {
          FLog.w(ReactConstants.TAG, "invalid value for justifyContent: " + justifyContent);
          setJustifyContent(YogaJustify.FLEX_START);
          break;
        }
    }
  }

  @ReactProp(name = ViewProps.OVERFLOW)
  public void setOverflow(@Nullable String overflow) {
    if (isVirtual()) {
      return;
    }
    if (overflow == null) {
      setOverflow(YogaOverflow.VISIBLE);
      return;
    }

    switch (overflow) {
      case "visible":
        {
          setOverflow(YogaOverflow.VISIBLE);
          break;
        }
      case "hidden":
        {
          setOverflow(YogaOverflow.HIDDEN);
          break;
        }
      case "scroll":
        {
          setOverflow(YogaOverflow.SCROLL);
          break;
        }
      default:
        {
          FLog.w(ReactConstants.TAG, "invalid value for overflow: " + overflow);
          setOverflow(YogaOverflow.VISIBLE);
          break;
        }
    }
  }

  @ReactProp(name = ViewProps.DISPLAY)
  public void setDisplay(@Nullable String display) {
    if (isVirtual()) {
      return;
    }

    if (display == null) {
      setDisplay(YogaDisplay.FLEX);
      return;
    }

    switch (display) {
      case "flex":
        {
          setDisplay(YogaDisplay.FLEX);
          break;
        }
      case "none":
        {
          setDisplay(YogaDisplay.NONE);
          break;
        }
      default:
        {
          FLog.w(ReactConstants.TAG, "invalid value for display: " + display);
          setDisplay(YogaDisplay.FLEX);
          break;
        }
    }
  }

  @ReactPropGroup(
      names = {
        ViewProps.MARGIN,
        ViewProps.MARGIN_VERTICAL,
        ViewProps.MARGIN_HORIZONTAL,
        ViewProps.MARGIN_START,
        ViewProps.MARGIN_END,
        ViewProps.MARGIN_TOP,
        ViewProps.MARGIN_BOTTOM,
        ViewProps.MARGIN_LEFT,
        ViewProps.MARGIN_RIGHT,
      })
  public void setMargins(int index, Dynamic margin) {
    if (isVirtual()) {
      return;
    }

    int spacingType =
        maybeTransformLeftRightToStartEnd(ViewProps.PADDING_MARGIN_SPACING_TYPES[index]);

    mTempYogaValue.setFromDynamic(margin);
    switch (mTempYogaValue.unit) {
      case POINT:
      case UNDEFINED:
        setMargin(spacingType, mTempYogaValue.value);
        break;
      case AUTO:
        setMarginAuto(spacingType);
        break;
      case PERCENT:
        setMarginPercent(spacingType, mTempYogaValue.value);
        break;
    }

    margin.recycle();
  }

  @ReactPropGroup(
      names = {
        ViewProps.PADDING,
        ViewProps.PADDING_VERTICAL,
        ViewProps.PADDING_HORIZONTAL,
        ViewProps.PADDING_START,
        ViewProps.PADDING_END,
        ViewProps.PADDING_TOP,
        ViewProps.PADDING_BOTTOM,
        ViewProps.PADDING_LEFT,
        ViewProps.PADDING_RIGHT,
      })
  public void setPaddings(int index, Dynamic padding) {
    if (isVirtual()) {
      return;
    }

    int spacingType =
        maybeTransformLeftRightToStartEnd(ViewProps.PADDING_MARGIN_SPACING_TYPES[index]);

    mTempYogaValue.setFromDynamic(padding);
    switch (mTempYogaValue.unit) {
      case POINT:
      case UNDEFINED:
        setPadding(spacingType, mTempYogaValue.value);
        break;
      case PERCENT:
        setPaddingPercent(spacingType, mTempYogaValue.value);
        break;
    }

    padding.recycle();
  }

  @ReactPropGroup(
      names = {
        ViewProps.BORDER_WIDTH,
        ViewProps.BORDER_START_WIDTH,
        ViewProps.BORDER_END_WIDTH,
        ViewProps.BORDER_TOP_WIDTH,
        ViewProps.BORDER_BOTTOM_WIDTH,
        ViewProps.BORDER_LEFT_WIDTH,
        ViewProps.BORDER_RIGHT_WIDTH,
      },
      defaultFloat = YogaConstants.UNDEFINED)
  public void setBorderWidths(int index, float borderWidth) {
    if (isVirtual()) {
      return;
    }
    int spacingType = maybeTransformLeftRightToStartEnd(ViewProps.BORDER_SPACING_TYPES[index]);
    setBorder(spacingType, PixelUtil.toPixelFromDIP(borderWidth));
  }

  @ReactPropGroup(
      names = {
        ViewProps.START,
        ViewProps.END,
        ViewProps.LEFT,
        ViewProps.RIGHT,
        ViewProps.TOP,
        ViewProps.BOTTOM,
      })
  public void setPositionValues(int index, Dynamic position) {
    if (isVirtual()) {
      return;
    }

    final int[] POSITION_SPACING_TYPES = {
      Spacing.START, Spacing.END, Spacing.LEFT, Spacing.RIGHT, Spacing.TOP, Spacing.BOTTOM
    };

    int spacingType = maybeTransformLeftRightToStartEnd(POSITION_SPACING_TYPES[index]);

    mTempYogaValue.setFromDynamic(position);
    switch (mTempYogaValue.unit) {
      case POINT:
      case UNDEFINED:
        setPosition(spacingType, mTempYogaValue.value);
        break;
      case PERCENT:
        setPositionPercent(spacingType, mTempYogaValue.value);
        break;
    }

    position.recycle();
  }

  private int maybeTransformLeftRightToStartEnd(int spacingType) {
    if (!I18nUtil.getInstance().doLeftAndRightSwapInRTL(getThemedContext())) {
      return spacingType;
    }

    switch (spacingType) {
      case Spacing.LEFT:
        return Spacing.START;
      case Spacing.RIGHT:
        return Spacing.END;
      default:
        return spacingType;
    }
  }

  @ReactProp(name = ViewProps.POSITION)
  public void setPosition(@Nullable String position) {
    if (isVirtual()) {
      return;
    }

    if (position == null) {
      setPositionType(YogaPositionType.RELATIVE);
      return;
    }

    switch (position) {
      case "static":
        {
          setPositionType(YogaPositionType.STATIC);
          break;
        }
      case "relative":
        {
          setPositionType(YogaPositionType.RELATIVE);
          break;
        }
      case "absolute":
        {
          setPositionType(YogaPositionType.ABSOLUTE);
          break;
        }
      default:
        {
          FLog.w(ReactConstants.TAG, "invalid value for position: " + position);
          setPositionType(YogaPositionType.RELATIVE);
          break;
        }
    }
  }

  @Override
  @ReactProp(name = "onLayout")
  public void setShouldNotifyOnLayout(boolean shouldNotifyOnLayout) {
    super.setShouldNotifyOnLayout(shouldNotifyOnLayout);
  }

  @ReactProp(name = "onPointerEnter")
  public void setShouldNotifyPointerEnter(boolean value) {
    // This method exists to inject Native View configs in RN Android VR
    // DO NOTHING
  }

  @ReactProp(name = "onPointerLeave")
  public void setShouldNotifyPointerLeave(boolean value) {
    // This method exists to inject Native View configs in RN Android VR
    // DO NOTHING
  }

  @ReactProp(name = "onPointerMove")
  public void setShouldNotifyPointerMove(boolean value) {
    // This method exists to inject Native View configs in RN Android VR
    // DO NOTHING
  }
}
