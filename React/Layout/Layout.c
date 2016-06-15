/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// NOTE: this file is auto-copied from https://github.com/facebook/css-layout
// @generated SignedSource<<0c8bd7e17fc12884003809cf282b0988>>


#include <assert.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// in concatenated header, don't include Layout.h it's already at the top
#ifndef CSS_LAYOUT_IMPLEMENTATION
#include "Layout.h"
#endif

#ifdef _MSC_VER
#include <float.h>
#define isnan _isnan

/* define fmaxf if < VC12 */
#if _MSC_VER < 1800
__forceinline const float fmaxf(const float a, const float b) {
  return (a > b) ? a : b;
}
#endif
#endif

#define POSITIVE_FLEX_IS_AUTO 0

int gCurrentGenerationCount = 0;

bool layoutNodeInternal(css_node_t* node, float availableWidth, float availableHeight, css_direction_t parentDirection,
  css_measure_mode_t widthMeasureMode, css_measure_mode_t heightMeasureMode, bool performLayout, char* reason);

bool isUndefined(float value) {
  return isnan(value);
}

static bool eq(float a, float b) {
  if (isUndefined(a)) {
    return isUndefined(b);
  }
  return fabs(a - b) < 0.0001;
}

void init_css_node(css_node_t* node) {
  node->style.align_items = CSS_ALIGN_STRETCH;
  node->style.align_content = CSS_ALIGN_FLEX_START;

  node->style.direction = CSS_DIRECTION_INHERIT;
  node->style.flex_direction = CSS_FLEX_DIRECTION_COLUMN;

  node->style.overflow = CSS_OVERFLOW_VISIBLE;

  // Some of the fields default to undefined and not 0
  node->style.dimensions[CSS_WIDTH] = CSS_UNDEFINED;
  node->style.dimensions[CSS_HEIGHT] = CSS_UNDEFINED;

  node->style.minDimensions[CSS_WIDTH] = CSS_UNDEFINED;
  node->style.minDimensions[CSS_HEIGHT] = CSS_UNDEFINED;

  node->style.maxDimensions[CSS_WIDTH] = CSS_UNDEFINED;
  node->style.maxDimensions[CSS_HEIGHT] = CSS_UNDEFINED;

  node->style.position[CSS_LEFT] = CSS_UNDEFINED;
  node->style.position[CSS_TOP] = CSS_UNDEFINED;
  node->style.position[CSS_RIGHT] = CSS_UNDEFINED;
  node->style.position[CSS_BOTTOM] = CSS_UNDEFINED;

  node->style.margin[CSS_START] = CSS_UNDEFINED;
  node->style.margin[CSS_END] = CSS_UNDEFINED;
  node->style.padding[CSS_START] = CSS_UNDEFINED;
  node->style.padding[CSS_END] = CSS_UNDEFINED;
  node->style.border[CSS_START] = CSS_UNDEFINED;
  node->style.border[CSS_END] = CSS_UNDEFINED;

  node->layout.dimensions[CSS_WIDTH] = CSS_UNDEFINED;
  node->layout.dimensions[CSS_HEIGHT] = CSS_UNDEFINED;

  // Such that the comparison is always going to be false
  node->layout.last_parent_direction = (css_direction_t)-1;
  node->layout.should_update = true;
  node->layout.next_cached_measurements_index = 0;

  node->layout.measured_dimensions[CSS_WIDTH] = CSS_UNDEFINED;
  node->layout.measured_dimensions[CSS_HEIGHT] = CSS_UNDEFINED;
  node->layout.cached_layout.width_measure_mode = (css_measure_mode_t)-1;
  node->layout.cached_layout.height_measure_mode = (css_measure_mode_t)-1;
}

css_node_t* new_css_node() {
  css_node_t* node = (css_node_t*)calloc(1, sizeof(*node));
  init_css_node(node);
  return node;
}

void free_css_node(css_node_t* node) {
  free(node);
}

static void indent(int n) {
  for (int i = 0; i < n; ++i) {
    printf("  ");
  }
}

static void print_number_0(const char* str, float number) {
  if (!eq(number, 0)) {
    printf("%s: %g, ", str, number);
  }
}

static void print_number_nan(const char* str, float number) {
  if (!isnan(number)) {
    printf("%s: %g, ", str, number);
  }
}

static bool four_equal(float four[4]) {
  return
    eq(four[0], four[1]) &&
    eq(four[0], four[2]) &&
    eq(four[0], four[3]);
}


static void print_css_node_rec(
  css_node_t* node,
  css_print_options_t options,
  int level
) {
  indent(level);
  printf("{");

  if (node->print) {
    node->print(node->context);
  }

  if (options & CSS_PRINT_LAYOUT) {
    printf("layout: {");
    printf("width: %g, ", node->layout.dimensions[CSS_WIDTH]);
    printf("height: %g, ", node->layout.dimensions[CSS_HEIGHT]);
    printf("top: %g, ", node->layout.position[CSS_TOP]);
    printf("left: %g", node->layout.position[CSS_LEFT]);
    printf("}, ");
  }

  if (options & CSS_PRINT_STYLE) {
    if (node->style.flex_direction == CSS_FLEX_DIRECTION_COLUMN) {
      printf("flexDirection: 'column', ");
    } else if (node->style.flex_direction == CSS_FLEX_DIRECTION_COLUMN_REVERSE) {
      printf("flexDirection: 'column-reverse', ");
    } else if (node->style.flex_direction == CSS_FLEX_DIRECTION_ROW) {
      printf("flexDirection: 'row', ");
    } else if (node->style.flex_direction == CSS_FLEX_DIRECTION_ROW_REVERSE) {
      printf("flexDirection: 'row-reverse', ");
    }

    if (node->style.justify_content == CSS_JUSTIFY_CENTER) {
      printf("justifyContent: 'center', ");
    } else if (node->style.justify_content == CSS_JUSTIFY_FLEX_END) {
      printf("justifyContent: 'flex-end', ");
    } else if (node->style.justify_content == CSS_JUSTIFY_SPACE_AROUND) {
      printf("justifyContent: 'space-around', ");
    } else if (node->style.justify_content == CSS_JUSTIFY_SPACE_BETWEEN) {
      printf("justifyContent: 'space-between', ");
    }

    if (node->style.align_items == CSS_ALIGN_CENTER) {
      printf("alignItems: 'center', ");
    } else if (node->style.align_items == CSS_ALIGN_FLEX_END) {
      printf("alignItems: 'flex-end', ");
    } else if (node->style.align_items == CSS_ALIGN_STRETCH) {
      printf("alignItems: 'stretch', ");
    }

    if (node->style.align_content == CSS_ALIGN_CENTER) {
      printf("alignContent: 'center', ");
    } else if (node->style.align_content == CSS_ALIGN_FLEX_END) {
      printf("alignContent: 'flex-end', ");
    } else if (node->style.align_content == CSS_ALIGN_STRETCH) {
      printf("alignContent: 'stretch', ");
    }

    if (node->style.align_self == CSS_ALIGN_FLEX_START) {
      printf("alignSelf: 'flex-start', ");
    } else if (node->style.align_self == CSS_ALIGN_CENTER) {
      printf("alignSelf: 'center', ");
    } else if (node->style.align_self == CSS_ALIGN_FLEX_END) {
      printf("alignSelf: 'flex-end', ");
    } else if (node->style.align_self == CSS_ALIGN_STRETCH) {
      printf("alignSelf: 'stretch', ");
    }

    print_number_nan("flex", node->style.flex);

    if (node->style.overflow == CSS_OVERFLOW_HIDDEN) {
      printf("overflow: 'hidden', ");
    } else if (node->style.overflow == CSS_OVERFLOW_VISIBLE) {
      printf("overflow: 'visible', ");
    }

    if (four_equal(node->style.margin)) {
      print_number_0("margin", node->style.margin[CSS_LEFT]);
    } else {
      print_number_0("marginLeft", node->style.margin[CSS_LEFT]);
      print_number_0("marginRight", node->style.margin[CSS_RIGHT]);
      print_number_0("marginTop", node->style.margin[CSS_TOP]);
      print_number_0("marginBottom", node->style.margin[CSS_BOTTOM]);
      print_number_0("marginStart", node->style.margin[CSS_START]);
      print_number_0("marginEnd", node->style.margin[CSS_END]);
    }

    if (four_equal(node->style.padding)) {
      print_number_0("padding", node->style.padding[CSS_LEFT]);
    } else {
      print_number_0("paddingLeft", node->style.padding[CSS_LEFT]);
      print_number_0("paddingRight", node->style.padding[CSS_RIGHT]);
      print_number_0("paddingTop", node->style.padding[CSS_TOP]);
      print_number_0("paddingBottom", node->style.padding[CSS_BOTTOM]);
      print_number_0("paddingStart", node->style.padding[CSS_START]);
      print_number_0("paddingEnd", node->style.padding[CSS_END]);
    }

    if (four_equal(node->style.border)) {
      print_number_0("borderWidth", node->style.border[CSS_LEFT]);
    } else {
      print_number_0("borderLeftWidth", node->style.border[CSS_LEFT]);
      print_number_0("borderRightWidth", node->style.border[CSS_RIGHT]);
      print_number_0("borderTopWidth", node->style.border[CSS_TOP]);
      print_number_0("borderBottomWidth", node->style.border[CSS_BOTTOM]);
      print_number_0("borderStartWidth", node->style.border[CSS_START]);
      print_number_0("borderEndWidth", node->style.border[CSS_END]);
    }

    print_number_nan("width", node->style.dimensions[CSS_WIDTH]);
    print_number_nan("height", node->style.dimensions[CSS_HEIGHT]);
    print_number_nan("maxWidth", node->style.maxDimensions[CSS_WIDTH]);
    print_number_nan("maxHeight", node->style.maxDimensions[CSS_HEIGHT]);
    print_number_nan("minWidth", node->style.minDimensions[CSS_WIDTH]);
    print_number_nan("minHeight", node->style.minDimensions[CSS_HEIGHT]);

    if (node->style.position_type == CSS_POSITION_ABSOLUTE) {
      printf("position: 'absolute', ");
    }

    print_number_nan("left", node->style.position[CSS_LEFT]);
    print_number_nan("right", node->style.position[CSS_RIGHT]);
    print_number_nan("top", node->style.position[CSS_TOP]);
    print_number_nan("bottom", node->style.position[CSS_BOTTOM]);
  }

  if (options & CSS_PRINT_CHILDREN && node->children_count > 0) {
    printf("children: [\n");
    for (int i = 0; i < node->children_count; ++i) {
      print_css_node_rec(node->get_child(node->context, i), options, level + 1);
    }
    indent(level);
    printf("]},\n");
  } else {
    printf("},\n");
  }
}

