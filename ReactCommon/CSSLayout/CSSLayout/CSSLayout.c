/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <string.h>

#include "CSSLayout.h"
#include "CSSNodeList.h"

#ifdef _MSC_VER
#include <float.h>
#ifndef isnan
#define isnan _isnan
#endif

#ifndef __cplusplus
#define inline __inline
#endif

/* define fmaxf if < VC12 */
#if _MSC_VER < 1800
__forceinline const float fmaxf(const float a, const float b) {
  return (a > b) ? a : b;
}
#endif
#endif

typedef struct CSSCachedMeasurement {
  float availableWidth;
  float availableHeight;
  YGMeasureMode widthMeasureMode;
  YGMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;
} CSSCachedMeasurement;

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
enum { CSS_MAX_CACHED_RESULT_COUNT = 16 };

typedef struct CSSLayout {
  float position[4];
  float dimensions[2];
  YGDirection direction;

  uint32_t computedFlexBasisGeneration;
  float computedFlexBasis;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  YGDirection lastParentDirection;

  uint32_t nextCachedMeasurementsIndex;
  CSSCachedMeasurement cachedMeasurements[CSS_MAX_CACHED_RESULT_COUNT];
  float measuredDimensions[2];

  CSSCachedMeasurement cachedLayout;
} CSSLayout;

typedef struct CSSStyle {
  YGDirection direction;
  YGFlexDirection flexDirection;
  YGJustify justifyContent;
  YGAlign alignContent;
  YGAlign alignItems;
  YGAlign alignSelf;
  YGPositionType positionType;
  YGWrap flexWrap;
  YGOverflow overflow;
  float flex;
  float flexGrow;
  float flexShrink;
  float flexBasis;
  float margin[YGEdgeCount];
  float position[YGEdgeCount];
  float padding[YGEdgeCount];
  float border[YGEdgeCount];
  float dimensions[2];
  float minDimensions[2];
  float maxDimensions[2];

  // Yoga specific properties, not compatible with flexbox specification
  float aspectRatio;
} CSSStyle;

typedef struct CSSNode {
  CSSStyle style;
  CSSLayout layout;
  uint32_t lineIndex;
  bool hasNewLayout;
  CSSNodeRef parent;
  CSSNodeListRef children;
  bool isDirty;

  struct CSSNode *nextChild;

  CSSMeasureFunc measure;
  CSSPrintFunc print;
  void *context;
} CSSNode;

static void _CSSNodeMarkDirty(const CSSNodeRef node);

CSSMalloc gCSSMalloc = &malloc;
CSSCalloc gCSSCalloc = &calloc;
CSSRealloc gCSSRealloc = &realloc;
CSSFree gCSSFree = &free;

#ifdef ANDROID
#include <android/log.h>
static int _csslayoutAndroidLog(YGLogLevel level, const char *format, va_list args) {
  int androidLevel = YGLogLevelDebug;
  switch (level) {
    case YGLogLevelError:
      androidLevel = ANDROID_LOG_ERROR;
      break;
    case YGLogLevelWarn:
      androidLevel = ANDROID_LOG_WARN;
      break;
    case YGLogLevelInfo:
      androidLevel = ANDROID_LOG_INFO;
      break;
    case YGLogLevelDebug:
      androidLevel = ANDROID_LOG_DEBUG;
      break;
    case YGLogLevelVerbose:
      androidLevel = ANDROID_LOG_VERBOSE;
      break;
    case YGLogLevelCount:
      break;
  }
  const int result = __android_log_vprint(androidLevel, "css-layout", format, args);
  return result;
}
static CSSLogger gLogger = &_csslayoutAndroidLog;
#else
static int _csslayoutDefaultLog(YGLogLevel level, const char *format, va_list args) {
  switch (level) {
    case YGLogLevelError:
      return vfprintf(stderr, format, args);
    case YGLogLevelWarn:
    case YGLogLevelInfo:
    case YGLogLevelDebug:
    case YGLogLevelVerbose:
    default:
      return vprintf(format, args);
  }
}
static CSSLogger gLogger = &_csslayoutDefaultLog;
#endif

static inline float computedEdgeValue(const float edges[YGEdgeCount],
                                      const YGEdge edge,
                                      const float defaultValue) {
  CSS_ASSERT(edge <= YGEdgeEnd, "Cannot get computed value of multi-edge shorthands");

  if (!CSSValueIsUndefined(edges[edge])) {
    return edges[edge];
  }

  if ((edge == YGEdgeTop || edge == YGEdgeBottom) && !CSSValueIsUndefined(edges[YGEdgeVertical])) {
    return edges[YGEdgeVertical];
  }

  if ((edge == YGEdgeLeft || edge == YGEdgeRight || edge == YGEdgeStart || edge == YGEdgeEnd) &&
      !CSSValueIsUndefined(edges[YGEdgeHorizontal])) {
    return edges[YGEdgeHorizontal];
  }

  if (!CSSValueIsUndefined(edges[YGEdgeAll])) {
    return edges[YGEdgeAll];
  }

  if (edge == YGEdgeStart || edge == YGEdgeEnd) {
    return YGUndefined;
  }

  return defaultValue;
}

int32_t gNodeInstanceCount = 0;

CSSNodeRef CSSNodeNew(void) {
  const CSSNodeRef node = gCSSCalloc(1, sizeof(CSSNode));
  CSS_ASSERT(node, "Could not allocate memory for node");
  gNodeInstanceCount++;

  CSSNodeInit(node);
  return node;
}

void CSSNodeFree(const CSSNodeRef node) {
  if (node->parent) {
    CSSNodeListDelete(node->parent->children, node);
    node->parent = NULL;
  }

  const uint32_t childCount = CSSNodeChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const CSSNodeRef child = CSSNodeGetChild(node, i);
    child->parent = NULL;
  }

  CSSNodeListFree(node->children);
  gCSSFree(node);
  gNodeInstanceCount--;
}

void CSSNodeFreeRecursive(const CSSNodeRef root) {
  while (CSSNodeChildCount(root) > 0) {
    const CSSNodeRef child = CSSNodeGetChild(root, 0);
    CSSNodeRemoveChild(root, child);
    CSSNodeFreeRecursive(child);
  }
  CSSNodeFree(root);
}

void CSSNodeReset(const CSSNodeRef node) {
  CSS_ASSERT(CSSNodeChildCount(node) == 0, "Cannot reset a node which still has children attached");
  CSS_ASSERT(node->parent == NULL, "Cannot reset a node still attached to a parent");

  CSSNodeListFree(node->children);
  memset(node, 0, sizeof(CSSNode));
  CSSNodeInit(node);
}

int32_t CSSNodeGetInstanceCount(void) {
  return gNodeInstanceCount;
}

void CSSNodeInit(const CSSNodeRef node) {
  node->parent = NULL;
  node->children = NULL;
  node->hasNewLayout = true;
  node->isDirty = false;

  node->style.flex = YGUndefined;
  node->style.flexGrow = YGUndefined;
  node->style.flexShrink = YGUndefined;
  node->style.flexBasis = YGUndefined;

  node->style.alignItems = YGAlignStretch;
  node->style.alignContent = YGAlignFlexStart;

  node->style.direction = YGDirectionInherit;
  node->style.flexDirection = YGFlexDirectionColumn;

  node->style.overflow = YGOverflowVisible;

  // Some of the fields default to undefined and not 0
  node->style.dimensions[YGDimensionWidth] = YGUndefined;
  node->style.dimensions[YGDimensionHeight] = YGUndefined;

  node->style.minDimensions[YGDimensionWidth] = YGUndefined;
  node->style.minDimensions[YGDimensionHeight] = YGUndefined;

  node->style.maxDimensions[YGDimensionWidth] = YGUndefined;
  node->style.maxDimensions[YGDimensionHeight] = YGUndefined;

  for (YGEdge edge = YGEdgeLeft; edge < YGEdgeCount; edge++) {
    node->style.position[edge] = YGUndefined;
    node->style.margin[edge] = YGUndefined;
    node->style.padding[edge] = YGUndefined;
    node->style.border[edge] = YGUndefined;
  }

  node->style.aspectRatio = YGUndefined;

  node->layout.dimensions[YGDimensionWidth] = YGUndefined;
  node->layout.dimensions[YGDimensionHeight] = YGUndefined;

  // Such that the comparison is always going to be false
  node->layout.lastParentDirection = (YGDirection) -1;
  node->layout.nextCachedMeasurementsIndex = 0;
  node->layout.computedFlexBasis = YGUndefined;

  node->layout.measuredDimensions[YGDimensionWidth] = YGUndefined;
  node->layout.measuredDimensions[YGDimensionHeight] = YGUndefined;
  node->layout.cachedLayout.widthMeasureMode = (YGMeasureMode) -1;
  node->layout.cachedLayout.heightMeasureMode = (YGMeasureMode) -1;
  node->layout.cachedLayout.computedWidth = -1;
  node->layout.cachedLayout.computedHeight = -1;
}

static void _CSSNodeMarkDirty(const CSSNodeRef node) {
  if (!node->isDirty) {
    node->isDirty = true;
    node->layout.computedFlexBasis = YGUndefined;
    if (node->parent) {
      _CSSNodeMarkDirty(node->parent);
    }
  }
}

void CSSNodeSetMeasureFunc(const CSSNodeRef node, CSSMeasureFunc measureFunc) {
  if (measureFunc == NULL) {
    node->measure = NULL;
  } else {
    CSS_ASSERT(CSSNodeChildCount(node) == 0,
               "Cannot set measure function: Nodes with measure functions cannot have children.");
    node->measure = measureFunc;
  }
}

CSSMeasureFunc CSSNodeGetMeasureFunc(const CSSNodeRef node) {
  return node->measure;
}

void CSSNodeInsertChild(const CSSNodeRef node, const CSSNodeRef child, const uint32_t index) {
  CSS_ASSERT(child->parent == NULL, "Child already has a parent, it must be removed first.");
  CSS_ASSERT(node->measure == NULL,
             "Cannot add child: Nodes with measure functions cannot have children.");
  CSSNodeListInsert(&node->children, child, index);
  child->parent = node;
  _CSSNodeMarkDirty(node);
}

void CSSNodeRemoveChild(const CSSNodeRef node, const CSSNodeRef child) {
  if (CSSNodeListDelete(node->children, child) != NULL) {
    child->parent = NULL;
    _CSSNodeMarkDirty(node);
  }
}

CSSNodeRef CSSNodeGetChild(const CSSNodeRef node, const uint32_t index) {
  return CSSNodeListGet(node->children, index);
}

inline uint32_t CSSNodeChildCount(const CSSNodeRef node) {
  return CSSNodeListCount(node->children);
}

void CSSNodeMarkDirty(const CSSNodeRef node) {
  CSS_ASSERT(node->measure != NULL,
             "Only leaf nodes with custom measure functions"
             "should manually mark themselves as dirty");
  _CSSNodeMarkDirty(node);
}

bool CSSNodeIsDirty(const CSSNodeRef node) {
  return node->isDirty;
}

void CSSNodeCopyStyle(const CSSNodeRef dstNode, const CSSNodeRef srcNode) {
  if (memcmp(&dstNode->style, &srcNode->style, sizeof(CSSStyle)) != 0) {
    memcpy(&dstNode->style, &srcNode->style, sizeof(CSSStyle));
    _CSSNodeMarkDirty(dstNode);
  }
}

inline float CSSNodeStyleGetFlexGrow(const CSSNodeRef node) {
  if (!CSSValueIsUndefined(node->style.flexGrow)) {
    return node->style.flexGrow;
  }
  if (!CSSValueIsUndefined(node->style.flex) && node->style.flex > 0) {
    return node->style.flex;
  }
  return 0;
}

