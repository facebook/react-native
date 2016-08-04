/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <string.h>

#include "CSSLayout-internal.h"

#ifdef _MSC_VER
#include <float.h>
#define isnan _isnan

/* define fmaxf if < VC12 */
#if _MSC_VER < 1800
__forceinline const float fmaxf(const float a, const float b) { return (a > b) ? a : b; }
#endif
#endif

#define POSITIVE_FLEX_IS_AUTO 0

CSSNodeRef CSSNodeNew() {
  CSSNodeRef node = calloc(1, sizeof(CSSNode));
  CSS_ASSERT(node, "Could not allocate memory for node");

  CSSNodeInit(node);
  return node;
}

void CSSNodeFree(CSSNodeRef node) {
  CSSNodeListFree(node->children);
  free(node);
}

void CSSNodeInit(CSSNodeRef node) {
  node->parent = NULL;
  node->children = CSSNodeListNew(4);
  node->hasNewLayout = true;
  node->isDirty = false;

  node->style.alignItems = CSSAlignStretch;
  node->style.alignContent = CSSAlignFlexStart;

  node->style.direction = CSSDirectionInherit;
  node->style.flexDirection = CSSFlexDirectionColumn;

  node->style.overflow = CSSOverflowVisible;

  // Some of the fields default to undefined and not 0
  node->style.dimensions[CSSDimensionWidth] = CSSUndefined;
  node->style.dimensions[CSSDimensionHeight] = CSSUndefined;

  node->style.minDimensions[CSSDimensionWidth] = CSSUndefined;
  node->style.minDimensions[CSSDimensionHeight] = CSSUndefined;

  node->style.maxDimensions[CSSDimensionWidth] = CSSUndefined;
  node->style.maxDimensions[CSSDimensionHeight] = CSSUndefined;

  node->style.position[CSSPositionLeft] = CSSUndefined;
  node->style.position[CSSPositionTop] = CSSUndefined;
  node->style.position[CSSPositionRight] = CSSUndefined;
  node->style.position[CSSPositionBottom] = CSSUndefined;
  node->style.position[CSSPositionStart] = CSSUndefined;
  node->style.position[CSSPositionEnd] = CSSUndefined;

  node->style.margin[CSSPositionStart] = CSSUndefined;
  node->style.margin[CSSPositionEnd] = CSSUndefined;
  node->style.padding[CSSPositionStart] = CSSUndefined;
  node->style.padding[CSSPositionEnd] = CSSUndefined;
  node->style.border[CSSPositionStart] = CSSUndefined;
  node->style.border[CSSPositionEnd] = CSSUndefined;

  node->layout.dimensions[CSSDimensionWidth] = CSSUndefined;
  node->layout.dimensions[CSSDimensionHeight] = CSSUndefined;

  // Such that the comparison is always going to be false
  node->layout.lastParentDirection = (CSSDirection)-1;
  node->layout.nextCachedMeasurementsIndex = 0;

  node->layout.measuredDimensions[CSSDimensionWidth] = CSSUndefined;
  node->layout.measuredDimensions[CSSDimensionHeight] = CSSUndefined;
  node->layout.cached_layout.widthMeasureMode = (CSSMeasureMode)-1;
  node->layout.cached_layout.heightMeasureMode = (CSSMeasureMode)-1;
}

void _CSSNodeMarkDirty(CSSNodeRef node) {
  if (!node->isDirty) {
    node->isDirty = true;
    if (node->parent) {
      _CSSNodeMarkDirty(node->parent);
    }
  }
}

void CSSNodeInsertChild(CSSNodeRef node, CSSNodeRef child, uint32_t index) {
  CSSNodeListInsert(node->children, child, index);
  child->parent = node;
  _CSSNodeMarkDirty(node);
}

void CSSNodeRemoveChild(CSSNodeRef node, CSSNodeRef child) {
  CSSNodeListDelete(node->children, child);
  child->parent = NULL;
  _CSSNodeMarkDirty(node);
}

CSSNodeRef CSSNodeGetChild(CSSNodeRef node, uint32_t index) {
  return CSSNodeListGet(node->children, index);
}

uint32_t CSSNodeChildCount(CSSNodeRef node) { return CSSNodeListCount(node->children); }

void CSSNodeMarkDirty(CSSNodeRef node) {
  CSS_ASSERT(node->measure != NULL, "Nodes without custom measure functions "
                                    "should not manually mark themselves as "
                                    "dirty");
  _CSSNodeMarkDirty(node);
}

bool CSSNodeIsDirty(CSSNodeRef node) { return node->isDirty; }

#define CSS_NODE_PROPERTY_IMPL(type, name, paramName, instanceName)                                \
  void CSSNodeSet##name(CSSNodeRef node, type paramName) { node->instanceName = paramName; }       \
                                                                                                   \
  type CSSNodeGet##name(CSSNodeRef node) { return node->instanceName; }

#define CSS_NODE_STYLE_PROPERTY_IMPL(type, name, paramName, instanceName)                          \
  void CSSNodeStyleSet##name(CSSNodeRef node, type paramName) {                                    \
    if (node->style.instanceName != paramName) {                                                   \
      node->style.instanceName = paramName;                                                        \
      _CSSNodeMarkDirty(node);                                                                     \
    }                                                                                              \
  }                                                                                                \
                                                                                                   \
  type CSSNodeStyleGet##name(CSSNodeRef node) { return node->style.instanceName; }

#define CSS_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName)                                    \
  type CSSNodeLayoutGet##name(CSSNodeRef node) { return node->layout.instanceName; }

CSS_NODE_PROPERTY_IMPL(void *, Context, context, context);
CSS_NODE_PROPERTY_IMPL(CSSMeasureFunc, MeasureFunc, measureFunc, measure);
CSS_NODE_PROPERTY_IMPL(CSSPrintFunc, PrintFunc, printFunc, print);
CSS_NODE_PROPERTY_IMPL(bool, IsTextnode, isTextNode, isTextNode);
CSS_NODE_PROPERTY_IMPL(bool, HasNewLayout, hasNewLayout, hasNewLayout);

CSS_NODE_STYLE_PROPERTY_IMPL(CSSDirection, Direction, direction, direction);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSFlexDirection, FlexDirection, flexDirection, flexDirection);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSJustify, JustifyContent, justifyContent, justifyContent);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSAlign, AlignContent, alignContent, alignContent);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSAlign, AlignItems, alignItems, alignItems);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSAlign, AlignSelf, alignSelf, alignSelf);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSPositionType, PositionType, positionType, positionType);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSWrapType, FlexWrap, flexWrap, flexWrap);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSOverflow, Overflow, overflow, overflow);
CSS_NODE_STYLE_PROPERTY_IMPL(float, Flex, flex, flex);

CSS_NODE_STYLE_PROPERTY_IMPL(float, PositionLeft, positionLeft, position[CSSPositionLeft]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, PositionTop, positionTop, position[CSSPositionTop]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, PositionRight, positionRight, position[CSSPositionRight]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, PositionBottom, positionBottom, position[CSSPositionBottom]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, PositionStart, positionStart, position[CSSPositionStart]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, PositionEnd, positionEnd, position[CSSPositionEnd]);

CSS_NODE_STYLE_PROPERTY_IMPL(float, MarginLeft, marginLeft, margin[CSSPositionLeft]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MarginTop, marginTop, margin[CSSPositionTop]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MarginRight, marginRight, margin[CSSPositionRight]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MarginBottom, marginBottom, margin[CSSPositionBottom]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MarginStart, marginStart, margin[CSSPositionStart]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MarginEnd, marginEnd, margin[CSSPositionEnd]);

CSS_NODE_STYLE_PROPERTY_IMPL(float, PaddingLeft, paddingLeft, padding[CSSPositionLeft]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, PaddingTop, paddingTop, padding[CSSPositionTop]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, PaddingRight, paddingRight, padding[CSSPositionRight]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, PaddingBottom, paddingBottom, padding[CSSPositionBottom]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, PaddingStart, paddingStart, padding[CSSPositionStart]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, PaddingEnd, paddingEnd, padding[CSSPositionEnd]);

CSS_NODE_STYLE_PROPERTY_IMPL(float, BorderLeft, borderLeft, border[CSSPositionLeft]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, BorderTop, borderTop, border[CSSPositionTop]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, BorderRight, borderRight, border[CSSPositionRight]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, BorderBottom, borderBottom, border[CSSPositionBottom]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, BorderStart, borderStart, border[CSSPositionStart]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, BorderEnd, BorderEnd, border[CSSPositionEnd]);

CSS_NODE_STYLE_PROPERTY_IMPL(float, Width, width, dimensions[CSSDimensionWidth]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, Height, height, dimensions[CSSDimensionHeight]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MinWidth, minWidth, minDimensions[CSSDimensionWidth]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MinHeight, minHeight, minDimensions[CSSDimensionHeight]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MaxWidth, maxWidth, maxDimensions[CSSDimensionWidth]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MaxHeight, maxHeight, maxDimensions[CSSDimensionHeight]);

CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[CSSPositionLeft]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[CSSPositionTop]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[CSSPositionRight]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[CSSPositionBottom]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[CSSDimensionWidth]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[CSSDimensionHeight]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(CSSDirection, Direction, direction);

uint32_t gCurrentGenerationCount = 0;

bool layoutNodeInternal(CSSNode *node,
    float availableWidth,
    float availableHeight,
    CSSDirection parentDirection,
    CSSMeasureMode widthMeasureMode,
    CSSMeasureMode heightMeasureMode,
    bool performLayout,
    char *reason);

bool isUndefined(float value) { return isnan(value); }

static bool eq(float a, float b) {
  if (isUndefined(a)) {
    return isUndefined(b);
  }
  return fabs(a - b) < 0.0001;
}