void print_css_node(css_node_t* node, css_print_options_t options) {
  print_css_node_rec(node, options, 0);
}

static css_position_t leading[4] = {
  /* CSS_FLEX_DIRECTION_COLUMN = */ CSS_TOP,
  /* CSS_FLEX_DIRECTION_COLUMN_REVERSE = */ CSS_BOTTOM,
  /* CSS_FLEX_DIRECTION_ROW = */ CSS_LEFT,
  /* CSS_FLEX_DIRECTION_ROW_REVERSE = */ CSS_RIGHT
};
static css_position_t trailing[4] = {
  /* CSS_FLEX_DIRECTION_COLUMN = */ CSS_BOTTOM,
  /* CSS_FLEX_DIRECTION_COLUMN_REVERSE = */ CSS_TOP,
  /* CSS_FLEX_DIRECTION_ROW = */ CSS_RIGHT,
  /* CSS_FLEX_DIRECTION_ROW_REVERSE = */ CSS_LEFT
};
static css_position_t pos[4] = {
  /* CSS_FLEX_DIRECTION_COLUMN = */ CSS_TOP,
  /* CSS_FLEX_DIRECTION_COLUMN_REVERSE = */ CSS_BOTTOM,
  /* CSS_FLEX_DIRECTION_ROW = */ CSS_LEFT,
  /* CSS_FLEX_DIRECTION_ROW_REVERSE = */ CSS_RIGHT
};
static css_dimension_t dim[4] = {
  /* CSS_FLEX_DIRECTION_COLUMN = */ CSS_HEIGHT,
  /* CSS_FLEX_DIRECTION_COLUMN_REVERSE = */ CSS_HEIGHT,
  /* CSS_FLEX_DIRECTION_ROW = */ CSS_WIDTH,
  /* CSS_FLEX_DIRECTION_ROW_REVERSE = */ CSS_WIDTH
};

static bool isRowDirection(css_flex_direction_t flex_direction) {
  return flex_direction == CSS_FLEX_DIRECTION_ROW ||
         flex_direction == CSS_FLEX_DIRECTION_ROW_REVERSE;
}

static bool isColumnDirection(css_flex_direction_t flex_direction) {
  return flex_direction == CSS_FLEX_DIRECTION_COLUMN ||
         flex_direction == CSS_FLEX_DIRECTION_COLUMN_REVERSE;
}

static bool isFlexBasisAuto(css_node_t* node) {
#if POSITIVE_FLEX_IS_AUTO
  // All flex values are auto.
  (void) node;
  return true;
#else
  // A flex value > 0 implies a basis of zero.
  return node->style.flex <= 0;
#endif
}

static float getFlexGrowFactor(css_node_t* node) {
  // Flex grow is implied by positive values for flex.
  if (node->style.flex > 0) {
    return node->style.flex;
  }
  return 0;
}

static float getFlexShrinkFactor(css_node_t* node) {
#if POSITIVE_FLEX_IS_AUTO
  // A flex shrink factor of 1 is implied by non-zero values for flex.
  if (node->style.flex != 0) {
    return 1;
  }
#else
  // A flex shrink factor of 1 is implied by negative values for flex.
  if (node->style.flex < 0) {
    return 1;
  }
#endif
  return 0;
}

static float getLeadingMargin(css_node_t* node, css_flex_direction_t axis) {
  if (isRowDirection(axis) && !isUndefined(node->style.margin[CSS_START])) {
    return node->style.margin[CSS_START];
  }

  return node->style.margin[leading[axis]];
}

static float getTrailingMargin(css_node_t* node, css_flex_direction_t axis) {
  if (isRowDirection(axis) && !isUndefined(node->style.margin[CSS_END])) {
    return node->style.margin[CSS_END];
  }

  return node->style.margin[trailing[axis]];
}

static float getLeadingPadding(css_node_t* node, css_flex_direction_t axis) {
  if (isRowDirection(axis) &&
      !isUndefined(node->style.padding[CSS_START]) &&
      node->style.padding[CSS_START] >= 0) {
    return node->style.padding[CSS_START];
  }

  if (node->style.padding[leading[axis]] >= 0) {
    return node->style.padding[leading[axis]];
  }

  return 0;
}

static float getTrailingPadding(css_node_t* node, css_flex_direction_t axis) {
  if (isRowDirection(axis) &&
      !isUndefined(node->style.padding[CSS_END]) &&
      node->style.padding[CSS_END] >= 0) {
    return node->style.padding[CSS_END];
  }

  if (node->style.padding[trailing[axis]] >= 0) {
    return node->style.padding[trailing[axis]];
  }

  return 0;
}

static float getLeadingBorder(css_node_t* node, css_flex_direction_t axis) {
  if (isRowDirection(axis) &&
      !isUndefined(node->style.border[CSS_START]) &&
      node->style.border[CSS_START] >= 0) {
    return node->style.border[CSS_START];
  }

  if (node->style.border[leading[axis]] >= 0) {
    return node->style.border[leading[axis]];
  }

  return 0;
}

static float getTrailingBorder(css_node_t* node, css_flex_direction_t axis) {
  if (isRowDirection(axis) &&
      !isUndefined(node->style.border[CSS_END]) &&
      node->style.border[CSS_END] >= 0) {
    return node->style.border[CSS_END];
  }

  if (node->style.border[trailing[axis]] >= 0) {
    return node->style.border[trailing[axis]];
  }

  return 0;
}

static float getLeadingPaddingAndBorder(css_node_t* node, css_flex_direction_t axis) {
  return getLeadingPadding(node, axis) + getLeadingBorder(node, axis);
}

static float getTrailingPaddingAndBorder(css_node_t* node, css_flex_direction_t axis) {
  return getTrailingPadding(node, axis) + getTrailingBorder(node, axis);
}

static float getMarginAxis(css_node_t* node, css_flex_direction_t axis) {
  return getLeadingMargin(node, axis) + getTrailingMargin(node, axis);
}

static float getPaddingAndBorderAxis(css_node_t* node, css_flex_direction_t axis) {
  return getLeadingPaddingAndBorder(node, axis) + getTrailingPaddingAndBorder(node, axis);
}

static css_align_t getAlignItem(css_node_t* node, css_node_t* child) {
  if (child->style.align_self != CSS_ALIGN_AUTO) {
    return child->style.align_self;
  }
  return node->style.align_items;
}

static css_direction_t resolveDirection(css_node_t* node, css_direction_t parentDirection) {
  css_direction_t direction = node->style.direction;

  if (direction == CSS_DIRECTION_INHERIT) {
    direction = parentDirection > CSS_DIRECTION_INHERIT ? parentDirection : CSS_DIRECTION_LTR;
  }

  return direction;
}

static css_flex_direction_t getFlexDirection(css_node_t* node) {
  return node->style.flex_direction;
}

static css_flex_direction_t resolveAxis(css_flex_direction_t flex_direction, css_direction_t direction) {
  if (direction == CSS_DIRECTION_RTL) {
    if (flex_direction == CSS_FLEX_DIRECTION_ROW) {
      return CSS_FLEX_DIRECTION_ROW_REVERSE;
    } else if (flex_direction == CSS_FLEX_DIRECTION_ROW_REVERSE) {
      return CSS_FLEX_DIRECTION_ROW;
    }
  }

  return flex_direction;
}

static css_flex_direction_t getCrossFlexDirection(css_flex_direction_t flex_direction, css_direction_t direction) {
  if (isColumnDirection(flex_direction)) {
    return resolveAxis(CSS_FLEX_DIRECTION_ROW, direction);
  } else {
    return CSS_FLEX_DIRECTION_COLUMN;
  }
}

static float getFlex(css_node_t* node) {
  return node->style.flex;
}

static bool isFlex(css_node_t* node) {
  return (
    node->style.position_type == CSS_POSITION_RELATIVE &&
    getFlex(node) != 0
  );
}

static bool isFlexWrap(css_node_t* node) {
  return node->style.flex_wrap == CSS_WRAP;
}

static float getDimWithMargin(css_node_t* node, css_flex_direction_t axis) {
  return node->layout.measured_dimensions[dim[axis]] +
    getLeadingMargin(node, axis) +
    getTrailingMargin(node, axis);
}

static bool isStyleDimDefined(css_node_t* node, css_flex_direction_t axis) {
  float value = node->style.dimensions[dim[axis]];
  return !isUndefined(value) && value >= 0.0;
}

static bool isLayoutDimDefined(css_node_t* node, css_flex_direction_t axis) {
  float value = node->layout.measured_dimensions[dim[axis]];
  return !isUndefined(value) && value >= 0.0;
}

static bool isPosDefined(css_node_t* node, css_position_t position) {
  return !isUndefined(node->style.position[position]);
}

static bool isMeasureDefined(css_node_t* node) {
  return node->measure;
}

static float getPosition(css_node_t* node, css_position_t position) {
  float result = node->style.position[position];
  if (!isUndefined(result)) {
    return result;
  }
  return 0;
}