inline float CSSNodeStyleGetFlexShrink(const CSSNodeRef node) {
  if (!CSSValueIsUndefined(node->style.flexShrink)) {
    return node->style.flexShrink;
  }
  if (!CSSValueIsUndefined(node->style.flex) && node->style.flex < 0) {
    return -node->style.flex;
  }
  return 0;
}

inline float CSSNodeStyleGetFlexBasis(const CSSNodeRef node) {
  if (!CSSValueIsUndefined(node->style.flexBasis)) {
    return node->style.flexBasis;
  }
  if (!CSSValueIsUndefined(node->style.flex)) {
    return node->style.flex > 0 ? 0 : YGUndefined;
  }
  return YGUndefined;
}

void CSSNodeStyleSetFlex(const CSSNodeRef node, const float flex) {
  if (node->style.flex != flex) {
    node->style.flex = flex;
    _CSSNodeMarkDirty(node);
  }
}

#define CSS_NODE_PROPERTY_IMPL(type, name, paramName, instanceName) \
  void CSSNodeSet##name(const CSSNodeRef node, type paramName) {    \
    node->instanceName = paramName;                                 \
  }                                                                 \
                                                                    \
  type CSSNodeGet##name(const CSSNodeRef node) {                    \
    return node->instanceName;                                      \
  }

#define CSS_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
  void CSSNodeStyleSet##name(const CSSNodeRef node, const type paramName) {      \
    if (node->style.instanceName != paramName) {                                 \
      node->style.instanceName = paramName;                                      \
      _CSSNodeMarkDirty(node);                                                   \
    }                                                                            \
  }

#define CSS_NODE_STYLE_PROPERTY_IMPL(type, name, paramName, instanceName)  \
  CSS_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
                                                                           \
  type CSSNodeStyleGet##name(const CSSNodeRef node) {                      \
    return node->style.instanceName;                                       \
  }

#define CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(type, name, paramName, instanceName, defaultValue)   \
  void CSSNodeStyleSet##name(const CSSNodeRef node, const YGEdge edge, const type paramName) { \
    if (node->style.instanceName[edge] != paramName) {                                         \
      node->style.instanceName[edge] = paramName;                                              \
      _CSSNodeMarkDirty(node);                                                                 \
    }                                                                                          \
  }                                                                                            \
                                                                                               \
  type CSSNodeStyleGet##name(const CSSNodeRef node, const YGEdge edge) {                       \
    return computedEdgeValue(node->style.instanceName, edge, defaultValue);                    \
  }

#define CSS_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName) \
  type CSSNodeLayoutGet##name(const CSSNodeRef node) {          \
    return node->layout.instanceName;                           \
  }

CSS_NODE_PROPERTY_IMPL(void *, Context, context, context);
CSS_NODE_PROPERTY_IMPL(CSSPrintFunc, PrintFunc, printFunc, print);
CSS_NODE_PROPERTY_IMPL(bool, HasNewLayout, hasNewLayout, hasNewLayout);

CSS_NODE_STYLE_PROPERTY_IMPL(YGDirection, Direction, direction, direction);
CSS_NODE_STYLE_PROPERTY_IMPL(YGFlexDirection, FlexDirection, flexDirection, flexDirection);
CSS_NODE_STYLE_PROPERTY_IMPL(YGJustify, JustifyContent, justifyContent, justifyContent);
CSS_NODE_STYLE_PROPERTY_IMPL(YGAlign, AlignContent, alignContent, alignContent);
CSS_NODE_STYLE_PROPERTY_IMPL(YGAlign, AlignItems, alignItems, alignItems);
CSS_NODE_STYLE_PROPERTY_IMPL(YGAlign, AlignSelf, alignSelf, alignSelf);
CSS_NODE_STYLE_PROPERTY_IMPL(YGPositionType, PositionType, positionType, positionType);
CSS_NODE_STYLE_PROPERTY_IMPL(YGWrap, FlexWrap, flexWrap, flexWrap);
CSS_NODE_STYLE_PROPERTY_IMPL(YGOverflow, Overflow, overflow, overflow);

CSS_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexGrow, flexGrow, flexGrow);
CSS_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexShrink, flexShrink, flexShrink);
CSS_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexBasis, flexBasis, flexBasis);

CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Position, position, position, YGUndefined);
CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Margin, margin, margin, 0);
CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Padding, padding, padding, 0);
CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Border, border, border, 0);

CSS_NODE_STYLE_PROPERTY_IMPL(float, Width, width, dimensions[YGDimensionWidth]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, Height, height, dimensions[YGDimensionHeight]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MinWidth, minWidth, minDimensions[YGDimensionWidth]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MinHeight, minHeight, minDimensions[YGDimensionHeight]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MaxWidth, maxWidth, maxDimensions[YGDimensionWidth]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MaxHeight, maxHeight, maxDimensions[YGDimensionHeight]);

// Yoga specific properties, not compatible with flexbox specification
CSS_NODE_STYLE_PROPERTY_IMPL(float, AspectRatio, aspectRatio, aspectRatio);

CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[YGEdgeLeft]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[YGEdgeTop]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[YGEdgeRight]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[YGEdgeBottom]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[YGDimensionWidth]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[YGDimensionHeight]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(YGDirection, Direction, direction);

uint32_t gCurrentGenerationCount = 0;

bool layoutNodeInternal(const CSSNodeRef node,
                        const float availableWidth,
                        const float availableHeight,
                        const YGDirection parentDirection,
                        const YGMeasureMode widthMeasureMode,
                        const YGMeasureMode heightMeasureMode,
                        const bool performLayout,
                        const char *reason);

inline bool CSSValueIsUndefined(const float value) {
  return isnan(value);
}

static inline bool eq(const float a, const float b) {
  if (CSSValueIsUndefined(a)) {
    return CSSValueIsUndefined(b);
  }
  return fabs(a - b) < 0.0001;
}

static void indent(const uint32_t n) {
  for (uint32_t i = 0; i < n; i++) {
    CSSLog(YGLogLevelDebug, "  ");
  }
}

static void printNumberIfNotZero(const char *str, const float number) {
  if (!eq(number, 0)) {
    CSSLog(YGLogLevelDebug, "%s: %g, ", str, number);
  }
}

static void printNumberIfNotUndefined(const char *str, const float number) {
  if (!CSSValueIsUndefined(number)) {
    CSSLog(YGLogLevelDebug, "%s: %g, ", str, number);
  }
}

static bool eqFour(const float four[4]) {
  return eq(four[0], four[1]) && eq(four[0], four[2]) && eq(four[0], four[3]);
}

static void _CSSNodePrint(const CSSNodeRef node,
                          const YGPrintOptions options,
                          const uint32_t level) {
  indent(level);
  CSSLog(YGLogLevelDebug, "{");

  if (node->print) {
    node->print(node);
  }

  if (options & YGPrintOptionsLayout) {
    CSSLog(YGLogLevelDebug, "layout: {");
    CSSLog(YGLogLevelDebug, "width: %g, ", node->layout.dimensions[YGDimensionWidth]);
    CSSLog(YGLogLevelDebug, "height: %g, ", node->layout.dimensions[YGDimensionHeight]);
    CSSLog(YGLogLevelDebug, "top: %g, ", node->layout.position[YGEdgeTop]);
    CSSLog(YGLogLevelDebug, "left: %g", node->layout.position[YGEdgeLeft]);
    CSSLog(YGLogLevelDebug, "}, ");
  }

  if (options & YGPrintOptionsStyle) {
    if (node->style.flexDirection == YGFlexDirectionColumn) {
      CSSLog(YGLogLevelDebug, "flexDirection: 'column', ");
    } else if (node->style.flexDirection == YGFlexDirectionColumnReverse) {
      CSSLog(YGLogLevelDebug, "flexDirection: 'column-reverse', ");
    } else if (node->style.flexDirection == YGFlexDirectionRow) {
      CSSLog(YGLogLevelDebug, "flexDirection: 'row', ");
    } else if (node->style.flexDirection == YGFlexDirectionRowReverse) {
      CSSLog(YGLogLevelDebug, "flexDirection: 'row-reverse', ");
    }

    if (node->style.justifyContent == YGJustifyCenter) {
      CSSLog(YGLogLevelDebug, "justifyContent: 'center', ");
    } else if (node->style.justifyContent == YGJustifyFlexEnd) {
      CSSLog(YGLogLevelDebug, "justifyContent: 'flex-end', ");
    } else if (node->style.justifyContent == YGJustifySpaceAround) {
      CSSLog(YGLogLevelDebug, "justifyContent: 'space-around', ");
    } else if (node->style.justifyContent == YGJustifySpaceBetween) {
      CSSLog(YGLogLevelDebug, "justifyContent: 'space-between', ");
    }

    if (node->style.alignItems == YGAlignCenter) {
      CSSLog(YGLogLevelDebug, "alignItems: 'center', ");
    } else if (node->style.alignItems == YGAlignFlexEnd) {
      CSSLog(YGLogLevelDebug, "alignItems: 'flex-end', ");
    } else if (node->style.alignItems == YGAlignStretch) {
      CSSLog(YGLogLevelDebug, "alignItems: 'stretch', ");
    }

    if (node->style.alignContent == YGAlignCenter) {
      CSSLog(YGLogLevelDebug, "alignContent: 'center', ");
    } else if (node->style.alignContent == YGAlignFlexEnd) {
      CSSLog(YGLogLevelDebug, "alignContent: 'flex-end', ");
    } else if (node->style.alignContent == YGAlignStretch) {
      CSSLog(YGLogLevelDebug, "alignContent: 'stretch', ");
    }

    if (node->style.alignSelf == YGAlignFlexStart) {
      CSSLog(YGLogLevelDebug, "alignSelf: 'flex-start', ");
    } else if (node->style.alignSelf == YGAlignCenter) {
      CSSLog(YGLogLevelDebug, "alignSelf: 'center', ");
    } else if (node->style.alignSelf == YGAlignFlexEnd) {
      CSSLog(YGLogLevelDebug, "alignSelf: 'flex-end', ");
    } else if (node->style.alignSelf == YGAlignStretch) {
      CSSLog(YGLogLevelDebug, "alignSelf: 'stretch', ");
    }

    printNumberIfNotUndefined("flexGrow", CSSNodeStyleGetFlexGrow(node));
    printNumberIfNotUndefined("flexShrink", CSSNodeStyleGetFlexShrink(node));
    printNumberIfNotUndefined("flexBasis", CSSNodeStyleGetFlexBasis(node));

    if (node->style.overflow == YGOverflowHidden) {
      CSSLog(YGLogLevelDebug, "overflow: 'hidden', ");
    } else if (node->style.overflow == YGOverflowVisible) {
      CSSLog(YGLogLevelDebug, "overflow: 'visible', ");
    } else if (node->style.overflow == YGOverflowScroll) {
      CSSLog(YGLogLevelDebug, "overflow: 'scroll', ");
    }

    if (eqFour(node->style.margin)) {
      printNumberIfNotZero("margin", computedEdgeValue(node->style.margin, YGEdgeLeft, 0));
    } else {
      printNumberIfNotZero("marginLeft", computedEdgeValue(node->style.margin, YGEdgeLeft, 0));
      printNumberIfNotZero("marginRight", computedEdgeValue(node->style.margin, YGEdgeRight, 0));
      printNumberIfNotZero("marginTop", computedEdgeValue(node->style.margin, YGEdgeTop, 0));
      printNumberIfNotZero("marginBottom", computedEdgeValue(node->style.margin, YGEdgeBottom, 0));
      printNumberIfNotZero("marginStart", computedEdgeValue(node->style.margin, YGEdgeStart, 0));
      printNumberIfNotZero("marginEnd", computedEdgeValue(node->style.margin, YGEdgeEnd, 0));
    }

    if (eqFour(node->style.padding)) {
      printNumberIfNotZero("padding", computedEdgeValue(node->style.padding, YGEdgeLeft, 0));
    } else {
      printNumberIfNotZero("paddingLeft", computedEdgeValue(node->style.padding, YGEdgeLeft, 0));
      printNumberIfNotZero("paddingRight", computedEdgeValue(node->style.padding, YGEdgeRight, 0));
      printNumberIfNotZero("paddingTop", computedEdgeValue(node->style.padding, YGEdgeTop, 0));
      printNumberIfNotZero("paddingBottom",
                           computedEdgeValue(node->style.padding, YGEdgeBottom, 0));
      printNumberIfNotZero("paddingStart", computedEdgeValue(node->style.padding, YGEdgeStart, 0));
      printNumberIfNotZero("paddingEnd", computedEdgeValue(node->style.padding, YGEdgeEnd, 0));
    }

    if (eqFour(node->style.border)) {
      printNumberIfNotZero("borderWidth", computedEdgeValue(node->style.border, YGEdgeLeft, 0));
    } else {
      printNumberIfNotZero("borderLeftWidth", computedEdgeValue(node->style.border, YGEdgeLeft, 0));
      printNumberIfNotZero("borderRightWidth",
                           computedEdgeValue(node->style.border, YGEdgeRight, 0));
      printNumberIfNotZero("borderTopWidth", computedEdgeValue(node->style.border, YGEdgeTop, 0));
      printNumberIfNotZero("borderBottomWidth",
                           computedEdgeValue(node->style.border, YGEdgeBottom, 0));
      printNumberIfNotZero("borderStartWidth",
                           computedEdgeValue(node->style.border, YGEdgeStart, 0));
      printNumberIfNotZero("borderEndWidth", computedEdgeValue(node->style.border, YGEdgeEnd, 0));
    }

    printNumberIfNotUndefined("width", node->style.dimensions[YGDimensionWidth]);
    printNumberIfNotUndefined("height", node->style.dimensions[YGDimensionHeight]);
    printNumberIfNotUndefined("maxWidth", node->style.maxDimensions[YGDimensionWidth]);
    printNumberIfNotUndefined("maxHeight", node->style.maxDimensions[YGDimensionHeight]);
    printNumberIfNotUndefined("minWidth", node->style.minDimensions[YGDimensionWidth]);
    printNumberIfNotUndefined("minHeight", node->style.minDimensions[YGDimensionHeight]);

    if (node->style.positionType == YGPositionTypeAbsolute) {
      CSSLog(YGLogLevelDebug, "position: 'absolute', ");
    }

    printNumberIfNotUndefined("left",
                              computedEdgeValue(node->style.position, YGEdgeLeft, YGUndefined));
    printNumberIfNotUndefined("right",
                              computedEdgeValue(node->style.position, YGEdgeRight, YGUndefined));
    printNumberIfNotUndefined("top",
                              computedEdgeValue(node->style.position, YGEdgeTop, YGUndefined));
    printNumberIfNotUndefined("bottom",
                              computedEdgeValue(node->style.position, YGEdgeBottom, YGUndefined));
  }

  const uint32_t childCount = CSSNodeListCount(node->children);
  if (options & YGPrintOptionsChildren && childCount > 0) {
    CSSLog(YGLogLevelDebug, "children: [\n");
    for (uint32_t i = 0; i < childCount; i++) {
      _CSSNodePrint(CSSNodeGetChild(node, i), options, level + 1);
    }
    indent(level);
    CSSLog(YGLogLevelDebug, "]},\n");
  } else {
    CSSLog(YGLogLevelDebug, "},\n");
  }
}