static void indent(uint32_t n) {
  for (uint32_t i = 0; i < n; ++i) {
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
  return eq(four[0], four[1]) && eq(four[0], four[2]) && eq(four[0], four[3]);
}

static void print_css_node_rec(CSSNode *node, CSSPrintOptions options, uint32_t level) {
  indent(level);
  printf("{");

  if (node->print) {
    node->print(node->context);
  }

  if (options & CSSPrintOptionsLayout) {
    printf("layout: {");
    printf("width: %g, ", node->layout.dimensions[CSSDimensionWidth]);
    printf("height: %g, ", node->layout.dimensions[CSSDimensionHeight]);
    printf("top: %g, ", node->layout.position[CSSPositionTop]);
    printf("left: %g", node->layout.position[CSSPositionLeft]);
    printf("}, ");
  }

  if (options & CSSPrintOptionsStyle) {
    if (node->style.flexDirection == CSSFlexDirectionColumn) {
      printf("flexDirection: 'column', ");
    } else if (node->style.flexDirection == CSSFlexDirectionColumnReverse) {
      printf("flexDirection: 'column-reverse', ");
    } else if (node->style.flexDirection == CSSFlexDirectionRow) {
      printf("flexDirection: 'row', ");
    } else if (node->style.flexDirection == CSSFlexDirectionRowReverse) {
      printf("flexDirection: 'row-reverse', ");
    }

    if (node->style.justifyContent == CSSJustifyCenter) {
      printf("justifyContent: 'center', ");
    } else if (node->style.justifyContent == CSSJustifyFlexEnd) {
      printf("justifyContent: 'flex-end', ");
    } else if (node->style.justifyContent == CSSJustifySpaceAround) {
      printf("justifyContent: 'space-around', ");
    } else if (node->style.justifyContent == CSSJustifySpaceBetween) {
      printf("justifyContent: 'space-between', ");
    }

    if (node->style.alignItems == CSSAlignCenter) {
      printf("alignItems: 'center', ");
    } else if (node->style.alignItems == CSSAlignFlexEnd) {
      printf("alignItems: 'flex-end', ");
    } else if (node->style.alignItems == CSSAlignStretch) {
      printf("alignItems: 'stretch', ");
    }

    if (node->style.alignContent == CSSAlignCenter) {
      printf("alignContent: 'center', ");
    } else if (node->style.alignContent == CSSAlignFlexEnd) {
      printf("alignContent: 'flex-end', ");
    } else if (node->style.alignContent == CSSAlignStretch) {
      printf("alignContent: 'stretch', ");
    }

    if (node->style.alignSelf == CSSAlignFlexStart) {
      printf("alignSelf: 'flex-start', ");
    } else if (node->style.alignSelf == CSSAlignCenter) {
      printf("alignSelf: 'center', ");
    } else if (node->style.alignSelf == CSSAlignFlexEnd) {
      printf("alignSelf: 'flex-end', ");
    } else if (node->style.alignSelf == CSSAlignStretch) {
      printf("alignSelf: 'stretch', ");
    }

    print_number_nan("flex", node->style.flex);

    if (node->style.overflow == CSSOverflowHidden) {
      printf("overflow: 'hidden', ");
    } else if (node->style.overflow == CSSOverflowVisible) {
      printf("overflow: 'visible', ");
    }

    if (four_equal(node->style.margin)) {
      print_number_0("margin", node->style.margin[CSSPositionLeft]);
    } else {
      print_number_0("marginLeft", node->style.margin[CSSPositionLeft]);
      print_number_0("marginRight", node->style.margin[CSSPositionRight]);
      print_number_0("marginTop", node->style.margin[CSSPositionTop]);
      print_number_0("marginBottom", node->style.margin[CSSPositionBottom]);
      print_number_0("marginStart", node->style.margin[CSSPositionStart]);
      print_number_0("marginEnd", node->style.margin[CSSPositionEnd]);
    }

    if (four_equal(node->style.padding)) {
      print_number_0("padding", node->style.padding[CSSPositionLeft]);
    } else {
      print_number_0("paddingLeft", node->style.padding[CSSPositionLeft]);
      print_number_0("paddingRight", node->style.padding[CSSPositionRight]);
      print_number_0("paddingTop", node->style.padding[CSSPositionTop]);
      print_number_0("paddingBottom", node->style.padding[CSSPositionBottom]);
      print_number_0("paddingStart", node->style.padding[CSSPositionStart]);
      print_number_0("paddingEnd", node->style.padding[CSSPositionEnd]);
    }

    if (four_equal(node->style.border)) {
      print_number_0("borderWidth", node->style.border[CSSPositionLeft]);
    } else {
      print_number_0("borderLeftWidth", node->style.border[CSSPositionLeft]);
      print_number_0("borderRightWidth", node->style.border[CSSPositionRight]);
      print_number_0("borderTopWidth", node->style.border[CSSPositionTop]);
      print_number_0("borderBottomWidth", node->style.border[CSSPositionBottom]);
      print_number_0("borderStartWidth", node->style.border[CSSPositionStart]);
      print_number_0("borderEndWidth", node->style.border[CSSPositionEnd]);
    }

    print_number_nan("width", node->style.dimensions[CSSDimensionWidth]);
    print_number_nan("height", node->style.dimensions[CSSDimensionHeight]);
    print_number_nan("maxWidth", node->style.maxDimensions[CSSDimensionWidth]);
    print_number_nan("maxHeight", node->style.maxDimensions[CSSDimensionHeight]);
    print_number_nan("minWidth", node->style.minDimensions[CSSDimensionWidth]);
    print_number_nan("minHeight", node->style.minDimensions[CSSDimensionHeight]);

    if (node->style.positionType == CSSPositionTypeAbsolute) {
      printf("position: 'absolute', ");
    }

    print_number_nan("left", node->style.position[CSSPositionLeft]);
    print_number_nan("right", node->style.position[CSSPositionRight]);
    print_number_nan("top", node->style.position[CSSPositionTop]);
    print_number_nan("bottom", node->style.position[CSSPositionBottom]);
  }

  uint32_t childCount = CSSNodeListCount(node->children);
  if (options & CSSPrintOptionsChildren && childCount > 0) {
    printf("children: [\n");
    for (uint32_t i = 0; i < childCount; ++i) {
      print_css_node_rec(CSSNodeGetChild(node, i), options, level + 1);
    }
    indent(level);
    printf("]},\n");
  } else {
    printf("},\n");
  }
}

void CSSNodePrint(CSSNode *node, CSSPrintOptions options) { print_css_node_rec(node, options, 0); }

static CSSPosition leading[4] = {
  /* CSSFlexDirectionColumn = */ CSSPositionTop,
  /* CSSFlexDirectionColumnReverse = */ CSSPositionBottom,
  /* CSSFlexDirectionRow = */ CSSPositionLeft,
  /* CSSFlexDirectionRowReverse = */ CSSPositionRight
};
static CSSPosition trailing[4] = {
  /* CSSFlexDirectionColumn = */ CSSPositionBottom,
  /* CSSFlexDirectionColumnReverse = */ CSSPositionTop,
  /* CSSFlexDirectionRow = */ CSSPositionRight,
  /* CSSFlexDirectionRowReverse = */ CSSPositionLeft
};
static CSSPosition pos[4] = {
  /* CSSFlexDirectionColumn = */ CSSPositionTop,
  /* CSSFlexDirectionColumnReverse = */ CSSPositionBottom,
  /* CSSFlexDirectionRow = */ CSSPositionLeft,
  /* CSSFlexDirectionRowReverse = */ CSSPositionRight
};
static CSSDimension dim[4] = {
  /* CSSFlexDirectionColumn = */ CSSDimensionHeight,
  /* CSSFlexDirectionColumnReverse = */ CSSDimensionHeight,
  /* CSSFlexDirectionRow = */ CSSDimensionWidth,
  /* CSSFlexDirectionRowReverse = */ CSSDimensionWidth
};

static bool isRowDirection(CSSFlexDirection flexDirection) {
  return flexDirection == CSSFlexDirectionRow || flexDirection == CSSFlexDirectionRowReverse;
}

static bool isColumnDirection(CSSFlexDirection flexDirection) {
  return flexDirection == CSSFlexDirectionColumn || flexDirection == CSSFlexDirectionColumnReverse;
}

static bool isFlexBasisAuto(CSSNode *node) {
#if POSITIVE_FLEX_IS_AUTO
  // All flex values are auto.
  (void)node;
  return true;
#else
  // A flex value > 0 implies a basis of zero.
  return node->style.flex <= 0;
#endif
}

static float getFlexGrowFactor(CSSNode *node) {
  // Flex grow is implied by positive values for flex.
  if (node->style.flex > 0) {
    return node->style.flex;
  }
  return 0;
}

static float getFlexShrinkFactor(CSSNode *node) {
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

static float getLeadingMargin(CSSNode *node, CSSFlexDirection axis) {
  if (isRowDirection(axis) && !isUndefined(node->style.margin[CSSPositionStart])) {
    return node->style.margin[CSSPositionStart];
  }

  return node->style.margin[leading[axis]];
}

static float getTrailingMargin(CSSNode *node, CSSFlexDirection axis) {
  if (isRowDirection(axis) && !isUndefined(node->style.margin[CSSPositionEnd])) {
    return node->style.margin[CSSPositionEnd];
  }

  return node->style.margin[trailing[axis]];
}

static float getLeadingPadding(CSSNode *node, CSSFlexDirection axis) {
  if (isRowDirection(axis) && !isUndefined(node->style.padding[CSSPositionStart])
      && node->style.padding[CSSPositionStart] >= 0) {
    return node->style.padding[CSSPositionStart];
  }

  if (node->style.padding[leading[axis]] >= 0) {
    return node->style.padding[leading[axis]];
  }

  return 0;
}

static float getTrailingPadding(CSSNode *node, CSSFlexDirection axis) {
  if (isRowDirection(axis) && !isUndefined(node->style.padding[CSSPositionEnd])
      && node->style.padding[CSSPositionEnd] >= 0) {
    return node->style.padding[CSSPositionEnd];
  }

  if (node->style.padding[trailing[axis]] >= 0) {
    return node->style.padding[trailing[axis]];
  }

  return 0;
}

static float getLeadingBorder(CSSNode *node, CSSFlexDirection axis) {
  if (isRowDirection(axis) && !isUndefined(node->style.border[CSSPositionStart])
      && node->style.border[CSSPositionStart] >= 0) {
    return node->style.border[CSSPositionStart];
  }

  if (node->style.border[leading[axis]] >= 0) {
    return node->style.border[leading[axis]];
  }

  return 0;
}

static float getTrailingBorder(CSSNode *node, CSSFlexDirection axis) {
  if (isRowDirection(axis) && !isUndefined(node->style.border[CSSPositionEnd])
      && node->style.border[CSSPositionEnd] >= 0) {
    return node->style.border[CSSPositionEnd];
  }

  if (node->style.border[trailing[axis]] >= 0) {
    return node->style.border[trailing[axis]];
  }

  return 0;
}

static float getLeadingPaddingAndBorder(CSSNode *node, CSSFlexDirection axis) {
  return getLeadingPadding(node, axis) + getLeadingBorder(node, axis);
}

static float getTrailingPaddingAndBorder(CSSNode *node, CSSFlexDirection axis) {
  return getTrailingPadding(node, axis) + getTrailingBorder(node, axis);
}

static float getMarginAxis(CSSNode *node, CSSFlexDirection axis) {
  return getLeadingMargin(node, axis) + getTrailingMargin(node, axis);
}

static float getPaddingAndBorderAxis(CSSNode *node, CSSFlexDirection axis) {
  return getLeadingPaddingAndBorder(node, axis) + getTrailingPaddingAndBorder(node, axis);
}

static CSSAlign getAlignItem(CSSNode *node, CSSNode *child) {
  if (child->style.alignSelf != CSSAlignAuto) {
    return child->style.alignSelf;
  }
  return node->style.alignItems;
}

static CSSDirection resolveDirection(CSSNode *node, CSSDirection parentDirection) {
  CSSDirection direction = node->style.direction;

  if (direction == CSSDirectionInherit) {
    direction = parentDirection > CSSDirectionInherit ? parentDirection : CSSDirectionLTR;
  }

  return direction;
}

static CSSFlexDirection getFlexDirection(CSSNode *node) { return node->style.flexDirection; }

static CSSFlexDirection resolveAxis(CSSFlexDirection flexDirection, CSSDirection direction) {
  if (direction == CSSDirectionRTL) {
    if (flexDirection == CSSFlexDirectionRow) {
      return CSSFlexDirectionRowReverse;
    } else if (flexDirection == CSSFlexDirectionRowReverse) {
      return CSSFlexDirectionRow;
    }
  }

  return flexDirection;
}

static CSSFlexDirection getCrossFlexDirection(
    CSSFlexDirection flexDirection, CSSDirection direction) {
  if (isColumnDirection(flexDirection)) {
    return resolveAxis(CSSFlexDirectionRow, direction);
  } else {
    return CSSFlexDirectionColumn;
  }
}

static float getFlex(CSSNode *node) { return node->style.flex; }

static bool isFlex(CSSNode *node) {
  return (node->style.positionType == CSSPositionTypeRelative && getFlex(node) != 0);
}

static bool isFlexWrap(CSSNode *node) { return node->style.flexWrap == CSSWrapTypeWrap; }

static float getDimWithMargin(CSSNode *node, CSSFlexDirection axis) {
  return node->layout.measuredDimensions[dim[axis]] + getLeadingMargin(node, axis)
      + getTrailingMargin(node, axis);
}

static bool isStyleDimDefined(CSSNode *node, CSSFlexDirection axis) {
  float value = node->style.dimensions[dim[axis]];
  return !isUndefined(value) && value >= 0.0;
}

static bool isLayoutDimDefined(CSSNode *node, CSSFlexDirection axis) {
  float value = node->layout.measuredDimensions[dim[axis]];
  return !isUndefined(value) && value >= 0.0;
}

static bool isLeadingPosDefined(CSSNode *node, CSSFlexDirection axis) {
  return (isRowDirection(axis) && !isUndefined(node->style.position[CSSPositionStart]))
      || !isUndefined(node->style.position[leading[axis]]);
}

static bool isTrailingPosDefined(CSSNode *node, CSSFlexDirection axis) {
  return (isRowDirection(axis) && !isUndefined(node->style.position[CSSPositionEnd]))
      || !isUndefined(node->style.position[trailing[axis]]);
}

static bool isMeasureDefined(CSSNode *node) { return node->measure; }

static float getLeadingPosition(CSSNode *node, CSSFlexDirection axis) {
  if (isRowDirection(axis) && !isUndefined(node->style.position[CSSPositionStart])) {
    return node->style.position[CSSPositionStart];
  }
  if (!isUndefined(node->style.position[leading[axis]])) {
    return node->style.position[leading[axis]];
  }
  return 0;
}

static float getTrailingPosition(CSSNode *node, CSSFlexDirection axis) {
  if (isRowDirection(axis) && !isUndefined(node->style.position[CSSPositionEnd])) {
    return node->style.position[CSSPositionEnd];
  }
  if (!isUndefined(node->style.position[trailing[axis]])) {
    return node->style.position[trailing[axis]];
  }
  return 0;
}

static float boundAxisWithinMinAndMax(CSSNode *node, CSSFlexDirection axis, float value) {
  float min = CSSUndefined;
  float max = CSSUndefined;

  if (isColumnDirection(axis)) {
    min = node->style.minDimensions[CSSDimensionHeight];
    max = node->style.maxDimensions[CSSDimensionHeight];
  } else if (isRowDirection(axis)) {
    min = node->style.minDimensions[CSSDimensionWidth];
    max = node->style.maxDimensions[CSSDimensionWidth];
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

// Like boundAxisWithinMinAndMax but also ensures that the value doesn't go
// below the
// padding and border amount.
static float boundAxis(CSSNode *node, CSSFlexDirection axis, float value) {
  return fmaxf(boundAxisWithinMinAndMax(node, axis, value), getPaddingAndBorderAxis(node, axis));
}

static void setTrailingPosition(CSSNode *node, CSSNode *child, CSSFlexDirection axis) {
  float size = child->layout.measuredDimensions[dim[axis]];
  child->layout.position[trailing[axis]]
      = node->layout.measuredDimensions[dim[axis]] - size - child->layout.position[pos[axis]];
}

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
static float getRelativePosition(CSSNode *node, CSSFlexDirection axis) {
  if (isLeadingPosDefined(node, axis)) {
    return getLeadingPosition(node, axis);
  }
  return -getTrailingPosition(node, axis);
}

static void setPosition(CSSNode *node, CSSDirection direction) {
  CSSFlexDirection mainAxis = resolveAxis(getFlexDirection(node), direction);
  CSSFlexDirection crossAxis = getCrossFlexDirection(mainAxis, direction);

  node->layout.position[leading[mainAxis]]
      = getLeadingMargin(node, mainAxis) + getRelativePosition(node, mainAxis);
  node->layout.position[trailing[mainAxis]]
      = getTrailingMargin(node, mainAxis) + getRelativePosition(node, mainAxis);
  node->layout.position[leading[crossAxis]]
      = getLeadingMargin(node, crossAxis) + getRelativePosition(node, crossAxis);
  node->layout.position[trailing[crossAxis]]
      = getTrailingMargin(node, crossAxis) + getRelativePosition(node, crossAxis);
}

//
// This is the main routine that implements a subset of the flexbox layout
// algorithm
// described in the W3C CSS documentation: https://www.w3.org/TR/css3-flexbox/.
//
// Limitations of this algorithm, compared to the full standard:
//  * Display property is always assumed to be 'flex' except for Text nodes,
//  which
//    are assumed to be 'inline-flex'.
//  * The 'zIndex' property (or any form of z ordering) is not supported. Nodes
//  are
//    stacked in document order.
//  * The 'order' property is not supported. The order of flex items is always
//  defined
//    by document order.
//  * The 'visibility' property is always assumed to be 'visible'. Values of
//  'collapse'
//    and 'hidden' are not supported.
//  * The 'wrap' property supports only 'nowrap' (which is the default) or
//  'wrap'. The
//    rarely-used 'wrap-reverse' is not supported.
//  * Rather than allowing arbitrary combinations of flexGrow, flexShrink and
//    flexBasis, this algorithm supports only the three most common
//    combinations:
//      flex: 0 is equiavlent to flex: 0 0 auto
//      flex: n (where n is a positive value) is equivalent to flex: n 1 auto
//          If POSITIVE_FLEX_IS_AUTO is 0, then it is equivalent to flex: n 0 0
//          This is faster because the content doesn't need to be measured, but
//          it's
//          less flexible because the basis is always 0 and can't be overriden
//          with
//          the width/height attributes.
//      flex: -1 (or any negative value) is equivalent to flex: 0 1 auto
//  * Margins cannot be specified as 'auto'. They must be specified in terms of
//  pixel
//    values, and the default value is 0.
//  * The 'baseline' value is not supported for alignItems and alignSelf
//  properties.
//  * Values of width, maxWidth, minWidth, height, maxHeight and minHeight must
//  be
//    specified as pixel values, not as percentages.
//  * There is no support for calculation of dimensions based on intrinsic
//  aspect ratios
//     (e.g. images).
//  * There is no support for forced breaks.
//  * It does not support vertical inline directions (top-to-bottom or
//  bottom-to-top text).
//
// Deviations from standard:
//  * Section 4.5 of the spec indicates that all flex items have a default
//  minimum
//    main size. For text blocks, for example, this is the width of the widest
//    word.
//    Calculating the minimum width is expensive, so we forego it and assume a
//    default
//    minimum main size of 0.
//  * Min/Max sizes in the main axis are not honored when resolving flexible
//  lengths.
//  * The spec indicates that the default value for 'flexDirection' is 'row',
//  but
//    the algorithm below assumes a default of 'column'.
//
// Input parameters:
//    - node: current node to be sized and layed out
//    - availableWidth & availableHeight: available size to be used for sizing
//    the node
//      or CSSUndefined if the size is not available; interpretation depends on
//      layout
//      flags
//    - parentDirection: the inline (text) direction within the parent
//    (left-to-right or
//      right-to-left)
//    - widthMeasureMode: indicates the sizing rules for the width (see below
//    for explanation)
//    - heightMeasureMode: indicates the sizing rules for the height (see below
//    for explanation)
//    - performLayout: specifies whether the caller is interested in just the
//    dimensions
//      of the node or it requires the entire node and its subtree to be layed
//      out
//      (with final positions)
//
// Details:
//    This routine is called recursively to lay out subtrees of flexbox
//    elements. It uses the
//    information in node.style, which is treated as a read-only input. It is
//    responsible for
//    setting the layout.direction and layout.measuredDimensions fields for the
//    input node as well
//    as the layout.position and layout.lineIndex fields for its child nodes.
//    The
//    layout.measuredDimensions field includes any border or padding for the
//    node but does
//    not include margins.
//
//    The spec describes four different layout modes: "fill available", "max
//    content", "min
//    content",
//    and "fit content". Of these, we don't use "min content" because we don't
//    support default
//    minimum main sizes (see above for details). Each of our measure modes maps
//    to a layout mode
//    from the spec (https://www.w3.org/TR/css3-sizing/#terms):
//      - CSSMeasureModeUndefined: max content
//      - CSSMeasureModeExactly: fill available
//      - CSSMeasureModeAtMost: fit content
//
//    When calling layoutNodeImpl and layoutNodeInternal, if the caller passes
//    an available size of
//    undefined then it must also pass a measure mode of CSSMeasureModeUndefined
//    in that dimension.
//
static void layoutNodeImpl(CSSNode *node,
    float availableWidth,
    float availableHeight,
    CSSDirection parentDirection,
    CSSMeasureMode widthMeasureMode,
    CSSMeasureMode heightMeasureMode,
    bool performLayout) {

  CSS_ASSERT(isUndefined(availableWidth) ? widthMeasureMode == CSSMeasureModeUndefined : true,
      "availableWidth is indefinite so widthMeasureMode must be "
      "CSSMeasureModeUndefined");
  CSS_ASSERT(isUndefined(availableHeight) ? heightMeasureMode == CSSMeasureModeUndefined : true,
      "availableHeight is indefinite so heightMeasureMode must be "
      "CSSMeasureModeUndefined");

  float paddingAndBorderAxisRow = getPaddingAndBorderAxis(node, CSSFlexDirectionRow);
  float paddingAndBorderAxisColumn = getPaddingAndBorderAxis(node, CSSFlexDirectionColumn);
  float marginAxisRow = getMarginAxis(node, CSSFlexDirectionRow);
  float marginAxisColumn = getMarginAxis(node, CSSFlexDirectionColumn);

  // Set the resolved resolution in the node's layout.
  CSSDirection direction = resolveDirection(node, parentDirection);
  node->layout.direction = direction;

  // For content (text) nodes, determine the dimensions based on the text
  // contents.
  if (isMeasureDefined(node)) {
    float innerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
    float innerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;

    if (widthMeasureMode == CSSMeasureModeExactly && heightMeasureMode == CSSMeasureModeExactly) {

      // Don't bother sizing the text if both dimensions are already defined.
      node->layout.measuredDimensions[CSSDimensionWidth]
          = boundAxis(node, CSSFlexDirectionRow, availableWidth - marginAxisRow);
      node->layout.measuredDimensions[CSSDimensionHeight]
          = boundAxis(node, CSSFlexDirectionColumn, availableHeight - marginAxisColumn);
    } else if (innerWidth <= 0 || innerHeight <= 0) {

      // Don't bother sizing the text if there's no horizontal or vertical
      // space.
      node->layout.measuredDimensions[CSSDimensionWidth] = boundAxis(node, CSSFlexDirectionRow, 0);
      node->layout.measuredDimensions[CSSDimensionHeight]
          = boundAxis(node, CSSFlexDirectionColumn, 0);
    } else {

      // Measure the text under the current constraints.
      CSSSize measuredSize = node->measure(node->context,

          innerWidth, widthMeasureMode, innerHeight, heightMeasureMode);

      node->layout.measuredDimensions[CSSDimensionWidth] = boundAxis(node, CSSFlexDirectionRow,
          (widthMeasureMode == CSSMeasureModeUndefined || widthMeasureMode == CSSMeasureModeAtMost)
              ? measuredSize.width + paddingAndBorderAxisRow
              : availableWidth - marginAxisRow);
      node->layout.measuredDimensions[CSSDimensionHeight] = boundAxis(
          node, CSSFlexDirectionColumn, (heightMeasureMode == CSSMeasureModeUndefined
                                            || heightMeasureMode == CSSMeasureModeAtMost)
              ? measuredSize.height + paddingAndBorderAxisColumn
              : availableHeight - marginAxisColumn);
    }

    return;
  }

  // For nodes with no children, use the available values if they were provided,
  // or
  // the minimum size as indicated by the padding and border sizes.
  uint32_t childCount = CSSNodeListCount(node->children);
  if (childCount == 0) {
    node->layout.measuredDimensions[CSSDimensionWidth] = boundAxis(node, CSSFlexDirectionRow,
        (widthMeasureMode == CSSMeasureModeUndefined || widthMeasureMode == CSSMeasureModeAtMost)
            ? paddingAndBorderAxisRow
            : availableWidth - marginAxisRow);
    node->layout.measuredDimensions[CSSDimensionHeight] = boundAxis(node, CSSFlexDirectionColumn,
        (heightMeasureMode == CSSMeasureModeUndefined || heightMeasureMode == CSSMeasureModeAtMost)
            ? paddingAndBorderAxisColumn
            : availableHeight - marginAxisColumn);
    return;
  }

  // If we're not being asked to perform a full layout, we can handle a number
  // of common
  // cases here without incurring the cost of the remaining function.
  if (!performLayout) {
    // If we're being asked to size the content with an at most constraint but
    // there is no available
    // width,
    // the measurement will always be zero.
    if (widthMeasureMode == CSSMeasureModeAtMost && availableWidth <= 0
        && heightMeasureMode == CSSMeasureModeAtMost && availableHeight <= 0) {
      node->layout.measuredDimensions[CSSDimensionWidth] = boundAxis(node, CSSFlexDirectionRow, 0);
      node->layout.measuredDimensions[CSSDimensionHeight]
          = boundAxis(node, CSSFlexDirectionColumn, 0);
      return;
    }

    if (widthMeasureMode == CSSMeasureModeAtMost && availableWidth <= 0) {
      node->layout.measuredDimensions[CSSDimensionWidth] = boundAxis(node, CSSFlexDirectionRow, 0);
      node->layout.measuredDimensions[CSSDimensionHeight] = boundAxis(node, CSSFlexDirectionColumn,
          isUndefined(availableHeight) ? 0 : (availableHeight - marginAxisColumn));
      return;
    }

    if (heightMeasureMode == CSSMeasureModeAtMost && availableHeight <= 0) {
      node->layout.measuredDimensions[CSSDimensionWidth] = boundAxis(node, CSSFlexDirectionRow,
          isUndefined(availableWidth) ? 0 : (availableWidth - marginAxisRow));
      node->layout.measuredDimensions[CSSDimensionHeight]
          = boundAxis(node, CSSFlexDirectionColumn, 0);
      return;
    }

    // If we're being asked to use an exact width/height, there's no need to
    // measure the children.
    if (widthMeasureMode == CSSMeasureModeExactly && heightMeasureMode == CSSMeasureModeExactly) {
      node->layout.measuredDimensions[CSSDimensionWidth]
          = boundAxis(node, CSSFlexDirectionRow, availableWidth - marginAxisRow);
      node->layout.measuredDimensions[CSSDimensionHeight]
          = boundAxis(node, CSSFlexDirectionColumn, availableHeight - marginAxisColumn);
      return;
    }
  }

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  CSSFlexDirection mainAxis = resolveAxis(getFlexDirection(node), direction);
  CSSFlexDirection crossAxis = getCrossFlexDirection(mainAxis, direction);
  bool isMainAxisRow = isRowDirection(mainAxis);
  CSSJustify justifyContent = node->style.justifyContent;
  bool isNodeFlexWrap = isFlexWrap(node);

  CSSNode *firstAbsoluteChild = NULL;
  CSSNode *currentAbsoluteChild = NULL;

  float leadingPaddingAndBorderMain = getLeadingPaddingAndBorder(node, mainAxis);
  float trailingPaddingAndBorderMain = getTrailingPaddingAndBorder(node, mainAxis);
  float leadingPaddingAndBorderCross = getLeadingPaddingAndBorder(node, crossAxis);
  float paddingAndBorderAxisMain = getPaddingAndBorderAxis(node, mainAxis);
  float paddingAndBorderAxisCross = getPaddingAndBorderAxis(node, crossAxis);

  CSSMeasureMode measureModeMainDim = isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  CSSMeasureMode measureModeCrossDim = isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS
  float availableInnerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  float availableInnerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;
  float availableInnerMainDim = isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  float availableInnerCrossDim = isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM
  CSSNode *child;
  uint32_t i;
  float childWidth;
  float childHeight;
  CSSMeasureMode childWidthMeasureMode;
  CSSMeasureMode childHeightMeasureMode;
  for (i = 0; i < childCount; i++) {
    child = CSSNodeListGet(node->children, i);

    if (performLayout) {
      // Set the initial position (relative to the parent).
      CSSDirection childDirection = resolveDirection(child, direction);
      setPosition(child, childDirection);
    }

    // Absolute-positioned children don't participate in flex layout. Add them
    // to a list that we can process later.
    if (child->style.positionType == CSSPositionTypeAbsolute) {

      // Store a private linked list of absolutely positioned children
      // so that we can efficiently traverse them later.
      if (firstAbsoluteChild == NULL) {
        firstAbsoluteChild = child;
      }
      if (currentAbsoluteChild != NULL) {
        currentAbsoluteChild->nextChild = child;
      }
      currentAbsoluteChild = child;
      child->nextChild = NULL;
    } else {

      if (isMainAxisRow && isStyleDimDefined(child, CSSFlexDirectionRow)) {

        // The width is definite, so use that as the flex basis.
        child->layout.flexBasis = fmaxf(child->style.dimensions[CSSDimensionWidth],
            getPaddingAndBorderAxis(child, CSSFlexDirectionRow));
      } else if (!isMainAxisRow && isStyleDimDefined(child, CSSFlexDirectionColumn)) {

        // The height is definite, so use that as the flex basis.
        child->layout.flexBasis = fmaxf(child->style.dimensions[CSSDimensionHeight],
            getPaddingAndBorderAxis(child, CSSFlexDirectionColumn));
      } else if (!isFlexBasisAuto(child) && !isUndefined(availableInnerMainDim)) {

        // If the basis isn't 'auto', it is assumed to be zero.
        child->layout.flexBasis = fmaxf(0, getPaddingAndBorderAxis(child, mainAxis));
      } else {

        // Compute the flex basis and hypothetical main size (i.e. the clamped
        // flex basis).
        childWidth = CSSUndefined;
        childHeight = CSSUndefined;
        childWidthMeasureMode = CSSMeasureModeUndefined;
        childHeightMeasureMode = CSSMeasureModeUndefined;

        if (isStyleDimDefined(child, CSSFlexDirectionRow)) {
          childWidth = child->style.dimensions[CSSDimensionWidth]
              + getMarginAxis(child, CSSFlexDirectionRow);
          childWidthMeasureMode = CSSMeasureModeExactly;
        }
        if (isStyleDimDefined(child, CSSFlexDirectionColumn)) {
          childHeight = child->style.dimensions[CSSDimensionHeight]
              + getMarginAxis(child, CSSFlexDirectionColumn);
          childHeightMeasureMode = CSSMeasureModeExactly;
        }

        // According to the spec, if the main size is not definite and the
        // child's inline axis is parallel to the main axis (i.e. it's
        // horizontal), the child should be sized using "UNDEFINED" in
        // the main size. Otherwise use "AT_MOST" in the cross axis.
        if (!isMainAxisRow && isUndefined(childWidth) && !isUndefined(availableInnerWidth)) {
          childWidth = availableInnerWidth;
          childWidthMeasureMode = CSSMeasureModeAtMost;
        }

        // The W3C spec doesn't say anything about the 'overflow' property,
        // but all major browsers appear to implement the following logic.
        if (node->style.overflow == CSSOverflowHidden) {
          if (isMainAxisRow && isUndefined(childHeight) && !isUndefined(availableInnerHeight)) {
            childHeight = availableInnerHeight;
            childHeightMeasureMode = CSSMeasureModeAtMost;
          }
        }

        // If child has no defined size in the cross axis and is set to stretch,
        // set the cross
        // axis to be measured exactly with the available inner width
        if (!isMainAxisRow && !isUndefined(availableInnerWidth)
            && !isStyleDimDefined(child, CSSFlexDirectionRow)
            && widthMeasureMode == CSSMeasureModeExactly
            && getAlignItem(node, child) == CSSAlignStretch) {
          childWidth = availableInnerWidth;
          childWidthMeasureMode = CSSMeasureModeExactly;
        }
        if (isMainAxisRow && !isUndefined(availableInnerHeight)
            && !isStyleDimDefined(child, CSSFlexDirectionColumn)
            && heightMeasureMode == CSSMeasureModeExactly
            && getAlignItem(node, child) == CSSAlignStretch) {
          childHeight = availableInnerHeight;
          childHeightMeasureMode = CSSMeasureModeExactly;
        }

        // Measure the child
        layoutNodeInternal(child, childWidth, childHeight, direction, childWidthMeasureMode,
            childHeightMeasureMode, false, "measure");

        child->layout.flexBasis
            = fmaxf(isMainAxisRow ? child->layout.measuredDimensions[CSSDimensionWidth]
                                  : child->layout.measuredDimensions[CSSDimensionHeight],
                getPaddingAndBorderAxis(child, mainAxis));
      }
    }
  }

  // STEP 4: COLLECT FLEX ITEMS INTO FLEX LINES

  // Indexes of children that represent the first and last items in the line.
  uint32_t startOfLineIndex = 0;
  uint32_t endOfLineIndex = 0;

  // Number of lines.
  uint32_t lineCount = 0;

  // Accumulated cross dimensions of all lines so far.
  float totalLineCrossDim = 0;

  // Max main dimension of all the lines.
  float maxLineMainDim = 0;

  while (endOfLineIndex < childCount) {

    // Number of items on the currently line. May be different than the
    // difference
    // between start and end indicates because we skip over absolute-positioned
    // items.
    uint32_t itemsOnLine = 0;

    // sizeConsumedOnCurrentLine is accumulation of the dimensions and margin
    // of all the children on the current line. This will be used in order to
    // either set the dimensions of the node if none already exist or to compute
    // the remaining space left for the flexible children.
    float sizeConsumedOnCurrentLine = 0;

    float totalFlexGrowFactors = 0;
    float totalFlexShrinkScaledFactors = 0;

    i = startOfLineIndex;

    // Maintain a linked list of the child nodes that can shrink and/or grow.
    CSSNode *firstRelativeChild = NULL;
    CSSNode *currentRelativeChild = NULL;

    // Add items to the current line until it's full or we run out of items.
    while (i < childCount) {
      child = CSSNodeListGet(node->children, i);
      child->lineIndex = lineCount;

      if (child->style.positionType != CSSPositionTypeAbsolute) {
        float outerFlexBasis = child->layout.flexBasis + getMarginAxis(child, mainAxis);

        // If this is a multi-line flow and this item pushes us over the
        // available size, we've
        // hit the end of the current line. Break out of the loop and lay out
        // the current line.
        if (sizeConsumedOnCurrentLine + outerFlexBasis > availableInnerMainDim && isNodeFlexWrap
            && itemsOnLine > 0) {
          break;
        }

        sizeConsumedOnCurrentLine += outerFlexBasis;
        itemsOnLine++;

        if (isFlex(child)) {
          totalFlexGrowFactors += getFlexGrowFactor(child);

          // Unlike the grow factor, the shrink factor is scaled relative to the
          // child
          // dimension.
          totalFlexShrinkScaledFactors += getFlexShrinkFactor(child) * child->layout.flexBasis;
        }

        // Store a private linked list of children that need to be layed out.
        if (firstRelativeChild == NULL) {
          firstRelativeChild = child;
        }
        if (currentRelativeChild != NULL) {
          currentRelativeChild->nextChild = child;
        }
        currentRelativeChild = child;
        child->nextChild = NULL;
      }

      i++;
      endOfLineIndex++;
    }

    // If we don't need to measure the cross axis, we can skip the entire flex
    // step.
    bool canSkipFlex = !performLayout && measureModeCrossDim == CSSMeasureModeExactly;

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
      // availableInnerMainDim is indefinite which means the node is being sized
      // based on its
      // content.
      // sizeConsumedOnCurrentLine is negative which means the node will
      // allocate 0 pixels for
      // its content. Consequently, remainingFreeSpace is 0 -
      // sizeConsumedOnCurrentLine.
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

      // Do two passes over the flex items to figure out how to distribute the
      // remaining space.
      // The first pass finds the items whose min/max constraints trigger,
      // freezes them at those
      // sizes, and excludes those sizes from the remaining space. The second
      // pass sets the size
      // of each flexible item. It distributes the remaining space amongst the
      // items whose min/max
      // constraints didn't trigger in pass 1. For the other items, it sets
      // their sizes by forcing
      // their min/max constraints to trigger again.
      //
      // This two pass approach for resolving min/max constraints deviates from
      // the spec. The
      // spec (https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths)
      // describes a process
      // that needs to be repeated a variable number of times. The algorithm
      // implemented here
      // won't handle all cases but it was simpler to implement and it mitigates
      // performance
      // concerns because we know exactly how many passes it'll do.

      // First pass: detect the flex items whose min/max constraints trigger
      float deltaFlexShrinkScaledFactors = 0;
      float deltaFlexGrowFactors = 0;
      currentRelativeChild = firstRelativeChild;
      while (currentRelativeChild != NULL) {
        childFlexBasis = currentRelativeChild->layout.flexBasis;

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor = getFlexShrinkFactor(currentRelativeChild) * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            baseMainSize = childFlexBasis
                + remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor;
            boundMainSize = boundAxis(currentRelativeChild, mainAxis, baseMainSize);
            if (baseMainSize != boundMainSize) {
              // By excluding this item's size and flex factor from remaining,
              // this item's
              // min/max constraints should also trigger in the second pass
              // resulting in the
              // item's size calculation being identical in the first and second
              // passes.
              deltaFreeSpace -= boundMainSize - childFlexBasis;
              deltaFlexShrinkScaledFactors -= flexShrinkScaledFactor;
            }
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = getFlexGrowFactor(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            baseMainSize
                = childFlexBasis + remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor;
            boundMainSize = boundAxis(currentRelativeChild, mainAxis, baseMainSize);
            if (baseMainSize != boundMainSize) {
              // By excluding this item's size and flex factor from remaining,
              // this item's
              // min/max constraints should also trigger in the second pass
              // resulting in the
              // item's size calculation being identical in the first and second
              // passes.
              deltaFreeSpace -= boundMainSize - childFlexBasis;
              deltaFlexGrowFactors -= flexGrowFactor;
            }
          }
        }

        currentRelativeChild = currentRelativeChild->nextChild;
      }

      totalFlexShrinkScaledFactors += deltaFlexShrinkScaledFactors;
      totalFlexGrowFactors += deltaFlexGrowFactors;
      remainingFreeSpace += deltaFreeSpace;

      // Second pass: resolve the sizes of the flexible items
      deltaFreeSpace = 0;
      currentRelativeChild = firstRelativeChild;
      while (currentRelativeChild != NULL) {
        childFlexBasis = currentRelativeChild->layout.flexBasis;
        float updatedMainSize = childFlexBasis;

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor = getFlexShrinkFactor(currentRelativeChild) * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            updatedMainSize = boundAxis(currentRelativeChild, mainAxis, childFlexBasis
                    + remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor);
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = getFlexGrowFactor(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            updatedMainSize = boundAxis(currentRelativeChild, mainAxis,
                childFlexBasis + remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor);
          }
        }

        deltaFreeSpace -= updatedMainSize - childFlexBasis;

        if (isMainAxisRow) {
          childWidth = updatedMainSize + getMarginAxis(currentRelativeChild, CSSFlexDirectionRow);
          childWidthMeasureMode = CSSMeasureModeExactly;

          if (!isUndefined(availableInnerCrossDim)
              && !isStyleDimDefined(currentRelativeChild, CSSFlexDirectionColumn)
              && heightMeasureMode == CSSMeasureModeExactly
              && getAlignItem(node, currentRelativeChild) == CSSAlignStretch) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode = CSSMeasureModeExactly;
          } else if (!isStyleDimDefined(currentRelativeChild, CSSFlexDirectionColumn)) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode
                = isUndefined(childHeight) ? CSSMeasureModeUndefined : CSSMeasureModeAtMost;
          } else {
            childHeight = currentRelativeChild->style.dimensions[CSSDimensionHeight]
                + getMarginAxis(currentRelativeChild, CSSFlexDirectionColumn);
            childHeightMeasureMode = CSSMeasureModeExactly;
          }
        } else {
          childHeight
              = updatedMainSize + getMarginAxis(currentRelativeChild, CSSFlexDirectionColumn);
          childHeightMeasureMode = CSSMeasureModeExactly;

          if (!isUndefined(availableInnerCrossDim)
              && !isStyleDimDefined(currentRelativeChild, CSSFlexDirectionRow)
              && widthMeasureMode == CSSMeasureModeExactly
              && getAlignItem(node, currentRelativeChild) == CSSAlignStretch) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode = CSSMeasureModeExactly;
          } else if (!isStyleDimDefined(currentRelativeChild, CSSFlexDirectionRow)) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode
                = isUndefined(childWidth) ? CSSMeasureModeUndefined : CSSMeasureModeAtMost;
          } else {
            childWidth = currentRelativeChild->style.dimensions[CSSDimensionWidth]
                + getMarginAxis(currentRelativeChild, CSSFlexDirectionRow);
            childWidthMeasureMode = CSSMeasureModeExactly;
          }
        }

        bool requiresStretchLayout = !isStyleDimDefined(currentRelativeChild, crossAxis)
            && getAlignItem(node, currentRelativeChild) == CSSAlignStretch;

        // Recursively call the layout algorithm for this child with the updated
        // main size.
        layoutNodeInternal(currentRelativeChild, childWidth, childHeight, direction,
            childWidthMeasureMode, childHeightMeasureMode, performLayout && !requiresStretchLayout,
            "flex");

        currentRelativeChild = currentRelativeChild->nextChild;
      }
    }

    remainingFreeSpace = originalRemainingFreeSpace + deltaFreeSpace;

    // STEP 6: MAIN-AXIS JUSTIFICATION & CROSS-AXIS SIZE DETERMINATION

    // At this point, all the children have their dimensions set in the main
    // axis.
    // Their dimensions are also set in the cross axis with the exception of
    // items
    // that are aligned "stretch". We need to compute these stretch values and
    // set the final positions.

    // If we are using "at most" rules in the main axis, we won't distribute
    // any remaining space at this point.
    if (measureModeMainDim == CSSMeasureModeAtMost) {
      remainingFreeSpace = 0;
    }

    // Use justifyContent to figure out how to allocate the remaining space
    // available in the main axis.
    if (justifyContent != CSSJustifyFlexStart) {
      if (justifyContent == CSSJustifyCenter) {
        leadingMainDim = remainingFreeSpace / 2;
      } else if (justifyContent == CSSJustifyFlexEnd) {
        leadingMainDim = remainingFreeSpace;
      } else if (justifyContent == CSSJustifySpaceBetween) {
        remainingFreeSpace = fmaxf(remainingFreeSpace, 0);
        if (itemsOnLine > 1) {
          betweenMainDim = remainingFreeSpace / (itemsOnLine - 1);
        } else {
          betweenMainDim = 0;
        }
      } else if (justifyContent == CSSJustifySpaceAround) {
        // Space on the edges is half of the space between elements
        betweenMainDim = remainingFreeSpace / itemsOnLine;
        leadingMainDim = betweenMainDim / 2;
      }
    }

    float mainDim = leadingPaddingAndBorderMain + leadingMainDim;
    float crossDim = 0;

    for (i = startOfLineIndex; i < endOfLineIndex; ++i) {
      child = CSSNodeListGet(node->children, i);

      if (child->style.positionType == CSSPositionTypeAbsolute
          && isLeadingPosDefined(child, mainAxis)) {
        if (performLayout) {
          // In case the child is position absolute and has left/top being
          // defined, we override the position to whatever the user said
          // (and margin/border).
          child->layout.position[pos[mainAxis]] = getLeadingPosition(child, mainAxis)
              + getLeadingBorder(node, mainAxis) + getLeadingMargin(child, mainAxis);
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
        if (child->style.positionType == CSSPositionTypeRelative) {
          if (canSkipFlex) {
            // If we skipped the flex step, then we can't rely on the
            // measuredDims because
            // they weren't computed. This means we can't call getDimWithMargin.
            mainDim += betweenMainDim + getMarginAxis(child, mainAxis) + child->layout.flexBasis;
            crossDim = availableInnerCrossDim;
          } else {
            // The main dimension is the sum of all the elements dimension plus
            // the spacing.
            mainDim += betweenMainDim + getDimWithMargin(child, mainAxis);

            // The cross dimension is the max of the elements dimension since
            // there
            // can only be one element in that cross dimension.
            crossDim = fmaxf(crossDim, getDimWithMargin(child, crossAxis));
          }
        }
      }
    }

    mainDim += trailingPaddingAndBorderMain;

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == CSSMeasureModeUndefined
        || measureModeCrossDim == CSSMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis = boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross)
          - paddingAndBorderAxisCross;

      if (measureModeCrossDim == CSSMeasureModeAtMost) {
        containerCrossAxis = fminf(containerCrossAxis, availableInnerCrossDim);
      }
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == CSSMeasureModeExactly) {
      crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    crossDim = boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross)
        - paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (i = startOfLineIndex; i < endOfLineIndex; ++i) {
        child = CSSNodeListGet(node->children, i);

        if (child->style.positionType == CSSPositionTypeAbsolute) {
          // If the child is absolutely positioned and has a
          // top/left/bottom/right
          // set, override all the previously computed positions to set it
          // correctly.
          if (isLeadingPosDefined(child, crossAxis)) {
            child->layout.position[pos[crossAxis]] = getLeadingPosition(child, crossAxis)
                + getLeadingBorder(node, crossAxis) + getLeadingMargin(child, crossAxis);
          } else {
            child->layout.position[pos[crossAxis]]
                = leadingPaddingAndBorderCross + getLeadingMargin(child, crossAxis);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (parent) or
          // alignSelf (child) in order to determine the position in the cross
          // axis
          CSSAlign alignItem = getAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time
          // forcing the cross-axis size to be the computed cross size for the
          // current line.
          if (alignItem == CSSAlignStretch) {
            childWidth = child->layout.measuredDimensions[CSSDimensionWidth]
                + getMarginAxis(child, CSSFlexDirectionRow);
            childHeight = child->layout.measuredDimensions[CSSDimensionHeight]
                + getMarginAxis(child, CSSFlexDirectionColumn);
            bool isCrossSizeDefinite = false;

            if (isMainAxisRow) {
              isCrossSizeDefinite = isStyleDimDefined(child, CSSFlexDirectionColumn);
              childHeight = crossDim;
            } else {
              isCrossSizeDefinite = isStyleDimDefined(child, CSSFlexDirectionRow);
              childWidth = crossDim;
            }

            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!isCrossSizeDefinite) {
              childWidthMeasureMode
                  = isUndefined(childWidth) ? CSSMeasureModeUndefined : CSSMeasureModeExactly;
              childHeightMeasureMode
                  = isUndefined(childHeight) ? CSSMeasureModeUndefined : CSSMeasureModeExactly;
              layoutNodeInternal(child, childWidth, childHeight, direction, childWidthMeasureMode,
                  childHeightMeasureMode, true, "stretch");
            }
          } else if (alignItem != CSSAlignFlexStart) {
            float remainingCrossDim = containerCrossAxis - getDimWithMargin(child, crossAxis);

            if (alignItem == CSSAlignCenter) {
              leadingCrossDim += remainingCrossDim / 2;
            } else { // CSSAlignFlexEnd
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

    CSSAlign alignContent = node->style.alignContent;
    if (alignContent == CSSAlignFlexEnd) {
      currentLead += remainingAlignContentDim;
    } else if (alignContent == CSSAlignCenter) {
      currentLead += remainingAlignContentDim / 2;
    } else if (alignContent == CSSAlignStretch) {
      if (availableInnerCrossDim > totalLineCrossDim) {
        crossDimLead = (remainingAlignContentDim / lineCount);
      }
    }

    uint32_t endIndex = 0;
    for (i = 0; i < lineCount; ++i) {
      uint32_t startIndex = endIndex;
      uint32_t j;

      // compute the line's height and find the endIndex
      float lineHeight = 0;
      for (j = startIndex; j < childCount; ++j) {
        child = CSSNodeListGet(node->children, j);
        if (child->style.positionType != CSSPositionTypeRelative) {
          continue;
        }
        if (child->lineIndex != i) {
          break;
        }
        if (isLayoutDimDefined(child, crossAxis)) {
          lineHeight = fmaxf(lineHeight,
              child->layout.measuredDimensions[dim[crossAxis]] + getMarginAxis(child, crossAxis));
        }
      }
      endIndex = j;
      lineHeight += crossDimLead;

      if (performLayout) {
        for (j = startIndex; j < endIndex; ++j) {
          child = CSSNodeListGet(node->children, j);
          if (child->style.positionType != CSSPositionTypeRelative) {
            continue;
          }

          CSSAlign alignContentAlignItem = getAlignItem(node, child);
          if (alignContentAlignItem == CSSAlignFlexStart) {
            child->layout.position[pos[crossAxis]]
                = currentLead + getLeadingMargin(child, crossAxis);
          } else if (alignContentAlignItem == CSSAlignFlexEnd) {
            child->layout.position[pos[crossAxis]] = currentLead + lineHeight
                - getTrailingMargin(child, crossAxis)
                - child->layout.measuredDimensions[dim[crossAxis]];
          } else if (alignContentAlignItem == CSSAlignCenter) {
            childHeight = child->layout.measuredDimensions[dim[crossAxis]];
            child->layout.position[pos[crossAxis]] = currentLead + (lineHeight - childHeight) / 2;
          } else if (alignContentAlignItem == CSSAlignStretch) {
            child->layout.position[pos[crossAxis]]
                = currentLead + getLeadingMargin(child, crossAxis);
            // TODO(prenaux): Correctly set the height of items with indefinite
            //                (auto) crossAxis dimension.
          }
        }
      }

      currentLead += lineHeight;
    }
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS
  node->layout.measuredDimensions[CSSDimensionWidth]
      = boundAxis(node, CSSFlexDirectionRow, availableWidth - marginAxisRow);
  node->layout.measuredDimensions[CSSDimensionHeight]
      = boundAxis(node, CSSFlexDirectionColumn, availableHeight - marginAxisColumn);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == CSSMeasureModeUndefined) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[mainAxis]] = boundAxis(node, mainAxis, maxLineMainDim);
  } else if (measureModeMainDim == CSSMeasureModeAtMost) {
    node->layout.measuredDimensions[dim[mainAxis]]
        = fmaxf(fminf(availableInnerMainDim + paddingAndBorderAxisMain,
                    boundAxisWithinMinAndMax(node, mainAxis, maxLineMainDim)),
            paddingAndBorderAxisMain);
  }

  if (measureModeCrossDim == CSSMeasureModeUndefined) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[crossAxis]]
        = boundAxis(node, crossAxis, totalLineCrossDim + paddingAndBorderAxisCross);
  } else if (measureModeCrossDim == CSSMeasureModeAtMost) {
    node->layout.measuredDimensions[dim[crossAxis]]
        = fmaxf(fminf(availableInnerCrossDim + paddingAndBorderAxisCross,
                    boundAxisWithinMinAndMax(
                          node, crossAxis, totalLineCrossDim + paddingAndBorderAxisCross)),
            paddingAndBorderAxisCross);
  }

  // STEP 10: SIZING AND POSITIONING ABSOLUTE CHILDREN
  currentAbsoluteChild = firstAbsoluteChild;
  while (currentAbsoluteChild != NULL) {
    // Now that we know the bounds of the container, perform layout again on the
    // absolutely-positioned children.
    if (performLayout) {

      childWidth = CSSUndefined;
      childHeight = CSSUndefined;

      if (isStyleDimDefined(currentAbsoluteChild, CSSFlexDirectionRow)) {
        childWidth = currentAbsoluteChild->style.dimensions[CSSDimensionWidth]
            + getMarginAxis(currentAbsoluteChild, CSSFlexDirectionRow);
      } else {
        // If the child doesn't have a specified width, compute the width based
        // on the left/right
        // offsets if they're defined.
        if (isLeadingPosDefined(currentAbsoluteChild, CSSFlexDirectionRow)
            && isTrailingPosDefined(currentAbsoluteChild, CSSFlexDirectionRow)) {
          childWidth = node->layout.measuredDimensions[CSSDimensionWidth]
              - (getLeadingBorder(node, CSSFlexDirectionRow)
                           + getTrailingBorder(node, CSSFlexDirectionRow))
              - (getLeadingPosition(currentAbsoluteChild, CSSFlexDirectionRow)
                           + getTrailingPosition(currentAbsoluteChild, CSSFlexDirectionRow));
          childWidth = boundAxis(currentAbsoluteChild, CSSFlexDirectionRow, childWidth);
        }
      }

      if (isStyleDimDefined(currentAbsoluteChild, CSSFlexDirectionColumn)) {
        childHeight = currentAbsoluteChild->style.dimensions[CSSDimensionHeight]
            + getMarginAxis(currentAbsoluteChild, CSSFlexDirectionColumn);
      } else {
        // If the child doesn't have a specified height, compute the height
        // based on the top/bottom
        // offsets if they're defined.
        if (isLeadingPosDefined(currentAbsoluteChild, CSSFlexDirectionColumn)
            && isTrailingPosDefined(currentAbsoluteChild, CSSFlexDirectionColumn)) {
          childHeight = node->layout.measuredDimensions[CSSDimensionHeight]
              - (getLeadingBorder(node, CSSFlexDirectionColumn)
                            + getTrailingBorder(node, CSSFlexDirectionColumn))
              - (getLeadingPosition(currentAbsoluteChild, CSSFlexDirectionColumn)
                            + getTrailingPosition(currentAbsoluteChild, CSSFlexDirectionColumn));
          childHeight = boundAxis(currentAbsoluteChild, CSSFlexDirectionColumn, childHeight);
        }
      }

      // If we're still missing one or the other dimension, measure the content.
      if (isUndefined(childWidth) || isUndefined(childHeight)) {
        childWidthMeasureMode
            = isUndefined(childWidth) ? CSSMeasureModeUndefined : CSSMeasureModeExactly;
        childHeightMeasureMode
            = isUndefined(childHeight) ? CSSMeasureModeUndefined : CSSMeasureModeExactly;

        // According to the spec, if the main size is not definite and the
        // child's inline axis is parallel to the main axis (i.e. it's
        // horizontal), the child should be sized using "UNDEFINED" in
        // the main size. Otherwise use "AT_MOST" in the cross axis.
        if (!isMainAxisRow && isUndefined(childWidth) && !isUndefined(availableInnerWidth)) {
          childWidth = availableInnerWidth;
          childWidthMeasureMode = CSSMeasureModeAtMost;
        }

        // The W3C spec doesn't say anything about the 'overflow' property,
        // but all major browsers appear to implement the following logic.
        if (node->style.overflow == CSSOverflowHidden) {
          if (isMainAxisRow && isUndefined(childHeight) && !isUndefined(availableInnerHeight)) {
            childHeight = availableInnerHeight;
            childHeightMeasureMode = CSSMeasureModeAtMost;
          }
        }

        layoutNodeInternal(currentAbsoluteChild, childWidth, childHeight, direction,
            childWidthMeasureMode, childHeightMeasureMode, false, "abs-measure");
        childWidth = currentAbsoluteChild->layout.measuredDimensions[CSSDimensionWidth]
            + getMarginAxis(currentAbsoluteChild, CSSFlexDirectionRow);
        childHeight = currentAbsoluteChild->layout.measuredDimensions[CSSDimensionHeight]
            + getMarginAxis(currentAbsoluteChild, CSSFlexDirectionColumn);
      }

      layoutNodeInternal(currentAbsoluteChild, childWidth, childHeight, direction,
          CSSMeasureModeExactly, CSSMeasureModeExactly, true, "abs-layout");

      if (isTrailingPosDefined(currentAbsoluteChild, mainAxis)
          && !isLeadingPosDefined(currentAbsoluteChild, mainAxis)) {
        currentAbsoluteChild->layout.position[leading[mainAxis]]
            = node->layout.measuredDimensions[dim[mainAxis]]
            - currentAbsoluteChild->layout.measuredDimensions[dim[mainAxis]]
            - getTrailingPosition(currentAbsoluteChild, mainAxis);
      }

      if (isTrailingPosDefined(currentAbsoluteChild, crossAxis)
          && !isLeadingPosDefined(currentAbsoluteChild, crossAxis)) {
        currentAbsoluteChild->layout.position[leading[crossAxis]]
            = node->layout.measuredDimensions[dim[crossAxis]]
            - currentAbsoluteChild->layout.measuredDimensions[dim[crossAxis]]
            - getTrailingPosition(currentAbsoluteChild, crossAxis);
      }
    }

    currentAbsoluteChild = currentAbsoluteChild->nextChild;
  }

  // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
  if (performLayout) {
    bool needsMainTrailingPos = false;
    bool needsCrossTrailingPos = false;

    if (mainAxis == CSSFlexDirectionRowReverse || mainAxis == CSSFlexDirectionColumnReverse) {
      needsMainTrailingPos = true;
    }

    if (crossAxis == CSSFlexDirectionRowReverse || crossAxis == CSSFlexDirectionColumnReverse) {
      needsCrossTrailingPos = true;
    }

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (i = 0; i < childCount; ++i) {
        child = CSSNodeListGet(node->children, i);

        if (needsMainTrailingPos) {
          setTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          setTrailingPosition(node, child, crossAxis);
        }
      }
    }
  }
}