static float boundAxisWithinMinAndMax(css_node_t* node, css_flex_direction_t axis, float value) {
  float min = CSS_UNDEFINED;
  float max = CSS_UNDEFINED;

  if (isColumnDirection(axis)) {
    min = node->style.minDimensions[CSS_HEIGHT];
    max = node->style.maxDimensions[CSS_HEIGHT];
  } else if (isRowDirection(axis)) {
    min = node->style.minDimensions[CSS_WIDTH];
    max = node->style.maxDimensions[CSS_WIDTH];
  }

  float boundValue = value;

  if (!isUndefined(max) && max >= 0.0 && boundValue > max) {
    boundValue = max;
  }
  if (!isUndefined(min) && min >= 0.0 && boundValue < min) {
    boundValue = min;
  }

  return boundValue;
}

// Like boundAxisWithinMinAndMax but also ensures that the value doesn't go below the
// padding and border amount.
static float boundAxis(css_node_t* node, css_flex_direction_t axis, float value) {
  return fmaxf(boundAxisWithinMinAndMax(node, axis, value), getPaddingAndBorderAxis(node, axis));
}

static void setTrailingPosition(css_node_t* node, css_node_t* child, css_flex_direction_t axis) {
  float size = child->style.position_type == CSS_POSITION_ABSOLUTE ?
    0 :
    child->layout.measured_dimensions[dim[axis]];
  child->layout.position[trailing[axis]] = node->layout.measured_dimensions[dim[axis]] - size - child->layout.position[pos[axis]];
}

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
static float getRelativePosition(css_node_t* node, css_flex_direction_t axis) {
  float lead = node->style.position[leading[axis]];
  if (!isUndefined(lead)) {
    return lead;
  }
  return -getPosition(node, trailing[axis]);
}

static void setPosition(css_node_t* node, css_direction_t direction) {
  css_flex_direction_t mainAxis = resolveAxis(getFlexDirection(node), direction);
  css_flex_direction_t crossAxis = getCrossFlexDirection(mainAxis, direction);

  node->layout.position[leading[mainAxis]] = getLeadingMargin(node, mainAxis) +
    getRelativePosition(node, mainAxis);
  node->layout.position[trailing[mainAxis]] = getTrailingMargin(node, mainAxis) +
    getRelativePosition(node, mainAxis);
  node->layout.position[leading[crossAxis]] = getLeadingMargin(node, crossAxis) +
    getRelativePosition(node, crossAxis);
  node->layout.position[trailing[crossAxis]] = getTrailingMargin(node, crossAxis) +
    getRelativePosition(node, crossAxis);
}