void CSSNodePrint(const CSSNodeRef node, const YGPrintOptions options) {
  _CSSNodePrint(node, options, 0);
}

static const YGEdge leading[4] = {
        [YGFlexDirectionColumn] = YGEdgeTop,
        [YGFlexDirectionColumnReverse] = YGEdgeBottom,
        [YGFlexDirectionRow] = YGEdgeLeft,
        [YGFlexDirectionRowReverse] = YGEdgeRight,
};
static const YGEdge trailing[4] = {
        [YGFlexDirectionColumn] = YGEdgeBottom,
        [YGFlexDirectionColumnReverse] = YGEdgeTop,
        [YGFlexDirectionRow] = YGEdgeRight,
        [YGFlexDirectionRowReverse] = YGEdgeLeft,
};
static const YGEdge pos[4] = {
        [YGFlexDirectionColumn] = YGEdgeTop,
        [YGFlexDirectionColumnReverse] = YGEdgeBottom,
        [YGFlexDirectionRow] = YGEdgeLeft,
        [YGFlexDirectionRowReverse] = YGEdgeRight,
};
static const YGDimension dim[4] = {
        [YGFlexDirectionColumn] = YGDimensionHeight,
        [YGFlexDirectionColumnReverse] = YGDimensionHeight,
        [YGFlexDirectionRow] = YGDimensionWidth,
        [YGFlexDirectionRowReverse] = YGDimensionWidth,
};

static inline bool isRowDirection(const YGFlexDirection flexDirection) {
  return flexDirection == YGFlexDirectionRow || flexDirection == YGFlexDirectionRowReverse;
}

static inline bool isColumnDirection(const YGFlexDirection flexDirection) {
  return flexDirection == YGFlexDirectionColumn || flexDirection == YGFlexDirectionColumnReverse;
}

static inline float getLeadingMargin(const CSSNodeRef node, const YGFlexDirection axis) {
  if (isRowDirection(axis) && !CSSValueIsUndefined(node->style.margin[YGEdgeStart])) {
    return node->style.margin[YGEdgeStart];
  }

  return computedEdgeValue(node->style.margin, leading[axis], 0);
}

static float getTrailingMargin(const CSSNodeRef node, const YGFlexDirection axis) {
  if (isRowDirection(axis) && !CSSValueIsUndefined(node->style.margin[YGEdgeEnd])) {
    return node->style.margin[YGEdgeEnd];
  }

  return computedEdgeValue(node->style.margin, trailing[axis], 0);
}

static float getLeadingPadding(const CSSNodeRef node, const YGFlexDirection axis) {
  if (isRowDirection(axis) && !CSSValueIsUndefined(node->style.padding[YGEdgeStart]) &&
      node->style.padding[YGEdgeStart] >= 0) {
    return node->style.padding[YGEdgeStart];
  }

  return fmaxf(computedEdgeValue(node->style.padding, leading[axis], 0), 0);
}

static float getTrailingPadding(const CSSNodeRef node, const YGFlexDirection axis) {
  if (isRowDirection(axis) && !CSSValueIsUndefined(node->style.padding[YGEdgeEnd]) &&
      node->style.padding[YGEdgeEnd] >= 0) {
    return node->style.padding[YGEdgeEnd];
  }

  return fmaxf(computedEdgeValue(node->style.padding, trailing[axis], 0), 0);
}

static float getLeadingBorder(const CSSNodeRef node, const YGFlexDirection axis) {
  if (isRowDirection(axis) && !CSSValueIsUndefined(node->style.border[YGEdgeStart]) &&
      node->style.border[YGEdgeStart] >= 0) {
    return node->style.border[YGEdgeStart];
  }

  return fmaxf(computedEdgeValue(node->style.border, leading[axis], 0), 0);
}

static float getTrailingBorder(const CSSNodeRef node, const YGFlexDirection axis) {
  if (isRowDirection(axis) && !CSSValueIsUndefined(node->style.border[YGEdgeEnd]) &&
      node->style.border[YGEdgeEnd] >= 0) {
    return node->style.border[YGEdgeEnd];
  }

  return fmaxf(computedEdgeValue(node->style.border, trailing[axis], 0), 0);
}

static inline float getLeadingPaddingAndBorder(const CSSNodeRef node, const YGFlexDirection axis) {
  return getLeadingPadding(node, axis) + getLeadingBorder(node, axis);
}

static inline float getTrailingPaddingAndBorder(const CSSNodeRef node, const YGFlexDirection axis) {
  return getTrailingPadding(node, axis) + getTrailingBorder(node, axis);
}

static inline float getMarginAxis(const CSSNodeRef node, const YGFlexDirection axis) {
  return getLeadingMargin(node, axis) + getTrailingMargin(node, axis);
}

static inline float getPaddingAndBorderAxis(const CSSNodeRef node, const YGFlexDirection axis) {
  return getLeadingPaddingAndBorder(node, axis) + getTrailingPaddingAndBorder(node, axis);
}

static inline YGAlign getAlignItem(const CSSNodeRef node, const CSSNodeRef child) {
  return child->style.alignSelf == YGAlignAuto ? node->style.alignItems : child->style.alignSelf;
}

static inline YGDirection resolveDirection(const CSSNodeRef node,
                                           const YGDirection parentDirection) {
  if (node->style.direction == YGDirectionInherit) {
    return parentDirection > YGDirectionInherit ? parentDirection : YGDirectionLTR;
  } else {
    return node->style.direction;
  }
}

static inline YGFlexDirection resolveAxis(const YGFlexDirection flexDirection,
                                          const YGDirection direction) {
  if (direction == YGDirectionRTL) {
    if (flexDirection == YGFlexDirectionRow) {
      return YGFlexDirectionRowReverse;
    } else if (flexDirection == YGFlexDirectionRowReverse) {
      return YGFlexDirectionRow;
    }
  }

  return flexDirection;
}

static YGFlexDirection getCrossFlexDirection(const YGFlexDirection flexDirection,
                                             const YGDirection direction) {
  return isColumnDirection(flexDirection) ? resolveAxis(YGFlexDirectionRow, direction)
                                          : YGFlexDirectionColumn;
}

static inline bool isFlex(const CSSNodeRef node) {
  return (node->style.positionType == YGPositionTypeRelative &&
          (node->style.flexGrow != 0 || node->style.flexShrink != 0 || node->style.flex != 0));
}

static inline float getDimWithMargin(const CSSNodeRef node, const YGFlexDirection axis) {
  return node->layout.measuredDimensions[dim[axis]] + getLeadingMargin(node, axis) +
         getTrailingMargin(node, axis);
}

static inline bool isStyleDimDefined(const CSSNodeRef node, const YGFlexDirection axis) {
  const float value = node->style.dimensions[dim[axis]];
  return !CSSValueIsUndefined(value) && value >= 0.0;
}

static inline bool isLayoutDimDefined(const CSSNodeRef node, const YGFlexDirection axis) {
  const float value = node->layout.measuredDimensions[dim[axis]];
  return !CSSValueIsUndefined(value) && value >= 0.0;
}

static inline bool isLeadingPosDefined(const CSSNodeRef node, const YGFlexDirection axis) {
  return (isRowDirection(axis) &&
          !CSSValueIsUndefined(
              computedEdgeValue(node->style.position, YGEdgeStart, YGUndefined))) ||
         !CSSValueIsUndefined(computedEdgeValue(node->style.position, leading[axis], YGUndefined));
}

static inline bool isTrailingPosDefined(const CSSNodeRef node, const YGFlexDirection axis) {
  return (isRowDirection(axis) &&
          !CSSValueIsUndefined(computedEdgeValue(node->style.position, YGEdgeEnd, YGUndefined))) ||
         !CSSValueIsUndefined(computedEdgeValue(node->style.position, trailing[axis], YGUndefined));
}

static float getLeadingPosition(const CSSNodeRef node, const YGFlexDirection axis) {
  if (isRowDirection(axis)) {
    const float leadingPosition = computedEdgeValue(node->style.position, YGEdgeStart, YGUndefined);
    if (!CSSValueIsUndefined(leadingPosition)) {
      return leadingPosition;
    }
  }

  const float leadingPosition = computedEdgeValue(node->style.position, leading[axis], YGUndefined);

  return CSSValueIsUndefined(leadingPosition) ? 0 : leadingPosition;
}

