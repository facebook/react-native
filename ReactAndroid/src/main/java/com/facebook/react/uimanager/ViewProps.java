/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.graphics.Color;
import com.facebook.react.bridge.ReadableMap;
import java.util.Arrays;
import java.util.HashSet;

/**
 * Keys for props that need to be shared across multiple classes.
 */
public class ViewProps {

  public static final String VIEW_CLASS_NAME = "RCTView";

  // Layout only (only affect positions of children, causes no drawing)
  // !!! Keep in sync with LAYOUT_ONLY_PROPS below
  public static final String ALIGN_ITEMS = "alignItems";
  public static final String ALIGN_SELF = "alignSelf";
  public static final String ALIGN_CONTENT = "alignContent";
  public static final String OVERFLOW = "overflow";
  public static final String DISPLAY = "display";
  public static final String BOTTOM = "bottom";
  public static final String COLLAPSABLE = "collapsable";
  public static final String FLEX = "flex";
  public static final String FLEX_GROW = "flexGrow";
  public static final String FLEX_SHRINK = "flexShrink";
  public static final String FLEX_BASIS = "flexBasis";
  public static final String FLEX_DIRECTION = "flexDirection";
  public static final String FLEX_WRAP = "flexWrap";
  public static final String HEIGHT = "height";
  public static final String JUSTIFY_CONTENT = "justifyContent";
  public static final String LEFT = "left";

  public static final String MARGIN = "margin";
  public static final String MARGIN_VERTICAL = "marginVertical";
  public static final String MARGIN_HORIZONTAL = "marginHorizontal";
  public static final String MARGIN_LEFT = "marginLeft";
  public static final String MARGIN_RIGHT = "marginRight";
  public static final String MARGIN_TOP = "marginTop";
  public static final String MARGIN_BOTTOM = "marginBottom";
  public static final String MARGIN_START = "marginStart";
  public static final String MARGIN_END = "marginEnd";

  public static final String PADDING = "padding";
  public static final String PADDING_VERTICAL = "paddingVertical";
  public static final String PADDING_HORIZONTAL = "paddingHorizontal";
  public static final String PADDING_LEFT = "paddingLeft";
  public static final String PADDING_RIGHT = "paddingRight";
  public static final String PADDING_TOP = "paddingTop";
  public static final String PADDING_BOTTOM = "paddingBottom";
  public static final String PADDING_START = "paddingStart";
  public static final String PADDING_END = "paddingEnd";

  public static final String POSITION = "position";
  public static final String RIGHT = "right";
  public static final String TOP = "top";
  public static final String WIDTH = "width";
  public static final String START = "start";
  public static final String END = "end";

  public static final String AUTO = "auto";
  public static final String NONE = "none";
  public static final String BOX_NONE = "box-none";

  public static final String MIN_WIDTH = "minWidth";
  public static final String MAX_WIDTH = "maxWidth";
  public static final String MIN_HEIGHT = "minHeight";
  public static final String MAX_HEIGHT = "maxHeight";

  public static final String ASPECT_RATIO = "aspectRatio";

  // Props that sometimes may prevent us from collapsing views
  public static final String POINTER_EVENTS = "pointerEvents";

  // Props that affect more than just layout
  public static final String ENABLED = "enabled";
  public static final String BACKGROUND_COLOR = "backgroundColor";
  public static final String COLOR = "color";
  public static final String FONT_SIZE = "fontSize";
  public static final String FONT_WEIGHT = "fontWeight";
  public static final String FONT_STYLE = "fontStyle";
  public static final String FONT_FAMILY = "fontFamily";
  public static final String LINE_HEIGHT = "lineHeight";
  public static final String NEEDS_OFFSCREEN_ALPHA_COMPOSITING = "needsOffscreenAlphaCompositing";
  public static final String NUMBER_OF_LINES = "numberOfLines";
  public static final String ELLIPSIZE_MODE = "ellipsizeMode";
  public static final String ON = "on";
  public static final String RESIZE_MODE = "resizeMode";
  public static final String RESIZE_METHOD = "resizeMethod";
  public static final String TEXT_ALIGN = "textAlign";
  public static final String TEXT_ALIGN_VERTICAL = "textAlignVertical";
  public static final String TEXT_DECORATION_LINE = "textDecorationLine";
  public static final String TEXT_BREAK_STRATEGY = "textBreakStrategy";
  public static final String OPACITY = "opacity";

  public static final String ALLOW_FONT_SCALING = "allowFontScaling";
  public static final String INCLUDE_FONT_PADDING = "includeFontPadding";

  public static final String BORDER_WIDTH = "borderWidth";
  public static final String BORDER_LEFT_WIDTH = "borderLeftWidth";
  public static final String BORDER_START_WIDTH = "borderStartWidth";
  public static final String BORDER_END_WIDTH = "borderEndWidth";
  public static final String BORDER_TOP_WIDTH = "borderTopWidth";
  public static final String BORDER_RIGHT_WIDTH = "borderRightWidth";
  public static final String BORDER_BOTTOM_WIDTH = "borderBottomWidth";
  public static final String BORDER_RADIUS = "borderRadius";
  public static final String BORDER_TOP_LEFT_RADIUS = "borderTopLeftRadius";
  public static final String BORDER_TOP_RIGHT_RADIUS = "borderTopRightRadius";
  public static final String BORDER_BOTTOM_LEFT_RADIUS = "borderBottomLeftRadius";
  public static final String BORDER_BOTTOM_RIGHT_RADIUS = "borderBottomRightRadius";
  public static final String BORDER_COLOR = "borderColor";
  public static final String BORDER_LEFT_COLOR = "borderLeftColor";
  public static final String BORDER_RIGHT_COLOR = "borderRightColor";
  public static final String BORDER_TOP_COLOR = "borderTopColor";
  public static final String BORDER_BOTTOM_COLOR = "borderBottomColor";
  public static final String BORDER_TOP_START_RADIUS = "borderTopStartRadius";
  public static final String BORDER_TOP_END_RADIUS = "borderTopEndRadius";
  public static final String BORDER_BOTTOM_START_RADIUS = "borderBottomStartRadius";
  public static final String BORDER_BOTTOM_END_RADIUS = "borderBottomEndRadius";
  public static final String BORDER_START_COLOR = "borderStartColor";
  public static final String BORDER_END_COLOR = "borderEndColor";
  public static final String ON_LAYOUT = "onLayout";