//
// This is the main routine that implements a subset of the flexbox layout algorithm
// described in the W3C CSS documentation: https://www.w3.org/TR/css3-flexbox/.
//
// Limitations of this algorithm, compared to the full standard:
//  * Display property is always assumed to be 'flex' except for Text nodes, which
//    are assumed to be 'inline-flex'.
//  * The 'zIndex' property (or any form of z ordering) is not supported. Nodes are
//    stacked in document order.
//  * The 'order' property is not supported. The order of flex items is always defined
//    by document order.
//  * The 'visibility' property is always assumed to be 'visible'. Values of 'collapse'
//    and 'hidden' are not supported.
//  * The 'wrap' property supports only 'nowrap' (which is the default) or 'wrap'. The
//    rarely-used 'wrap-reverse' is not supported.
//  * Rather than allowing arbitrary combinations of flexGrow, flexShrink and
//    flexBasis, this algorithm supports only the three most common combinations:
//      flex: 0 is equiavlent to flex: 0 0 auto
//      flex: n (where n is a positive value) is equivalent to flex: n 1 auto
//          If POSITIVE_FLEX_IS_AUTO is 0, then it is equivalent to flex: n 0 0
//          This is faster because the content doesn't need to be measured, but it's
//          less flexible because the basis is always 0 and can't be overriden with
//          the width/height attributes.
//      flex: -1 (or any negative value) is equivalent to flex: 0 1 auto
//  * Margins cannot be specified as 'auto'. They must be specified in terms of pixel
//    values, and the default value is 0.
//  * The 'baseline' value is not supported for alignItems and alignSelf properties.
//  * Values of width, maxWidth, minWidth, height, maxHeight and minHeight must be
//    specified as pixel values, not as percentages.
//  * There is no support for calculation of dimensions based on intrinsic aspect ratios
//     (e.g. images).
//  * There is no support for forced breaks.
//  * It does not support vertical inline directions (top-to-bottom or bottom-to-top text).
//
// Deviations from standard:
//  * Section 4.5 of the spec indicates that all flex items have a default minimum
//    main size. For text blocks, for example, this is the width of the widest word.
//    Calculating the minimum width is expensive, so we forego it and assume a default
//    minimum main size of 0.
//  * Min/Max sizes in the main axis are not honored when resolving flexible lengths.
//  * The spec indicates that the default value for 'flexDirection' is 'row', but
//    the algorithm below assumes a default of 'column'.
//
// Input parameters:
//    - node: current node to be sized and layed out
//    - availableWidth & availableHeight: available size to be used for sizing the node
//      or CSS_UNDEFINED if the size is not available; interpretation depends on layout
//      flags
//    - parentDirection: the inline (text) direction within the parent (left-to-right or
//      right-to-left)
//    - widthMeasureMode: indicates the sizing rules for the width (see below for explanation)
//    - heightMeasureMode: indicates the sizing rules for the height (see below for explanation)
//    - performLayout: specifies whether the caller is interested in just the dimensions
//      of the node or it requires the entire node and its subtree to be layed out
//      (with final positions)
//
// Details:
//    This routine is called recursively to lay out subtrees of flexbox elements. It uses the
//    information in node.style, which is treated as a read-only input. It is responsible for
//    setting the layout.direction and layout.measured_dimensions fields for the input node as well
//    as the layout.position and layout.line_index fields for its child nodes. The
//    layout.measured_dimensions field includes any border or padding for the node but does
//    not include margins.
//
//    The spec describes four different layout modes: "fill available", "max content", "min content",
//    and "fit content". Of these, we don't use "min content" because we don't support default
//    minimum main sizes (see above for details). Each of our measure modes maps to a layout mode
//    from the spec (https://www.w3.org/TR/css3-sizing/#terms):
//      - CSS_MEASURE_MODE_UNDEFINED: max content
//      - CSS_MEASURE_MODE_EXACTLY: fill available
//      - CSS_MEASURE_MODE_AT_MOST: fit content
//
//    When calling layoutNodeImpl and layoutNodeInternal, if the caller passes an available size of
//    undefined then it must also pass a measure mode of CSS_MEASURE_MODE_UNDEFINED in that dimension.
//
static void layoutNodeImpl(css_node_t* node, float availableWidth, float availableHeight,
    css_direction_t parentDirection, css_measure_mode_t widthMeasureMode, css_measure_mode_t heightMeasureMode, bool performLayout) {
  /** START_GENERATED **/

  assert(isUndefined(availableWidth) ? widthMeasureMode == CSS_MEASURE_MODE_UNDEFINED : true); // availableWidth is indefinite so widthMeasureMode must be CSS_MEASURE_MODE_UNDEFINED
  assert(isUndefined(availableHeight) ? heightMeasureMode == CSS_MEASURE_MODE_UNDEFINED : true); // availableHeight is indefinite so heightMeasureMode must be CSS_MEASURE_MODE_UNDEFINED

  float paddingAndBorderAxisRow = getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_ROW);
  float paddingAndBorderAxisColumn = getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_COLUMN);
  float marginAxisRow = getMarginAxis(node, CSS_FLEX_DIRECTION_ROW);
  float marginAxisColumn = getMarginAxis(node, CSS_FLEX_DIRECTION_COLUMN);

  // Set the resolved resolution in the node's layout.
  css_direction_t direction = resolveDirection(node, parentDirection);
  node->layout.direction = direction;

  // For content (text) nodes, determine the dimensions based on the text contents.
  if (isMeasureDefined(node)) {
    float innerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
    float innerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;

    if (widthMeasureMode == CSS_MEASURE_MODE_EXACTLY && heightMeasureMode == CSS_MEASURE_MODE_EXACTLY) {

      // Don't bother sizing the text if both dimensions are already defined.
      node->layout.measured_dimensions[CSS_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW, availableWidth - marginAxisRow);
      node->layout.measured_dimensions[CSS_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN, availableHeight - marginAxisColumn);
    } else if (innerWidth <= 0 || innerHeight <= 0) {

      // Don't bother sizing the text if there's no horizontal or vertical space.
      node->layout.measured_dimensions[CSS_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW, 0);
      node->layout.measured_dimensions[CSS_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN, 0);
    } else {

      // Measure the text under the current constraints.
      css_dim_t measureDim = node->measure(
        node->context,
        
        innerWidth,
        widthMeasureMode,
        innerHeight,
        heightMeasureMode
      );

      node->layout.measured_dimensions[CSS_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW,
        (widthMeasureMode == CSS_MEASURE_MODE_UNDEFINED || widthMeasureMode == CSS_MEASURE_MODE_AT_MOST) ?
          measureDim.dimensions[CSS_WIDTH] + paddingAndBorderAxisRow :
          availableWidth - marginAxisRow);
      node->layout.measured_dimensions[CSS_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN,
        (heightMeasureMode == CSS_MEASURE_MODE_UNDEFINED || heightMeasureMode == CSS_MEASURE_MODE_AT_MOST) ?
          measureDim.dimensions[CSS_HEIGHT] + paddingAndBorderAxisColumn :
          availableHeight - marginAxisColumn);
    }

    return;
  }

  // For nodes with no children, use the available values if they were provided, or
  // the minimum size as indicated by the padding and border sizes.
  int childCount = node->children_count;
  if (childCount == 0) {
    node->layout.measured_dimensions[CSS_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW,
      (widthMeasureMode == CSS_MEASURE_MODE_UNDEFINED || widthMeasureMode == CSS_MEASURE_MODE_AT_MOST) ?
        paddingAndBorderAxisRow :
        availableWidth - marginAxisRow);
    node->layout.measured_dimensions[CSS_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN,
      (heightMeasureMode == CSS_MEASURE_MODE_UNDEFINED || heightMeasureMode == CSS_MEASURE_MODE_AT_MOST) ?
        paddingAndBorderAxisColumn :
        availableHeight - marginAxisColumn);
    return;
  }

  // If we're not being asked to perform a full layout, we can handle a number of common
  // cases here without incurring the cost of the remaining function.
  if (!performLayout) {
    // If we're being asked to size the content with an at most constraint but there is no available width,
    // the measurement will always be zero.
    if (widthMeasureMode == CSS_MEASURE_MODE_AT_MOST && availableWidth <= 0 &&
        heightMeasureMode == CSS_MEASURE_MODE_AT_MOST && availableHeight <= 0) {
      node->layout.measured_dimensions[CSS_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW, 0);
      node->layout.measured_dimensions[CSS_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN, 0);
      return;
    }

    if (widthMeasureMode == CSS_MEASURE_MODE_AT_MOST && availableWidth <= 0) {
      node->layout.measured_dimensions[CSS_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW, 0);
      node->layout.measured_dimensions[CSS_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN, isUndefined(availableHeight) ? 0 : (availableHeight - marginAxisColumn));
      return;
    }

    if (heightMeasureMode == CSS_MEASURE_MODE_AT_MOST && availableHeight <= 0) {
      node->layout.measured_dimensions[CSS_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW, isUndefined(availableWidth) ? 0 : (availableWidth - marginAxisRow));
      node->layout.measured_dimensions[CSS_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN, 0);
      return;
    }

    // If we're being asked to use an exact width/height, there's no need to measure the children.
    if (widthMeasureMode == CSS_MEASURE_MODE_EXACTLY && heightMeasureMode == CSS_MEASURE_MODE_EXACTLY) {
      node->layout.measured_dimensions[CSS_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW, availableWidth - marginAxisRow);
      node->layout.measured_dimensions[CSS_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN, availableHeight - marginAxisColumn);
      return;
    }
  }

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  css_flex_direction_t mainAxis = resolveAxis(getFlexDirection(node), direction);
  css_flex_direction_t crossAxis = getCrossFlexDirection(mainAxis, direction);
  bool isMainAxisRow = isRowDirection(mainAxis);
  css_justify_t justifyContent = node->style.justify_content;
  bool isNodeFlexWrap = isFlexWrap(node);

  css_node_t* firstAbsoluteChild = NULL;
  css_node_t* currentAbsoluteChild = NULL;

  float leadingPaddingAndBorderMain = getLeadingPaddingAndBorder(node, mainAxis);
  float trailingPaddingAndBorderMain = getTrailingPaddingAndBorder(node, mainAxis);
  float leadingPaddingAndBorderCross = getLeadingPaddingAndBorder(node, crossAxis);
  float paddingAndBorderAxisMain = getPaddingAndBorderAxis(node, mainAxis);
  float paddingAndBorderAxisCross = getPaddingAndBorderAxis(node, crossAxis);

  css_measure_mode_t measureModeMainDim = isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  css_measure_mode_t measureModeCrossDim = isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS
  float availableInnerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  float availableInnerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;
  float availableInnerMainDim = isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  float availableInnerCrossDim = isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM
  css_node_t* child;
  int i;
  float childWidth;
  float childHeight;
  css_measure_mode_t childWidthMeasureMode;
  css_measure_mode_t childHeightMeasureMode;
  for (i = 0; i < childCount; i++) {
    child = node->get_child(node->context, i);

    if (performLayout) {
      // Set the initial position (relative to the parent).
      css_direction_t childDirection = resolveDirection(child, direction);
      setPosition(child, childDirection);
    }

    // Absolute-positioned children don't participate in flex layout. Add them
    // to a list that we can process later.
    if (child->style.position_type == CSS_POSITION_ABSOLUTE) {

      // Store a private linked list of absolutely positioned children
      // so that we can efficiently traverse them later.
      if (firstAbsoluteChild == NULL) {
        firstAbsoluteChild = child;
      }
      if (currentAbsoluteChild != NULL) {
        currentAbsoluteChild->next_child = child;
      }
      currentAbsoluteChild = child;
      child->next_child = NULL;
    } else {

      if (isMainAxisRow && isStyleDimDefined(child, CSS_FLEX_DIRECTION_ROW)) {

        // The width is definite, so use that as the flex basis.
        child->layout.flex_basis = fmaxf(child->style.dimensions[CSS_WIDTH], getPaddingAndBorderAxis(child, CSS_FLEX_DIRECTION_ROW));
      } else if (!isMainAxisRow && isStyleDimDefined(child, CSS_FLEX_DIRECTION_COLUMN)) {

        // The height is definite, so use that as the flex basis.
        child->layout.flex_basis = fmaxf(child->style.dimensions[CSS_HEIGHT], getPaddingAndBorderAxis(child, CSS_FLEX_DIRECTION_COLUMN));
      } else if (!isFlexBasisAuto(child) && !isUndefined(availableInnerMainDim)) {

        // If the basis isn't 'auto', it is assumed to be zero.
        child->layout.flex_basis = fmaxf(0, getPaddingAndBorderAxis(child, mainAxis));
      } else {

        // Compute the flex basis and hypothetical main size (i.e. the clamped flex basis).
        childWidth = CSS_UNDEFINED;
        childHeight = CSS_UNDEFINED;
        childWidthMeasureMode = CSS_MEASURE_MODE_UNDEFINED;
        childHeightMeasureMode = CSS_MEASURE_MODE_UNDEFINED;

        if (isStyleDimDefined(child, CSS_FLEX_DIRECTION_ROW)) {
          childWidth = child->style.dimensions[CSS_WIDTH] + getMarginAxis(child, CSS_FLEX_DIRECTION_ROW);
          childWidthMeasureMode = CSS_MEASURE_MODE_EXACTLY;
        }
        if (isStyleDimDefined(child, CSS_FLEX_DIRECTION_COLUMN)) {
          childHeight = child->style.dimensions[CSS_HEIGHT] + getMarginAxis(child, CSS_FLEX_DIRECTION_COLUMN);
          childHeightMeasureMode = CSS_MEASURE_MODE_EXACTLY;
        }

        // According to the spec, if the main size is not definite and the
        // child's inline axis is parallel to the main axis (i.e. it's
        // horizontal), the child should be sized using "UNDEFINED" in
        // the main size. Otherwise use "AT_MOST" in the cross axis.
        if (!isMainAxisRow && isUndefined(childWidth) && !isUndefined(availableInnerWidth)) {
          childWidth = availableInnerWidth;
          childWidthMeasureMode = CSS_MEASURE_MODE_AT_MOST;
        }

        // The W3C spec doesn't say anything about the 'overflow' property,
        // but all major browsers appear to implement the following logic.
        if (node->style.overflow == CSS_OVERFLOW_HIDDEN) {
          if (isMainAxisRow && isUndefined(childHeight) && !isUndefined(availableInnerHeight)) {
            childHeight = availableInnerHeight;
            childHeightMeasureMode = CSS_MEASURE_MODE_AT_MOST;
          }
        }

        // If child has no defined size in the cross axis and is set to stretch, set the cross
        // axis to be measured exactly with the available inner width
        if (!isMainAxisRow &&
            !isUndefined(availableInnerWidth) &&
            !isStyleDimDefined(child, CSS_FLEX_DIRECTION_ROW) &&
            widthMeasureMode == CSS_MEASURE_MODE_EXACTLY &&
            getAlignItem(node, child) == CSS_ALIGN_STRETCH) {
          childWidth = availableInnerWidth;
          childWidthMeasureMode = CSS_MEASURE_MODE_EXACTLY;
        }
        if (isMainAxisRow &&
            !isUndefined(availableInnerHeight) &&
            !isStyleDimDefined(child, CSS_FLEX_DIRECTION_COLUMN) &&
            heightMeasureMode == CSS_MEASURE_MODE_EXACTLY &&
            getAlignItem(node, child) == CSS_ALIGN_STRETCH) {
          childHeight = availableInnerHeight;
          childHeightMeasureMode = CSS_MEASURE_MODE_EXACTLY;
        }

        // Measure the child
        layoutNodeInternal(child, childWidth, childHeight, direction, childWidthMeasureMode, childHeightMeasureMode, false, "measure");

        child->layout.flex_basis = fmaxf(isMainAxisRow ? child->layout.measured_dimensions[CSS_WIDTH] : child->layout.measured_dimensions[CSS_HEIGHT], getPaddingAndBorderAxis(child, mainAxis));
      }
    }
  }

  // STEP 4: COLLECT FLEX ITEMS INTO FLEX LINES

  // Indexes of children that represent the first and last items in the line.
  int startOfLineIndex = 0;
  int endOfLineIndex = 0;

  // Number of lines.
  int lineCount = 0;

  // Accumulated cross dimensions of all lines so far.
  float totalLineCrossDim = 0;

  // Max main dimension of all the lines.
  float maxLineMainDim = 0;

  while (endOfLineIndex < childCount) {

    // Number of items on the currently line. May be different than the difference
    // between start and end indicates because we skip over absolute-positioned items.
    int itemsOnLine = 0;

    // sizeConsumedOnCurrentLine is accumulation of the dimensions and margin
    // of all the children on the current line. This will be used in order to
    // either set the dimensions of the node if none already exist or to compute
    // the remaining space left for the flexible children.
    float sizeConsumedOnCurrentLine = 0;

    float totalFlexGrowFactors = 0;
    float totalFlexShrinkScaledFactors = 0;

    i = startOfLineIndex;

    // Maintain a linked list of the child nodes that can shrink and/or grow.
    css_node_t* firstRelativeChild = NULL;
    css_node_t* currentRelativeChild = NULL;

    // Add items to the current line until it's full or we run out of items.
    while (i < childCount) {
      child = node->get_child(node->context, i);
      child->line_index = lineCount;

      if (child->style.position_type != CSS_POSITION_ABSOLUTE) {
        float outerFlexBasis = child->layout.flex_basis + getMarginAxis(child, mainAxis);

        // If this is a multi-line flow and this item pushes us over the available size, we've
        // hit the end of the current line. Break out of the loop and lay out the current line.
        if (sizeConsumedOnCurrentLine + outerFlexBasis > availableInnerMainDim && isNodeFlexWrap && itemsOnLine > 0) {
          break;
        }

        sizeConsumedOnCurrentLine += outerFlexBasis;
        itemsOnLine++;

        if (isFlex(child)) {
          totalFlexGrowFactors += getFlexGrowFactor(child);

          // Unlike the grow factor, the shrink factor is scaled relative to the child
          // dimension.
          totalFlexShrinkScaledFactors += getFlexShrinkFactor(child) * child->layout.flex_basis;
        }

        // Store a private linked list of children that need to be layed out.
        if (firstRelativeChild == NULL) {
          firstRelativeChild = child;
        }
        if (currentRelativeChild != NULL) {
          currentRelativeChild->next_child = child;
        }
        currentRelativeChild = child;
        child->next_child = NULL;
      }

      i++;
      endOfLineIndex++;
    }

    // If we don't need to measure the cross axis, we can skip the entire flex step.
    bool canSkipFlex = !performLayout && measureModeCrossDim == CSS_MEASURE_MODE_EXACTLY;

    // In order to position the elements in the main axis, we have two
    // controls. The space between the beginning and the first element
    // and the space between each two elements.
    float leadingMainDim = 0;
    float betweenMainDim = 0;

    // STEP 5: RESOLVING FLEXIBLE LENGTHS ON MAIN AXIS
    // Calculate the remaining available space that needs to be allocated.
    // If the main dimension size isn't known, it is computed based on
    // the line length, so there's no more space left to distribute.
    float remainingFreeSpace = 0;
    if (!isUndefined(availableInnerMainDim)) {
      remainingFreeSpace = availableInnerMainDim - sizeConsumedOnCurrentLine;
    } else if (sizeConsumedOnCurrentLine < 0) {
      // availableInnerMainDim is indefinite which means the node is being sized based on its content.
      // sizeConsumedOnCurrentLine is negative which means the node will allocate 0 pixels for
      // its content. Consequently, remainingFreeSpace is 0 - sizeConsumedOnCurrentLine.
      remainingFreeSpace = -sizeConsumedOnCurrentLine;
    }

    float originalRemainingFreeSpace = remainingFreeSpace;
    float deltaFreeSpace = 0;

    if (!canSkipFlex) {
      float childFlexBasis;
      float flexShrinkScaledFactor;
      float flexGrowFactor;
      float baseMainSize;
      float boundMainSize;

      // Do two passes over the flex items to figure out how to distribute the remaining space.
      // The first pass finds the items whose min/max constraints trigger, freezes them at those
      // sizes, and excludes those sizes from the remaining space. The second pass sets the size
      // of each flexible item. It distributes the remaining space amongst the items whose min/max
      // constraints didn't trigger in pass 1. For the other items, it sets their sizes by forcing
      // their min/max constraints to trigger again.
      //
      // This two pass approach for resolving min/max constraints deviates from the spec. The
      // spec (https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths) describes a process
      // that needs to be repeated a variable number of times. The algorithm implemented here
      // won't handle all cases but it was simpler to implement and it mitigates performance
      // concerns because we know exactly how many passes it'll do.

      // First pass: detect the flex items whose min/max constraints trigger
      float deltaFlexShrinkScaledFactors = 0;
      float deltaFlexGrowFactors = 0;
      currentRelativeChild = firstRelativeChild;
      while (currentRelativeChild != NULL) {
        childFlexBasis = currentRelativeChild->layout.flex_basis;

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor = getFlexShrinkFactor(currentRelativeChild) * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            baseMainSize = childFlexBasis +
              remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor;
            boundMainSize = boundAxis(currentRelativeChild, mainAxis, baseMainSize);
            if (baseMainSize != boundMainSize) {
              // By excluding this item's size and flex factor from remaining, this item's
              // min/max constraints should also trigger in the second pass resulting in the
              // item's size calculation being identical in the first and second passes.
              deltaFreeSpace -= boundMainSize - childFlexBasis;
              deltaFlexShrinkScaledFactors -= flexShrinkScaledFactor;
            }
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = getFlexGrowFactor(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            baseMainSize = childFlexBasis +
              remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor;
            boundMainSize = boundAxis(currentRelativeChild, mainAxis, baseMainSize);
            if (baseMainSize != boundMainSize) {
              // By excluding this item's size and flex factor from remaining, this item's
              // min/max constraints should also trigger in the second pass resulting in the
              // item's size calculation being identical in the first and second passes.
              deltaFreeSpace -= boundMainSize - childFlexBasis;
              deltaFlexGrowFactors -= flexGrowFactor;
            }
          }
        }

        currentRelativeChild = currentRelativeChild->next_child;
      }

      totalFlexShrinkScaledFactors += deltaFlexShrinkScaledFactors;
      totalFlexGrowFactors += deltaFlexGrowFactors;
      remainingFreeSpace += deltaFreeSpace;

      // Second pass: resolve the sizes of the flexible items
      deltaFreeSpace = 0;
      currentRelativeChild = firstRelativeChild;
      while (currentRelativeChild != NULL) {
        childFlexBasis = currentRelativeChild->layout.flex_basis;
        float updatedMainSize = childFlexBasis;

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor = getFlexShrinkFactor(currentRelativeChild) * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            updatedMainSize = boundAxis(currentRelativeChild, mainAxis, childFlexBasis +
              remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor);
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = getFlexGrowFactor(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            updatedMainSize = boundAxis(currentRelativeChild, mainAxis, childFlexBasis +
              remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor);
          }
        }

        deltaFreeSpace -= updatedMainSize - childFlexBasis;

        if (isMainAxisRow) {
          childWidth = updatedMainSize + getMarginAxis(currentRelativeChild, CSS_FLEX_DIRECTION_ROW);
          childWidthMeasureMode = CSS_MEASURE_MODE_EXACTLY;

          if (!isUndefined(availableInnerCrossDim) &&
              !isStyleDimDefined(currentRelativeChild, CSS_FLEX_DIRECTION_COLUMN) &&
              heightMeasureMode == CSS_MEASURE_MODE_EXACTLY &&
              getAlignItem(node, currentRelativeChild) == CSS_ALIGN_STRETCH) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode = CSS_MEASURE_MODE_EXACTLY;
          } else if (!isStyleDimDefined(currentRelativeChild, CSS_FLEX_DIRECTION_COLUMN)) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode = isUndefined(childHeight) ? CSS_MEASURE_MODE_UNDEFINED : CSS_MEASURE_MODE_AT_MOST;
          } else {
            childHeight = currentRelativeChild->style.dimensions[CSS_HEIGHT] + getMarginAxis(currentRelativeChild, CSS_FLEX_DIRECTION_COLUMN);
            childHeightMeasureMode = CSS_MEASURE_MODE_EXACTLY;
          }
        } else {
          childHeight = updatedMainSize + getMarginAxis(currentRelativeChild, CSS_FLEX_DIRECTION_COLUMN);
          childHeightMeasureMode = CSS_MEASURE_MODE_EXACTLY;

          if (!isUndefined(availableInnerCrossDim) &&
              !isStyleDimDefined(currentRelativeChild, CSS_FLEX_DIRECTION_ROW) &&
              widthMeasureMode == CSS_MEASURE_MODE_EXACTLY &&
              getAlignItem(node, currentRelativeChild) == CSS_ALIGN_STRETCH) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode = CSS_MEASURE_MODE_EXACTLY;
          } else if (!isStyleDimDefined(currentRelativeChild, CSS_FLEX_DIRECTION_ROW)) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode = isUndefined(childWidth) ? CSS_MEASURE_MODE_UNDEFINED : CSS_MEASURE_MODE_AT_MOST;
          } else {
            childWidth = currentRelativeChild->style.dimensions[CSS_WIDTH] + getMarginAxis(currentRelativeChild, CSS_FLEX_DIRECTION_ROW);
            childWidthMeasureMode = CSS_MEASURE_MODE_EXACTLY;
          }
        }

        bool requiresStretchLayout = !isStyleDimDefined(currentRelativeChild, crossAxis) &&
          getAlignItem(node, currentRelativeChild) == CSS_ALIGN_STRETCH;

        // Recursively call the layout algorithm for this child with the updated main size.
        layoutNodeInternal(currentRelativeChild, childWidth, childHeight, direction, childWidthMeasureMode, childHeightMeasureMode, performLayout && !requiresStretchLayout, "flex");

        currentRelativeChild = currentRelativeChild->next_child;
      }
    }

    remainingFreeSpace = originalRemainingFreeSpace + deltaFreeSpace;

    // STEP 6: MAIN-AXIS JUSTIFICATION & CROSS-AXIS SIZE DETERMINATION

    // At this point, all the children have their dimensions set in the main axis.
    // Their dimensions are also set in the cross axis with the exception of items
    // that are aligned "stretch". We need to compute these stretch values and
    // set the final positions.

    // If we are using "at most" rules in the main axis, we won't distribute
    // any remaining space at this point.
    if (measureModeMainDim == CSS_MEASURE_MODE_AT_MOST) {
      remainingFreeSpace = 0;
    }

    // Use justifyContent to figure out how to allocate the remaining space
    // available in the main axis.
    if (justifyContent != CSS_JUSTIFY_FLEX_START) {
      if (justifyContent == CSS_JUSTIFY_CENTER) {
        leadingMainDim = remainingFreeSpace / 2;
      } else if (justifyContent == CSS_JUSTIFY_FLEX_END) {
        leadingMainDim = remainingFreeSpace;
      } else if (justifyContent == CSS_JUSTIFY_SPACE_BETWEEN) {
        remainingFreeSpace = fmaxf(remainingFreeSpace, 0);
        if (itemsOnLine > 1) {
          betweenMainDim = remainingFreeSpace / (itemsOnLine - 1);
        } else {
          betweenMainDim = 0;
        }
      } else if (justifyContent == CSS_JUSTIFY_SPACE_AROUND) {
        // Space on the edges is half of the space between elements
        betweenMainDim = remainingFreeSpace / itemsOnLine;
        leadingMainDim = betweenMainDim / 2;
      }
    }

    float mainDim = leadingPaddingAndBorderMain + leadingMainDim;
    float crossDim = 0;

    for (i = startOfLineIndex; i < endOfLineIndex; ++i) {
      child = node->get_child(node->context, i);

      if (child->style.position_type == CSS_POSITION_ABSOLUTE &&
          isPosDefined(child, leading[mainAxis])) {
        if (performLayout) {
          // In case the child is position absolute and has left/top being
          // defined, we override the position to whatever the user said
          // (and margin/border).
          child->layout.position[pos[mainAxis]] = getPosition(child, leading[mainAxis]) +
            getLeadingBorder(node, mainAxis) +
            getLeadingMargin(child, mainAxis);
        }
      } else {
        if (performLayout) {
          // If the child is position absolute (without top/left) or relative,
          // we put it at the current accumulated offset.
          child->layout.position[pos[mainAxis]] += mainDim;
        }

        // Now that we placed the element, we need to update the variables.
        // We need to do that only for relative elements. Absolute elements
        // do not take part in that phase.
        if (child->style.position_type == CSS_POSITION_RELATIVE) {
          if (canSkipFlex) {
            // If we skipped the flex step, then we can't rely on the measuredDims because
            // they weren't computed. This means we can't call getDimWithMargin.
            mainDim += betweenMainDim + getMarginAxis(child, mainAxis) + child->layout.flex_basis;
            crossDim = availableInnerCrossDim;
          } else {
            // The main dimension is the sum of all the elements dimension plus
            // the spacing.
            mainDim += betweenMainDim + getDimWithMargin(child, mainAxis);

            // The cross dimension is the max of the elements dimension since there
            // can only be one element in that cross dimension.
            crossDim = fmaxf(crossDim, getDimWithMargin(child, crossAxis));
          }
        }
      }
    }

    mainDim += trailingPaddingAndBorderMain;

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == CSS_MEASURE_MODE_UNDEFINED || measureModeCrossDim == CSS_MEASURE_MODE_AT_MOST) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis = boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross) - paddingAndBorderAxisCross;

      if (measureModeCrossDim == CSS_MEASURE_MODE_AT_MOST) {
        containerCrossAxis = fminf(containerCrossAxis, availableInnerCrossDim);
      }
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == CSS_MEASURE_MODE_EXACTLY) {
      crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    crossDim = boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross) - paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (i = startOfLineIndex; i < endOfLineIndex; ++i) {
        child = node->get_child(node->context, i);

        if (child->style.position_type == CSS_POSITION_ABSOLUTE) {
          // If the child is absolutely positioned and has a top/left/bottom/right
          // set, override all the previously computed positions to set it correctly.
          if (isPosDefined(child, leading[crossAxis])) {
            child->layout.position[pos[crossAxis]] = getPosition(child, leading[crossAxis]) +
              getLeadingBorder(node, crossAxis) +
              getLeadingMargin(child, crossAxis);
          } else {
            child->layout.position[pos[crossAxis]] = leadingPaddingAndBorderCross +
              getLeadingMargin(child, crossAxis);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (parent) or
          // alignSelf (child) in order to determine the position in the cross axis
          css_align_t alignItem = getAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more time, this time
          // forcing the cross-axis size to be the computed cross size for the current line.
          if (alignItem == CSS_ALIGN_STRETCH) {
            childWidth = child->layout.measured_dimensions[CSS_WIDTH] + getMarginAxis(child, CSS_FLEX_DIRECTION_ROW);
            childHeight = child->layout.measured_dimensions[CSS_HEIGHT] + getMarginAxis(child, CSS_FLEX_DIRECTION_COLUMN);
            bool isCrossSizeDefinite = false;

            if (isMainAxisRow) {
              isCrossSizeDefinite = isStyleDimDefined(child, CSS_FLEX_DIRECTION_COLUMN);
              childHeight = crossDim;
            } else {
              isCrossSizeDefinite = isStyleDimDefined(child, CSS_FLEX_DIRECTION_ROW);
              childWidth = crossDim;
            }

            // If the child defines a definite size for its cross axis, there's no need to stretch.
            if (!isCrossSizeDefinite) {
              childWidthMeasureMode = isUndefined(childWidth) ? CSS_MEASURE_MODE_UNDEFINED : CSS_MEASURE_MODE_EXACTLY;
              childHeightMeasureMode = isUndefined(childHeight) ? CSS_MEASURE_MODE_UNDEFINED : CSS_MEASURE_MODE_EXACTLY;
              layoutNodeInternal(child, childWidth, childHeight, direction, childWidthMeasureMode, childHeightMeasureMode, true, "stretch");
            }
          } else if (alignItem != CSS_ALIGN_FLEX_START) {
            float remainingCrossDim = containerCrossAxis - getDimWithMargin(child, crossAxis);

            if (alignItem == CSS_ALIGN_CENTER) {
              leadingCrossDim += remainingCrossDim / 2;
            } else { // CSS_ALIGN_FLEX_END
              leadingCrossDim += remainingCrossDim;
            }
          }

          // And we apply the position
          child->layout.position[pos[crossAxis]] += totalLineCrossDim + leadingCrossDim;
        }
      }
    }

    totalLineCrossDim += crossDim;
    maxLineMainDim = fmaxf(maxLineMainDim, mainDim);

    // Reset variables for new line.
    lineCount++;
    startOfLineIndex = endOfLineIndex;
    endOfLineIndex = startOfLineIndex;
  }

  // STEP 8: MULTI-LINE CONTENT ALIGNMENT
  if (lineCount > 1 && performLayout && !isUndefined(availableInnerCrossDim)) {
    float remainingAlignContentDim = availableInnerCrossDim - totalLineCrossDim;

    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;

    css_align_t alignContent = node->style.align_content;
    if (alignContent == CSS_ALIGN_FLEX_END) {
      currentLead += remainingAlignContentDim;
    } else if (alignContent == CSS_ALIGN_CENTER) {
      currentLead += remainingAlignContentDim / 2;
    } else if (alignContent == CSS_ALIGN_STRETCH) {
      if (availableInnerCrossDim > totalLineCrossDim) {
        crossDimLead = (remainingAlignContentDim / lineCount);
      }
    }

    int endIndex = 0;
    for (i = 0; i < lineCount; ++i) {
      int startIndex = endIndex;
      int j;

      // compute the line's height and find the endIndex
      float lineHeight = 0;
      for (j = startIndex; j < childCount; ++j) {
        child = node->get_child(node->context, j);
        if (child->style.position_type != CSS_POSITION_RELATIVE) {
          continue;
        }
        if (child->line_index != i) {
          break;
        }
        if (isLayoutDimDefined(child, crossAxis)) {
          lineHeight = fmaxf(lineHeight,
            child->layout.measured_dimensions[dim[crossAxis]] + getMarginAxis(child, crossAxis));
        }
      }
      endIndex = j;
      lineHeight += crossDimLead;

      if (performLayout) {
        for (j = startIndex; j < endIndex; ++j) {
          child = node->get_child(node->context, j);
          if (child->style.position_type != CSS_POSITION_RELATIVE) {
            continue;
          }

          css_align_t alignContentAlignItem = getAlignItem(node, child);
          if (alignContentAlignItem == CSS_ALIGN_FLEX_START) {
            child->layout.position[pos[crossAxis]] = currentLead + getLeadingMargin(child, crossAxis);
          } else if (alignContentAlignItem == CSS_ALIGN_FLEX_END) {
            child->layout.position[pos[crossAxis]] = currentLead + lineHeight - getTrailingMargin(child, crossAxis) - child->layout.measured_dimensions[dim[crossAxis]];
          } else if (alignContentAlignItem == CSS_ALIGN_CENTER) {
            childHeight = child->layout.measured_dimensions[dim[crossAxis]];
            child->layout.position[pos[crossAxis]] = currentLead + (lineHeight - childHeight) / 2;
          } else if (alignContentAlignItem == CSS_ALIGN_STRETCH) {
            child->layout.position[pos[crossAxis]] = currentLead + getLeadingMargin(child, crossAxis);
            // TODO(prenaux): Correctly set the height of items with indefinite
            //                (auto) crossAxis dimension.
          }
        }
      }

      currentLead += lineHeight;
    }
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS
  node->layout.measured_dimensions[CSS_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW, availableWidth - marginAxisRow);
  node->layout.measured_dimensions[CSS_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN, availableHeight - marginAxisColumn);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == CSS_MEASURE_MODE_UNDEFINED) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measured_dimensions[dim[mainAxis]] = boundAxis(node, mainAxis, maxLineMainDim);
  } else if (measureModeMainDim == CSS_MEASURE_MODE_AT_MOST) {
    node->layout.measured_dimensions[dim[mainAxis]] = fmaxf(
      fminf(availableInnerMainDim + paddingAndBorderAxisMain,
        boundAxisWithinMinAndMax(node, mainAxis, maxLineMainDim)),
      paddingAndBorderAxisMain);
  }

  if (measureModeCrossDim == CSS_MEASURE_MODE_UNDEFINED) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measured_dimensions[dim[crossAxis]] = boundAxis(node, crossAxis, totalLineCrossDim + paddingAndBorderAxisCross);
  } else if (measureModeCrossDim == CSS_MEASURE_MODE_AT_MOST) {
    node->layout.measured_dimensions[dim[crossAxis]] = fmaxf(
      fminf(availableInnerCrossDim + paddingAndBorderAxisCross,
        boundAxisWithinMinAndMax(node, crossAxis, totalLineCrossDim + paddingAndBorderAxisCross)),
      paddingAndBorderAxisCross);
  }

  // STEP 10: SETTING TRAILING POSITIONS FOR CHILDREN
  if (performLayout) {
    bool needsMainTrailingPos = false;
    bool needsCrossTrailingPos = false;

    if (mainAxis == CSS_FLEX_DIRECTION_ROW_REVERSE ||
        mainAxis == CSS_FLEX_DIRECTION_COLUMN_REVERSE) {
      needsMainTrailingPos = true;
    }

    if (crossAxis == CSS_FLEX_DIRECTION_ROW_REVERSE ||
        crossAxis == CSS_FLEX_DIRECTION_COLUMN_REVERSE) {
      needsCrossTrailingPos = true;
    }

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (i = 0; i < childCount; ++i) {
        child = node->get_child(node->context, i);

        if (needsMainTrailingPos) {
          setTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          setTrailingPosition(node, child, crossAxis);
        }
      }
    }
  }

  // STEP 11: SIZING AND POSITIONING ABSOLUTE CHILDREN
  currentAbsoluteChild = firstAbsoluteChild;
  while (currentAbsoluteChild != NULL) {
    // Now that we know the bounds of the container, perform layout again on the
    // absolutely-positioned children.
    if (performLayout) {

      childWidth = CSS_UNDEFINED;
      childHeight = CSS_UNDEFINED;

      if (isStyleDimDefined(currentAbsoluteChild, CSS_FLEX_DIRECTION_ROW)) {
        childWidth = currentAbsoluteChild->style.dimensions[CSS_WIDTH] + getMarginAxis(currentAbsoluteChild, CSS_FLEX_DIRECTION_ROW);
      } else {
        // If the child doesn't have a specified width, compute the width based on the left/right offsets if they're defined.
        if (isPosDefined(currentAbsoluteChild, CSS_LEFT) && isPosDefined(currentAbsoluteChild, CSS_RIGHT)) {
          childWidth = node->layout.measured_dimensions[CSS_WIDTH] -
            (getLeadingBorder(node, CSS_FLEX_DIRECTION_ROW) + getTrailingBorder(node, CSS_FLEX_DIRECTION_ROW)) -
            (currentAbsoluteChild->style.position[CSS_LEFT] + currentAbsoluteChild->style.position[CSS_RIGHT]);
          childWidth = boundAxis(currentAbsoluteChild, CSS_FLEX_DIRECTION_ROW, childWidth);
        }
      }

      if (isStyleDimDefined(currentAbsoluteChild, CSS_FLEX_DIRECTION_COLUMN)) {
        childHeight = currentAbsoluteChild->style.dimensions[CSS_HEIGHT] + getMarginAxis(currentAbsoluteChild, CSS_FLEX_DIRECTION_COLUMN);
      } else {
        // If the child doesn't have a specified height, compute the height based on the top/bottom offsets if they're defined.
        if (isPosDefined(currentAbsoluteChild, CSS_TOP) && isPosDefined(currentAbsoluteChild, CSS_BOTTOM)) {
          childHeight = node->layout.measured_dimensions[CSS_HEIGHT] -
            (getLeadingBorder(node, CSS_FLEX_DIRECTION_COLUMN) + getTrailingBorder(node, CSS_FLEX_DIRECTION_COLUMN)) -
            (currentAbsoluteChild->style.position[CSS_TOP] + currentAbsoluteChild->style.position[CSS_BOTTOM]);
          childHeight = boundAxis(currentAbsoluteChild, CSS_FLEX_DIRECTION_COLUMN, childHeight);
        }
      }

      // If we're still missing one or the other dimension, measure the content.
      if (isUndefined(childWidth) || isUndefined(childHeight)) {
        childWidthMeasureMode = isUndefined(childWidth) ? CSS_MEASURE_MODE_UNDEFINED : CSS_MEASURE_MODE_EXACTLY;
        childHeightMeasureMode = isUndefined(childHeight) ? CSS_MEASURE_MODE_UNDEFINED : CSS_MEASURE_MODE_EXACTLY;

        // According to the spec, if the main size is not definite and the
        // child's inline axis is parallel to the main axis (i.e. it's
        // horizontal), the child should be sized using "UNDEFINED" in
        // the main size. Otherwise use "AT_MOST" in the cross axis.
        if (!isMainAxisRow && isUndefined(childWidth) && !isUndefined(availableInnerWidth)) {
          childWidth = availableInnerWidth;
          childWidthMeasureMode = CSS_MEASURE_MODE_AT_MOST;
        }

        // The W3C spec doesn't say anything about the 'overflow' property,
        // but all major browsers appear to implement the following logic.
        if (node->style.overflow == CSS_OVERFLOW_HIDDEN) {
          if (isMainAxisRow && isUndefined(childHeight) && !isUndefined(availableInnerHeight)) {
            childHeight = availableInnerHeight;
            childHeightMeasureMode = CSS_MEASURE_MODE_AT_MOST;
          }
        }

        layoutNodeInternal(currentAbsoluteChild, childWidth, childHeight, direction, childWidthMeasureMode, childHeightMeasureMode, false, "abs-measure");
        childWidth = currentAbsoluteChild->layout.measured_dimensions[CSS_WIDTH] + getMarginAxis(currentAbsoluteChild, CSS_FLEX_DIRECTION_ROW);
        childHeight = currentAbsoluteChild->layout.measured_dimensions[CSS_HEIGHT] + getMarginAxis(currentAbsoluteChild, CSS_FLEX_DIRECTION_COLUMN);
      }

      layoutNodeInternal(currentAbsoluteChild, childWidth, childHeight, direction, CSS_MEASURE_MODE_EXACTLY, CSS_MEASURE_MODE_EXACTLY, true, "abs-layout");

      if (isPosDefined(currentAbsoluteChild, trailing[CSS_FLEX_DIRECTION_ROW]) &&
          !isPosDefined(currentAbsoluteChild, leading[CSS_FLEX_DIRECTION_ROW])) {
        currentAbsoluteChild->layout.position[leading[CSS_FLEX_DIRECTION_ROW]] =
          node->layout.measured_dimensions[dim[CSS_FLEX_DIRECTION_ROW]] -
          currentAbsoluteChild->layout.measured_dimensions[dim[CSS_FLEX_DIRECTION_ROW]] -
          getPosition(currentAbsoluteChild, trailing[CSS_FLEX_DIRECTION_ROW]);
      }

      if (isPosDefined(currentAbsoluteChild, trailing[CSS_FLEX_DIRECTION_COLUMN]) &&
          !isPosDefined(currentAbsoluteChild, leading[CSS_FLEX_DIRECTION_COLUMN])) {
        currentAbsoluteChild->layout.position[leading[CSS_FLEX_DIRECTION_COLUMN]] =
          node->layout.measured_dimensions[dim[CSS_FLEX_DIRECTION_COLUMN]] -
          currentAbsoluteChild->layout.measured_dimensions[dim[CSS_FLEX_DIRECTION_COLUMN]] -
          getPosition(currentAbsoluteChild, trailing[CSS_FLEX_DIRECTION_COLUMN]);
      }
    }

    currentAbsoluteChild = currentAbsoluteChild->next_child;
  }
  /** END_GENERATED **/
}

