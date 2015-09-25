/**
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! This file is a check-in from github!                       !!
 * !!                                                            !!
 * !! You should not modify this file directly. Instead:         !!
 * !! 1) Go to https://github.com/facebook/css-layout            !!
 * !! 2) Make a pull request and get it merged                   !!
 * !! 3) Copy the file from github to here                       !!
 * !!    (don't forget to keep this header)                      !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

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

bool isUndefined(float value) {
  return isnan(value);
}

static bool eq(float a, float b) {
  if (isUndefined(a)) {
    return isUndefined(b);
  }
  return fabs(a - b) < 0.0001;
}

void init_css_node(css_node_t *node) {
  node->style.align_items = CSS_ALIGN_STRETCH;
  node->style.align_content = CSS_ALIGN_FLEX_START;

  node->style.direction = CSS_DIRECTION_INHERIT;
  node->style.flex_direction = CSS_FLEX_DIRECTION_COLUMN;

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
  node->layout.last_requested_dimensions[CSS_WIDTH] = -1;
  node->layout.last_requested_dimensions[CSS_HEIGHT] = -1;
  node->layout.last_parent_max_width = -1;
  node->layout.last_direction = (css_direction_t)-1;
  node->layout.should_update = true;
}

css_node_t *new_css_node() {
  css_node_t *node = (css_node_t *)calloc(1, sizeof(*node));
  init_css_node(node);
  return node;
}

void free_css_node(css_node_t *node) {
  free(node);
}

static void indent(int n) {
  for (int i = 0; i < n; ++i) {
    printf("  ");
  }
}

static void print_number_0(const char *str, float number) {
  if (!eq(number, 0)) {
    printf("%s: %g, ", str, number);
  }
}

static void print_number_nan(const char *str, float number) {
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
  css_node_t *node,
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
      printf("flexDirection: 'columnReverse', ");
    } else if (node->style.flex_direction == CSS_FLEX_DIRECTION_ROW) {
      printf("flexDirection: 'row', ");
    } else if (node->style.flex_direction == CSS_FLEX_DIRECTION_ROW_REVERSE) {
      printf("flexDirection: 'rowReverse', ");
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
      print_number_0("padding", node->style.margin[CSS_LEFT]);
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

void print_css_node(css_node_t *node, css_print_options_t options) {
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

static float getLeadingMargin(css_node_t *node, css_flex_direction_t axis) {
  if (isRowDirection(axis) && !isUndefined(node->style.margin[CSS_START])) {
    return node->style.margin[CSS_START];
  }

  return node->style.margin[leading[axis]];
}

static float getTrailingMargin(css_node_t *node, css_flex_direction_t axis) {
  if (isRowDirection(axis) && !isUndefined(node->style.margin[CSS_END])) {
    return node->style.margin[CSS_END];
  }

  return node->style.margin[trailing[axis]];
}

static float getLeadingPadding(css_node_t *node, css_flex_direction_t axis) {
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

static float getTrailingPadding(css_node_t *node, css_flex_direction_t axis) {
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

static float getLeadingBorder(css_node_t *node, css_flex_direction_t axis) {
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

static float getTrailingBorder(css_node_t *node, css_flex_direction_t axis) {
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

static float getLeadingPaddingAndBorder(css_node_t *node, css_flex_direction_t axis) {
  return getLeadingPadding(node, axis) + getLeadingBorder(node, axis);
}

static float getTrailingPaddingAndBorder(css_node_t *node, css_flex_direction_t axis) {
  return getTrailingPadding(node, axis) + getTrailingBorder(node, axis);
}

static float getBorderAxis(css_node_t *node, css_flex_direction_t axis) {
  return getLeadingBorder(node, axis) + getTrailingBorder(node, axis);
}

static float getMarginAxis(css_node_t *node, css_flex_direction_t axis) {
  return getLeadingMargin(node, axis) + getTrailingMargin(node, axis);
}

static float getPaddingAndBorderAxis(css_node_t *node, css_flex_direction_t axis) {
  return getLeadingPaddingAndBorder(node, axis) + getTrailingPaddingAndBorder(node, axis);
}

static css_align_t getAlignItem(css_node_t *node, css_node_t *child) {
  if (child->style.align_self != CSS_ALIGN_AUTO) {
    return child->style.align_self;
  }
  return node->style.align_items;
}

static css_direction_t resolveDirection(css_node_t *node, css_direction_t parentDirection) {
  css_direction_t direction = node->style.direction;

  if (direction == CSS_DIRECTION_INHERIT) {
    direction = parentDirection > CSS_DIRECTION_INHERIT ? parentDirection : CSS_DIRECTION_LTR;
  }

  return direction;
}

static css_flex_direction_t getFlexDirection(css_node_t *node) {
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

static float getFlex(css_node_t *node) {
  return node->style.flex;
}

static bool isFlex(css_node_t *node) {
  return (
    node->style.position_type == CSS_POSITION_RELATIVE &&
    getFlex(node) > 0
  );
}

static bool isFlexWrap(css_node_t *node) {
  return node->style.flex_wrap == CSS_WRAP;
}

static float getDimWithMargin(css_node_t *node, css_flex_direction_t axis) {
  return node->layout.dimensions[dim[axis]] +
    getLeadingMargin(node, axis) +
    getTrailingMargin(node, axis);
}

static bool isDimDefined(css_node_t *node, css_flex_direction_t axis) {
  float value = node->style.dimensions[dim[axis]];
  return !isUndefined(value) && value >= 0.0;
}

static bool isPosDefined(css_node_t *node, css_position_t position) {
  return !isUndefined(node->style.position[position]);
}

static bool isMeasureDefined(css_node_t *node) {
  return node->measure;
}

static float getPosition(css_node_t *node, css_position_t position) {
  float result = node->style.position[position];
  if (!isUndefined(result)) {
    return result;
  }
  return 0;
}

static float boundAxis(css_node_t *node, css_flex_direction_t axis, float value) {
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

// When the user specifically sets a value for width or height
static void setDimensionFromStyle(css_node_t *node, css_flex_direction_t axis) {
  // The parent already computed us a width or height. We just skip it
  if (!isUndefined(node->layout.dimensions[dim[axis]])) {
    return;
  }
  // We only run if there's a width or height defined
  if (!isDimDefined(node, axis)) {
    return;
  }

  // The dimensions can never be smaller than the padding and border
  node->layout.dimensions[dim[axis]] = fmaxf(
    boundAxis(node, axis, node->style.dimensions[dim[axis]]),
    getPaddingAndBorderAxis(node, axis)
  );
}

static void setTrailingPosition(css_node_t *node, css_node_t *child, css_flex_direction_t axis) {
    child->layout.position[trailing[axis]] = node->layout.dimensions[dim[axis]] -
      child->layout.dimensions[dim[axis]] - child->layout.position[pos[axis]];
  }

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
static float getRelativePosition(css_node_t *node, css_flex_direction_t axis) {
  float lead = node->style.position[leading[axis]];
  if (!isUndefined(lead)) {
    return lead;
  }
  return -getPosition(node, trailing[axis]);
}

static void layoutNodeImpl(css_node_t *node, float parentMaxWidth, css_direction_t parentDirection) {
  /** START_GENERATED **/
  css_direction_t direction = resolveDirection(node, parentDirection);
  css_flex_direction_t mainAxis = resolveAxis(getFlexDirection(node), direction);
  css_flex_direction_t crossAxis = getCrossFlexDirection(mainAxis, direction);
  css_flex_direction_t resolvedRowAxis = resolveAxis(CSS_FLEX_DIRECTION_ROW, direction);

  // Handle width and height style attributes
  setDimensionFromStyle(node, mainAxis);
  setDimensionFromStyle(node, crossAxis);

  // Set the resolved resolution in the node's layout
  node->layout.direction = direction;

  // The position is set by the parent, but we need to complete it with a
  // delta composed of the margin and left/top/right/bottom
  node->layout.position[leading[mainAxis]] += getLeadingMargin(node, mainAxis) +
    getRelativePosition(node, mainAxis);
  node->layout.position[trailing[mainAxis]] += getTrailingMargin(node, mainAxis) +
    getRelativePosition(node, mainAxis);
  node->layout.position[leading[crossAxis]] += getLeadingMargin(node, crossAxis) +
    getRelativePosition(node, crossAxis);
  node->layout.position[trailing[crossAxis]] += getTrailingMargin(node, crossAxis) +
    getRelativePosition(node, crossAxis);

  // Inline immutable values from the target node to avoid excessive method
  // invocations during the layout calculation.
  int childCount = node->children_count;
  float paddingAndBorderAxisResolvedRow = getPaddingAndBorderAxis(node, resolvedRowAxis);

  if (isMeasureDefined(node)) {
    bool isResolvedRowDimDefined = !isUndefined(node->layout.dimensions[dim[resolvedRowAxis]]);

    float width = CSS_UNDEFINED;
    if (isDimDefined(node, resolvedRowAxis)) {
      width = node->style.dimensions[CSS_WIDTH];
    } else if (isResolvedRowDimDefined) {
      width = node->layout.dimensions[dim[resolvedRowAxis]];
    } else {
      width = parentMaxWidth -
        getMarginAxis(node, resolvedRowAxis);
    }
    width -= paddingAndBorderAxisResolvedRow;

    // We only need to give a dimension for the text if we haven't got any
    // for it computed yet. It can either be from the style attribute or because
    // the element is flexible.
    bool isRowUndefined = !isDimDefined(node, resolvedRowAxis) && !isResolvedRowDimDefined;
    bool isColumnUndefined = !isDimDefined(node, CSS_FLEX_DIRECTION_COLUMN) &&
      isUndefined(node->layout.dimensions[dim[CSS_FLEX_DIRECTION_COLUMN]]);

    // Let's not measure the text if we already know both dimensions
    if (isRowUndefined || isColumnUndefined) {
      css_dim_t measureDim = node->measure(
        node->context,

        width
      );
      if (isRowUndefined) {
        node->layout.dimensions[CSS_WIDTH] = measureDim.dimensions[CSS_WIDTH] +
          paddingAndBorderAxisResolvedRow;
      }
      if (isColumnUndefined) {
        node->layout.dimensions[CSS_HEIGHT] = measureDim.dimensions[CSS_HEIGHT] +
          getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_COLUMN);
      }
    }
    if (childCount == 0) {
      return;
    }
  }

  bool isNodeFlexWrap = isFlexWrap(node);

  css_justify_t justifyContent = node->style.justify_content;

  float leadingPaddingAndBorderMain = getLeadingPaddingAndBorder(node, mainAxis);
  float leadingPaddingAndBorderCross = getLeadingPaddingAndBorder(node, crossAxis);
  float paddingAndBorderAxisMain = getPaddingAndBorderAxis(node, mainAxis);
  float paddingAndBorderAxisCross = getPaddingAndBorderAxis(node, crossAxis);

  bool isMainDimDefined = !isUndefined(node->layout.dimensions[dim[mainAxis]]);
  bool isCrossDimDefined = !isUndefined(node->layout.dimensions[dim[crossAxis]]);
  bool isMainRowDirection = isRowDirection(mainAxis);

  int i;
  int ii;
  css_node_t* child;
  css_flex_direction_t axis;

  css_node_t* firstAbsoluteChild = NULL;
  css_node_t* currentAbsoluteChild = NULL;

  float definedMainDim = CSS_UNDEFINED;
  if (isMainDimDefined) {
    definedMainDim = node->layout.dimensions[dim[mainAxis]] - paddingAndBorderAxisMain;
  }

  // We want to execute the next two loops one per line with flex-wrap
  int startLine = 0;
  int endLine = 0;
  // int nextOffset = 0;
  int alreadyComputedNextLayout = 0;
  // We aggregate the total dimensions of the container in those two variables
  float linesCrossDim = 0;
  float linesMainDim = 0;
  int linesCount = 0;
  while (endLine < childCount) {
    // <Loop A> Layout non flexible children and count children by type

    // mainContentDim is accumulation of the dimensions and margin of all the
    // non flexible children. This will be used in order to either set the
    // dimensions of the node if none already exist, or to compute the
    // remaining space left for the flexible children.
    float mainContentDim = 0;

    // There are three kind of children, non flexible, flexible and absolute.
    // We need to know how many there are in order to distribute the space.
    int flexibleChildrenCount = 0;
    float totalFlexible = 0;
    int nonFlexibleChildrenCount = 0;

    // Use the line loop to position children in the main axis for as long
    // as they are using a simple stacking behaviour. Children that are
    // immediately stacked in the initial loop will not be touched again
    // in <Loop C>.
    bool isSimpleStackMain =
        (isMainDimDefined && justifyContent == CSS_JUSTIFY_FLEX_START) ||
        (!isMainDimDefined && justifyContent != CSS_JUSTIFY_CENTER);
    int firstComplexMain = (isSimpleStackMain ? childCount : startLine);

    // Use the initial line loop to position children in the cross axis for
    // as long as they are relatively positioned with alignment STRETCH or
    // FLEX_START. Children that are immediately stacked in the initial loop
    // will not be touched again in <Loop D>.
    bool isSimpleStackCross = true;
    int firstComplexCross = childCount;

    css_node_t* firstFlexChild = NULL;
    css_node_t* currentFlexChild = NULL;

    float mainDim = leadingPaddingAndBorderMain;
    float crossDim = 0;

    float maxWidth;
    for (i = startLine; i < childCount; ++i) {
      child = node->get_child(node->context, i);
      child->line_index = linesCount;

      child->next_absolute_child = NULL;
      child->next_flex_child = NULL;

      css_align_t alignItem = getAlignItem(node, child);

      // Pre-fill cross axis dimensions when the child is using stretch before
      // we call the recursive layout pass
      if (alignItem == CSS_ALIGN_STRETCH &&
          child->style.position_type == CSS_POSITION_RELATIVE &&
          isCrossDimDefined &&
          !isDimDefined(child, crossAxis)) {
        child->layout.dimensions[dim[crossAxis]] = fmaxf(
          boundAxis(child, crossAxis, node->layout.dimensions[dim[crossAxis]] -
            paddingAndBorderAxisCross - getMarginAxis(child, crossAxis)),
          // You never want to go smaller than padding
          getPaddingAndBorderAxis(child, crossAxis)
        );
      } else if (child->style.position_type == CSS_POSITION_ABSOLUTE) {
        // Store a private linked list of absolutely positioned children
        // so that we can efficiently traverse them later.
        if (firstAbsoluteChild == NULL) {
          firstAbsoluteChild = child;
        }
        if (currentAbsoluteChild != NULL) {
          currentAbsoluteChild->next_absolute_child = child;
        }
        currentAbsoluteChild = child;

        // Pre-fill dimensions when using absolute position and both offsets for the axis are defined (either both
        // left and right or top and bottom).
        for (ii = 0; ii < 2; ii++) {
          axis = (ii != 0) ? CSS_FLEX_DIRECTION_ROW : CSS_FLEX_DIRECTION_COLUMN;
          if (!isUndefined(node->layout.dimensions[dim[axis]]) &&
              !isDimDefined(child, axis) &&
              isPosDefined(child, leading[axis]) &&
              isPosDefined(child, trailing[axis])) {
            child->layout.dimensions[dim[axis]] = fmaxf(
              boundAxis(child, axis, node->layout.dimensions[dim[axis]] -
                getPaddingAndBorderAxis(node, axis) -
                getMarginAxis(child, axis) -
                getPosition(child, leading[axis]) -
                getPosition(child, trailing[axis])),
              // You never want to go smaller than padding
              getPaddingAndBorderAxis(child, axis)
            );
          }
        }
      }

      float nextContentDim = 0;

      // It only makes sense to consider a child flexible if we have a computed
      // dimension for the node->
      if (isMainDimDefined && isFlex(child)) {
        flexibleChildrenCount++;
        totalFlexible += child->style.flex;

        // Store a private linked list of flexible children so that we can
        // efficiently traverse them later.
        if (firstFlexChild == NULL) {
          firstFlexChild = child;
        }
        if (currentFlexChild != NULL) {
          currentFlexChild->next_flex_child = child;
        }
        currentFlexChild = child;

        // Even if we don't know its exact size yet, we already know the padding,
        // border and margin. We'll use this partial information, which represents
        // the smallest possible size for the child, to compute the remaining
        // available space.
        nextContentDim = getPaddingAndBorderAxis(child, mainAxis) +
          getMarginAxis(child, mainAxis);

      } else {
        maxWidth = CSS_UNDEFINED;
        if (!isMainRowDirection) {
          if (isDimDefined(node, resolvedRowAxis)) {
            maxWidth = node->layout.dimensions[dim[resolvedRowAxis]] -
              paddingAndBorderAxisResolvedRow;
          } else {
            maxWidth = parentMaxWidth -
              getMarginAxis(node, resolvedRowAxis) -
              paddingAndBorderAxisResolvedRow;
          }
        }

        // This is the main recursive call. We layout non flexible children.
        if (alreadyComputedNextLayout == 0) {
          layoutNode(child, maxWidth, direction);
        }

        // Absolute positioned elements do not take part of the layout, so we
        // don't use them to compute mainContentDim
        if (child->style.position_type == CSS_POSITION_RELATIVE) {
          nonFlexibleChildrenCount++;
          // At this point we know the final size and margin of the element.
          nextContentDim = getDimWithMargin(child, mainAxis);
        }
      }

      // The element we are about to add would make us go to the next line
      if (isNodeFlexWrap &&
          isMainDimDefined &&
          mainContentDim + nextContentDim > definedMainDim &&
          // If there's only one element, then it's bigger than the content
          // and needs its own line
          i != startLine) {
        nonFlexibleChildrenCount--;
        alreadyComputedNextLayout = 1;
        break;
      }

      // Disable simple stacking in the main axis for the current line as
      // we found a non-trivial child-> The remaining children will be laid out
      // in <Loop C>.
      if (isSimpleStackMain &&
          (child->style.position_type != CSS_POSITION_RELATIVE || isFlex(child))) {
        isSimpleStackMain = false;
        firstComplexMain = i;
      }

      // Disable simple stacking in the cross axis for the current line as
      // we found a non-trivial child-> The remaining children will be laid out
      // in <Loop D>.
      if (isSimpleStackCross &&
          (child->style.position_type != CSS_POSITION_RELATIVE ||
              (alignItem != CSS_ALIGN_STRETCH && alignItem != CSS_ALIGN_FLEX_START) ||
              isUndefined(child->layout.dimensions[dim[crossAxis]]))) {
        isSimpleStackCross = false;
        firstComplexCross = i;
      }

      if (isSimpleStackMain) {
        child->layout.position[pos[mainAxis]] += mainDim;
        if (isMainDimDefined) {
          setTrailingPosition(node, child, mainAxis);
        }

        mainDim += getDimWithMargin(child, mainAxis);
        crossDim = fmaxf(crossDim, boundAxis(child, crossAxis, getDimWithMargin(child, crossAxis)));
      }

      if (isSimpleStackCross) {
        child->layout.position[pos[crossAxis]] += linesCrossDim + leadingPaddingAndBorderCross;
        if (isCrossDimDefined) {
          setTrailingPosition(node, child, crossAxis);
        }
      }

      alreadyComputedNextLayout = 0;
      mainContentDim += nextContentDim;
      endLine = i + 1;
    }

    // <Loop B> Layout flexible children and allocate empty space

    // In order to position the elements in the main axis, we have two
    // controls. The space between the beginning and the first element
    // and the space between each two elements.
    float leadingMainDim = 0;
    float betweenMainDim = 0;

    // The remaining available space that needs to be allocated
    float remainingMainDim = 0;
    if (isMainDimDefined) {
      remainingMainDim = definedMainDim - mainContentDim;
    } else {
      remainingMainDim = fmaxf(mainContentDim, 0) - mainContentDim;
    }

    // If there are flexible children in the mix, they are going to fill the
    // remaining space
    if (flexibleChildrenCount != 0) {
      float flexibleMainDim = remainingMainDim / totalFlexible;
      float baseMainDim;
      float boundMainDim;

      // If the flex share of remaining space doesn't meet min/max bounds,
      // remove this child from flex calculations.
      currentFlexChild = firstFlexChild;
      while (currentFlexChild != NULL) {
        baseMainDim = flexibleMainDim * currentFlexChild->style.flex +
            getPaddingAndBorderAxis(currentFlexChild, mainAxis);
        boundMainDim = boundAxis(currentFlexChild, mainAxis, baseMainDim);

        if (baseMainDim != boundMainDim) {
          remainingMainDim -= boundMainDim;
          totalFlexible -= currentFlexChild->style.flex;
        }

        currentFlexChild = currentFlexChild->next_flex_child;
      }
      flexibleMainDim = remainingMainDim / totalFlexible;

      // The non flexible children can overflow the container, in this case
      // we should just assume that there is no space available.
      if (flexibleMainDim < 0) {
        flexibleMainDim = 0;
      }

      currentFlexChild = firstFlexChild;
      while (currentFlexChild != NULL) {
        // At this point we know the final size of the element in the main
        // dimension
        currentFlexChild->layout.dimensions[dim[mainAxis]] = boundAxis(currentFlexChild, mainAxis,
          flexibleMainDim * currentFlexChild->style.flex +
              getPaddingAndBorderAxis(currentFlexChild, mainAxis)
        );

        maxWidth = CSS_UNDEFINED;
        if (isDimDefined(node, resolvedRowAxis)) {
          maxWidth = node->layout.dimensions[dim[resolvedRowAxis]] -
            paddingAndBorderAxisResolvedRow;
        } else if (!isMainRowDirection) {
          maxWidth = parentMaxWidth -
            getMarginAxis(node, resolvedRowAxis) -
            paddingAndBorderAxisResolvedRow;
        }

        // And we recursively call the layout algorithm for this child
        layoutNode(currentFlexChild, maxWidth, direction);

        child = currentFlexChild;
        currentFlexChild = currentFlexChild->next_flex_child;
        child->next_flex_child = NULL;
      }

    // We use justifyContent to figure out how to allocate the remaining
    // space available
    } else if (justifyContent != CSS_JUSTIFY_FLEX_START) {
      if (justifyContent == CSS_JUSTIFY_CENTER) {
        leadingMainDim = remainingMainDim / 2;
      } else if (justifyContent == CSS_JUSTIFY_FLEX_END) {
        leadingMainDim = remainingMainDim;
      } else if (justifyContent == CSS_JUSTIFY_SPACE_BETWEEN) {
        remainingMainDim = fmaxf(remainingMainDim, 0);
        if (flexibleChildrenCount + nonFlexibleChildrenCount - 1 != 0) {
          betweenMainDim = remainingMainDim /
            (flexibleChildrenCount + nonFlexibleChildrenCount - 1);
        } else {
          betweenMainDim = 0;
        }
      } else if (justifyContent == CSS_JUSTIFY_SPACE_AROUND) {
        // Space on the edges is half of the space between elements
        betweenMainDim = remainingMainDim /
          (flexibleChildrenCount + nonFlexibleChildrenCount);
        leadingMainDim = betweenMainDim / 2;
      }
    }

    // <Loop C> Position elements in the main axis and compute dimensions

    // At this point, all the children have their dimensions set. We need to
    // find their position. In order to do that, we accumulate data in
    // variables that are also useful to compute the total dimensions of the
    // container!
    mainDim += leadingMainDim;

    for (i = firstComplexMain; i < endLine; ++i) {
      child = node->get_child(node->context, i);

      if (child->style.position_type == CSS_POSITION_ABSOLUTE &&
          isPosDefined(child, leading[mainAxis])) {
        // In case the child is position absolute and has left/top being
        // defined, we override the position to whatever the user said
        // (and margin/border).
        child->layout.position[pos[mainAxis]] = getPosition(child, leading[mainAxis]) +
          getLeadingBorder(node, mainAxis) +
          getLeadingMargin(child, mainAxis);
      } else {
        // If the child is position absolute (without top/left) or relative,
        // we put it at the current accumulated offset.
        child->layout.position[pos[mainAxis]] += mainDim;

        // Define the trailing position accordingly.
        if (isMainDimDefined) {
          setTrailingPosition(node, child, mainAxis);
        }

        // Now that we placed the element, we need to update the variables
        // We only need to do that for relative elements. Absolute elements
        // do not take part in that phase.
        if (child->style.position_type == CSS_POSITION_RELATIVE) {
          // The main dimension is the sum of all the elements dimension plus
          // the spacing.
          mainDim += betweenMainDim + getDimWithMargin(child, mainAxis);
          // The cross dimension is the max of the elements dimension since there
          // can only be one element in that cross dimension.
          crossDim = fmaxf(crossDim, boundAxis(child, crossAxis, getDimWithMargin(child, crossAxis)));
        }
      }
    }

    float containerCrossAxis = node->layout.dimensions[dim[crossAxis]];
    if (!isCrossDimDefined) {
      containerCrossAxis = fmaxf(
        // For the cross dim, we add both sides at the end because the value
        // is aggregate via a max function. Intermediate negative values
        // can mess this computation otherwise
        boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross),
        paddingAndBorderAxisCross
      );
    }

    // <Loop D> Position elements in the cross axis
    for (i = firstComplexCross; i < endLine; ++i) {
      child = node->get_child(node->context, i);

      if (child->style.position_type == CSS_POSITION_ABSOLUTE &&
          isPosDefined(child, leading[crossAxis])) {
        // In case the child is absolutely positionned and has a
        // top/left/bottom/right being set, we override all the previously
        // computed positions to set it correctly.
        child->layout.position[pos[crossAxis]] = getPosition(child, leading[crossAxis]) +
          getLeadingBorder(node, crossAxis) +
          getLeadingMargin(child, crossAxis);

      } else {
        float leadingCrossDim = leadingPaddingAndBorderCross;

        // For a relative children, we're either using alignItems (parent) or
        // alignSelf (child) in order to determine the position in the cross axis
        if (child->style.position_type == CSS_POSITION_RELATIVE) {
          css_align_t alignItem = getAlignItem(node, child);
          if (alignItem == CSS_ALIGN_STRETCH) {
            // You can only stretch if the dimension has not already been set
            // previously.
            if (!isDimDefined(child, crossAxis)) {
              child->layout.dimensions[dim[crossAxis]] = fmaxf(
                boundAxis(child, crossAxis, containerCrossAxis -
                  paddingAndBorderAxisCross - getMarginAxis(child, crossAxis)),
                // You never want to go smaller than padding
                getPaddingAndBorderAxis(child, crossAxis)
              );
            }
          } else if (alignItem != CSS_ALIGN_FLEX_START) {
            // The remaining space between the parent dimensions+padding and child
            // dimensions+margin.
            float remainingCrossDim = containerCrossAxis -
              paddingAndBorderAxisCross - getDimWithMargin(child, crossAxis);

            if (alignItem == CSS_ALIGN_CENTER) {
              leadingCrossDim += remainingCrossDim / 2;
            } else { // CSS_ALIGN_FLEX_END
              leadingCrossDim += remainingCrossDim;
            }
          }
        }

        // And we apply the position
        child->layout.position[pos[crossAxis]] += linesCrossDim + leadingCrossDim;

        // Define the trailing position accordingly.
        if (isCrossDimDefined) {
          setTrailingPosition(node, child, crossAxis);
        }
      }
    }

    linesCrossDim += crossDim;
    linesMainDim = fmaxf(linesMainDim, mainDim);
    linesCount += 1;
    startLine = endLine;
  }

  // <Loop E>
  //
  // Note(prenaux): More than one line, we need to layout the crossAxis
  // according to alignContent.
  //
  // Note that we could probably remove <Loop D> and handle the one line case
  // here too, but for the moment this is safer since it won't interfere with
  // previously working code.
  //
  // See specs:
  // http://www.w3.org/TR/2012/CR-css3-flexbox-20120918/#layout-algorithm
  // section 9.4
  //
  if (linesCount > 1 && isCrossDimDefined) {
    float nodeCrossAxisInnerSize = node->layout.dimensions[dim[crossAxis]] -
        paddingAndBorderAxisCross;
    float remainingAlignContentDim = nodeCrossAxisInnerSize - linesCrossDim;

    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;

    css_align_t alignContent = node->style.align_content;
    if (alignContent == CSS_ALIGN_FLEX_END) {
      currentLead += remainingAlignContentDim;
    } else if (alignContent == CSS_ALIGN_CENTER) {
      currentLead += remainingAlignContentDim / 2;
    } else if (alignContent == CSS_ALIGN_STRETCH) {
      if (nodeCrossAxisInnerSize > linesCrossDim) {
        crossDimLead = (remainingAlignContentDim / linesCount);
      }
    }

    int endIndex = 0;
    for (i = 0; i < linesCount; ++i) {
      int startIndex = endIndex;

      // compute the line's height and find the endIndex
      float lineHeight = 0;
      for (ii = startIndex; ii < childCount; ++ii) {
        child = node->get_child(node->context, ii);
        if (child->style.position_type != CSS_POSITION_RELATIVE) {
          continue;
        }
        if (child->line_index != i) {
          break;
        }
        if (!isUndefined(child->layout.dimensions[dim[crossAxis]])) {
          lineHeight = fmaxf(
            lineHeight,
            child->layout.dimensions[dim[crossAxis]] + getMarginAxis(child, crossAxis)
          );
        }
      }
      endIndex = ii;
      lineHeight += crossDimLead;

      for (ii = startIndex; ii < endIndex; ++ii) {
        child = node->get_child(node->context, ii);
        if (child->style.position_type != CSS_POSITION_RELATIVE) {
          continue;
        }

        css_align_t alignContentAlignItem = getAlignItem(node, child);
        if (alignContentAlignItem == CSS_ALIGN_FLEX_START) {
          child->layout.position[pos[crossAxis]] = currentLead + getLeadingMargin(child, crossAxis);
        } else if (alignContentAlignItem == CSS_ALIGN_FLEX_END) {
          child->layout.position[pos[crossAxis]] = currentLead + lineHeight - getTrailingMargin(child, crossAxis) - child->layout.dimensions[dim[crossAxis]];
        } else if (alignContentAlignItem == CSS_ALIGN_CENTER) {
          float childHeight = child->layout.dimensions[dim[crossAxis]];
          child->layout.position[pos[crossAxis]] = currentLead + (lineHeight - childHeight) / 2;
        } else if (alignContentAlignItem == CSS_ALIGN_STRETCH) {
          child->layout.position[pos[crossAxis]] = currentLead + getLeadingMargin(child, crossAxis);
          // TODO(prenaux): Correctly set the height of items with undefined
          //                (auto) crossAxis dimension.
        }
      }

      currentLead += lineHeight;
    }
  }

  bool needsMainTrailingPos = false;
  bool needsCrossTrailingPos = false;

  // If the user didn't specify a width or height, and it has not been set
  // by the container, then we set it via the children.
  if (!isMainDimDefined) {
    node->layout.dimensions[dim[mainAxis]] = fmaxf(
      // We're missing the last padding at this point to get the final
      // dimension
      boundAxis(node, mainAxis, linesMainDim + getTrailingPaddingAndBorder(node, mainAxis)),
      // We can never assign a width smaller than the padding and borders
      paddingAndBorderAxisMain
    );

    if (mainAxis == CSS_FLEX_DIRECTION_ROW_REVERSE ||
        mainAxis == CSS_FLEX_DIRECTION_COLUMN_REVERSE) {
      needsMainTrailingPos = true;
    }
  }

  if (!isCrossDimDefined) {
    node->layout.dimensions[dim[crossAxis]] = fmaxf(
      // For the cross dim, we add both sides at the end because the value
      // is aggregate via a max function. Intermediate negative values
      // can mess this computation otherwise
      boundAxis(node, crossAxis, linesCrossDim + paddingAndBorderAxisCross),
      paddingAndBorderAxisCross
    );

    if (crossAxis == CSS_FLEX_DIRECTION_ROW_REVERSE ||
        crossAxis == CSS_FLEX_DIRECTION_COLUMN_REVERSE) {
      needsCrossTrailingPos = true;
    }
  }

  // <Loop F> Set trailing position if necessary
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

  // <Loop G> Calculate dimensions for absolutely positioned elements
  currentAbsoluteChild = firstAbsoluteChild;
  while (currentAbsoluteChild != NULL) {
    // Pre-fill dimensions when using absolute position and both offsets for
    // the axis are defined (either both left and right or top and bottom).
    for (ii = 0; ii < 2; ii++) {
      axis = (ii != 0) ? CSS_FLEX_DIRECTION_ROW : CSS_FLEX_DIRECTION_COLUMN;

      if (!isUndefined(node->layout.dimensions[dim[axis]]) &&
          !isDimDefined(currentAbsoluteChild, axis) &&
          isPosDefined(currentAbsoluteChild, leading[axis]) &&
          isPosDefined(currentAbsoluteChild, trailing[axis])) {
        currentAbsoluteChild->layout.dimensions[dim[axis]] = fmaxf(
          boundAxis(currentAbsoluteChild, axis, node->layout.dimensions[dim[axis]] -
            getBorderAxis(node, axis) -
            getMarginAxis(currentAbsoluteChild, axis) -
            getPosition(currentAbsoluteChild, leading[axis]) -
            getPosition(currentAbsoluteChild, trailing[axis])
          ),
          // You never want to go smaller than padding
          getPaddingAndBorderAxis(currentAbsoluteChild, axis)
        );
      }

      if (isPosDefined(currentAbsoluteChild, trailing[axis]) &&
          !isPosDefined(currentAbsoluteChild, leading[axis])) {
        currentAbsoluteChild->layout.position[leading[axis]] =
          node->layout.dimensions[dim[axis]] -
          currentAbsoluteChild->layout.dimensions[dim[axis]] -
          getPosition(currentAbsoluteChild, trailing[axis]);
      }
    }

    child = currentAbsoluteChild;
    currentAbsoluteChild = currentAbsoluteChild->next_absolute_child;
    child->next_absolute_child = NULL;
  }
  /** END_GENERATED **/
}

