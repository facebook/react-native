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
  CSSMeasureMode widthMeasureMode;
  CSSMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;
} CSSCachedMeasurement;

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
enum { CSS_MAX_CACHED_RESULT_COUNT = 16 };

typedef struct CSSLayout {
  float position[4];
  float dimensions[2];
  CSSDirection direction;

  uint32_t computedFlexBasisGeneration;
  float computedFlexBasis;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  CSSDirection lastParentDirection;

  uint32_t nextCachedMeasurementsIndex;
  CSSCachedMeasurement cachedMeasurements[CSS_MAX_CACHED_RESULT_COUNT];
  float measuredDimensions[2];

  CSSCachedMeasurement cachedLayout;
} CSSLayout;

typedef struct CSSStyle {
  CSSDirection direction;
  CSSFlexDirection flexDirection;
  CSSJustify justifyContent;
  CSSAlign alignContent;
  CSSAlign alignItems;
  CSSAlign alignSelf;
  CSSPositionType positionType;
  CSSWrap flexWrap;
  CSSOverflow overflow;
  float flex;
  float flexGrow;
  float flexShrink;
  float flexBasis;
  float margin[CSSEdgeCount];
  float position[CSSEdgeCount];
  float padding[CSSEdgeCount];
  float border[CSSEdgeCount];
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
static int _csslayoutAndroidLog(CSSLogLevel level, const char *format, va_list args) {
  int androidLevel = CSSLogLevelDebug;
  switch (level) {
    case CSSLogLevelError:
      androidLevel = ANDROID_LOG_ERROR;
      break;
    case CSSLogLevelWarn:
      androidLevel = ANDROID_LOG_WARN;
      break;
    case CSSLogLevelInfo:
      androidLevel = ANDROID_LOG_INFO;
      break;
    case CSSLogLevelDebug:
      androidLevel = ANDROID_LOG_DEBUG;
      break;
    case CSSLogLevelVerbose:
      androidLevel = ANDROID_LOG_VERBOSE;
      break;
    case CSSLogLevelCount:
      break;
  }
  const int result = __android_log_vprint(androidLevel, "css-layout", format, args);
  return result;
}
static CSSLogger gLogger = &_csslayoutAndroidLog;
#else
static int _csslayoutDefaultLog(CSSLogLevel level, const char *format, va_list args) {
  switch (level) {
    case CSSLogLevelError:
      return vfprintf(stderr, format, args);
    case CSSLogLevelWarn:
    case CSSLogLevelInfo:
    case CSSLogLevelDebug:
    case CSSLogLevelVerbose:
    default:
      return vprintf(format, args);
  }
}
static CSSLogger gLogger = &_csslayoutDefaultLog;
#endif

static inline float computedEdgeValue(const float edges[CSSEdgeCount],
                                      const CSSEdge edge,
                                      const float defaultValue) {
  CSS_ASSERT(edge <= CSSEdgeEnd, "Cannot get computed value of multi-edge shorthands");

  if (!CSSValueIsUndefined(edges[edge])) {
    return edges[edge];
  }

  if ((edge == CSSEdgeTop || edge == CSSEdgeBottom) &&
      !CSSValueIsUndefined(edges[CSSEdgeVertical])) {
    return edges[CSSEdgeVertical];
  }

  if ((edge == CSSEdgeLeft || edge == CSSEdgeRight || edge == CSSEdgeStart || edge == CSSEdgeEnd) &&
      !CSSValueIsUndefined(edges[CSSEdgeHorizontal])) {
    return edges[CSSEdgeHorizontal];
  }

  if (!CSSValueIsUndefined(edges[CSSEdgeAll])) {
    return edges[CSSEdgeAll];
  }

  if (edge == CSSEdgeStart || edge == CSSEdgeEnd) {
    return CSSUndefined;
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

  node->style.flex = CSSUndefined;
  node->style.flexGrow = CSSUndefined;
  node->style.flexShrink = CSSUndefined;
  node->style.flexBasis = CSSUndefined;

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

  for (CSSEdge edge = CSSEdgeLeft; edge < CSSEdgeCount; edge++) {
    node->style.position[edge] = CSSUndefined;
    node->style.margin[edge] = CSSUndefined;
    node->style.padding[edge] = CSSUndefined;
    node->style.border[edge] = CSSUndefined;
  }

  node->style.aspectRatio = CSSUndefined;

  node->layout.dimensions[CSSDimensionWidth] = CSSUndefined;
  node->layout.dimensions[CSSDimensionHeight] = CSSUndefined;

  // Such that the comparison is always going to be false
  node->layout.lastParentDirection = (CSSDirection) -1;
  node->layout.nextCachedMeasurementsIndex = 0;
  node->layout.computedFlexBasis = CSSUndefined;

  node->layout.measuredDimensions[CSSDimensionWidth] = CSSUndefined;
  node->layout.measuredDimensions[CSSDimensionHeight] = CSSUndefined;
  node->layout.cachedLayout.widthMeasureMode = (CSSMeasureMode) -1;
  node->layout.cachedLayout.heightMeasureMode = (CSSMeasureMode) -1;
  node->layout.cachedLayout.computedWidth = -1;
  node->layout.cachedLayout.computedHeight = -1;
}

static void _CSSNodeMarkDirty(const CSSNodeRef node) {
  if (!node->isDirty) {
    node->isDirty = true;
    node->layout.computedFlexBasis = CSSUndefined;
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
    return node->style.flex > 0 ? 0 : CSSUndefined;
  }
  return CSSUndefined;
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

#define CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(type, name, paramName, instanceName, defaultValue)    \
  void CSSNodeStyleSet##name(const CSSNodeRef node, const CSSEdge edge, const type paramName) { \
    if (node->style.instanceName[edge] != paramName) {                                          \
      node->style.instanceName[edge] = paramName;                                               \
      _CSSNodeMarkDirty(node);                                                                  \
    }                                                                                           \
  }                                                                                             \
                                                                                                \
  type CSSNodeStyleGet##name(const CSSNodeRef node, const CSSEdge edge) {                       \
    return computedEdgeValue(node->style.instanceName, edge, defaultValue);                     \
  }

#define CSS_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName) \
  type CSSNodeLayoutGet##name(const CSSNodeRef node) {          \
    return node->layout.instanceName;                           \
  }

CSS_NODE_PROPERTY_IMPL(void *, Context, context, context);
CSS_NODE_PROPERTY_IMPL(CSSPrintFunc, PrintFunc, printFunc, print);
CSS_NODE_PROPERTY_IMPL(bool, HasNewLayout, hasNewLayout, hasNewLayout);

CSS_NODE_STYLE_PROPERTY_IMPL(CSSDirection, Direction, direction, direction);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSFlexDirection, FlexDirection, flexDirection, flexDirection);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSJustify, JustifyContent, justifyContent, justifyContent);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSAlign, AlignContent, alignContent, alignContent);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSAlign, AlignItems, alignItems, alignItems);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSAlign, AlignSelf, alignSelf, alignSelf);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSPositionType, PositionType, positionType, positionType);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSWrap, FlexWrap, flexWrap, flexWrap);
CSS_NODE_STYLE_PROPERTY_IMPL(CSSOverflow, Overflow, overflow, overflow);

CSS_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexGrow, flexGrow, flexGrow);
CSS_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexShrink, flexShrink, flexShrink);
CSS_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexBasis, flexBasis, flexBasis);

CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Position, position, position, CSSUndefined);
CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Margin, margin, margin, 0);
CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Padding, padding, padding, 0);
CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Border, border, border, 0);

CSS_NODE_STYLE_PROPERTY_IMPL(float, Width, width, dimensions[CSSDimensionWidth]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, Height, height, dimensions[CSSDimensionHeight]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MinWidth, minWidth, minDimensions[CSSDimensionWidth]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MinHeight, minHeight, minDimensions[CSSDimensionHeight]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MaxWidth, maxWidth, maxDimensions[CSSDimensionWidth]);
CSS_NODE_STYLE_PROPERTY_IMPL(float, MaxHeight, maxHeight, maxDimensions[CSSDimensionHeight]);

// Yoga specific properties, not compatible with flexbox specification
CSS_NODE_STYLE_PROPERTY_IMPL(float, AspectRatio, aspectRatio, aspectRatio);

CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[CSSEdgeLeft]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[CSSEdgeTop]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[CSSEdgeRight]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[CSSEdgeBottom]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[CSSDimensionWidth]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[CSSDimensionHeight]);
CSS_NODE_LAYOUT_PROPERTY_IMPL(CSSDirection, Direction, direction);

uint32_t gCurrentGenerationCount = 0;

bool layoutNodeInternal(const CSSNodeRef node,
                        const float availableWidth,
                        const float availableHeight,
                        const CSSDirection parentDirection,
                        const CSSMeasureMode widthMeasureMode,
                        const CSSMeasureMode heightMeasureMode,
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
    CSSLog(CSSLogLevelDebug, "  ");
  }
}

static void printNumberIfNotZero(const char *str, const float number) {
  if (!eq(number, 0)) {
    CSSLog(CSSLogLevelDebug, "%s: %g, ", str, number);
  }
}

static void printNumberIfNotUndefined(const char *str, const float number) {
  if (!CSSValueIsUndefined(number)) {
    CSSLog(CSSLogLevelDebug, "%s: %g, ", str, number);
  }
}

static bool eqFour(const float four[4]) {
  return eq(four[0], four[1]) && eq(four[0], four[2]) && eq(four[0], four[3]);
}

static void _CSSNodePrint(const CSSNodeRef node,
                          const CSSPrintOptions options,
                          const uint32_t level) {
  indent(level);
  CSSLog(CSSLogLevelDebug, "{");

  if (node->print) {
    node->print(node);
  }

  if (options & CSSPrintOptionsLayout) {
    CSSLog(CSSLogLevelDebug, "layout: {");
    CSSLog(CSSLogLevelDebug, "width: %g, ", node->layout.dimensions[CSSDimensionWidth]);
    CSSLog(CSSLogLevelDebug, "height: %g, ", node->layout.dimensions[CSSDimensionHeight]);
    CSSLog(CSSLogLevelDebug, "top: %g, ", node->layout.position[CSSEdgeTop]);
    CSSLog(CSSLogLevelDebug, "left: %g", node->layout.position[CSSEdgeLeft]);
    CSSLog(CSSLogLevelDebug, "}, ");
  }

  if (options & CSSPrintOptionsStyle) {
    if (node->style.flexDirection == CSSFlexDirectionColumn) {
      CSSLog(CSSLogLevelDebug, "flexDirection: 'column', ");
    } else if (node->style.flexDirection == CSSFlexDirectionColumnReverse) {
      CSSLog(CSSLogLevelDebug, "flexDirection: 'column-reverse', ");
    } else if (node->style.flexDirection == CSSFlexDirectionRow) {
      CSSLog(CSSLogLevelDebug, "flexDirection: 'row', ");
    } else if (node->style.flexDirection == CSSFlexDirectionRowReverse) {
      CSSLog(CSSLogLevelDebug, "flexDirection: 'row-reverse', ");
    }

    if (node->style.justifyContent == CSSJustifyCenter) {
      CSSLog(CSSLogLevelDebug, "justifyContent: 'center', ");
    } else if (node->style.justifyContent == CSSJustifyFlexEnd) {
      CSSLog(CSSLogLevelDebug, "justifyContent: 'flex-end', ");
    } else if (node->style.justifyContent == CSSJustifySpaceAround) {
      CSSLog(CSSLogLevelDebug, "justifyContent: 'space-around', ");
    } else if (node->style.justifyContent == CSSJustifySpaceBetween) {
      CSSLog(CSSLogLevelDebug, "justifyContent: 'space-between', ");
    }

    if (node->style.alignItems == CSSAlignCenter) {
      CSSLog(CSSLogLevelDebug, "alignItems: 'center', ");
    } else if (node->style.alignItems == CSSAlignFlexEnd) {
      CSSLog(CSSLogLevelDebug, "alignItems: 'flex-end', ");
    } else if (node->style.alignItems == CSSAlignStretch) {
      CSSLog(CSSLogLevelDebug, "alignItems: 'stretch', ");
    }

    if (node->style.alignContent == CSSAlignCenter) {
      CSSLog(CSSLogLevelDebug, "alignContent: 'center', ");
    } else if (node->style.alignContent == CSSAlignFlexEnd) {
      CSSLog(CSSLogLevelDebug, "alignContent: 'flex-end', ");
    } else if (node->style.alignContent == CSSAlignStretch) {
      CSSLog(CSSLogLevelDebug, "alignContent: 'stretch', ");
    }

    if (node->style.alignSelf == CSSAlignFlexStart) {
      CSSLog(CSSLogLevelDebug, "alignSelf: 'flex-start', ");
    } else if (node->style.alignSelf == CSSAlignCenter) {
      CSSLog(CSSLogLevelDebug, "alignSelf: 'center', ");
    } else if (node->style.alignSelf == CSSAlignFlexEnd) {
      CSSLog(CSSLogLevelDebug, "alignSelf: 'flex-end', ");
    } else if (node->style.alignSelf == CSSAlignStretch) {
      CSSLog(CSSLogLevelDebug, "alignSelf: 'stretch', ");
    }

    printNumberIfNotUndefined("flexGrow", CSSNodeStyleGetFlexGrow(node));
    printNumberIfNotUndefined("flexShrink", CSSNodeStyleGetFlexShrink(node));
    printNumberIfNotUndefined("flexBasis", CSSNodeStyleGetFlexBasis(node));

    if (node->style.overflow == CSSOverflowHidden) {
      CSSLog(CSSLogLevelDebug, "overflow: 'hidden', ");
    } else if (node->style.overflow == CSSOverflowVisible) {
      CSSLog(CSSLogLevelDebug, "overflow: 'visible', ");
    } else if (node->style.overflow == CSSOverflowScroll) {
      CSSLog(CSSLogLevelDebug, "overflow: 'scroll', ");
    }

    if (eqFour(node->style.margin)) {
      printNumberIfNotZero("margin", computedEdgeValue(node->style.margin, CSSEdgeLeft, 0));
    } else {
      printNumberIfNotZero("marginLeft", computedEdgeValue(node->style.margin, CSSEdgeLeft, 0));
      printNumberIfNotZero("marginRight", computedEdgeValue(node->style.margin, CSSEdgeRight, 0));
      printNumberIfNotZero("marginTop", computedEdgeValue(node->style.margin, CSSEdgeTop, 0));
      printNumberIfNotZero("marginBottom", computedEdgeValue(node->style.margin, CSSEdgeBottom, 0));
      printNumberIfNotZero("marginStart", computedEdgeValue(node->style.margin, CSSEdgeStart, 0));
      printNumberIfNotZero("marginEnd", computedEdgeValue(node->style.margin, CSSEdgeEnd, 0));
    }

    if (eqFour(node->style.padding)) {
      printNumberIfNotZero("padding", computedEdgeValue(node->style.padding, CSSEdgeLeft, 0));
    } else {
      printNumberIfNotZero("paddingLeft", computedEdgeValue(node->style.padding, CSSEdgeLeft, 0));
      printNumberIfNotZero("paddingRight", computedEdgeValue(node->style.padding, CSSEdgeRight, 0));
      printNumberIfNotZero("paddingTop", computedEdgeValue(node->style.padding, CSSEdgeTop, 0));
      printNumberIfNotZero("paddingBottom",
                           computedEdgeValue(node->style.padding, CSSEdgeBottom, 0));
      printNumberIfNotZero("paddingStart", computedEdgeValue(node->style.padding, CSSEdgeStart, 0));
      printNumberIfNotZero("paddingEnd", computedEdgeValue(node->style.padding, CSSEdgeEnd, 0));
    }

    if (eqFour(node->style.border)) {
      printNumberIfNotZero("borderWidth", computedEdgeValue(node->style.border, CSSEdgeLeft, 0));
    } else {
      printNumberIfNotZero("borderLeftWidth",
                           computedEdgeValue(node->style.border, CSSEdgeLeft, 0));
      printNumberIfNotZero("borderRightWidth",
                           computedEdgeValue(node->style.border, CSSEdgeRight, 0));
      printNumberIfNotZero("borderTopWidth", computedEdgeValue(node->style.border, CSSEdgeTop, 0));
      printNumberIfNotZero("borderBottomWidth",
                           computedEdgeValue(node->style.border, CSSEdgeBottom, 0));
      printNumberIfNotZero("borderStartWidth",
                           computedEdgeValue(node->style.border, CSSEdgeStart, 0));
      printNumberIfNotZero("borderEndWidth", computedEdgeValue(node->style.border, CSSEdgeEnd, 0));
    }

    printNumberIfNotUndefined("width", node->style.dimensions[CSSDimensionWidth]);
    printNumberIfNotUndefined("height", node->style.dimensions[CSSDimensionHeight]);
    printNumberIfNotUndefined("maxWidth", node->style.maxDimensions[CSSDimensionWidth]);
    printNumberIfNotUndefined("maxHeight", node->style.maxDimensions[CSSDimensionHeight]);
    printNumberIfNotUndefined("minWidth", node->style.minDimensions[CSSDimensionWidth]);
    printNumberIfNotUndefined("minHeight", node->style.minDimensions[CSSDimensionHeight]);

    if (node->style.positionType == CSSPositionTypeAbsolute) {
      CSSLog(CSSLogLevelDebug, "position: 'absolute', ");
    }

    printNumberIfNotUndefined("left",
                              computedEdgeValue(node->style.position, CSSEdgeLeft, CSSUndefined));
    printNumberIfNotUndefined("right",
                              computedEdgeValue(node->style.position, CSSEdgeRight, CSSUndefined));
    printNumberIfNotUndefined("top",
                              computedEdgeValue(node->style.position, CSSEdgeTop, CSSUndefined));
    printNumberIfNotUndefined("bottom",
                              computedEdgeValue(node->style.position, CSSEdgeBottom, CSSUndefined));
  }

  const uint32_t childCount = CSSNodeListCount(node->children);
  if (options & CSSPrintOptionsChildren && childCount > 0) {
    CSSLog(CSSLogLevelDebug, "children: [\n");
    for (uint32_t i = 0; i < childCount; i++) {
      _CSSNodePrint(CSSNodeGetChild(node, i), options, level + 1);
    }
    indent(level);
    CSSLog(CSSLogLevelDebug, "]},\n");
  } else {
    CSSLog(CSSLogLevelDebug, "},\n");
  }
}