int gDepth = 0;
bool gPrintTree = false;
bool gPrintChanges = false;
bool gPrintSkips = false;

static const char* spacer = "                                                            ";

static const char* getSpacer(unsigned long level) {
  unsigned long spacerLen = strlen(spacer);
  if (level > spacerLen) {
    level = spacerLen;
  }
  return &spacer[spacerLen - level];
}

static const char* getModeName(css_measure_mode_t mode, bool performLayout) {
  const char* kMeasureModeNames[CSS_MEASURE_MODE_COUNT] = {
    "UNDEFINED",
    "EXACTLY",
    "AT_MOST"
  };
  const char* kLayoutModeNames[CSS_MEASURE_MODE_COUNT] = {
    "LAY_UNDEFINED",
    "LAY_EXACTLY",
    "LAY_AT_MOST"
  };

  if (mode >= CSS_MEASURE_MODE_COUNT) {
    return "";
  }

  return performLayout? kLayoutModeNames[mode] : kMeasureModeNames[mode];
}

static bool canUseCachedMeasurement(
    bool is_text_node,
    float available_width,
    float available_height,
    float margin_row,
    float margin_column,
    css_measure_mode_t width_measure_mode,
    css_measure_mode_t height_measure_mode,
    css_cached_measurement_t cached_layout) {

  bool is_height_same =
    (cached_layout.height_measure_mode == CSS_MEASURE_MODE_UNDEFINED && height_measure_mode == CSS_MEASURE_MODE_UNDEFINED) ||
      (cached_layout.height_measure_mode == height_measure_mode && eq(cached_layout.available_height, available_height));

  bool is_width_same =
    (cached_layout.width_measure_mode == CSS_MEASURE_MODE_UNDEFINED && width_measure_mode == CSS_MEASURE_MODE_UNDEFINED) ||
      (cached_layout.width_measure_mode == width_measure_mode && eq(cached_layout.available_width, available_width));

  if (is_height_same && is_width_same) {
    return true;
  }

  bool is_height_valid =
    (cached_layout.height_measure_mode == CSS_MEASURE_MODE_UNDEFINED && height_measure_mode == CSS_MEASURE_MODE_AT_MOST && cached_layout.computed_height <= (available_height - margin_column)) ||
      (height_measure_mode == CSS_MEASURE_MODE_EXACTLY && eq(cached_layout.computed_height, available_height - margin_column));

  if (is_width_same && is_height_valid) {
    return true;
  }

  bool is_width_valid =
    (cached_layout.width_measure_mode == CSS_MEASURE_MODE_UNDEFINED && width_measure_mode == CSS_MEASURE_MODE_AT_MOST && cached_layout.computed_width <= (available_width - margin_row)) ||
      (width_measure_mode == CSS_MEASURE_MODE_EXACTLY && eq(cached_layout.computed_width, available_width - margin_row));

  if (is_height_same && is_width_valid) {
    return true;
  }

  if (is_height_valid && is_width_valid) {
    return true;
  }

  // We know this to be text so we can apply some more specialized heuristics.
  if (is_text_node) {
    if (is_width_same) {
      if (height_measure_mode == CSS_MEASURE_MODE_UNDEFINED) {
        // Width is the same and height is not restricted. Re-use cahced value.
        return true;
      }

      if (height_measure_mode == CSS_MEASURE_MODE_AT_MOST &&
          cached_layout.computed_height < (available_height - margin_column)) {
        // Width is the same and height restriction is greater than the cached height. Re-use cached value.
        return true;
      }

      // Width is the same but height restriction imposes smaller height than previously measured.
      // Update the cached value to respect the new height restriction.
      cached_layout.computed_height = available_height - margin_column;
      return true;
    }

    if (cached_layout.width_measure_mode == CSS_MEASURE_MODE_UNDEFINED) {
      if (width_measure_mode == CSS_MEASURE_MODE_UNDEFINED ||
           (width_measure_mode == CSS_MEASURE_MODE_AT_MOST &&
            cached_layout.computed_width <= (available_width - margin_row))) {
        // Previsouly this text was measured with no width restriction, if width is now restricted
        // but to a larger value than the previsouly measured width we can re-use the measurement
        // as we know it will fit.
        return true;
      }
    }
  }

  return false;
}