uint32_t gDepth = 0;
bool gPrintTree = false;
bool gPrintChanges = false;
bool gPrintSkips = false;

static const char *spacer = "                                                            ";

static const char *getSpacer(unsigned long level) {
  unsigned long spacerLen = strlen(spacer);
  if (level > spacerLen) {
    level = spacerLen;
  }
  return &spacer[spacerLen - level];
}

static const char *getModeName(CSSMeasureMode mode, bool performLayout) {
  const char *kMeasureModeNames[CSSMeasureModeCount] = { "UNDEFINED", "EXACTLY", "AT_MOST" };
  const char *kLayoutModeNames[CSSMeasureModeCount]
      = { "LAY_UNDEFINED", "LAY_EXACTLY", "LAY_AT_MOST" };

  if (mode >= CSSMeasureModeCount) {
    return "";
  }

  return performLayout ? kLayoutModeNames[mode] : kMeasureModeNames[mode];
}

static bool canUseCachedMeasurement(bool isTextNode,
    float availableWidth,
    float availableHeight,
    float margin_row,
    float margin_column,
    CSSMeasureMode widthMeasureMode,
    CSSMeasureMode heightMeasureMode,
    CSSCachedMeasurement cached_layout) {

  bool is_height_same = (cached_layout.heightMeasureMode == CSSMeasureModeUndefined
                            && heightMeasureMode == CSSMeasureModeUndefined)
      || (cached_layout.heightMeasureMode == heightMeasureMode
                            && eq(cached_layout.availableHeight, availableHeight));

  bool is_width_same = (cached_layout.widthMeasureMode == CSSMeasureModeUndefined
                           && widthMeasureMode == CSSMeasureModeUndefined)
      || (cached_layout.widthMeasureMode == widthMeasureMode
                           && eq(cached_layout.availableWidth, availableWidth));

  if (is_height_same && is_width_same) {
    return true;
  }

  bool is_height_valid = (cached_layout.heightMeasureMode == CSSMeasureModeUndefined
                             && heightMeasureMode == CSSMeasureModeAtMost
                             && cached_layout.computedHeight <= (availableHeight - margin_column))
      || (heightMeasureMode == CSSMeasureModeExactly
                             && eq(cached_layout.computedHeight, availableHeight - margin_column));

  if (is_width_same && is_height_valid) {
    return true;
  }

  bool is_width_valid = (cached_layout.widthMeasureMode == CSSMeasureModeUndefined
                            && widthMeasureMode == CSSMeasureModeAtMost
                            && cached_layout.computedWidth <= (availableWidth - margin_row))
      || (widthMeasureMode == CSSMeasureModeExactly
                            && eq(cached_layout.computedWidth, availableWidth - margin_row));

  if (is_height_same && is_width_valid) {
    return true;
  }

  if (is_height_valid && is_width_valid) {
    return true;
  }

  // We know this to be text so we can apply some more specialized heuristics.
  if (isTextNode) {
    if (is_width_same) {
      if (heightMeasureMode == CSSMeasureModeUndefined) {
        // Width is the same and height is not restricted. Re-use cahced value.
        return true;
      }

      if (heightMeasureMode == CSSMeasureModeAtMost
          && cached_layout.computedHeight < (availableHeight - margin_column)) {
        // Width is the same and height restriction is greater than the cached
        // height. Re-use cached
        // value.
        return true;
      }

      // Width is the same but height restriction imposes smaller height than
      // previously measured.
      // Update the cached value to respect the new height restriction.
      cached_layout.computedHeight = availableHeight - margin_column;
      return true;
    }

    if (cached_layout.widthMeasureMode == CSSMeasureModeUndefined) {
      if (widthMeasureMode == CSSMeasureModeUndefined
          || (widthMeasureMode == CSSMeasureModeAtMost
                 && cached_layout.computedWidth <= (availableWidth - margin_row))) {
        // Previsouly this text was measured with no width restriction, if width
        // is now restricted
        // but to a larger value than the previsouly measured width we can
        // re-use the measurement
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
bool layoutNodeInternal(CSSNode *node,
    float availableWidth,
    float availableHeight,
    CSSDirection parentDirection,
    CSSMeasureMode widthMeasureMode,
    CSSMeasureMode heightMeasureMode,
    bool performLayout,
    char *reason) {
  CSSLayout *layout = &node->layout;

  gDepth++;

  bool needToVisitNode = (node->isDirty && layout->generationCount != gCurrentGenerationCount)
      || layout->lastParentDirection != parentDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout->nextCachedMeasurementsIndex = 0;
    layout->cached_layout.widthMeasureMode = (CSSMeasureMode)-1;
    layout->cached_layout.heightMeasureMode = (CSSMeasureMode)-1;
  }

  CSSCachedMeasurement *cachedResults = NULL;

  // Determine whether the results are already cached. We maintain a separate
  // cache for layouts and measurements. A layout operation modifies the
  // positions
  // and dimensions for nodes in the subtree. The algorithm assumes that each
  // node
  // gets layed out a maximum of one time per tree layout, but multiple
  // measurements
  // may be required to resolve all of the flex dimensions.
  // We handle nodes with measure functions specially here because they are the
  // most
  // expensive to measure, so it's worth avoiding redundant measurements if at
  // all possible.
  if (isMeasureDefined(node)) {
    float marginAxisRow = getMarginAxis(node, CSSFlexDirectionRow);
    float marginAxisColumn = getMarginAxis(node, CSSFlexDirectionColumn);

    // First, try to use the layout cache.
    if (canUseCachedMeasurement(node->isTextNode, availableWidth, availableHeight, marginAxisRow,
            marginAxisColumn, widthMeasureMode, heightMeasureMode, layout->cached_layout)) {
      cachedResults = &layout->cached_layout;
    } else {
      // Try to use the measurement cache.
      for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
        if (canUseCachedMeasurement(node->isTextNode, availableWidth, availableHeight,
                marginAxisRow, marginAxisColumn, widthMeasureMode, heightMeasureMode,
                layout->cachedMeasurements[i])) {
          cachedResults = &layout->cachedMeasurements[i];
          break;
        }
      }
    }
  } else if (performLayout) {
    if (eq(layout->cached_layout.availableWidth, availableWidth)
        && eq(layout->cached_layout.availableHeight, availableHeight)
        && layout->cached_layout.widthMeasureMode == widthMeasureMode
        && layout->cached_layout.heightMeasureMode == heightMeasureMode) {

      cachedResults = &layout->cached_layout;
    }
  } else {
    for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
      if (eq(layout->cachedMeasurements[i].availableWidth, availableWidth)
          && eq(layout->cachedMeasurements[i].availableHeight, availableHeight)
          && layout->cachedMeasurements[i].widthMeasureMode == widthMeasureMode
          && layout->cachedMeasurements[i].heightMeasureMode == heightMeasureMode) {

        cachedResults = &layout->cachedMeasurements[i];
        break;
      }
    }
  }

  if (!needToVisitNode && cachedResults != NULL) {
    layout->measuredDimensions[CSSDimensionWidth] = cachedResults->computedWidth;
    layout->measuredDimensions[CSSDimensionHeight] = cachedResults->computedHeight;

    if (gPrintChanges && gPrintSkips) {
      printf("%s%d.{[skipped] ", getSpacer(gDepth), gDepth);
      if (node->print) {
        node->print(node->context);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
          getModeName(widthMeasureMode, performLayout),
          getModeName(heightMeasureMode, performLayout), availableWidth, availableHeight,
          cachedResults->computedWidth, cachedResults->computedHeight, reason);
    }
  } else {

    if (gPrintChanges) {
      printf("%s%d.{%s", getSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node->context);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f %s\n", getModeName(widthMeasureMode, performLayout),
          getModeName(heightMeasureMode, performLayout), availableWidth, availableHeight, reason);
    }

    layoutNodeImpl(node, availableWidth, availableHeight, parentDirection, widthMeasureMode,
        heightMeasureMode, performLayout);

    if (gPrintChanges) {
      printf("%s%d.}%s", getSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node->context);
      }
      printf("wm: %s, hm: %s, d: (%f, %f) %s\n", getModeName(widthMeasureMode, performLayout),
          getModeName(heightMeasureMode, performLayout),
          layout->measuredDimensions[CSSDimensionWidth],
          layout->measuredDimensions[CSSDimensionHeight], reason);
    }

    layout->lastParentDirection = parentDirection;

    if (cachedResults == NULL) {
      if (layout->nextCachedMeasurementsIndex == CSS_MAX_CACHED_RESULT_COUNT) {
        if (gPrintChanges) {
          printf("Out of cache entries!\n");
        }
        layout->nextCachedMeasurementsIndex = 0;
      }

      CSSCachedMeasurement *newCacheEntry;
      if (performLayout) {
        // Use the single layout cache entry.
        newCacheEntry = &layout->cached_layout;
      } else {
        // Allocate a new measurement cache entry.
        newCacheEntry = &layout->cachedMeasurements[layout->nextCachedMeasurementsIndex];
        layout->nextCachedMeasurementsIndex++;
      }

      newCacheEntry->availableWidth = availableWidth;
      newCacheEntry->availableHeight = availableHeight;
      newCacheEntry->widthMeasureMode = widthMeasureMode;
      newCacheEntry->heightMeasureMode = heightMeasureMode;
      newCacheEntry->computedWidth = layout->measuredDimensions[CSSDimensionWidth];
      newCacheEntry->computedHeight = layout->measuredDimensions[CSSDimensionHeight];
    }
  }

  if (performLayout) {
    node->layout.dimensions[CSSDimensionWidth] = node->layout.measuredDimensions[CSSDimensionWidth];
    node->layout.dimensions[CSSDimensionHeight]
        = node->layout.measuredDimensions[CSSDimensionHeight];
    node->hasNewLayout = true;
    node->isDirty = false;
  }

  gDepth--;
  layout->generationCount = gCurrentGenerationCount;
  return (needToVisitNode || cachedResults == NULL);
}