void CSSNodePrint(const CSSNodeRef node, const CSSPrintOptions options) {
  _CSSNodePrint(node, options, 0);
}

static const CSSEdge leading[4] = {
        [CSSFlexDirectionColumn] = CSSEdgeTop,
        [CSSFlexDirectionColumnReverse] = CSSEdgeBottom,
        [CSSFlexDirectionRow] = CSSEdgeLeft,
        [CSSFlexDirectionRowReverse] = CSSEdgeRight,
};
static const CSSEdge trailing[4] = {
        [CSSFlexDirectionColumn] = CSSEdgeBottom,
        [CSSFlexDirectionColumnReverse] = CSSEdgeTop,
        [CSSFlexDirectionRow] = CSSEdgeRight,
        [CSSFlexDirectionRowReverse] = CSSEdgeLeft,
};
static const CSSEdge pos[4] = {
        [CSSFlexDirectionColumn] = CSSEdgeTop,
        [CSSFlexDirectionColumnReverse] = CSSEdgeBottom,
        [CSSFlexDirectionRow] = CSSEdgeLeft,
        [CSSFlexDirectionRowReverse] = CSSEdgeRight,
};
static const CSSDimension dim[4] = {
        [CSSFlexDirectionColumn] = CSSDimensionHeight,
        [CSSFlexDirectionColumnReverse] = CSSDimensionHeight,
        [CSSFlexDirectionRow] = CSSDimensionWidth,
        [CSSFlexDirectionRowReverse] = CSSDimensionWidth,
};

static inline bool isRowDirection(const CSSFlexDirection flexDirection) {
  return flexDirection == CSSFlexDirectionRow || flexDirection == CSSFlexDirectionRowReverse;
}

static inline bool isColumnDirection(const CSSFlexDirection flexDirection) {
  return flexDirection == CSSFlexDirectionColumn || flexDirection == CSSFlexDirectionColumnReverse;
}

static inline float getLeadingMargin(const CSSNodeRef node, const CSSFlexDirection axis) {
  if (isRowDirection(axis) && !CSSValueIsUndefined(node->style.margin[CSSEdgeStart])) {
    return node->style.margin[CSSEdgeStart];
  }

  return computedEdgeValue(node->style.margin, leading[axis], 0);
}

static float getTrailingMargin(const CSSNodeRef node, const CSSFlexDirection axis) {
  if (isRowDirection(axis) && !CSSValueIsUndefined(node->style.margin[CSSEdgeEnd])) {
    return node->style.margin[CSSEdgeEnd];
  }

  return computedEdgeValue(node->style.margin, trailing[axis], 0);
}

static float getLeadingPadding(const CSSNodeRef node, const CSSFlexDirection axis) {
  if (isRowDirection(axis) && !CSSValueIsUndefined(node->style.padding[CSSEdgeStart]) &&
      node->style.padding[CSSEdgeStart] >= 0) {
    return node->style.padding[CSSEdgeStart];
  }

  return fmaxf(computedEdgeValue(node->style.padding, leading[axis], 0), 0);
}

static float getTrailingPadding(const CSSNodeRef node, const CSSFlexDirection axis) {
  if (isRowDirection(axis) && !CSSValueIsUndefined(node->style.padding[CSSEdgeEnd]) &&
      node->style.padding[CSSEdgeEnd] >= 0) {
    return node->style.padding[CSSEdgeEnd];
  }

  return fmaxf(computedEdgeValue(node->style.padding, trailing[axis], 0), 0);
}

static float getLeadingBorder(const CSSNodeRef node, const CSSFlexDirection axis) {
  if (isRowDirection(axis) && !CSSValueIsUndefined(node->style.border[CSSEdgeStart]) &&
      node->style.border[CSSEdgeStart] >= 0) {
    return node->style.border[CSSEdgeStart];
  }

  return fmaxf(computedEdgeValue(node->style.border, leading[axis], 0), 0);
}

static float getTrailingBorder(const CSSNodeRef node, const CSSFlexDirection axis) {
  if (isRowDirection(axis) && !CSSValueIsUndefined(node->style.border[CSSEdgeEnd]) &&
      node->style.border[CSSEdgeEnd] >= 0) {
    return node->style.border[CSSEdgeEnd];
  }

  return fmaxf(computedEdgeValue(node->style.border, trailing[axis], 0), 0);
}

static inline float getLeadingPaddingAndBorder(const CSSNodeRef node, const CSSFlexDirection axis) {
  return getLeadingPadding(node, axis) + getLeadingBorder(node, axis);
}

static inline float getTrailingPaddingAndBorder(const CSSNodeRef node,
                                                const CSSFlexDirection axis) {
  return getTrailingPadding(node, axis) + getTrailingBorder(node, axis);
}

static inline float getMarginAxis(const CSSNodeRef node, const CSSFlexDirection axis) {
  return getLeadingMargin(node, axis) + getTrailingMargin(node, axis);
}

static inline float getPaddingAndBorderAxis(const CSSNodeRef node, const CSSFlexDirection axis) {
  return getLeadingPaddingAndBorder(node, axis) + getTrailingPaddingAndBorder(node, axis);
}

static inline CSSAlign getAlignItem(const CSSNodeRef node, const CSSNodeRef child) {
  return child->style.alignSelf == CSSAlignAuto ? node->style.alignItems : child->style.alignSelf;
}

static inline CSSDirection resolveDirection(const CSSNodeRef node,
                                            const CSSDirection parentDirection) {
  if (node->style.direction == CSSDirectionInherit) {
    return parentDirection > CSSDirectionInherit ? parentDirection : CSSDirectionLTR;
  } else {
    return node->style.direction;
  }
}

static inline CSSFlexDirection resolveAxis(const CSSFlexDirection flexDirection,
                                           const CSSDirection direction) {
  if (direction == CSSDirectionRTL) {
    if (flexDirection == CSSFlexDirectionRow) {
      return CSSFlexDirectionRowReverse;
    } else if (flexDirection == CSSFlexDirectionRowReverse) {
      return CSSFlexDirectionRow;
    }
  }

  return flexDirection;
}