//
// This is a wrapper around the layoutNodeImpl function. It determines
// whether the layout request is redundant and can be skipped.
//
// Parameters:
//  Input parameters are the same as layoutNodeImpl (see above)
//  Return parameter is true if layout was performed, false if skipped
//
bool layoutNodeInternal(css_node_t* node, float availableWidth, float availableHeight,
    css_direction_t parentDirection, css_measure_mode_t widthMeasureMode, css_measure_mode_t heightMeasureMode, bool performLayout, char* reason) {
  css_layout_t* layout = &node->layout;

  gDepth++;

  bool needToVisitNode = (node->is_dirty(node->context) && layout->generation_count != gCurrentGenerationCount) ||
    layout->last_parent_direction != parentDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout->next_cached_measurements_index = 0;
    layout->cached_layout.width_measure_mode = (css_measure_mode_t)-1;
    layout->cached_layout.height_measure_mode = (css_measure_mode_t)-1;
  }

  css_cached_measurement_t* cachedResults = NULL;

  // Determine whether the results are already cached. We maintain a separate
  // cache for layouts and measurements. A layout operation modifies the positions
  // and dimensions for nodes in the subtree. The algorithm assumes that each node
  // gets layed out a maximum of one time per tree layout, but multiple measurements
  // may be required to resolve all of the flex dimensions.
  // We handle nodes with measure functions specially here because they are the most
  // expensive to measure, so it's worth avoiding redundant measurements if at all possible.
  if (isMeasureDefined(node)) {
    float marginAxisRow = getMarginAxis(node, CSS_FLEX_DIRECTION_ROW);
    float marginAxisColumn = getMarginAxis(node, CSS_FLEX_DIRECTION_COLUMN);

    // First, try to use the layout cache.
    if (canUseCachedMeasurement(node->is_text_node && node->is_text_node(node->context), availableWidth, availableHeight, marginAxisRow, marginAxisColumn,
        widthMeasureMode, heightMeasureMode, layout->cached_layout)) {
      cachedResults = &layout->cached_layout;
    } else {
      // Try to use the measurement cache.
      for (int i = 0; i < layout->next_cached_measurements_index; i++) {
        if (canUseCachedMeasurement(node->is_text_node && node->is_text_node(node->context), availableWidth, availableHeight, marginAxisRow, marginAxisColumn,
            widthMeasureMode, heightMeasureMode, layout->cached_measurements[i])) {
          cachedResults = &layout->cached_measurements[i];
          break;
        }
      }
    }
  } else if (performLayout) {
    if (eq(layout->cached_layout.available_width, availableWidth) &&
        eq(layout->cached_layout.available_height, availableHeight) &&
        layout->cached_layout.width_measure_mode == widthMeasureMode &&
        layout->cached_layout.height_measure_mode == heightMeasureMode) {

      cachedResults = &layout->cached_layout;
    }
  } else {
    for (int i = 0; i < layout->next_cached_measurements_index; i++) {
      if (eq(layout->cached_measurements[i].available_width, availableWidth) &&
          eq(layout->cached_measurements[i].available_height, availableHeight) &&
          layout->cached_measurements[i].width_measure_mode == widthMeasureMode &&
          layout->cached_measurements[i].height_measure_mode == heightMeasureMode) {

        cachedResults = &layout->cached_measurements[i];
        break;
      }
    }
  }

  if (!needToVisitNode && cachedResults != NULL) {
    layout->measured_dimensions[CSS_WIDTH] = cachedResults->computed_width;
    layout->measured_dimensions[CSS_HEIGHT] = cachedResults->computed_height;

    if (gPrintChanges && gPrintSkips) {
      printf("%s%d.{[skipped] ", getSpacer(gDepth), gDepth);
      if (node->print) {
        node->print(node->context);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
        getModeName(widthMeasureMode, performLayout),
        getModeName(heightMeasureMode, performLayout),
        availableWidth, availableHeight,
        cachedResults->computed_width, cachedResults->computed_height, reason);
    }
  } else {

    if (gPrintChanges) {
      printf("%s%d.{%s", getSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node->context);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f %s\n",
        getModeName(widthMeasureMode, performLayout),
        getModeName(heightMeasureMode, performLayout),
        availableWidth, availableHeight, reason);
    }

    layoutNodeImpl(node, availableWidth, availableHeight, parentDirection, widthMeasureMode, heightMeasureMode, performLayout);

    if (gPrintChanges) {
      printf("%s%d.}%s", getSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node->context);
      }
      printf("wm: %s, hm: %s, d: (%f, %f) %s\n",
        getModeName(widthMeasureMode, performLayout),
        getModeName(heightMeasureMode, performLayout),
        layout->measured_dimensions[CSS_WIDTH], layout->measured_dimensions[CSS_HEIGHT], reason);
    }

    layout->last_parent_direction = parentDirection;

    if (cachedResults == NULL) {
      if (layout->next_cached_measurements_index == CSS_MAX_CACHED_RESULT_COUNT) {
        if (gPrintChanges) {
          printf("Out of cache entries!\n");
        }
        layout->next_cached_measurements_index = 0;
      }

      css_cached_measurement_t* newCacheEntry;
      if (performLayout) {
        // Use the single layout cache entry.
        newCacheEntry = &layout->cached_layout;
      } else {
        // Allocate a new measurement cache entry.
        newCacheEntry = &layout->cached_measurements[layout->next_cached_measurements_index];
        layout->next_cached_measurements_index++;
      }

      newCacheEntry->available_width = availableWidth;
      newCacheEntry->available_height = availableHeight;
      newCacheEntry->width_measure_mode = widthMeasureMode;
      newCacheEntry->height_measure_mode = heightMeasureMode;
      newCacheEntry->computed_width = layout->measured_dimensions[CSS_WIDTH];
      newCacheEntry->computed_height = layout->measured_dimensions[CSS_HEIGHT];
    }
  }

  if (performLayout) {
    node->layout.dimensions[CSS_WIDTH] = node->layout.measured_dimensions[CSS_WIDTH];
    node->layout.dimensions[CSS_HEIGHT] = node->layout.measured_dimensions[CSS_HEIGHT];
    layout->should_update = true;
  }

  gDepth--;
  layout->generation_count = gCurrentGenerationCount;
  return (needToVisitNode || cachedResults == NULL);
}