static float getTrailingPosition(const CSSNodeRef node, const YGFlexDirection axis) {
  if (isRowDirection(axis)) {
    const float trailingPosition = computedEdgeValue(node->style.position, YGEdgeEnd, YGUndefined);
    if (!CSSValueIsUndefined(trailingPosition)) {
      return trailingPosition;
    }
  }

  const float trailingPosition =
      computedEdgeValue(node->style.position, trailing[axis], YGUndefined);

  return CSSValueIsUndefined(trailingPosition) ? 0 : trailingPosition;
}

static float boundAxisWithinMinAndMax(const CSSNodeRef node,
                                      const YGFlexDirection axis,
                                      const float value) {
  float min = YGUndefined;
  float max = YGUndefined;

  if (isColumnDirection(axis)) {
    min = node->style.minDimensions[YGDimensionHeight];
    max = node->style.maxDimensions[YGDimensionHeight];
  } else if (isRowDirection(axis)) {
    min = node->style.minDimensions[YGDimensionWidth];
    max = node->style.maxDimensions[YGDimensionWidth];
  }

  float boundValue = value;

  if (!CSSValueIsUndefined(max) && max >= 0.0 && boundValue > max) {
    boundValue = max;
  }

  if (!CSSValueIsUndefined(min) && min >= 0.0 && boundValue < min) {
    boundValue = min;
  }

  return boundValue;
}

// Like boundAxisWithinMinAndMax but also ensures that the value doesn't go
// below the
// padding and border amount.
static inline float boundAxis(const CSSNodeRef node,
                              const YGFlexDirection axis,
                              const float value) {
  return fmaxf(boundAxisWithinMinAndMax(node, axis, value), getPaddingAndBorderAxis(node, axis));
}

static void setTrailingPosition(const CSSNodeRef node,
                                const CSSNodeRef child,
                                const YGFlexDirection axis) {
  const float size = child->layout.measuredDimensions[dim[axis]];
  child->layout.position[trailing[axis]] =
      node->layout.measuredDimensions[dim[axis]] - size - child->layout.position[pos[axis]];
}

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
static float getRelativePosition(const CSSNodeRef node, const YGFlexDirection axis) {
  return isLeadingPosDefined(node, axis) ? getLeadingPosition(node, axis)
                                         : -getTrailingPosition(node, axis);
}

static void constrainMaxSizeForMode(const float maxSize, YGMeasureMode *mode, float *size) {
  switch (*mode) {
    case YGMeasureModeExactly:
    case YGMeasureModeAtMost:
      *size = (CSSValueIsUndefined(maxSize) || *size < maxSize) ? *size : maxSize;
      break;
    case YGMeasureModeUndefined:
      if (!CSSValueIsUndefined(maxSize)) {
        *mode = YGMeasureModeAtMost;
        *size = maxSize;
      }
      break;
    case YGMeasureModeCount:
      break;
  }
}

static void setPosition(const CSSNodeRef node, const YGDirection direction) {
  const YGFlexDirection mainAxis = resolveAxis(node->style.flexDirection, direction);
  const YGFlexDirection crossAxis = getCrossFlexDirection(mainAxis, direction);
  const float relativePositionMain = getRelativePosition(node, mainAxis);
  const float relativePositionCross = getRelativePosition(node, crossAxis);

  node->layout.position[leading[mainAxis]] =
      getLeadingMargin(node, mainAxis) + relativePositionMain;
  node->layout.position[trailing[mainAxis]] =
      getTrailingMargin(node, mainAxis) + relativePositionMain;
  node->layout.position[leading[crossAxis]] =
      getLeadingMargin(node, crossAxis) + relativePositionCross;
  node->layout.position[trailing[crossAxis]] =
      getTrailingMargin(node, crossAxis) + relativePositionCross;
}