static CSSFlexDirection getCrossFlexDirection(const CSSFlexDirection flexDirection,
                                              const CSSDirection direction) {
  return isColumnDirection(flexDirection) ? resolveAxis(CSSFlexDirectionRow, direction)
                                          : CSSFlexDirectionColumn;
}

static inline bool isFlex(const CSSNodeRef node) {
  return (node->style.positionType == CSSPositionTypeRelative &&
          (node->style.flexGrow != 0 || node->style.flexShrink != 0 || node->style.flex != 0));
}

static inline float getDimWithMargin(const CSSNodeRef node, const CSSFlexDirection axis) {
  return node->layout.measuredDimensions[dim[axis]] + getLeadingMargin(node, axis) +
         getTrailingMargin(node, axis);
}

static inline bool isStyleDimDefined(const CSSNodeRef node, const CSSFlexDirection axis) {
  const float value = node->style.dimensions[dim[axis]];
  return !CSSValueIsUndefined(value) && value >= 0.0;
}

static inline bool isLayoutDimDefined(const CSSNodeRef node, const CSSFlexDirection axis) {
  const float value = node->layout.measuredDimensions[dim[axis]];
  return !CSSValueIsUndefined(value) && value >= 0.0;
}

static inline bool isLeadingPosDefined(const CSSNodeRef node, const CSSFlexDirection axis) {
  return (isRowDirection(axis) &&
          !CSSValueIsUndefined(
              computedEdgeValue(node->style.position, CSSEdgeStart, CSSUndefined))) ||
         !CSSValueIsUndefined(computedEdgeValue(node->style.position, leading[axis], CSSUndefined));
}

static inline bool isTrailingPosDefined(const CSSNodeRef node, const CSSFlexDirection axis) {
  return (isRowDirection(axis) &&
          !CSSValueIsUndefined(
              computedEdgeValue(node->style.position, CSSEdgeEnd, CSSUndefined))) ||
         !CSSValueIsUndefined(
             computedEdgeValue(node->style.position, trailing[axis], CSSUndefined));
}

static float getLeadingPosition(const CSSNodeRef node, const CSSFlexDirection axis) {
  if (isRowDirection(axis)) {
    const float leadingPosition =
        computedEdgeValue(node->style.position, CSSEdgeStart, CSSUndefined);
    if (!CSSValueIsUndefined(leadingPosition)) {
      return leadingPosition;
    }
  }

  const float leadingPosition =
      computedEdgeValue(node->style.position, leading[axis], CSSUndefined);

  return CSSValueIsUndefined(leadingPosition) ? 0 : leadingPosition;
}

static float getTrailingPosition(const CSSNodeRef node, const CSSFlexDirection axis) {
  if (isRowDirection(axis)) {
    const float trailingPosition =
        computedEdgeValue(node->style.position, CSSEdgeEnd, CSSUndefined);
    if (!CSSValueIsUndefined(trailingPosition)) {
      return trailingPosition;
    }
  }

  const float trailingPosition =
      computedEdgeValue(node->style.position, trailing[axis], CSSUndefined);

  return CSSValueIsUndefined(trailingPosition) ? 0 : trailingPosition;
}

static float boundAxisWithinMinAndMax(const CSSNodeRef node,
                                      const CSSFlexDirection axis,
                                      const float value) {
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
                              const CSSFlexDirection axis,
                              const float value) {
  return fmaxf(boundAxisWithinMinAndMax(node, axis, value), getPaddingAndBorderAxis(node, axis));
}

static void setTrailingPosition(const CSSNodeRef node,
                                const CSSNodeRef child,
                                const CSSFlexDirection axis) {
  const float size = child->layout.measuredDimensions[dim[axis]];
  child->layout.position[trailing[axis]] =
      node->layout.measuredDimensions[dim[axis]] - size - child->layout.position[pos[axis]];
}

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
static float getRelativePosition(const CSSNodeRef node, const CSSFlexDirection axis) {
  return isLeadingPosDefined(node, axis) ? getLeadingPosition(node, axis)
                                         : -getTrailingPosition(node, axis);
}

static void constrainMaxSizeForMode(const float maxSize, CSSMeasureMode *mode, float *size) {
  switch (*mode) {
    case CSSMeasureModeExactly:
    case CSSMeasureModeAtMost:
      *size = (CSSValueIsUndefined(maxSize) || *size < maxSize) ? *size : maxSize;
      break;
    case CSSMeasureModeUndefined:
      if (!CSSValueIsUndefined(maxSize)) {
        *mode = CSSMeasureModeAtMost;
        *size = maxSize;
      }
      break;
    case CSSMeasureModeCount:
      break;
  }
}