void layoutNode(css_node_t* node, float availableWidth, float availableHeight, css_direction_t parentDirection) {
  // Increment the generation count. This will force the recursive routine to visit
  // all dirty nodes at least once. Subsequent visits will be skipped if the input
  // parameters don't change.
  gCurrentGenerationCount++;

  // If the caller didn't specify a height/width, use the dimensions
  // specified in the style.
  if (isUndefined(availableWidth) && isStyleDimDefined(node, CSS_FLEX_DIRECTION_ROW)) {
    availableWidth = node->style.dimensions[CSS_WIDTH] + getMarginAxis(node, CSS_FLEX_DIRECTION_ROW);
  }
  if (isUndefined(availableHeight) && isStyleDimDefined(node, CSS_FLEX_DIRECTION_COLUMN)) {
    availableHeight = node->style.dimensions[CSS_HEIGHT] + getMarginAxis(node, CSS_FLEX_DIRECTION_COLUMN);
  }

  css_measure_mode_t widthMeasureMode = isUndefined(availableWidth) ? CSS_MEASURE_MODE_UNDEFINED : CSS_MEASURE_MODE_EXACTLY;
  css_measure_mode_t heightMeasureMode = isUndefined(availableHeight) ? CSS_MEASURE_MODE_UNDEFINED : CSS_MEASURE_MODE_EXACTLY;

  if (layoutNodeInternal(node, availableWidth, availableHeight, parentDirection, widthMeasureMode, heightMeasureMode, true, "initial")) {

    setPosition(node, node->layout.direction);

    if (gPrintTree) {
      print_css_node(node, CSS_PRINT_LAYOUT | CSS_PRINT_CHILDREN | CSS_PRINT_STYLE);
    }
  }
}