static void computeChildFlexBasis(const CSSNodeRef node,
                                  const CSSNodeRef child,
                                  const float width,
                                  const YGMeasureMode widthMode,
                                  const float height,
                                  const YGMeasureMode heightMode,
                                  const YGDirection direction) {
  const YGFlexDirection mainAxis = resolveAxis(node->style.flexDirection, direction);
  const bool isMainAxisRow = isRowDirection(mainAxis);

  float childWidth;
  float childHeight;
  YGMeasureMode childWidthMeasureMode;
  YGMeasureMode childHeightMeasureMode;

  const bool isRowStyleDimDefined = isStyleDimDefined(child, YGFlexDirectionRow);
  const bool isColumnStyleDimDefined = isStyleDimDefined(child, YGFlexDirectionColumn);

  if (!CSSValueIsUndefined(CSSNodeStyleGetFlexBasis(child)) &&
      !CSSValueIsUndefined(isMainAxisRow ? width : height)) {
    if (CSSValueIsUndefined(child->layout.computedFlexBasis) ||
        (CSSLayoutIsExperimentalFeatureEnabled(YGExperimentalFeatureWebFlexBasis) &&
         child->layout.computedFlexBasisGeneration != gCurrentGenerationCount)) {
      child->layout.computedFlexBasis =
          fmaxf(CSSNodeStyleGetFlexBasis(child), getPaddingAndBorderAxis(child, mainAxis));
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    child->layout.computedFlexBasis = fmaxf(child->style.dimensions[YGDimensionWidth],
                                            getPaddingAndBorderAxis(child, YGFlexDirectionRow));
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    child->layout.computedFlexBasis = fmaxf(child->style.dimensions[YGDimensionHeight],
                                            getPaddingAndBorderAxis(child, YGFlexDirectionColumn));
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped
    // flex basis).
    childWidth = YGUndefined;
    childHeight = YGUndefined;
    childWidthMeasureMode = YGMeasureModeUndefined;
    childHeightMeasureMode = YGMeasureModeUndefined;

    if (isRowStyleDimDefined) {
      childWidth =
          child->style.dimensions[YGDimensionWidth] + getMarginAxis(child, YGFlexDirectionRow);
      childWidthMeasureMode = YGMeasureModeExactly;
    }
    if (isColumnStyleDimDefined) {
      childHeight =
          child->style.dimensions[YGDimensionHeight] + getMarginAxis(child, YGFlexDirectionColumn);
      childHeightMeasureMode = YGMeasureModeExactly;
    }

    // The W3C spec doesn't say anything about the 'overflow' property,
    // but all major browsers appear to implement the following logic.
    if ((!isMainAxisRow && node->style.overflow == YGOverflowScroll) ||
        node->style.overflow != YGOverflowScroll) {
      if (CSSValueIsUndefined(childWidth) && !CSSValueIsUndefined(width)) {
        childWidth = width;
        childWidthMeasureMode = YGMeasureModeAtMost;
      }
    }

    if ((isMainAxisRow && node->style.overflow == YGOverflowScroll) ||
        node->style.overflow != YGOverflowScroll) {
      if (CSSValueIsUndefined(childHeight) && !CSSValueIsUndefined(height)) {
        childHeight = height;
        childHeightMeasureMode = YGMeasureModeAtMost;
      }
    }

    // If child has no defined size in the cross axis and is set to stretch,
    // set the cross
    // axis to be measured exactly with the available inner width
    if (!isMainAxisRow && !CSSValueIsUndefined(width) && !isRowStyleDimDefined &&
        widthMode == YGMeasureModeExactly && getAlignItem(node, child) == YGAlignStretch) {
      childWidth = width;
      childWidthMeasureMode = YGMeasureModeExactly;
    }
    if (isMainAxisRow && !CSSValueIsUndefined(height) && !isColumnStyleDimDefined &&
        heightMode == YGMeasureModeExactly && getAlignItem(node, child) == YGAlignStretch) {
      childHeight = height;
      childHeightMeasureMode = YGMeasureModeExactly;
    }

    if (!CSSValueIsUndefined(child->style.aspectRatio)) {
      if (!isMainAxisRow && childWidthMeasureMode == YGMeasureModeExactly) {
        child->layout.computedFlexBasis =
            fmaxf(childWidth * child->style.aspectRatio,
                  getPaddingAndBorderAxis(child, YGFlexDirectionColumn));
        return;
      } else if (isMainAxisRow && childHeightMeasureMode == YGMeasureModeExactly) {
        child->layout.computedFlexBasis = fmaxf(childHeight * child->style.aspectRatio,
                                                getPaddingAndBorderAxis(child, YGFlexDirectionRow));
        return;
      }
    }

    constrainMaxSizeForMode(child->style.maxDimensions[YGDimensionWidth],
                            &childWidthMeasureMode,
                            &childWidth);
    constrainMaxSizeForMode(child->style.maxDimensions[YGDimensionHeight],
                            &childHeightMeasureMode,
                            &childHeight);

    // Measure the child
    layoutNodeInternal(child,
                       childWidth,
                       childHeight,
                       direction,
                       childWidthMeasureMode,
                       childHeightMeasureMode,
                       false,
                       "measure");

    child->layout.computedFlexBasis =
        fmaxf(isMainAxisRow ? child->layout.measuredDimensions[YGDimensionWidth]
                            : child->layout.measuredDimensions[YGDimensionHeight],
              getPaddingAndBorderAxis(child, mainAxis));
  }

  child->layout.computedFlexBasisGeneration = gCurrentGenerationCount;
}

static void absoluteLayoutChild(const CSSNodeRef node,
                                const CSSNodeRef child,
                                const float width,
                                const YGMeasureMode widthMode,
                                const YGDirection direction) {
  const YGFlexDirection mainAxis = resolveAxis(node->style.flexDirection, direction);
  const YGFlexDirection crossAxis = getCrossFlexDirection(mainAxis, direction);
  const bool isMainAxisRow = isRowDirection(mainAxis);

  float childWidth = YGUndefined;
  float childHeight = YGUndefined;
  YGMeasureMode childWidthMeasureMode = YGMeasureModeUndefined;
  YGMeasureMode childHeightMeasureMode = YGMeasureModeUndefined;

  if (isStyleDimDefined(child, YGFlexDirectionRow)) {
    childWidth =
        child->style.dimensions[YGDimensionWidth] + getMarginAxis(child, YGFlexDirectionRow);
  } else {
    // If the child doesn't have a specified width, compute the width based
    // on the left/right
    // offsets if they're defined.
    if (isLeadingPosDefined(child, YGFlexDirectionRow) &&
        isTrailingPosDefined(child, YGFlexDirectionRow)) {
      childWidth = node->layout.measuredDimensions[YGDimensionWidth] -
                   (getLeadingBorder(node, YGFlexDirectionRow) +
                    getTrailingBorder(node, YGFlexDirectionRow)) -
                   (getLeadingPosition(child, YGFlexDirectionRow) +
                    getTrailingPosition(child, YGFlexDirectionRow));
      childWidth = boundAxis(child, YGFlexDirectionRow, childWidth);
    }
  }

  if (isStyleDimDefined(child, YGFlexDirectionColumn)) {
    childHeight =
        child->style.dimensions[YGDimensionHeight] + getMarginAxis(child, YGFlexDirectionColumn);
  } else {
    // If the child doesn't have a specified height, compute the height
    // based on the top/bottom
    // offsets if they're defined.
    if (isLeadingPosDefined(child, YGFlexDirectionColumn) &&
        isTrailingPosDefined(child, YGFlexDirectionColumn)) {
      childHeight = node->layout.measuredDimensions[YGDimensionHeight] -
                    (getLeadingBorder(node, YGFlexDirectionColumn) +
                     getTrailingBorder(node, YGFlexDirectionColumn)) -
                    (getLeadingPosition(child, YGFlexDirectionColumn) +
                     getTrailingPosition(child, YGFlexDirectionColumn));
      childHeight = boundAxis(child, YGFlexDirectionColumn, childHeight);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect ratio
  // calculation. One dimension being the anchor and the other being flexible.
  if (CSSValueIsUndefined(childWidth) ^ CSSValueIsUndefined(childHeight)) {
    if (!CSSValueIsUndefined(child->style.aspectRatio)) {
      if (CSSValueIsUndefined(childWidth)) {
        childWidth = fmaxf(childHeight * child->style.aspectRatio,
                           getPaddingAndBorderAxis(child, YGFlexDirectionColumn));
      } else if (CSSValueIsUndefined(childHeight)) {
        childHeight = fmaxf(childWidth * child->style.aspectRatio,
                            getPaddingAndBorderAxis(child, YGFlexDirectionRow));
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (CSSValueIsUndefined(childWidth) || CSSValueIsUndefined(childHeight)) {
    childWidthMeasureMode =
        CSSValueIsUndefined(childWidth) ? YGMeasureModeUndefined : YGMeasureModeExactly;
    childHeightMeasureMode =
        CSSValueIsUndefined(childHeight) ? YGMeasureModeUndefined : YGMeasureModeExactly;

    // According to the spec, if the main size is not definite and the
    // child's inline axis is parallel to the main axis (i.e. it's
    // horizontal), the child should be sized using "UNDEFINED" in
    // the main size. Otherwise use "AT_MOST" in the cross axis.
    if (!isMainAxisRow && CSSValueIsUndefined(childWidth) && widthMode != YGMeasureModeUndefined) {
      childWidth = width;
      childWidthMeasureMode = YGMeasureModeAtMost;
    }

    layoutNodeInternal(child,
                       childWidth,
                       childHeight,
                       direction,
                       childWidthMeasureMode,
                       childHeightMeasureMode,
                       false,
                       "abs-measure");
    childWidth = child->layout.measuredDimensions[YGDimensionWidth] +
                 getMarginAxis(child, YGFlexDirectionRow);
    childHeight = child->layout.measuredDimensions[YGDimensionHeight] +
                  getMarginAxis(child, YGFlexDirectionColumn);
  }

  layoutNodeInternal(child,
                     childWidth,
                     childHeight,
                     direction,
                     YGMeasureModeExactly,
                     YGMeasureModeExactly,
                     true,
                     "abs-layout");

  if (isTrailingPosDefined(child, mainAxis) && !isLeadingPosDefined(child, mainAxis)) {
    child->layout.position[leading[mainAxis]] = node->layout.measuredDimensions[dim[mainAxis]] -
                                                child->layout.measuredDimensions[dim[mainAxis]] -
                                                getTrailingBorder(node, mainAxis) -
                                                getTrailingPosition(child, mainAxis);
  }

  if (isTrailingPosDefined(child, crossAxis) && !isLeadingPosDefined(child, crossAxis)) {
    child->layout.position[leading[crossAxis]] = node->layout.measuredDimensions[dim[crossAxis]] -
                                                 child->layout.measuredDimensions[dim[crossAxis]] -
                                                 getTrailingBorder(node, crossAxis) -
                                                 getTrailingPosition(child, crossAxis);
  }
}

static void setMeasuredDimensionsForNodeWithMeasureFunc(const CSSNodeRef node,
                                                        const float availableWidth,
                                                        const float availableHeight,
                                                        const YGMeasureMode widthMeasureMode,
                                                        const YGMeasureMode heightMeasureMode) {
  CSS_ASSERT(node->measure, "Expected node to have custom measure function");

  const float paddingAndBorderAxisRow = getPaddingAndBorderAxis(node, YGFlexDirectionRow);
  const float paddingAndBorderAxisColumn = getPaddingAndBorderAxis(node, YGFlexDirectionColumn);
  const float marginAxisRow = getMarginAxis(node, YGFlexDirectionRow);
  const float marginAxisColumn = getMarginAxis(node, YGFlexDirectionColumn);

  const float innerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  const float innerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;

  if (widthMeasureMode == YGMeasureModeExactly && heightMeasureMode == YGMeasureModeExactly) {
    // Don't bother sizing the text if both dimensions are already defined.
    node->layout.measuredDimensions[YGDimensionWidth] =
        boundAxis(node, YGFlexDirectionRow, availableWidth - marginAxisRow);
    node->layout.measuredDimensions[YGDimensionHeight] =
        boundAxis(node, YGFlexDirectionColumn, availableHeight - marginAxisColumn);
  } else if (innerWidth <= 0 || innerHeight <= 0) {
    // Don't bother sizing the text if there's no horizontal or vertical
    // space.
    node->layout.measuredDimensions[YGDimensionWidth] = boundAxis(node, YGFlexDirectionRow, 0);
    node->layout.measuredDimensions[YGDimensionHeight] = boundAxis(node, YGFlexDirectionColumn, 0);
  } else {
    // Measure the text under the current constraints.
    const CSSSize measuredSize =
        node->measure(node, innerWidth, widthMeasureMode, innerHeight, heightMeasureMode);

    node->layout.measuredDimensions[YGDimensionWidth] =
        boundAxis(node,
                  YGFlexDirectionRow,
                  (widthMeasureMode == YGMeasureModeUndefined ||
                   widthMeasureMode == YGMeasureModeAtMost)
                      ? measuredSize.width + paddingAndBorderAxisRow
                      : availableWidth - marginAxisRow);
    node->layout.measuredDimensions[YGDimensionHeight] =
        boundAxis(node,
                  YGFlexDirectionColumn,
                  (heightMeasureMode == YGMeasureModeUndefined ||
                   heightMeasureMode == YGMeasureModeAtMost)
                      ? measuredSize.height + paddingAndBorderAxisColumn
                      : availableHeight - marginAxisColumn);
  }
}

// For nodes with no children, use the available values if they were provided,
// or the minimum size as indicated by the padding and border sizes.
static void setMeasuredDimensionsForEmptyContainer(const CSSNodeRef node,
                                                   const float availableWidth,
                                                   const float availableHeight,
                                                   const YGMeasureMode widthMeasureMode,
                                                   const YGMeasureMode heightMeasureMode) {
  const float paddingAndBorderAxisRow = getPaddingAndBorderAxis(node, YGFlexDirectionRow);
  const float paddingAndBorderAxisColumn = getPaddingAndBorderAxis(node, YGFlexDirectionColumn);
  const float marginAxisRow = getMarginAxis(node, YGFlexDirectionRow);
  const float marginAxisColumn = getMarginAxis(node, YGFlexDirectionColumn);

  node->layout.measuredDimensions[YGDimensionWidth] =
      boundAxis(node,
                YGFlexDirectionRow,
                (widthMeasureMode == YGMeasureModeUndefined ||
                 widthMeasureMode == YGMeasureModeAtMost)
                    ? paddingAndBorderAxisRow
                    : availableWidth - marginAxisRow);
  node->layout.measuredDimensions[YGDimensionHeight] =
      boundAxis(node,
                YGFlexDirectionColumn,
                (heightMeasureMode == YGMeasureModeUndefined ||
                 heightMeasureMode == YGMeasureModeAtMost)
                    ? paddingAndBorderAxisColumn
                    : availableHeight - marginAxisColumn);
}

static bool setMeasuredDimensionsIfEmptyOrFixedSize(const CSSNodeRef node,
                                                    const float availableWidth,
                                                    const float availableHeight,
                                                    const YGMeasureMode widthMeasureMode,
                                                    const YGMeasureMode heightMeasureMode) {
  if ((widthMeasureMode == YGMeasureModeAtMost && availableWidth <= 0) ||
      (heightMeasureMode == YGMeasureModeAtMost && availableHeight <= 0) ||
      (widthMeasureMode == YGMeasureModeExactly && heightMeasureMode == YGMeasureModeExactly)) {
    const float marginAxisColumn = getMarginAxis(node, YGFlexDirectionColumn);
    const float marginAxisRow = getMarginAxis(node, YGFlexDirectionRow);

    node->layout.measuredDimensions[YGDimensionWidth] =
        boundAxis(node,
                  YGFlexDirectionRow,
                  CSSValueIsUndefined(availableWidth) || (widthMeasureMode == YGMeasureModeAtMost && availableWidth < 0)
                      ? 0
                      : availableWidth - marginAxisRow);

    node->layout.measuredDimensions[YGDimensionHeight] =
        boundAxis(node,
                  YGFlexDirectionColumn,
                  CSSValueIsUndefined(availableHeight) || (heightMeasureMode == YGMeasureModeAtMost && availableHeight < 0)
                      ? 0
                      : availableHeight - marginAxisColumn);

    return true;
  }

  return false;
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
//      or YGUndefined if the size is not available; interpretation depends on
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
//      - YGMeasureModeUndefined: max content
//      - YGMeasureModeExactly: fill available
//      - YGMeasureModeAtMost: fit content
//
//    When calling layoutNodeImpl and layoutNodeInternal, if the caller passes
//    an available size of
//    undefined then it must also pass a measure mode of YGMeasureModeUndefined
//    in that dimension.
//
static void layoutNodeImpl(const CSSNodeRef node,
                           const float availableWidth,
                           const float availableHeight,
                           const YGDirection parentDirection,
                           const YGMeasureMode widthMeasureMode,
                           const YGMeasureMode heightMeasureMode,
                           const bool performLayout) {
  CSS_ASSERT(CSSValueIsUndefined(availableWidth) ? widthMeasureMode == YGMeasureModeUndefined
                                                 : true,
             "availableWidth is indefinite so widthMeasureMode must be "
             "YGMeasureModeUndefined");
  CSS_ASSERT(CSSValueIsUndefined(availableHeight) ? heightMeasureMode == YGMeasureModeUndefined
                                                  : true,
             "availableHeight is indefinite so heightMeasureMode must be "
             "YGMeasureModeUndefined");

  // Set the resolved resolution in the node's layout.
  const YGDirection direction = resolveDirection(node, parentDirection);
  node->layout.direction = direction;

  if (node->measure) {
    setMeasuredDimensionsForNodeWithMeasureFunc(
        node, availableWidth, availableHeight, widthMeasureMode, heightMeasureMode);
    return;
  }

  const uint32_t childCount = CSSNodeListCount(node->children);
  if (childCount == 0) {
    setMeasuredDimensionsForEmptyContainer(
        node, availableWidth, availableHeight, widthMeasureMode, heightMeasureMode);
    return;
  }

  // If we're not being asked to perform a full layout we can skip the algorithm if we already know
  // the size
  if (!performLayout &&
      setMeasuredDimensionsIfEmptyOrFixedSize(
          node, availableWidth, availableHeight, widthMeasureMode, heightMeasureMode)) {
    return;
  }

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const YGFlexDirection mainAxis = resolveAxis(node->style.flexDirection, direction);
  const YGFlexDirection crossAxis = getCrossFlexDirection(mainAxis, direction);
  const bool isMainAxisRow = isRowDirection(mainAxis);
  const YGJustify justifyContent = node->style.justifyContent;
  const bool isNodeFlexWrap = node->style.flexWrap == YGWrapWrap;

  CSSNodeRef firstAbsoluteChild = NULL;
  CSSNodeRef currentAbsoluteChild = NULL;

  const float leadingPaddingAndBorderMain = getLeadingPaddingAndBorder(node, mainAxis);
  const float trailingPaddingAndBorderMain = getTrailingPaddingAndBorder(node, mainAxis);
  const float leadingPaddingAndBorderCross = getLeadingPaddingAndBorder(node, crossAxis);
  const float paddingAndBorderAxisMain = getPaddingAndBorderAxis(node, mainAxis);
  const float paddingAndBorderAxisCross = getPaddingAndBorderAxis(node, crossAxis);

  const YGMeasureMode measureModeMainDim = isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  const YGMeasureMode measureModeCrossDim = isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  const float paddingAndBorderAxisRow = getPaddingAndBorderAxis(node, YGFlexDirectionRow);
  const float paddingAndBorderAxisColumn = getPaddingAndBorderAxis(node, YGFlexDirectionColumn);
  const float marginAxisRow = getMarginAxis(node, YGFlexDirectionRow);
  const float marginAxisColumn = getMarginAxis(node, YGFlexDirectionColumn);

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS
  const float availableInnerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  const float availableInnerHeight =
      availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;
  const float availableInnerMainDim = isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  const float availableInnerCrossDim = isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  // If there is only one child with flexGrow + flexShrink it means we can set the
  // computedFlexBasis to 0 instead of measuring and shrinking / flexing the child to exactly
  // match the remaining space
  CSSNodeRef singleFlexChild = NULL;
  if ((isMainAxisRow && widthMeasureMode == YGMeasureModeExactly) ||
      (!isMainAxisRow && heightMeasureMode == YGMeasureModeExactly)) {
    for (uint32_t i = 0; i < childCount; i++) {
      const CSSNodeRef child = CSSNodeGetChild(node, i);
      if (singleFlexChild) {
        if (isFlex(child)) {
          // There is already a flexible child, abort.
          singleFlexChild = NULL;
          break;
        }
      } else if (CSSNodeStyleGetFlexGrow(child) > 0 && CSSNodeStyleGetFlexShrink(child) > 0) {
        singleFlexChild = child;
      }
    }
  }

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM
  for (uint32_t i = 0; i < childCount; i++) {
    const CSSNodeRef child = CSSNodeListGet(node->children, i);

    if (performLayout) {
      // Set the initial position (relative to the parent).
      const YGDirection childDirection = resolveDirection(child, direction);
      setPosition(child, childDirection);
    }

    // Absolute-positioned children don't participate in flex layout. Add them
    // to a list that we can process later.
    if (child->style.positionType == YGPositionTypeAbsolute) {
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
      if (child == singleFlexChild) {
        child->layout.computedFlexBasisGeneration = gCurrentGenerationCount;
        child->layout.computedFlexBasis = 0;
      } else {
        computeChildFlexBasis(node,
                              child,
                              availableInnerWidth,
                              widthMeasureMode,
                              availableInnerHeight,
                              heightMeasureMode,
                              direction);
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

  for (; endOfLineIndex < childCount; lineCount++, startOfLineIndex = endOfLineIndex) {
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

    // Maintain a linked list of the child nodes that can shrink and/or grow.
    CSSNodeRef firstRelativeChild = NULL;
    CSSNodeRef currentRelativeChild = NULL;

    // Add items to the current line until it's full or we run out of items.
    for (uint32_t i = startOfLineIndex; i < childCount; i++, endOfLineIndex++) {
      const CSSNodeRef child = CSSNodeListGet(node->children, i);
      child->lineIndex = lineCount;

      if (child->style.positionType != YGPositionTypeAbsolute) {
        const float outerFlexBasis =
            child->layout.computedFlexBasis + getMarginAxis(child, mainAxis);

        // If this is a multi-line flow and this item pushes us over the
        // available size, we've
        // hit the end of the current line. Break out of the loop and lay out
        // the current line.
        if (sizeConsumedOnCurrentLine + outerFlexBasis > availableInnerMainDim && isNodeFlexWrap &&
            itemsOnLine > 0) {
          break;
        }

        sizeConsumedOnCurrentLine += outerFlexBasis;
        itemsOnLine++;

        if (isFlex(child)) {
          totalFlexGrowFactors += CSSNodeStyleGetFlexGrow(child);

          // Unlike the grow factor, the shrink factor is scaled relative to the
          // child
          // dimension.
          totalFlexShrinkScaledFactors +=
              -CSSNodeStyleGetFlexShrink(child) * child->layout.computedFlexBasis;
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
    }

    // If we don't need to measure the cross axis, we can skip the entire flex
    // step.
    const bool canSkipFlex = !performLayout && measureModeCrossDim == YGMeasureModeExactly;

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
    if (!CSSValueIsUndefined(availableInnerMainDim)) {
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

    const float originalRemainingFreeSpace = remainingFreeSpace;
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
        childFlexBasis = currentRelativeChild->layout.computedFlexBasis;

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor =
              -CSSNodeStyleGetFlexShrink(currentRelativeChild) * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            baseMainSize =
                childFlexBasis +
                remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor;
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
          flexGrowFactor = CSSNodeStyleGetFlexGrow(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            baseMainSize =
                childFlexBasis + remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor;
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
        childFlexBasis = currentRelativeChild->layout.computedFlexBasis;
        float updatedMainSize = childFlexBasis;

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor =
              -CSSNodeStyleGetFlexShrink(currentRelativeChild) * childFlexBasis;
          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            float childSize;

            if (totalFlexShrinkScaledFactors == 0) {
              childSize = childFlexBasis + flexShrinkScaledFactor;
            } else {
              childSize =
                  childFlexBasis +
                  (remainingFreeSpace / totalFlexShrinkScaledFactors) * flexShrinkScaledFactor;
            }

            updatedMainSize = boundAxis(currentRelativeChild, mainAxis, childSize);
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = CSSNodeStyleGetFlexGrow(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            updatedMainSize =
                boundAxis(currentRelativeChild,
                          mainAxis,
                          childFlexBasis +
                              remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor);
          }
        }

        deltaFreeSpace -= updatedMainSize - childFlexBasis;

        float childWidth;
        float childHeight;
        YGMeasureMode childWidthMeasureMode;
        YGMeasureMode childHeightMeasureMode;

        if (isMainAxisRow) {
          childWidth = updatedMainSize + getMarginAxis(currentRelativeChild, YGFlexDirectionRow);
          childWidthMeasureMode = YGMeasureModeExactly;

          if (!CSSValueIsUndefined(availableInnerCrossDim) &&
              !isStyleDimDefined(currentRelativeChild, YGFlexDirectionColumn) &&
              heightMeasureMode == YGMeasureModeExactly &&
              getAlignItem(node, currentRelativeChild) == YGAlignStretch) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode = YGMeasureModeExactly;
          } else if (!isStyleDimDefined(currentRelativeChild, YGFlexDirectionColumn)) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode =
                CSSValueIsUndefined(childHeight) ? YGMeasureModeUndefined : YGMeasureModeAtMost;
          } else {
            childHeight = currentRelativeChild->style.dimensions[YGDimensionHeight] +
                          getMarginAxis(currentRelativeChild, YGFlexDirectionColumn);
            childHeightMeasureMode = YGMeasureModeExactly;
          }
        } else {
          childHeight =
              updatedMainSize + getMarginAxis(currentRelativeChild, YGFlexDirectionColumn);
          childHeightMeasureMode = YGMeasureModeExactly;

          if (!CSSValueIsUndefined(availableInnerCrossDim) &&
              !isStyleDimDefined(currentRelativeChild, YGFlexDirectionRow) &&
              widthMeasureMode == YGMeasureModeExactly &&
              getAlignItem(node, currentRelativeChild) == YGAlignStretch) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode = YGMeasureModeExactly;
          } else if (!isStyleDimDefined(currentRelativeChild, YGFlexDirectionRow)) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode =
                CSSValueIsUndefined(childWidth) ? YGMeasureModeUndefined : YGMeasureModeAtMost;
          } else {
            childWidth = currentRelativeChild->style.dimensions[YGDimensionWidth] +
                         getMarginAxis(currentRelativeChild, YGFlexDirectionRow);
            childWidthMeasureMode = YGMeasureModeExactly;
          }
        }

        if (!CSSValueIsUndefined(currentRelativeChild->style.aspectRatio)) {
          if (isMainAxisRow && childHeightMeasureMode != YGMeasureModeExactly) {
            childHeight =
                fmaxf(childWidth * currentRelativeChild->style.aspectRatio,
                      getPaddingAndBorderAxis(currentRelativeChild, YGFlexDirectionColumn));
            childHeightMeasureMode = YGMeasureModeExactly;
          } else if (!isMainAxisRow && childWidthMeasureMode != YGMeasureModeExactly) {
            childWidth = fmaxf(childHeight * currentRelativeChild->style.aspectRatio,
                               getPaddingAndBorderAxis(currentRelativeChild, YGFlexDirectionRow));
            childWidthMeasureMode = YGMeasureModeExactly;
          }
        }

        constrainMaxSizeForMode(currentRelativeChild->style.maxDimensions[YGDimensionWidth],
                                &childWidthMeasureMode,
                                &childWidth);
        constrainMaxSizeForMode(currentRelativeChild->style.maxDimensions[YGDimensionHeight],
                                &childHeightMeasureMode,
                                &childHeight);

        const bool requiresStretchLayout =
            !isStyleDimDefined(currentRelativeChild, crossAxis) &&
            getAlignItem(node, currentRelativeChild) == YGAlignStretch;

        // Recursively call the layout algorithm for this child with the updated
        // main size.
        layoutNodeInternal(currentRelativeChild,
                           childWidth,
                           childHeight,
                           direction,
                           childWidthMeasureMode,
                           childHeightMeasureMode,
                           performLayout && !requiresStretchLayout,
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

    // If we are using "at most" rules in the main axis. Calculate the remaining space when
    // constraint by the min size defined for the main axis.

    if (measureModeMainDim == YGMeasureModeAtMost && remainingFreeSpace > 0) {
      if (!CSSValueIsUndefined(node->style.minDimensions[dim[mainAxis]]) &&
          node->style.minDimensions[dim[mainAxis]] >= 0) {
        remainingFreeSpace = fmaxf(0,
                                   node->style.minDimensions[dim[mainAxis]] -
                                       (availableInnerMainDim - remainingFreeSpace));
      } else {
        remainingFreeSpace = 0;
      }
    }

    switch (justifyContent) {
      case YGJustifyCenter:
        leadingMainDim = remainingFreeSpace / 2;
        break;
      case YGJustifyFlexEnd:
        leadingMainDim = remainingFreeSpace;
        break;
      case YGJustifySpaceBetween:
        if (itemsOnLine > 1) {
          betweenMainDim = fmaxf(remainingFreeSpace, 0) / (itemsOnLine - 1);
        } else {
          betweenMainDim = 0;
        }
        break;
      case YGJustifySpaceAround:
        // Space on the edges is half of the space between elements
        betweenMainDim = remainingFreeSpace / itemsOnLine;
        leadingMainDim = betweenMainDim / 2;
        break;
      case YGJustifyFlexStart:
      case YGJustifyCount:
        break;
    }

    float mainDim = leadingPaddingAndBorderMain + leadingMainDim;
    float crossDim = 0;

    for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
      const CSSNodeRef child = CSSNodeListGet(node->children, i);

      if (child->style.positionType == YGPositionTypeAbsolute &&
          isLeadingPosDefined(child, mainAxis)) {
        if (performLayout) {
          // In case the child is position absolute and has left/top being
          // defined, we override the position to whatever the user said
          // (and margin/border).
          child->layout.position[pos[mainAxis]] = getLeadingPosition(child, mainAxis) +
                                                  getLeadingBorder(node, mainAxis) +
                                                  getLeadingMargin(child, mainAxis);
        }
      } else {
        // Now that we placed the element, we need to update the variables.
        // We need to do that only for relative elements. Absolute elements
        // do not take part in that phase.
        if (child->style.positionType == YGPositionTypeRelative) {
          if (performLayout) {
            child->layout.position[pos[mainAxis]] += mainDim;
          }

          if (canSkipFlex) {
            // If we skipped the flex step, then we can't rely on the
            // measuredDims because
            // they weren't computed. This means we can't call getDimWithMargin.
            mainDim +=
                betweenMainDim + getMarginAxis(child, mainAxis) + child->layout.computedFlexBasis;
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
        } else if (performLayout) {
          child->layout.position[pos[mainAxis]] +=
              getLeadingBorder(node, mainAxis) + leadingMainDim;
        }
      }
    }

    mainDim += trailingPaddingAndBorderMain;

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == YGMeasureModeUndefined ||
        measureModeCrossDim == YGMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis = boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross) -
                           paddingAndBorderAxisCross;

      if (measureModeCrossDim == YGMeasureModeAtMost) {
        containerCrossAxis = fminf(containerCrossAxis, availableInnerCrossDim);
      }
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == YGMeasureModeExactly) {
      crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    crossDim = boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross) -
               paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
        const CSSNodeRef child = CSSNodeListGet(node->children, i);

        if (child->style.positionType == YGPositionTypeAbsolute) {
          // If the child is absolutely positioned and has a
          // top/left/bottom/right
          // set, override all the previously computed positions to set it
          // correctly.
          if (isLeadingPosDefined(child, crossAxis)) {
            child->layout.position[pos[crossAxis]] = getLeadingPosition(child, crossAxis) +
                                                     getLeadingBorder(node, crossAxis) +
                                                     getLeadingMargin(child, crossAxis);
          } else {
            child->layout.position[pos[crossAxis]] =
                getLeadingBorder(node, crossAxis) + getLeadingMargin(child, crossAxis);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (parent) or
          // alignSelf (child) in order to determine the position in the cross
          // axis
          const YGAlign alignItem = getAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time
          // forcing the cross-axis size to be the computed cross size for the
          // current line.
          if (alignItem == YGAlignStretch) {
            const bool isCrossSizeDefinite =
                (isMainAxisRow && isStyleDimDefined(child, YGFlexDirectionColumn)) ||
                (!isMainAxisRow && isStyleDimDefined(child, YGFlexDirectionRow));

            float childWidth;
            float childHeight;
            YGMeasureMode childWidthMeasureMode = YGMeasureModeExactly;
            YGMeasureMode childHeightMeasureMode = YGMeasureModeExactly;

            if (isMainAxisRow) {
              childHeight = crossDim;
              childWidth = child->layout.measuredDimensions[YGDimensionWidth] +
                           getMarginAxis(child, YGFlexDirectionRow);
            } else {
              childWidth = crossDim;
              childHeight = child->layout.measuredDimensions[YGDimensionHeight] +
                            getMarginAxis(child, YGFlexDirectionColumn);
            }

            constrainMaxSizeForMode(child->style.maxDimensions[YGDimensionWidth],
                                    &childWidthMeasureMode,
                                    &childWidth);
            constrainMaxSizeForMode(child->style.maxDimensions[YGDimensionHeight],
                                    &childHeightMeasureMode,
                                    &childHeight);

            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!isCrossSizeDefinite) {
              childWidthMeasureMode =
                  CSSValueIsUndefined(childWidth) ? YGMeasureModeUndefined : YGMeasureModeExactly;
              childHeightMeasureMode =
                  CSSValueIsUndefined(childHeight) ? YGMeasureModeUndefined : YGMeasureModeExactly;

              layoutNodeInternal(child,
                                 childWidth,
                                 childHeight,
                                 direction,
                                 childWidthMeasureMode,
                                 childHeightMeasureMode,
                                 true,
                                 "stretch");
            }
          } else if (alignItem != YGAlignFlexStart) {
            const float remainingCrossDim = containerCrossAxis - getDimWithMargin(child, crossAxis);

            if (alignItem == YGAlignCenter) {
              leadingCrossDim += remainingCrossDim / 2;
            } else { // YGAlignFlexEnd
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
  }

  // STEP 8: MULTI-LINE CONTENT ALIGNMENT
  if (lineCount > 1 && performLayout && !CSSValueIsUndefined(availableInnerCrossDim)) {
    const float remainingAlignContentDim = availableInnerCrossDim - totalLineCrossDim;

    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;

    switch (node->style.alignContent) {
      case YGAlignFlexEnd:
        currentLead += remainingAlignContentDim;
        break;
      case YGAlignCenter:
        currentLead += remainingAlignContentDim / 2;
        break;
      case YGAlignStretch:
        if (availableInnerCrossDim > totalLineCrossDim) {
          crossDimLead = (remainingAlignContentDim / lineCount);
        }
        break;
      case YGAlignAuto:
      case YGAlignFlexStart:
      case YGAlignCount:
        break;
    }

    uint32_t endIndex = 0;
    for (uint32_t i = 0; i < lineCount; i++) {
      uint32_t startIndex = endIndex;
      uint32_t ii;

      // compute the line's height and find the endIndex
      float lineHeight = 0;
      for (ii = startIndex; ii < childCount; ii++) {
        const CSSNodeRef child = CSSNodeListGet(node->children, ii);

        if (child->style.positionType == YGPositionTypeRelative) {
          if (child->lineIndex != i) {
            break;
          }

          if (isLayoutDimDefined(child, crossAxis)) {
            lineHeight = fmaxf(lineHeight,
                               child->layout.measuredDimensions[dim[crossAxis]] +
                                   getMarginAxis(child, crossAxis));
          }
        }
      }
      endIndex = ii;
      lineHeight += crossDimLead;

      if (performLayout) {
        for (ii = startIndex; ii < endIndex; ii++) {
          const CSSNodeRef child = CSSNodeListGet(node->children, ii);

          if (child->style.positionType == YGPositionTypeRelative) {
            switch (getAlignItem(node, child)) {
              case YGAlignFlexStart: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + getLeadingMargin(child, crossAxis);
                break;
              }
              case YGAlignFlexEnd: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + lineHeight - getTrailingMargin(child, crossAxis) -
                    child->layout.measuredDimensions[dim[crossAxis]];
                break;
              }
              case YGAlignCenter: {
                float childHeight = child->layout.measuredDimensions[dim[crossAxis]];
                child->layout.position[pos[crossAxis]] =
                    currentLead + (lineHeight - childHeight) / 2;
                break;
              }
              case YGAlignStretch: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + getLeadingMargin(child, crossAxis);
                // TODO(prenaux): Correctly set the height of items with indefinite
                //                (auto) crossAxis dimension.
                break;
              }
              case YGAlignAuto:
              case YGAlignCount:
                break;
            }
          }
        }
      }

      currentLead += lineHeight;
    }
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS
  node->layout.measuredDimensions[YGDimensionWidth] =
      boundAxis(node, YGFlexDirectionRow, availableWidth - marginAxisRow);
  node->layout.measuredDimensions[YGDimensionHeight] =
      boundAxis(node, YGFlexDirectionColumn, availableHeight - marginAxisColumn);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == YGMeasureModeUndefined) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[mainAxis]] = boundAxis(node, mainAxis, maxLineMainDim);
  } else if (measureModeMainDim == YGMeasureModeAtMost) {
    node->layout.measuredDimensions[dim[mainAxis]] =
        fmaxf(fminf(availableInnerMainDim + paddingAndBorderAxisMain,
                    boundAxisWithinMinAndMax(node, mainAxis, maxLineMainDim)),
              paddingAndBorderAxisMain);
  }

  if (measureModeCrossDim == YGMeasureModeUndefined) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[crossAxis]] =
        boundAxis(node, crossAxis, totalLineCrossDim + paddingAndBorderAxisCross);
  } else if (measureModeCrossDim == YGMeasureModeAtMost) {
    node->layout.measuredDimensions[dim[crossAxis]] =
        fmaxf(fminf(availableInnerCrossDim + paddingAndBorderAxisCross,
                    boundAxisWithinMinAndMax(node,
                                             crossAxis,
                                             totalLineCrossDim + paddingAndBorderAxisCross)),
              paddingAndBorderAxisCross);
  }

  if (performLayout) {
    // STEP 10: SIZING AND POSITIONING ABSOLUTE CHILDREN
    for (currentAbsoluteChild = firstAbsoluteChild; currentAbsoluteChild != NULL;
         currentAbsoluteChild = currentAbsoluteChild->nextChild) {
      absoluteLayoutChild(
          node, currentAbsoluteChild, availableInnerWidth, widthMeasureMode, direction);
    }

    // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
    const bool needsMainTrailingPos =
        mainAxis == YGFlexDirectionRowReverse || mainAxis == YGFlexDirectionColumnReverse;
    const bool needsCrossTrailingPos =
        YGFlexDirectionRowReverse || crossAxis == YGFlexDirectionColumnReverse;

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (uint32_t i = 0; i < childCount; i++) {
        const CSSNodeRef child = CSSNodeListGet(node->children, i);

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

static const char *getSpacer(const unsigned long level) {
  const size_t spacerLen = strlen(spacer);
  if (level > spacerLen) {
    return &spacer[0];
  } else {
    return &spacer[spacerLen - level];
  }
}

static const char *getModeName(const YGMeasureMode mode, const bool performLayout) {
  const char *kMeasureModeNames[YGMeasureModeCount] = {"UNDEFINED", "EXACTLY", "AT_MOST"};
  const char *kLayoutModeNames[YGMeasureModeCount] = {"LAY_UNDEFINED",
                                                      "LAY_EXACTLY",
                                                      "LAY_AT_"
                                                      "MOST"};

  if (mode >= YGMeasureModeCount) {
    return "";
  }

  return performLayout ? kLayoutModeNames[mode] : kMeasureModeNames[mode];
}

static inline bool newSizeIsExactAndMatchesOldMeasuredSize(YGMeasureMode sizeMode,
                                                           float size,
                                                           float lastComputedSize) {
  return sizeMode == YGMeasureModeExactly && eq(size, lastComputedSize);
}

static inline bool oldSizeIsUnspecifiedAndStillFits(YGMeasureMode sizeMode,
                                                    float size,
                                                    YGMeasureMode lastSizeMode,
                                                    float lastComputedSize) {
  return sizeMode == YGMeasureModeAtMost && lastSizeMode == YGMeasureModeUndefined &&
         size >= lastComputedSize;
}

static inline bool newMeasureSizeIsStricterAndStillValid(YGMeasureMode sizeMode,
                                                         float size,
                                                         YGMeasureMode lastSizeMode,
                                                         float lastSize,
                                                         float lastComputedSize) {
  return lastSizeMode == YGMeasureModeAtMost && sizeMode == YGMeasureModeAtMost &&
         lastSize > size && lastComputedSize <= size;
}

bool CSSNodeCanUseCachedMeasurement(const YGMeasureMode widthMode,
                                    const float width,
                                    const YGMeasureMode heightMode,
                                    const float height,
                                    const YGMeasureMode lastWidthMode,
                                    const float lastWidth,
                                    const YGMeasureMode lastHeightMode,
                                    const float lastHeight,
                                    const float lastComputedWidth,
                                    const float lastComputedHeight,
                                    const float marginRow,
                                    const float marginColumn) {
  if (lastComputedHeight < 0 || lastComputedWidth < 0) {
    return false;
  }

  const bool hasSameWidthSpec = lastWidthMode == widthMode && eq(lastWidth, width);
  const bool hasSameHeightSpec = lastHeightMode == heightMode && eq(lastHeight, height);

  const bool widthIsCompatible =
      hasSameWidthSpec ||
      newSizeIsExactAndMatchesOldMeasuredSize(widthMode, width - marginRow, lastComputedWidth) ||
      oldSizeIsUnspecifiedAndStillFits(widthMode,
                                       width - marginRow,
                                       lastWidthMode,
                                       lastComputedWidth) ||
      newMeasureSizeIsStricterAndStillValid(
          widthMode, width - marginRow, lastWidthMode, lastWidth, lastComputedWidth);

  const bool heightIsCompatible =
      hasSameHeightSpec || newSizeIsExactAndMatchesOldMeasuredSize(heightMode,
                                                                   height - marginColumn,
                                                                   lastComputedHeight) ||
      oldSizeIsUnspecifiedAndStillFits(heightMode,
                                       height - marginColumn,
                                       lastHeightMode,
                                       lastComputedHeight) ||
      newMeasureSizeIsStricterAndStillValid(
          heightMode, height - marginColumn, lastHeightMode, lastHeight, lastComputedHeight);

  return widthIsCompatible && heightIsCompatible;
}

//
// This is a wrapper around the layoutNodeImpl function. It determines
// whether the layout request is redundant and can be skipped.
//
// Parameters:
//  Input parameters are the same as layoutNodeImpl (see above)
//  Return parameter is true if layout was performed, false if skipped
//
bool layoutNodeInternal(const CSSNodeRef node,
                        const float availableWidth,
                        const float availableHeight,
                        const YGDirection parentDirection,
                        const YGMeasureMode widthMeasureMode,
                        const YGMeasureMode heightMeasureMode,
                        const bool performLayout,
                        const char *reason) {
  CSSLayout *layout = &node->layout;

  gDepth++;

  const bool needToVisitNode =
      (node->isDirty && layout->generationCount != gCurrentGenerationCount) ||
      layout->lastParentDirection != parentDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout->nextCachedMeasurementsIndex = 0;
    layout->cachedLayout.widthMeasureMode = (YGMeasureMode) -1;
    layout->cachedLayout.heightMeasureMode = (YGMeasureMode) -1;
    layout->cachedLayout.computedWidth = -1;
    layout->cachedLayout.computedHeight = -1;
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
  if (node->measure) {
    const float marginAxisRow = getMarginAxis(node, YGFlexDirectionRow);
    const float marginAxisColumn = getMarginAxis(node, YGFlexDirectionColumn);

    // First, try to use the layout cache.
    if (CSSNodeCanUseCachedMeasurement(widthMeasureMode,
                                       availableWidth,
                                       heightMeasureMode,
                                       availableHeight,
                                       layout->cachedLayout.widthMeasureMode,
                                       layout->cachedLayout.availableWidth,
                                       layout->cachedLayout.heightMeasureMode,
                                       layout->cachedLayout.availableHeight,
                                       layout->cachedLayout.computedWidth,
                                       layout->cachedLayout.computedHeight,
                                       marginAxisRow,
                                       marginAxisColumn)) {
      cachedResults = &layout->cachedLayout;
    } else {
      // Try to use the measurement cache.
      for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
        if (CSSNodeCanUseCachedMeasurement(widthMeasureMode,
                                           availableWidth,
                                           heightMeasureMode,
                                           availableHeight,
                                           layout->cachedMeasurements[i].widthMeasureMode,
                                           layout->cachedMeasurements[i].availableWidth,
                                           layout->cachedMeasurements[i].heightMeasureMode,
                                           layout->cachedMeasurements[i].availableHeight,
                                           layout->cachedMeasurements[i].computedWidth,
                                           layout->cachedMeasurements[i].computedHeight,
                                           marginAxisRow,
                                           marginAxisColumn)) {
          cachedResults = &layout->cachedMeasurements[i];
          break;
        }
      }
    }
  } else if (performLayout) {
    if (eq(layout->cachedLayout.availableWidth, availableWidth) &&
        eq(layout->cachedLayout.availableHeight, availableHeight) &&
        layout->cachedLayout.widthMeasureMode == widthMeasureMode &&
        layout->cachedLayout.heightMeasureMode == heightMeasureMode) {
      cachedResults = &layout->cachedLayout;
    }
  } else {
    for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
      if (eq(layout->cachedMeasurements[i].availableWidth, availableWidth) &&
          eq(layout->cachedMeasurements[i].availableHeight, availableHeight) &&
          layout->cachedMeasurements[i].widthMeasureMode == widthMeasureMode &&
          layout->cachedMeasurements[i].heightMeasureMode == heightMeasureMode) {
        cachedResults = &layout->cachedMeasurements[i];
        break;
      }
    }
  }

  if (!needToVisitNode && cachedResults != NULL) {
    layout->measuredDimensions[YGDimensionWidth] = cachedResults->computedWidth;
    layout->measuredDimensions[YGDimensionHeight] = cachedResults->computedHeight;

    if (gPrintChanges && gPrintSkips) {
      printf("%s%d.{[skipped] ", getSpacer(gDepth), gDepth);
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
             getModeName(widthMeasureMode, performLayout),
             getModeName(heightMeasureMode, performLayout),
             availableWidth,
             availableHeight,
             cachedResults->computedWidth,
             cachedResults->computedHeight,
             reason);
    }
  } else {
    if (gPrintChanges) {
      printf("%s%d.{%s", getSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f %s\n",
             getModeName(widthMeasureMode, performLayout),
             getModeName(heightMeasureMode, performLayout),
             availableWidth,
             availableHeight,
             reason);
    }

    layoutNodeImpl(node,
                   availableWidth,
                   availableHeight,
                   parentDirection,
                   widthMeasureMode,
                   heightMeasureMode,
                   performLayout);

    if (gPrintChanges) {
      printf("%s%d.}%s", getSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, d: (%f, %f) %s\n",
             getModeName(widthMeasureMode, performLayout),
             getModeName(heightMeasureMode, performLayout),
             layout->measuredDimensions[YGDimensionWidth],
             layout->measuredDimensions[YGDimensionHeight],
             reason);
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
        newCacheEntry = &layout->cachedLayout;
      } else {
        // Allocate a new measurement cache entry.
        newCacheEntry = &layout->cachedMeasurements[layout->nextCachedMeasurementsIndex];
        layout->nextCachedMeasurementsIndex++;
      }

      newCacheEntry->availableWidth = availableWidth;
      newCacheEntry->availableHeight = availableHeight;
      newCacheEntry->widthMeasureMode = widthMeasureMode;
      newCacheEntry->heightMeasureMode = heightMeasureMode;
      newCacheEntry->computedWidth = layout->measuredDimensions[YGDimensionWidth];
      newCacheEntry->computedHeight = layout->measuredDimensions[YGDimensionHeight];
    }
  }

  if (performLayout) {
    node->layout.dimensions[YGDimensionWidth] = node->layout.measuredDimensions[YGDimensionWidth];
    node->layout.dimensions[YGDimensionHeight] = node->layout.measuredDimensions[YGDimensionHeight];
    node->hasNewLayout = true;
    node->isDirty = false;
  }

  gDepth--;
  layout->generationCount = gCurrentGenerationCount;
  return (needToVisitNode || cachedResults == NULL);
}

static void roundToPixelGrid(const CSSNodeRef node) {
  const float fractialLeft =
      node->layout.position[YGEdgeLeft] - floorf(node->layout.position[YGEdgeLeft]);
  const float fractialTop =
      node->layout.position[YGEdgeTop] - floorf(node->layout.position[YGEdgeTop]);
  node->layout.dimensions[YGDimensionWidth] =
      roundf(fractialLeft + node->layout.dimensions[YGDimensionWidth]) - roundf(fractialLeft);
  node->layout.dimensions[YGDimensionHeight] =
      roundf(fractialTop + node->layout.dimensions[YGDimensionHeight]) - roundf(fractialTop);

  node->layout.position[YGEdgeLeft] = roundf(node->layout.position[YGEdgeLeft]);
  node->layout.position[YGEdgeTop] = roundf(node->layout.position[YGEdgeTop]);

  const uint32_t childCount = CSSNodeListCount(node->children);
  for (uint32_t i = 0; i < childCount; i++) {
    roundToPixelGrid(CSSNodeGetChild(node, i));
  }
}

void CSSNodeCalculateLayout(const CSSNodeRef node,
                            const float availableWidth,
                            const float availableHeight,
                            const YGDirection parentDirection) {
  // Increment the generation count. This will force the recursive routine to
  // visit
  // all dirty nodes at least once. Subsequent visits will be skipped if the
  // input
  // parameters don't change.
  gCurrentGenerationCount++;

  float width = availableWidth;
  float height = availableHeight;
  YGMeasureMode widthMeasureMode = YGMeasureModeUndefined;
  YGMeasureMode heightMeasureMode = YGMeasureModeUndefined;

  if (!CSSValueIsUndefined(width)) {
    widthMeasureMode = YGMeasureModeExactly;
  } else if (isStyleDimDefined(node, YGFlexDirectionRow)) {
    width =
        node->style.dimensions[dim[YGFlexDirectionRow]] + getMarginAxis(node, YGFlexDirectionRow);
    widthMeasureMode = YGMeasureModeExactly;
  } else if (node->style.maxDimensions[YGDimensionWidth] >= 0.0) {
    width = node->style.maxDimensions[YGDimensionWidth];
    widthMeasureMode = YGMeasureModeAtMost;
  }

  if (!CSSValueIsUndefined(height)) {
    heightMeasureMode = YGMeasureModeExactly;
  } else if (isStyleDimDefined(node, YGFlexDirectionColumn)) {
    height = node->style.dimensions[dim[YGFlexDirectionColumn]] +
             getMarginAxis(node, YGFlexDirectionColumn);
    heightMeasureMode = YGMeasureModeExactly;
  } else if (node->style.maxDimensions[YGDimensionHeight] >= 0.0) {
    height = node->style.maxDimensions[YGDimensionHeight];
    heightMeasureMode = YGMeasureModeAtMost;
  }

  if (layoutNodeInternal(node,
                         width,
                         height,
                         parentDirection,
                         widthMeasureMode,
                         heightMeasureMode,
                         true,
                         "initia"
                         "l")) {
    setPosition(node, node->layout.direction);

    if (CSSLayoutIsExperimentalFeatureEnabled(YGExperimentalFeatureRounding)) {
      roundToPixelGrid(node);
    }

    if (gPrintTree) {
      CSSNodePrint(node, YGPrintOptionsLayout | YGPrintOptionsChildren | YGPrintOptionsStyle);
    }
  }
}

void CSSLayoutSetLogger(CSSLogger logger) {
  gLogger = logger;
}

void CSSLog(YGLogLevel level, const char *format, ...) {
  va_list args;
  va_start(args, format);
  gLogger(level, format, args);
  va_end(args);
}

static bool experimentalFeatures[YGExperimentalFeatureCount + 1];

void CSSLayoutSetExperimentalFeatureEnabled(YGExperimentalFeature feature, bool enabled) {
  experimentalFeatures[feature] = enabled;
}

inline bool CSSLayoutIsExperimentalFeatureEnabled(YGExperimentalFeature feature) {
  return experimentalFeatures[feature];
}

void CSSLayoutSetMemoryFuncs(CSSMalloc cssMalloc,
                             CSSCalloc cssCalloc,
                             CSSRealloc cssRealloc,
                             CSSFree cssFree) {
  CSS_ASSERT(gNodeInstanceCount == 0, "Cannot set memory functions: all node must be freed first");
  CSS_ASSERT((cssMalloc == NULL && cssCalloc == NULL && cssRealloc == NULL && cssFree == NULL) ||
                 (cssMalloc != NULL && cssCalloc != NULL && cssRealloc != NULL && cssFree != NULL),
             "Cannot set memory functions: functions must be all NULL or Non-NULL");

  if (cssMalloc == NULL || cssCalloc == NULL || cssRealloc == NULL || cssFree == NULL) {
    gCSSMalloc = &malloc;
    gCSSCalloc = &calloc;
    gCSSRealloc = &realloc;
    gCSSFree = &free;
  } else {
    gCSSMalloc = cssMalloc;
    gCSSCalloc = cssCalloc;
    gCSSRealloc = cssRealloc;
    gCSSFree = cssFree;
  }
}