static void setPosition(const CSSNodeRef node, const CSSDirection direction) {
  const CSSFlexDirection mainAxis = resolveAxis(node->style.flexDirection, direction);
  const CSSFlexDirection crossAxis = getCrossFlexDirection(mainAxis, direction);
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
                                  const CSSMeasureMode widthMode,
                                  const float height,
                                  const CSSMeasureMode heightMode,
                                  const CSSDirection direction) {
  const CSSFlexDirection mainAxis = resolveAxis(node->style.flexDirection, direction);
  const bool isMainAxisRow = isRowDirection(mainAxis);

  float childWidth;
  float childHeight;
  CSSMeasureMode childWidthMeasureMode;
  CSSMeasureMode childHeightMeasureMode;

  const bool isRowStyleDimDefined = isStyleDimDefined(child, CSSFlexDirectionRow);
  const bool isColumnStyleDimDefined = isStyleDimDefined(child, CSSFlexDirectionColumn);

  if (!CSSValueIsUndefined(CSSNodeStyleGetFlexBasis(child)) &&
      !CSSValueIsUndefined(isMainAxisRow ? width : height)) {
    if (CSSValueIsUndefined(child->layout.computedFlexBasis) ||
        child->layout.computedFlexBasisGeneration != gCurrentGenerationCount) {
      child->layout.computedFlexBasis =
          fmaxf(CSSNodeStyleGetFlexBasis(child), getPaddingAndBorderAxis(child, mainAxis));
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    child->layout.computedFlexBasis = fmaxf(child->style.dimensions[CSSDimensionWidth],
                                            getPaddingAndBorderAxis(child, CSSFlexDirectionRow));
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    child->layout.computedFlexBasis = fmaxf(child->style.dimensions[CSSDimensionHeight],
                                            getPaddingAndBorderAxis(child, CSSFlexDirectionColumn));
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped
    // flex basis).
    childWidth = CSSUndefined;
    childHeight = CSSUndefined;
    childWidthMeasureMode = CSSMeasureModeUndefined;
    childHeightMeasureMode = CSSMeasureModeUndefined;

    if (isRowStyleDimDefined) {
      childWidth =
          child->style.dimensions[CSSDimensionWidth] + getMarginAxis(child, CSSFlexDirectionRow);
      childWidthMeasureMode = CSSMeasureModeExactly;
    }
    if (isColumnStyleDimDefined) {
      childHeight = child->style.dimensions[CSSDimensionHeight] +
                    getMarginAxis(child, CSSFlexDirectionColumn);
      childHeightMeasureMode = CSSMeasureModeExactly;
    }

    // The W3C spec doesn't say anything about the 'overflow' property,
    // but all major browsers appear to implement the following logic.
    if ((!isMainAxisRow && node->style.overflow == CSSOverflowScroll) ||
        node->style.overflow != CSSOverflowScroll) {
      if (CSSValueIsUndefined(childWidth) && !CSSValueIsUndefined(width)) {
        childWidth = width;
        childWidthMeasureMode = CSSMeasureModeAtMost;
      }
    }

    if ((isMainAxisRow && node->style.overflow == CSSOverflowScroll) ||
        node->style.overflow != CSSOverflowScroll) {
      if (CSSValueIsUndefined(childHeight) && !CSSValueIsUndefined(height)) {
        childHeight = height;
        childHeightMeasureMode = CSSMeasureModeAtMost;
      }
    }

    // If child has no defined size in the cross axis and is set to stretch,
    // set the cross
    // axis to be measured exactly with the available inner width
    if (!isMainAxisRow && !CSSValueIsUndefined(width) && !isRowStyleDimDefined &&
        widthMode == CSSMeasureModeExactly && getAlignItem(node, child) == CSSAlignStretch) {
      childWidth = width;
      childWidthMeasureMode = CSSMeasureModeExactly;
    }
    if (isMainAxisRow && !CSSValueIsUndefined(height) && !isColumnStyleDimDefined &&
        heightMode == CSSMeasureModeExactly && getAlignItem(node, child) == CSSAlignStretch) {
      childHeight = height;
      childHeightMeasureMode = CSSMeasureModeExactly;
    }

    if (!CSSValueIsUndefined(child->style.aspectRatio)) {
      if (!isMainAxisRow && childWidthMeasureMode == CSSMeasureModeExactly) {
        child->layout.computedFlexBasis =
            fmaxf(childWidth * child->style.aspectRatio,
                  getPaddingAndBorderAxis(child, CSSFlexDirectionColumn));
        return;
      } else if (isMainAxisRow && childHeightMeasureMode == CSSMeasureModeExactly) {
        child->layout.computedFlexBasis =
            fmaxf(childHeight * child->style.aspectRatio,
                  getPaddingAndBorderAxis(child, CSSFlexDirectionRow));
        return;
      }
    }

    constrainMaxSizeForMode(child->style.maxDimensions[CSSDimensionWidth],
                            &childWidthMeasureMode,
                            &childWidth);
    constrainMaxSizeForMode(child->style.maxDimensions[CSSDimensionHeight],
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
        fmaxf(isMainAxisRow ? child->layout.measuredDimensions[CSSDimensionWidth]
                            : child->layout.measuredDimensions[CSSDimensionHeight],
              getPaddingAndBorderAxis(child, mainAxis));
  }

  child->layout.computedFlexBasisGeneration = gCurrentGenerationCount;
}

static void absoluteLayoutChild(const CSSNodeRef node,
                                const CSSNodeRef child,
                                const float width,
                                const CSSMeasureMode widthMode,
                                const CSSDirection direction) {
  const CSSFlexDirection mainAxis = resolveAxis(node->style.flexDirection, direction);
  const CSSFlexDirection crossAxis = getCrossFlexDirection(mainAxis, direction);
  const bool isMainAxisRow = isRowDirection(mainAxis);

  float childWidth = CSSUndefined;
  float childHeight = CSSUndefined;
  CSSMeasureMode childWidthMeasureMode = CSSMeasureModeUndefined;
  CSSMeasureMode childHeightMeasureMode = CSSMeasureModeUndefined;

  if (isStyleDimDefined(child, CSSFlexDirectionRow)) {
    childWidth =
        child->style.dimensions[CSSDimensionWidth] + getMarginAxis(child, CSSFlexDirectionRow);
  } else {
    // If the child doesn't have a specified width, compute the width based
    // on the left/right
    // offsets if they're defined.
    if (isLeadingPosDefined(child, CSSFlexDirectionRow) &&
        isTrailingPosDefined(child, CSSFlexDirectionRow)) {
      childWidth = node->layout.measuredDimensions[CSSDimensionWidth] -
                   (getLeadingBorder(node, CSSFlexDirectionRow) +
                    getTrailingBorder(node, CSSFlexDirectionRow)) -
                   (getLeadingPosition(child, CSSFlexDirectionRow) +
                    getTrailingPosition(child, CSSFlexDirectionRow));
      childWidth = boundAxis(child, CSSFlexDirectionRow, childWidth);
    }
  }

  if (isStyleDimDefined(child, CSSFlexDirectionColumn)) {
    childHeight =
        child->style.dimensions[CSSDimensionHeight] + getMarginAxis(child, CSSFlexDirectionColumn);
  } else {
    // If the child doesn't have a specified height, compute the height
    // based on the top/bottom
    // offsets if they're defined.
    if (isLeadingPosDefined(child, CSSFlexDirectionColumn) &&
        isTrailingPosDefined(child, CSSFlexDirectionColumn)) {
      childHeight = node->layout.measuredDimensions[CSSDimensionHeight] -
                    (getLeadingBorder(node, CSSFlexDirectionColumn) +
                     getTrailingBorder(node, CSSFlexDirectionColumn)) -
                    (getLeadingPosition(child, CSSFlexDirectionColumn) +
                     getTrailingPosition(child, CSSFlexDirectionColumn));
      childHeight = boundAxis(child, CSSFlexDirectionColumn, childHeight);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect ratio
  // calculation. One dimension being the anchor and the other being flexible.
  if (CSSValueIsUndefined(childWidth) ^ CSSValueIsUndefined(childHeight)) {
    if (!CSSValueIsUndefined(child->style.aspectRatio)) {
      if (CSSValueIsUndefined(childWidth)) {
        childWidth = fmaxf(childHeight * child->style.aspectRatio,
                           getPaddingAndBorderAxis(child, CSSFlexDirectionColumn));
      } else if (CSSValueIsUndefined(childHeight)) {
        childHeight = fmaxf(childWidth * child->style.aspectRatio,
                            getPaddingAndBorderAxis(child, CSSFlexDirectionRow));
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (CSSValueIsUndefined(childWidth) || CSSValueIsUndefined(childHeight)) {
    childWidthMeasureMode =
        CSSValueIsUndefined(childWidth) ? CSSMeasureModeUndefined : CSSMeasureModeExactly;
    childHeightMeasureMode =
        CSSValueIsUndefined(childHeight) ? CSSMeasureModeUndefined : CSSMeasureModeExactly;

    // According to the spec, if the main size is not definite and the
    // child's inline axis is parallel to the main axis (i.e. it's
    // horizontal), the child should be sized using "UNDEFINED" in
    // the main size. Otherwise use "AT_MOST" in the cross axis.
    if (!isMainAxisRow && CSSValueIsUndefined(childWidth) && widthMode != CSSMeasureModeUndefined) {
      childWidth = width;
      childWidthMeasureMode = CSSMeasureModeAtMost;
    }

    layoutNodeInternal(child,
                       childWidth,
                       childHeight,
                       direction,
                       childWidthMeasureMode,
                       childHeightMeasureMode,
                       false,
                       "abs-measure");
    childWidth = child->layout.measuredDimensions[CSSDimensionWidth] +
                 getMarginAxis(child, CSSFlexDirectionRow);
    childHeight = child->layout.measuredDimensions[CSSDimensionHeight] +
                  getMarginAxis(child, CSSFlexDirectionColumn);
  }

  layoutNodeInternal(child,
                     childWidth,
                     childHeight,
                     direction,
                     CSSMeasureModeExactly,
                     CSSMeasureModeExactly,
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
                                                        const CSSMeasureMode widthMeasureMode,
                                                        const CSSMeasureMode heightMeasureMode) {
  CSS_ASSERT(node->measure, "Expected node to have custom measure function");

  const float paddingAndBorderAxisRow = getPaddingAndBorderAxis(node, CSSFlexDirectionRow);
  const float paddingAndBorderAxisColumn = getPaddingAndBorderAxis(node, CSSFlexDirectionColumn);
  const float marginAxisRow = getMarginAxis(node, CSSFlexDirectionRow);
  const float marginAxisColumn = getMarginAxis(node, CSSFlexDirectionColumn);

  const float innerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  const float innerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;

  if (widthMeasureMode == CSSMeasureModeExactly && heightMeasureMode == CSSMeasureModeExactly) {
    // Don't bother sizing the text if both dimensions are already defined.
    node->layout.measuredDimensions[CSSDimensionWidth] =
        boundAxis(node, CSSFlexDirectionRow, availableWidth - marginAxisRow);
    node->layout.measuredDimensions[CSSDimensionHeight] =
        boundAxis(node, CSSFlexDirectionColumn, availableHeight - marginAxisColumn);
  } else if (innerWidth <= 0 || innerHeight <= 0) {
    // Don't bother sizing the text if there's no horizontal or vertical
    // space.
    node->layout.measuredDimensions[CSSDimensionWidth] = boundAxis(node, CSSFlexDirectionRow, 0);
    node->layout.measuredDimensions[CSSDimensionHeight] =
        boundAxis(node, CSSFlexDirectionColumn, 0);
  } else {
    // Measure the text under the current constraints.
    const CSSSize measuredSize =
        node->measure(node, innerWidth, widthMeasureMode, innerHeight, heightMeasureMode);

    node->layout.measuredDimensions[CSSDimensionWidth] =
        boundAxis(node,
                  CSSFlexDirectionRow,
                  (widthMeasureMode == CSSMeasureModeUndefined ||
                   widthMeasureMode == CSSMeasureModeAtMost)
                      ? measuredSize.width + paddingAndBorderAxisRow
                      : availableWidth - marginAxisRow);
    node->layout.measuredDimensions[CSSDimensionHeight] =
        boundAxis(node,
                  CSSFlexDirectionColumn,
                  (heightMeasureMode == CSSMeasureModeUndefined ||
                   heightMeasureMode == CSSMeasureModeAtMost)
                      ? measuredSize.height + paddingAndBorderAxisColumn
                      : availableHeight - marginAxisColumn);
  }
}

// For nodes with no children, use the available values if they were provided,
// or the minimum size as indicated by the padding and border sizes.
static void setMeasuredDimensionsForEmptyContainer(const CSSNodeRef node,
                                                   const float availableWidth,
                                                   const float availableHeight,
                                                   const CSSMeasureMode widthMeasureMode,
                                                   const CSSMeasureMode heightMeasureMode) {
  const float paddingAndBorderAxisRow = getPaddingAndBorderAxis(node, CSSFlexDirectionRow);
  const float paddingAndBorderAxisColumn = getPaddingAndBorderAxis(node, CSSFlexDirectionColumn);
  const float marginAxisRow = getMarginAxis(node, CSSFlexDirectionRow);
  const float marginAxisColumn = getMarginAxis(node, CSSFlexDirectionColumn);

  node->layout.measuredDimensions[CSSDimensionWidth] =
      boundAxis(node,
                CSSFlexDirectionRow,
                (widthMeasureMode == CSSMeasureModeUndefined ||
                 widthMeasureMode == CSSMeasureModeAtMost)
                    ? paddingAndBorderAxisRow
                    : availableWidth - marginAxisRow);
  node->layout.measuredDimensions[CSSDimensionHeight] =
      boundAxis(node,
                CSSFlexDirectionColumn,
                (heightMeasureMode == CSSMeasureModeUndefined ||
                 heightMeasureMode == CSSMeasureModeAtMost)
                    ? paddingAndBorderAxisColumn
                    : availableHeight - marginAxisColumn);
}

static bool setMeasuredDimensionsIfEmptyOrFixedSize(const CSSNodeRef node,
                                                    const float availableWidth,
                                                    const float availableHeight,
                                                    const CSSMeasureMode widthMeasureMode,
                                                    const CSSMeasureMode heightMeasureMode) {
  if ((widthMeasureMode == CSSMeasureModeAtMost && availableWidth <= 0) ||
      (heightMeasureMode == CSSMeasureModeAtMost && availableHeight <= 0) ||
      (widthMeasureMode == CSSMeasureModeExactly && heightMeasureMode == CSSMeasureModeExactly)) {
    const float marginAxisColumn = getMarginAxis(node, CSSFlexDirectionColumn);
    const float marginAxisRow = getMarginAxis(node, CSSFlexDirectionRow);

    node->layout.measuredDimensions[CSSDimensionWidth] =
        boundAxis(node,
                  CSSFlexDirectionRow,
                  CSSValueIsUndefined(availableWidth) || availableWidth < 0
                      ? 0
                      : availableWidth - marginAxisRow);

    node->layout.measuredDimensions[CSSDimensionHeight] =
        boundAxis(node,
                  CSSFlexDirectionColumn,
                  CSSValueIsUndefined(availableHeight) || availableHeight < 0
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
static void layoutNodeImpl(const CSSNodeRef node,
                           const float availableWidth,
                           const float availableHeight,
                           const CSSDirection parentDirection,
                           const CSSMeasureMode widthMeasureMode,
                           const CSSMeasureMode heightMeasureMode,
                           const bool performLayout) {
  CSS_ASSERT(CSSValueIsUndefined(availableWidth) ? widthMeasureMode == CSSMeasureModeUndefined
                                                 : true,
             "availableWidth is indefinite so widthMeasureMode must be "
             "CSSMeasureModeUndefined");
  CSS_ASSERT(CSSValueIsUndefined(availableHeight) ? heightMeasureMode == CSSMeasureModeUndefined
                                                  : true,
             "availableHeight is indefinite so heightMeasureMode must be "
             "CSSMeasureModeUndefined");

  // Set the resolved resolution in the node's layout.
  const CSSDirection direction = resolveDirection(node, parentDirection);
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
  const CSSFlexDirection mainAxis = resolveAxis(node->style.flexDirection, direction);
  const CSSFlexDirection crossAxis = getCrossFlexDirection(mainAxis, direction);
  const bool isMainAxisRow = isRowDirection(mainAxis);
  const CSSJustify justifyContent = node->style.justifyContent;
  const bool isNodeFlexWrap = node->style.flexWrap == CSSWrapWrap;

  CSSNodeRef firstAbsoluteChild = NULL;
  CSSNodeRef currentAbsoluteChild = NULL;

  const float leadingPaddingAndBorderMain = getLeadingPaddingAndBorder(node, mainAxis);
  const float trailingPaddingAndBorderMain = getTrailingPaddingAndBorder(node, mainAxis);
  const float leadingPaddingAndBorderCross = getLeadingPaddingAndBorder(node, crossAxis);
  const float paddingAndBorderAxisMain = getPaddingAndBorderAxis(node, mainAxis);
  const float paddingAndBorderAxisCross = getPaddingAndBorderAxis(node, crossAxis);

  const CSSMeasureMode measureModeMainDim = isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  const CSSMeasureMode measureModeCrossDim = isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  const float paddingAndBorderAxisRow = getPaddingAndBorderAxis(node, CSSFlexDirectionRow);
  const float paddingAndBorderAxisColumn = getPaddingAndBorderAxis(node, CSSFlexDirectionColumn);
  const float marginAxisRow = getMarginAxis(node, CSSFlexDirectionRow);
  const float marginAxisColumn = getMarginAxis(node, CSSFlexDirectionColumn);

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
  if ((isMainAxisRow && widthMeasureMode == CSSMeasureModeExactly) ||
      (!isMainAxisRow && heightMeasureMode == CSSMeasureModeExactly)) {
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
      const CSSDirection childDirection = resolveDirection(child, direction);
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

      if (child->style.positionType != CSSPositionTypeAbsolute) {
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
    const bool canSkipFlex = !performLayout && measureModeCrossDim == CSSMeasureModeExactly;

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
        CSSMeasureMode childWidthMeasureMode;
        CSSMeasureMode childHeightMeasureMode;

        if (isMainAxisRow) {
          childWidth = updatedMainSize + getMarginAxis(currentRelativeChild, CSSFlexDirectionRow);
          childWidthMeasureMode = CSSMeasureModeExactly;

          if (!CSSValueIsUndefined(availableInnerCrossDim) &&
              !isStyleDimDefined(currentRelativeChild, CSSFlexDirectionColumn) &&
              heightMeasureMode == CSSMeasureModeExactly &&
              getAlignItem(node, currentRelativeChild) == CSSAlignStretch) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode = CSSMeasureModeExactly;
          } else if (!isStyleDimDefined(currentRelativeChild, CSSFlexDirectionColumn)) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode =
                CSSValueIsUndefined(childHeight) ? CSSMeasureModeUndefined : CSSMeasureModeAtMost;
          } else {
            childHeight = currentRelativeChild->style.dimensions[CSSDimensionHeight] +
                          getMarginAxis(currentRelativeChild, CSSFlexDirectionColumn);
            childHeightMeasureMode = CSSMeasureModeExactly;
          }
        } else {
          childHeight =
              updatedMainSize + getMarginAxis(currentRelativeChild, CSSFlexDirectionColumn);
          childHeightMeasureMode = CSSMeasureModeExactly;

          if (!CSSValueIsUndefined(availableInnerCrossDim) &&
              !isStyleDimDefined(currentRelativeChild, CSSFlexDirectionRow) &&
              widthMeasureMode == CSSMeasureModeExactly &&
              getAlignItem(node, currentRelativeChild) == CSSAlignStretch) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode = CSSMeasureModeExactly;
          } else if (!isStyleDimDefined(currentRelativeChild, CSSFlexDirectionRow)) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode =
                CSSValueIsUndefined(childWidth) ? CSSMeasureModeUndefined : CSSMeasureModeAtMost;
          } else {
            childWidth = currentRelativeChild->style.dimensions[CSSDimensionWidth] +
                         getMarginAxis(currentRelativeChild, CSSFlexDirectionRow);
            childWidthMeasureMode = CSSMeasureModeExactly;
          }
        }

        if (!CSSValueIsUndefined(currentRelativeChild->style.aspectRatio)) {
          if (isMainAxisRow && childHeightMeasureMode != CSSMeasureModeExactly) {
            childHeight =
                fmaxf(childWidth * currentRelativeChild->style.aspectRatio,
                      getPaddingAndBorderAxis(currentRelativeChild, CSSFlexDirectionColumn));
            childHeightMeasureMode = CSSMeasureModeExactly;
          } else if (!isMainAxisRow && childWidthMeasureMode != CSSMeasureModeExactly) {
            childWidth = fmaxf(childHeight * currentRelativeChild->style.aspectRatio,
                               getPaddingAndBorderAxis(currentRelativeChild, CSSFlexDirectionRow));
            childWidthMeasureMode = CSSMeasureModeExactly;
          }
        }

        constrainMaxSizeForMode(currentRelativeChild->style.maxDimensions[CSSDimensionWidth],
                                &childWidthMeasureMode,
                                &childWidth);
        constrainMaxSizeForMode(currentRelativeChild->style.maxDimensions[CSSDimensionHeight],
                                &childHeightMeasureMode,
                                &childHeight);

        const bool requiresStretchLayout =
            !isStyleDimDefined(currentRelativeChild, crossAxis) &&
            getAlignItem(node, currentRelativeChild) == CSSAlignStretch;

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

    if (measureModeMainDim == CSSMeasureModeAtMost && remainingFreeSpace > 0) {
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
      case CSSJustifyCenter:
        leadingMainDim = remainingFreeSpace / 2;
        break;
      case CSSJustifyFlexEnd:
        leadingMainDim = remainingFreeSpace;
        break;
      case CSSJustifySpaceBetween:
        if (itemsOnLine > 1) {
          betweenMainDim = fmaxf(remainingFreeSpace, 0) / (itemsOnLine - 1);
        } else {
          betweenMainDim = 0;
        }
        break;
      case CSSJustifySpaceAround:
        // Space on the edges is half of the space between elements
        betweenMainDim = remainingFreeSpace / itemsOnLine;
        leadingMainDim = betweenMainDim / 2;
        break;
      case CSSJustifyFlexStart:
      case CSSJustifyCount:
        break;
    }

    float mainDim = leadingPaddingAndBorderMain + leadingMainDim;
    float crossDim = 0;

    for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
      const CSSNodeRef child = CSSNodeListGet(node->children, i);

      if (child->style.positionType == CSSPositionTypeAbsolute &&
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
        if (child->style.positionType == CSSPositionTypeRelative) {
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
    if (measureModeCrossDim == CSSMeasureModeUndefined ||
        measureModeCrossDim == CSSMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis = boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross) -
                           paddingAndBorderAxisCross;

      if (measureModeCrossDim == CSSMeasureModeAtMost) {
        containerCrossAxis = fminf(containerCrossAxis, availableInnerCrossDim);
      }
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == CSSMeasureModeExactly) {
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

        if (child->style.positionType == CSSPositionTypeAbsolute) {
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
          const CSSAlign alignItem = getAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time
          // forcing the cross-axis size to be the computed cross size for the
          // current line.
          if (alignItem == CSSAlignStretch) {
            const bool isCrossSizeDefinite =
                (isMainAxisRow && isStyleDimDefined(child, CSSFlexDirectionColumn)) ||
                (!isMainAxisRow && isStyleDimDefined(child, CSSFlexDirectionRow));

            float childWidth;
            float childHeight;
            CSSMeasureMode childWidthMeasureMode = CSSMeasureModeExactly;
            CSSMeasureMode childHeightMeasureMode = CSSMeasureModeExactly;

            if (isMainAxisRow) {
              childHeight = crossDim;
              childWidth = child->layout.measuredDimensions[CSSDimensionWidth] +
                           getMarginAxis(child, CSSFlexDirectionRow);
            } else {
              childWidth = crossDim;
              childHeight = child->layout.measuredDimensions[CSSDimensionHeight] +
                            getMarginAxis(child, CSSFlexDirectionColumn);
            }

            constrainMaxSizeForMode(child->style.maxDimensions[CSSDimensionWidth],
                                    &childWidthMeasureMode,
                                    &childWidth);
            constrainMaxSizeForMode(child->style.maxDimensions[CSSDimensionHeight],
                                    &childHeightMeasureMode,
                                    &childHeight);

            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!isCrossSizeDefinite) {
              childWidthMeasureMode =
                  CSSValueIsUndefined(childWidth) ? CSSMeasureModeUndefined : CSSMeasureModeExactly;
              childHeightMeasureMode = CSSValueIsUndefined(childHeight) ? CSSMeasureModeUndefined
                                                                        : CSSMeasureModeExactly;

              layoutNodeInternal(child,
                                 childWidth,
                                 childHeight,
                                 direction,
                                 childWidthMeasureMode,
                                 childHeightMeasureMode,
                                 true,
                                 "stretch");
            }
          } else if (alignItem != CSSAlignFlexStart) {
            const float remainingCrossDim = containerCrossAxis - getDimWithMargin(child, crossAxis);

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
  }

  // STEP 8: MULTI-LINE CONTENT ALIGNMENT
  if (lineCount > 1 && performLayout && !CSSValueIsUndefined(availableInnerCrossDim)) {
    const float remainingAlignContentDim = availableInnerCrossDim - totalLineCrossDim;

    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;

    switch (node->style.alignContent) {
      case CSSAlignFlexEnd:
        currentLead += remainingAlignContentDim;
        break;
      case CSSAlignCenter:
        currentLead += remainingAlignContentDim / 2;
        break;
      case CSSAlignStretch:
        if (availableInnerCrossDim > totalLineCrossDim) {
          crossDimLead = (remainingAlignContentDim / lineCount);
        }
        break;
      case CSSAlignAuto:
      case CSSAlignFlexStart:
      case CSSAlignCount:
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

        if (child->style.positionType == CSSPositionTypeRelative) {
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

          if (child->style.positionType == CSSPositionTypeRelative) {
            switch (getAlignItem(node, child)) {
              case CSSAlignFlexStart: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + getLeadingMargin(child, crossAxis);
                break;
              }
              case CSSAlignFlexEnd: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + lineHeight - getTrailingMargin(child, crossAxis) -
                    child->layout.measuredDimensions[dim[crossAxis]];
                break;
              }
              case CSSAlignCenter: {
                float childHeight = child->layout.measuredDimensions[dim[crossAxis]];
                child->layout.position[pos[crossAxis]] =
                    currentLead + (lineHeight - childHeight) / 2;
                break;
              }
              case CSSAlignStretch: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + getLeadingMargin(child, crossAxis);
                // TODO(prenaux): Correctly set the height of items with indefinite
                //                (auto) crossAxis dimension.
                break;
              }
              case CSSAlignAuto:
              case CSSAlignCount:
                break;
            }
          }
        }
      }

      currentLead += lineHeight;
    }
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS
  node->layout.measuredDimensions[CSSDimensionWidth] =
      boundAxis(node, CSSFlexDirectionRow, availableWidth - marginAxisRow);
  node->layout.measuredDimensions[CSSDimensionHeight] =
      boundAxis(node, CSSFlexDirectionColumn, availableHeight - marginAxisColumn);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == CSSMeasureModeUndefined) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[mainAxis]] = boundAxis(node, mainAxis, maxLineMainDim);
  } else if (measureModeMainDim == CSSMeasureModeAtMost) {
    node->layout.measuredDimensions[dim[mainAxis]] =
        fmaxf(fminf(availableInnerMainDim + paddingAndBorderAxisMain,
                    boundAxisWithinMinAndMax(node, mainAxis, maxLineMainDim)),
              paddingAndBorderAxisMain);
  }

  if (measureModeCrossDim == CSSMeasureModeUndefined) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[crossAxis]] =
        boundAxis(node, crossAxis, totalLineCrossDim + paddingAndBorderAxisCross);
  } else if (measureModeCrossDim == CSSMeasureModeAtMost) {
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
        mainAxis == CSSFlexDirectionRowReverse || mainAxis == CSSFlexDirectionColumnReverse;
    const bool needsCrossTrailingPos =
        CSSFlexDirectionRowReverse || crossAxis == CSSFlexDirectionColumnReverse;

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

static const char *getModeName(const CSSMeasureMode mode, const bool performLayout) {
  const char *kMeasureModeNames[CSSMeasureModeCount] = {"UNDEFINED", "EXACTLY", "AT_MOST"};
  const char *kLayoutModeNames[CSSMeasureModeCount] = {"LAY_UNDEFINED",
                                                       "LAY_EXACTLY",
                                                       "LAY_AT_"
                                                       "MOST"};

  if (mode >= CSSMeasureModeCount) {
    return "";
  }

  return performLayout ? kLayoutModeNames[mode] : kMeasureModeNames[mode];
}

static inline bool newSizeIsExactAndMatchesOldMeasuredSize(CSSMeasureMode sizeMode,
                                                           float size,
                                                           float lastComputedSize) {
  return sizeMode == CSSMeasureModeExactly && eq(size, lastComputedSize);
}

static inline bool oldSizeIsUnspecifiedAndStillFits(CSSMeasureMode sizeMode,
                                                    float size,
                                                    CSSMeasureMode lastSizeMode,
                                                    float lastComputedSize) {
  return sizeMode == CSSMeasureModeAtMost && lastSizeMode == CSSMeasureModeUndefined &&
         size >= lastComputedSize;
}

static inline bool newMeasureSizeIsStricterAndStillValid(CSSMeasureMode sizeMode,
                                                         float size,
                                                         CSSMeasureMode lastSizeMode,
                                                         float lastSize,
                                                         float lastComputedSize) {
  return lastSizeMode == CSSMeasureModeAtMost && sizeMode == CSSMeasureModeAtMost &&
         lastSize > size && lastComputedSize <= size;
}

bool CSSNodeCanUseCachedMeasurement(const CSSMeasureMode widthMode,
                                    const float width,
                                    const CSSMeasureMode heightMode,
                                    const float height,
                                    const CSSMeasureMode lastWidthMode,
                                    const float lastWidth,
                                    const CSSMeasureMode lastHeightMode,
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
                        const CSSDirection parentDirection,
                        const CSSMeasureMode widthMeasureMode,
                        const CSSMeasureMode heightMeasureMode,
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
    layout->cachedLayout.widthMeasureMode = (CSSMeasureMode) -1;
    layout->cachedLayout.heightMeasureMode = (CSSMeasureMode) -1;
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
    const float marginAxisRow = getMarginAxis(node, CSSFlexDirectionRow);
    const float marginAxisColumn = getMarginAxis(node, CSSFlexDirectionColumn);

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
    layout->measuredDimensions[CSSDimensionWidth] = cachedResults->computedWidth;
    layout->measuredDimensions[CSSDimensionHeight] = cachedResults->computedHeight;

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
             layout->measuredDimensions[CSSDimensionWidth],
             layout->measuredDimensions[CSSDimensionHeight],
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
      newCacheEntry->computedWidth = layout->measuredDimensions[CSSDimensionWidth];
      newCacheEntry->computedHeight = layout->measuredDimensions[CSSDimensionHeight];
    }
  }

  if (performLayout) {
    node->layout.dimensions[CSSDimensionWidth] = node->layout.measuredDimensions[CSSDimensionWidth];
    node->layout.dimensions[CSSDimensionHeight] =
        node->layout.measuredDimensions[CSSDimensionHeight];
    node->hasNewLayout = true;
    node->isDirty = false;
  }

  gDepth--;
  layout->generationCount = gCurrentGenerationCount;
  return (needToVisitNode || cachedResults == NULL);
}

static void roundToPixelGrid(const CSSNodeRef node) {
  const float fractialLeft =
      node->layout.position[CSSEdgeLeft] - floorf(node->layout.position[CSSEdgeLeft]);
  const float fractialTop =
      node->layout.position[CSSEdgeTop] - floorf(node->layout.position[CSSEdgeTop]);
  node->layout.dimensions[CSSDimensionWidth] =
      roundf(fractialLeft + node->layout.dimensions[CSSDimensionWidth]) - roundf(fractialLeft);
  node->layout.dimensions[CSSDimensionHeight] =
      roundf(fractialTop + node->layout.dimensions[CSSDimensionHeight]) - roundf(fractialTop);

  node->layout.position[CSSEdgeLeft] = roundf(node->layout.position[CSSEdgeLeft]);
  node->layout.position[CSSEdgeTop] = roundf(node->layout.position[CSSEdgeTop]);

  const uint32_t childCount = CSSNodeListCount(node->children);
  for (uint32_t i = 0; i < childCount; i++) {
    roundToPixelGrid(CSSNodeGetChild(node, i));
  }
}

void CSSNodeCalculateLayout(const CSSNodeRef node,
                            const float availableWidth,
                            const float availableHeight,
                            const CSSDirection parentDirection) {
  // Increment the generation count. This will force the recursive routine to
  // visit
  // all dirty nodes at least once. Subsequent visits will be skipped if the
  // input
  // parameters don't change.
  gCurrentGenerationCount++;

  float width = availableWidth;
  float height = availableHeight;
  CSSMeasureMode widthMeasureMode = CSSMeasureModeUndefined;
  CSSMeasureMode heightMeasureMode = CSSMeasureModeUndefined;

  if (!CSSValueIsUndefined(width)) {
    widthMeasureMode = CSSMeasureModeExactly;
  } else if (isStyleDimDefined(node, CSSFlexDirectionRow)) {
    width =
        node->style.dimensions[dim[CSSFlexDirectionRow]] + getMarginAxis(node, CSSFlexDirectionRow);
    widthMeasureMode = CSSMeasureModeExactly;
  } else if (node->style.maxDimensions[CSSDimensionWidth] >= 0.0) {
    width = node->style.maxDimensions[CSSDimensionWidth];
    widthMeasureMode = CSSMeasureModeAtMost;
  }

  if (!CSSValueIsUndefined(height)) {
    heightMeasureMode = CSSMeasureModeExactly;
  } else if (isStyleDimDefined(node, CSSFlexDirectionColumn)) {
    height = node->style.dimensions[dim[CSSFlexDirectionColumn]] +
             getMarginAxis(node, CSSFlexDirectionColumn);
    heightMeasureMode = CSSMeasureModeExactly;
  } else if (node->style.maxDimensions[CSSDimensionHeight] >= 0.0) {
    height = node->style.maxDimensions[CSSDimensionHeight];
    heightMeasureMode = CSSMeasureModeAtMost;
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

    if (CSSLayoutIsExperimentalFeatureEnabled(CSSExperimentalFeatureRounding)) {
      roundToPixelGrid(node);
    }

    if (gPrintTree) {
      CSSNodePrint(node, CSSPrintOptionsLayout | CSSPrintOptionsChildren | CSSPrintOptionsStyle);
    }
  }
}

void CSSLayoutSetLogger(CSSLogger logger) {
  gLogger = logger;
}

void CSSLog(CSSLogLevel level, const char *format, ...) {
  va_list args;
  va_start(args, format);
  gLogger(level, format, args);
  va_end(args);
}

static bool experimentalFeatures[CSSExperimentalFeatureCount + 1];

void CSSLayoutSetExperimentalFeatureEnabled(CSSExperimentalFeature feature, bool enabled) {
  experimentalFeatures[feature] = enabled;
}

inline bool CSSLayoutIsExperimentalFeatureEnabled(CSSExperimentalFeature feature) {
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