  public static final int[] BORDER_SPACING_TYPES = {
    Spacing.ALL,
    Spacing.START,
    Spacing.END,
    Spacing.TOP,
    Spacing.BOTTOM,
    Spacing.LEFT,
    Spacing.RIGHT
  };
  public static final int[] PADDING_MARGIN_SPACING_TYPES = {
    Spacing.ALL,
    Spacing.VERTICAL,
    Spacing.HORIZONTAL,
    Spacing.START,
    Spacing.END,
    Spacing.TOP,
    Spacing.BOTTOM,
    Spacing.LEFT,
    Spacing.RIGHT,
  };
  public static final int[] POSITION_SPACING_TYPES = {
    Spacing.START, Spacing.END, Spacing.TOP, Spacing.BOTTOM
  };

  private static final HashSet<String> LAYOUT_ONLY_PROPS =
      new HashSet<>(
          Arrays.asList(
              ALIGN_SELF,
              ALIGN_ITEMS,
              COLLAPSABLE,
              FLEX,
              FLEX_BASIS,
              FLEX_DIRECTION,
              FLEX_GROW,
              FLEX_SHRINK,
              FLEX_WRAP,
              JUSTIFY_CONTENT,
              OVERFLOW,
              ALIGN_CONTENT,
              DISPLAY,

              /* position */
              POSITION,
              RIGHT,
              TOP,
              BOTTOM,
              LEFT,
              START,
              END,

              /* dimensions */
              WIDTH,
              HEIGHT,
              MIN_WIDTH,
              MAX_WIDTH,
              MIN_HEIGHT,
              MAX_HEIGHT,

              /* margins */
              MARGIN,
              MARGIN_VERTICAL,
              MARGIN_HORIZONTAL,
              MARGIN_LEFT,
              MARGIN_RIGHT,
              MARGIN_TOP,
              MARGIN_BOTTOM,
              MARGIN_START,
              MARGIN_END,

              /* paddings */
              PADDING,
              PADDING_VERTICAL,
              PADDING_HORIZONTAL,
              PADDING_LEFT,
              PADDING_RIGHT,
              PADDING_TOP,
              PADDING_BOTTOM,
              PADDING_START,
              PADDING_END));

  public static boolean sIsOptimizationsEnabled;

  public static boolean isLayoutOnly(ReadableMap map, String prop) {
    if (LAYOUT_ONLY_PROPS.contains(prop)) {
      return true;
    } else if (POINTER_EVENTS.equals(prop)) {
      String value = map.getString(prop);
      return AUTO.equals(value) || BOX_NONE.equals(value);
    }


    if (sIsOptimizationsEnabled) {
      switch (prop) {
        case OPACITY:
          // null opacity behaves like opacity = 1
          // Ignore if explicitly set to default opacity.
          return map.isNull(OPACITY) || map.getDouble(OPACITY) == 1d;
        case BORDER_RADIUS: // Without a background color or border width set, a border won't show.
          if (map.hasKey(BACKGROUND_COLOR) && map.getInt(BACKGROUND_COLOR) != Color.TRANSPARENT) {
            return false;
          }
          if (map.hasKey(BORDER_WIDTH)
            && !map.isNull(BORDER_WIDTH)
            && map.getDouble(BORDER_WIDTH) != 0d) {
            return false;
          }
          return true;
        case BORDER_LEFT_COLOR:
          return map.getInt(BORDER_LEFT_COLOR) == Color.TRANSPARENT;
        case BORDER_RIGHT_COLOR:
          return map.getInt(BORDER_RIGHT_COLOR) == Color.TRANSPARENT;
        case BORDER_TOP_COLOR:
          return map.getInt(BORDER_TOP_COLOR) == Color.TRANSPARENT;
        case BORDER_BOTTOM_COLOR:
          return map.getInt(BORDER_BOTTOM_COLOR) == Color.TRANSPARENT;
        case BORDER_WIDTH:
          return map.isNull(BORDER_WIDTH) || map.getDouble(BORDER_WIDTH) == 0d;
        case BORDER_LEFT_WIDTH:
          return map.isNull(BORDER_LEFT_WIDTH) || map.getDouble(BORDER_LEFT_WIDTH) == 0d;
        case BORDER_TOP_WIDTH:
          return map.isNull(BORDER_TOP_WIDTH) || map.getDouble(BORDER_TOP_WIDTH) == 0d;
        case BORDER_RIGHT_WIDTH:
          return map.isNull(BORDER_RIGHT_WIDTH) || map.getDouble(BORDER_RIGHT_WIDTH) == 0d;
        case BORDER_BOTTOM_WIDTH:
          return map.isNull(BORDER_BOTTOM_WIDTH) || map.getDouble(BORDER_BOTTOM_WIDTH) == 0d;
        case ON_LAYOUT:
          return true;
        case OVERFLOW: // We do nothing with this right now.
          return true;
        default:
          return false;
      }
    }
    return false;
  }
}