void layoutNode(css_node_t *node, float parentMaxWidth, css_direction_t parentDirection) {
  css_layout_t *layout = &node->layout;
  css_direction_t direction = node->style.direction;
  layout->should_update = true;

  bool skipLayout =
    !node->is_dirty(node->context) &&
    eq(layout->last_requested_dimensions[CSS_WIDTH], layout->dimensions[CSS_WIDTH]) &&
    eq(layout->last_requested_dimensions[CSS_HEIGHT], layout->dimensions[CSS_HEIGHT]) &&
    eq(layout->last_parent_max_width, parentMaxWidth);
    eq(layout->last_direction, direction);

  if (skipLayout) {
    layout->dimensions[CSS_WIDTH] = layout->last_dimensions[CSS_WIDTH];
    layout->dimensions[CSS_HEIGHT] = layout->last_dimensions[CSS_HEIGHT];
    layout->position[CSS_TOP] = layout->last_position[CSS_TOP];
    layout->position[CSS_LEFT] = layout->last_position[CSS_LEFT];
  } else {
    layout->last_requested_dimensions[CSS_WIDTH] = layout->dimensions[CSS_WIDTH];
    layout->last_requested_dimensions[CSS_HEIGHT] = layout->dimensions[CSS_HEIGHT];
    layout->last_parent_max_width = parentMaxWidth;
    layout->last_direction = direction;

    layoutNodeImpl(node, parentMaxWidth, parentDirection);

    layout->last_dimensions[CSS_WIDTH] = layout->dimensions[CSS_WIDTH];
    layout->last_dimensions[CSS_HEIGHT] = layout->dimensions[CSS_HEIGHT];
    layout->last_position[CSS_TOP] = layout->position[CSS_TOP];
    layout->last_position[CSS_LEFT] = layout->position[CSS_LEFT];
  }
}