void CSSNodeCalculateLayout(
    CSSNode *node, float availableWidth, float availableHeight, CSSDirection parentDirection) {
  // Increment the generation count. This will force the recursive routine to
  // visit
  // all dirty nodes at least once. Subsequent visits will be skipped if the
  // input
  // parameters don't change.
  gCurrentGenerationCount++;

  CSSMeasureMode widthMeasureMode = CSSMeasureModeUndefined;
  CSSMeasureMode heightMeasureMode = CSSMeasureModeUndefined;

  if (!isUndefined(availableWidth)) {
    widthMeasureMode = CSSMeasureModeExactly;
  } else if (isStyleDimDefined(node, CSSFlexDirectionRow)) {
    availableWidth = node->style.dimensions[dim[CSSFlexDirectionRow]]
        + getMarginAxis(node, CSSFlexDirectionRow);
    widthMeasureMode = CSSMeasureModeExactly;
  } else if (node->style.maxDimensions[CSSDimensionWidth] >= 0.0) {
    availableWidth = node->style.maxDimensions[CSSDimensionWidth];
    widthMeasureMode = CSSMeasureModeAtMost;
  }

  if (!isUndefined(availableHeight)) {
    heightMeasureMode = CSSMeasureModeExactly;
  } else if (isStyleDimDefined(node, CSSFlexDirectionColumn)) {
    availableHeight = node->style.dimensions[dim[CSSFlexDirectionColumn]]
        + getMarginAxis(node, CSSFlexDirectionColumn);
    heightMeasureMode = CSSMeasureModeExactly;
  } else if (node->style.maxDimensions[CSSDimensionHeight] >= 0.0) {
    availableHeight = node->style.maxDimensions[CSSDimensionHeight];
    heightMeasureMode = CSSMeasureModeAtMost;
  }

  if (layoutNodeInternal(node, availableWidth, availableHeight, parentDirection, widthMeasureMode,
          heightMeasureMode, true, "initial")) {

    setPosition(node, node->layout.direction);

    if (gPrintTree) {
      CSSNodePrint(node, CSSPrintOptionsLayout | CSSPrintOptionsChildren | CSSPrintOptionsStyle);
    }
  }
}
