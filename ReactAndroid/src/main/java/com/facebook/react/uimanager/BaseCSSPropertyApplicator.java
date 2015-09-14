/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import java.util.Locale;

import com.facebook.csslayout.CSSAlign;
import com.facebook.csslayout.CSSConstants;
import com.facebook.csslayout.CSSFlexDirection;
import com.facebook.csslayout.CSSJustify;
import com.facebook.csslayout.CSSNode;
import com.facebook.csslayout.CSSPositionType;
import com.facebook.csslayout.CSSWrap;
import com.facebook.csslayout.Spacing;

/**
 * Takes common style properties from JS and applies them to a given {@link CSSNode}.
 */
public class BaseCSSPropertyApplicator {

  private static final String PROP_ON_LAYOUT = "onLayout";

  /**
   * Takes the base props from updateView/manageChildren and applies any CSS styles (if they exist)
   * to the given {@link CSSNode}.
   *
   * TODO(5241893): Add and test border CSS attributes
   */
  public static void applyCSSProperties(ReactShadowNode cssNode, CatalystStylesDiffMap props) {
    if (props.hasKey(ViewProps.WIDTH)) {
      float width = props.getFloat(ViewProps.WIDTH, CSSConstants.UNDEFINED);
      cssNode.setStyleWidth(CSSConstants.isUndefined(width) ?
          width : PixelUtil.toPixelFromDIP(width));
    }

    if (props.hasKey(ViewProps.HEIGHT)) {
      float height = props.getFloat(ViewProps.HEIGHT, CSSConstants.UNDEFINED);
      cssNode.setStyleHeight(CSSConstants.isUndefined(height) ?
          height : PixelUtil.toPixelFromDIP(height));
    }

    if (props.hasKey(ViewProps.LEFT)) {
      float left = props.getFloat(ViewProps.LEFT, CSSConstants.UNDEFINED);
      cssNode.setPositionLeft(CSSConstants.isUndefined(left) ?
          left : PixelUtil.toPixelFromDIP(left));
    }

    if (props.hasKey(ViewProps.TOP)) {
      float top = props.getFloat(ViewProps.TOP, CSSConstants.UNDEFINED);
      cssNode.setPositionTop(CSSConstants.isUndefined(top) ?
          top : PixelUtil.toPixelFromDIP(top));
    }

    if (props.hasKey(ViewProps.BOTTOM)) {
      float bottom = props.getFloat(ViewProps.BOTTOM, CSSConstants.UNDEFINED);
      cssNode.setPositionBottom(CSSConstants.isUndefined(bottom) ?
          bottom : PixelUtil.toPixelFromDIP(bottom));
    }

    if (props.hasKey(ViewProps.RIGHT)) {
      float right = props.getFloat(ViewProps.RIGHT, CSSConstants.UNDEFINED);
      cssNode.setPositionRight(CSSConstants.isUndefined(right) ?
          right : PixelUtil.toPixelFromDIP(right));
    }

    if (props.hasKey(ViewProps.FLEX)) {
      cssNode.setFlex(props.getFloat(ViewProps.FLEX, 0.f));
    }

    if (props.hasKey(ViewProps.FLEX_DIRECTION)) {
      String flexDirectionString = props.getString(ViewProps.FLEX_DIRECTION);
      cssNode.setFlexDirection(flexDirectionString == null ?
          CSSFlexDirection.COLUMN : CSSFlexDirection.valueOf(
              flexDirectionString.toUpperCase(Locale.US)));
    }

    if (props.hasKey(ViewProps.FLEX_WRAP)) {
      String flexWrapString = props.getString(ViewProps.FLEX_WRAP);
      cssNode.setWrap(flexWrapString == null ?
          CSSWrap.NOWRAP : CSSWrap.valueOf(flexWrapString.toUpperCase(Locale.US)));
    }

    if (props.hasKey(ViewProps.ALIGN_SELF)) {
      String alignSelfString = props.getString(ViewProps.ALIGN_SELF);
      cssNode.setAlignSelf(alignSelfString == null ?
          CSSAlign.AUTO : CSSAlign.valueOf(
              alignSelfString.toUpperCase(Locale.US).replace("-", "_")));
    }

    if (props.hasKey(ViewProps.ALIGN_ITEMS)) {
      String alignItemsString = props.getString(ViewProps.ALIGN_ITEMS);
      cssNode.setAlignItems(alignItemsString == null ?
          CSSAlign.STRETCH : CSSAlign.valueOf(
              alignItemsString.toUpperCase(Locale.US).replace("-", "_")));
    }

    if (props.hasKey(ViewProps.JUSTIFY_CONTENT)) {
      String justifyContentString = props.getString(ViewProps.JUSTIFY_CONTENT);
      cssNode.setJustifyContent(justifyContentString == null ? CSSJustify.FLEX_START
          : CSSJustify.valueOf(justifyContentString.toUpperCase(Locale.US).replace("-", "_")));
    }

    for (int i = 0; i < ViewProps.MARGINS.length; i++) {
      if (props.hasKey(ViewProps.MARGINS[i])) {
        cssNode.setMargin(
            ViewProps.PADDING_MARGIN_SPACING_TYPES[i],
            PixelUtil.toPixelFromDIP(props.getFloat(ViewProps.MARGINS[i], 0.f)));
      }
    }

    for (int i = 0; i < ViewProps.PADDINGS.length; i++) {
      if (props.hasKey(ViewProps.PADDINGS[i])) {
        float value = props.getFloat(ViewProps.PADDINGS[i], CSSConstants.UNDEFINED);
        cssNode.setPadding(
            ViewProps.PADDING_MARGIN_SPACING_TYPES[i],
            CSSConstants.isUndefined(value) ? value : PixelUtil.toPixelFromDIP(value));
      }
    }

    for (int i = 0; i < ViewProps.BORDER_WIDTHS.length; i++) {
      if (props.hasKey(ViewProps.BORDER_WIDTHS[i])) {
        cssNode.setBorder(
            ViewProps.BORDER_SPACING_TYPES[i],
            PixelUtil.toPixelFromDIP(props.getFloat(ViewProps.BORDER_WIDTHS[i], 0.f)));
      }
    }

    if (props.hasKey(ViewProps.POSITION)) {
      String positionString = props.getString(ViewProps.POSITION);
      CSSPositionType positionType = positionString == null ?
          CSSPositionType.RELATIVE : CSSPositionType.valueOf(positionString.toUpperCase(Locale.US));
      cssNode.setPositionType(positionType);
    }

    if (props.hasKey(PROP_ON_LAYOUT)) {
      cssNode.setShouldNotifyOnLayout(props.getBoolean(PROP_ON_LAYOUT, false));
    }
  }
}
