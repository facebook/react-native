/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <string.h>

#include "YGNodeList.h"
#include "Yoga.h"

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

typedef struct YGCachedMeasurement {
  float availableWidth;
  float availableHeight;
  YGMeasureMode widthMeasureMode;
  YGMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;
} YGCachedMeasurement;

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
#define YG_MAX_CACHED_RESULT_COUNT 16

typedef struct YGLayout {
  float position[4];
  float dimensions[2];
  float margin[6];
  float border[6];
  float padding[6];
  YGDirection direction;

  uint32_t computedFlexBasisGeneration;
  float computedFlexBasis;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  YGDirection lastParentDirection;

  uint32_t nextCachedMeasurementsIndex;
  YGCachedMeasurement cachedMeasurements[YG_MAX_CACHED_RESULT_COUNT];
  float measuredDimensions[2];

  YGCachedMeasurement cachedLayout;
} YGLayout;

typedef struct YGStyle {
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
  YGValue flexBasis;
  YGValue margin[YGEdgeCount];
  YGValue position[YGEdgeCount];
  YGValue padding[YGEdgeCount];
  YGValue border[YGEdgeCount];
  YGValue dimensions[2];
  YGValue minDimensions[2];
  YGValue maxDimensions[2];

  // Yoga specific properties, not compatible with flexbox specification
  float aspectRatio;
} YGStyle;

typedef struct YGNode {
  YGStyle style;
  YGLayout layout;
  uint32_t lineIndex;

  YGNodeRef parent;
  YGNodeListRef children;

  struct YGNode *nextChild;

  YGMeasureFunc measure;
  YGBaselineFunc baseline;
  YGPrintFunc print;
  void *context;

  bool isDirty;
  bool hasNewLayout;
} YGNode;

#define YG_UNDEFINED_VALUES \
  { .value = YGUndefined, .unit = YGUnitUndefined }

#define YG_DEFAULT_EDGE_VALUES_UNIT                                                   \
  {                                                                                   \
    [YGEdgeLeft] = YG_UNDEFINED_VALUES, [YGEdgeTop] = YG_UNDEFINED_VALUES,            \
    [YGEdgeRight] = YG_UNDEFINED_VALUES, [YGEdgeBottom] = YG_UNDEFINED_VALUES,        \
    [YGEdgeStart] = YG_UNDEFINED_VALUES, [YGEdgeEnd] = YG_UNDEFINED_VALUES,           \
    [YGEdgeHorizontal] = YG_UNDEFINED_VALUES, [YGEdgeVertical] = YG_UNDEFINED_VALUES, \
    [YGEdgeAll] = YG_UNDEFINED_VALUES,                                                \
  }

#define YG_DEFAULT_DIMENSION_VALUES \
  { [YGDimensionWidth] = YGUndefined, [YGDimensionHeight] = YGUndefined, }

#define YG_DEFAULT_DIMENSION_VALUES_UNIT \
  { [YGDimensionWidth] = YG_UNDEFINED_VALUES, [YGDimensionHeight] = YG_UNDEFINED_VALUES, }

static YGNode gYGNodeDefaults = {
    .parent = NULL,
    .children = NULL,
    .hasNewLayout = true,
    .isDirty = false,

    .style =
        {
            .flex = YGUndefined,
            .flexGrow = YGUndefined,
            .flexShrink = YGUndefined,
            .flexBasis = YG_UNDEFINED_VALUES,
            .justifyContent = YGJustifyFlexStart,
            .alignItems = YGAlignStretch,
            .alignContent = YGAlignFlexStart,
            .direction = YGDirectionInherit,
            .flexDirection = YGFlexDirectionColumn,
            .overflow = YGOverflowVisible,
            .dimensions = YG_DEFAULT_DIMENSION_VALUES_UNIT,
            .minDimensions = YG_DEFAULT_DIMENSION_VALUES_UNIT,
            .maxDimensions = YG_DEFAULT_DIMENSION_VALUES_UNIT,
            .position = YG_DEFAULT_EDGE_VALUES_UNIT,
            .margin = YG_DEFAULT_EDGE_VALUES_UNIT,
            .padding = YG_DEFAULT_EDGE_VALUES_UNIT,
            .border = YG_DEFAULT_EDGE_VALUES_UNIT,
            .aspectRatio = YGUndefined,
        },

    .layout =
        {
            .dimensions = YG_DEFAULT_DIMENSION_VALUES,
            .lastParentDirection = (YGDirection) -1,
            .nextCachedMeasurementsIndex = 0,
            .computedFlexBasis = YGUndefined,
            .measuredDimensions = YG_DEFAULT_DIMENSION_VALUES,

            .cachedLayout =
                {
                    .widthMeasureMode = (YGMeasureMode) -1,
                    .heightMeasureMode = (YGMeasureMode) -1,
                    .computedWidth = -1,
                    .computedHeight = -1,
                },
        },
};

static void YGNodeMarkDirtyInternal(const YGNodeRef node);

YGMalloc gYGMalloc = &malloc;
YGCalloc gYGCalloc = &calloc;
YGRealloc gYGRealloc = &realloc;
YGFree gYGFree = &free;

static YGValue YGValueZero = {.value = 0, .unit = YGUnitPixel};

#ifdef ANDROID
#include <android/log.h>
static int YGAndroidLog(YGLogLevel level, const char *format, va_list args) {
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
  }
  const int result = __android_log_vprint(androidLevel, "YG-layout", format, args);
  return result;
}
static YGLogger gLogger = &YGAndroidLog;
#else
static int YGDefaultLog(YGLogLevel level, const char *format, va_list args) {
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
static YGLogger gLogger = &YGDefaultLog;
#endif

static inline const YGValue *YGComputedEdgeValue(const YGValue edges[YGEdgeCount],
                                                 const YGEdge edge,
                                                 const YGValue *const defaultValue) {
  YG_ASSERT(edge <= YGEdgeEnd, "Cannot get computed value of multi-edge shorthands");

  if (edges[edge].unit != YGUnitUndefined) {
    return &edges[edge];
  }

  if ((edge == YGEdgeTop || edge == YGEdgeBottom) &&
      edges[YGEdgeVertical].unit != YGUnitUndefined) {
    return &edges[YGEdgeVertical];
  }

  if ((edge == YGEdgeLeft || edge == YGEdgeRight || edge == YGEdgeStart || edge == YGEdgeEnd) &&
      edges[YGEdgeHorizontal].unit != YGUnitUndefined) {
    return &edges[YGEdgeHorizontal];
  }

  if (edges[YGEdgeAll].unit != YGUnitUndefined) {
    return &edges[YGEdgeAll];
  }

  if (edge == YGEdgeStart || edge == YGEdgeEnd) {
    return &YGValueUndefined;
  }

  return defaultValue;
}

static inline float YGValueResolve(const YGValue *const unit, const float parentSize) {
  if (unit->unit == YGUnitPixel) {
    return unit->value;
  } else {
    return unit->value * parentSize / 100.0f;
  }
}

int32_t gNodeInstanceCount = 0;

YGNodeRef YGNodeNew(void) {
  const YGNodeRef node = gYGMalloc(sizeof(YGNode));
  YG_ASSERT(node, "Could not allocate memory for node");
  gNodeInstanceCount++;

  memcpy(node, &gYGNodeDefaults, sizeof(YGNode));
  return node;
}

void YGNodeFree(const YGNodeRef node) {
  if (node->parent) {
    YGNodeListDelete(node->parent->children, node);
    node->parent = NULL;
  }

  const uint32_t childCount = YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const YGNodeRef child = YGNodeGetChild(node, i);
    child->parent = NULL;
  }

  YGNodeListFree(node->children);
  gYGFree(node);
  gNodeInstanceCount--;
}

void YGNodeFreeRecursive(const YGNodeRef root) {
  while (YGNodeGetChildCount(root) > 0) {
    const YGNodeRef child = YGNodeGetChild(root, 0);
    YGNodeRemoveChild(root, child);
    YGNodeFreeRecursive(child);
  }
  YGNodeFree(root);
}

void YGNodeReset(const YGNodeRef node) {
  YG_ASSERT(YGNodeGetChildCount(node) == 0,
            "Cannot reset a node which still has children attached");
  YG_ASSERT(node->parent == NULL, "Cannot reset a node still attached to a parent");

  YGNodeListFree(node->children);
  memcpy(node, &gYGNodeDefaults, sizeof(YGNode));
}

int32_t YGNodeGetInstanceCount(void) {
  return gNodeInstanceCount;
}

static void YGNodeMarkDirtyInternal(const YGNodeRef node) {
  if (!node->isDirty) {
    node->isDirty = true;
    node->layout.computedFlexBasis = YGUndefined;
    if (node->parent) {
      YGNodeMarkDirtyInternal(node->parent);
    }
  }
}

void YGNodeSetMeasureFunc(const YGNodeRef node, YGMeasureFunc measureFunc) {
  if (measureFunc == NULL) {
    node->measure = NULL;
  } else {
    YG_ASSERT(YGNodeGetChildCount(node) == 0,
              "Cannot set measure function: Nodes with measure functions cannot have children.");
    node->measure = measureFunc;
  }
}

YGMeasureFunc YGNodeGetMeasureFunc(const YGNodeRef node) {
  return node->measure;
}

void YGNodeSetBaselineFunc(const YGNodeRef node, YGBaselineFunc baselineFunc) {
  node->baseline = baselineFunc;
}

YGBaselineFunc YGNodeGetBaselineFunc(const YGNodeRef node) {
  return node->baseline;
}

void YGNodeInsertChild(const YGNodeRef node, const YGNodeRef child, const uint32_t index) {
  YG_ASSERT(child->parent == NULL, "Child already has a parent, it must be removed first.");
  YG_ASSERT(node->measure == NULL,
            "Cannot add child: Nodes with measure functions cannot have children.");
  YGNodeListInsert(&node->children, child, index);
  child->parent = node;
  YGNodeMarkDirtyInternal(node);
}

void YGNodeRemoveChild(const YGNodeRef node, const YGNodeRef child) {
  if (YGNodeListDelete(node->children, child) != NULL) {
    child->parent = NULL;
    YGNodeMarkDirtyInternal(node);
  }
}

YGNodeRef YGNodeGetChild(const YGNodeRef node, const uint32_t index) {
  return YGNodeListGet(node->children, index);
}

YGNodeRef YGNodeGetParent(const YGNodeRef node) {
  return node->parent;
}

inline uint32_t YGNodeGetChildCount(const YGNodeRef node) {
  return YGNodeListCount(node->children);
}

void YGNodeMarkDirty(const YGNodeRef node) {
  YG_ASSERT(node->measure != NULL,
            "Only leaf nodes with custom measure functions"
            "should manually mark themselves as dirty");
  YGNodeMarkDirtyInternal(node);
}

bool YGNodeIsDirty(const YGNodeRef node) {
  return node->isDirty;
}

void YGNodeCopyStyle(const YGNodeRef dstNode, const YGNodeRef srcNode) {
  if (memcmp(&dstNode->style, &srcNode->style, sizeof(YGStyle)) != 0) {
    memcpy(&dstNode->style, &srcNode->style, sizeof(YGStyle));
    YGNodeMarkDirtyInternal(dstNode);
  }
}

inline float YGNodeStyleGetFlexGrow(const YGNodeRef node) {
  if (!YGFloatIsUndefined(node->style.flexGrow)) {
    return node->style.flexGrow;
  }
  if (!YGFloatIsUndefined(node->style.flex) && node->style.flex > 0.0f) {
    return node->style.flex;
  }
  return 0.0f;
}

inline float YGNodeStyleGetFlexShrink(const YGNodeRef node) {
  if (!YGFloatIsUndefined(node->style.flexShrink)) {
    return node->style.flexShrink;
  }
  if (!YGFloatIsUndefined(node->style.flex) && node->style.flex < 0.0f) {
    return -node->style.flex;
  }
  return 0.0f;
}

static inline const YGValue *YGNodeStyleGetFlexBasisPtr(const YGNodeRef node) {
  if (node->style.flexBasis.unit != YGUnitUndefined) {
    return &node->style.flexBasis;
  }
  if (!YGFloatIsUndefined(node->style.flex) && node->style.flex > 0.0f) {
    return &YGValueZero;
  }
  return &YGValueUndefined;
}

inline YGValue YGNodeStyleGetFlexBasis(const YGNodeRef node) {
  return *YGNodeStyleGetFlexBasisPtr(node);
}

void YGNodeStyleSetFlex(const YGNodeRef node, const float flex) {
  if (node->style.flex != flex) {
    node->style.flex = flex;
    YGNodeMarkDirtyInternal(node);
  }
}

#define YG_NODE_PROPERTY_IMPL(type, name, paramName, instanceName) \
  void YGNodeSet##name(const YGNodeRef node, type paramName) {     \
    node->instanceName = paramName;                                \
  }                                                                \
                                                                   \
  type YGNodeGet##name(const YGNodeRef node) {                     \
    return node->instanceName;                                     \
  }

#define YG_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
  void YGNodeStyleSet##name(const YGNodeRef node, const type paramName) {       \
    if (node->style.instanceName != paramName) {                                \
      node->style.instanceName = paramName;                                     \
      YGNodeMarkDirtyInternal(node);                                            \
    }                                                                           \
  }

#define YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(type, name, paramName, instanceName) \
  void YGNodeStyleSet##name(const YGNodeRef node, const type paramName) {            \
    if (node->style.instanceName.value != paramName ||                               \
        node->style.instanceName.unit != YGUnitPixel) {                              \
      node->style.instanceName.value = paramName;                                    \
      node->style.instanceName.unit =                                                \
          YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPixel;             \
      YGNodeMarkDirtyInternal(node);                                                 \
    }                                                                                \
  }                                                                                  \
                                                                                     \
  void YGNodeStyleSet##name##Percent(const YGNodeRef node, const type paramName) {   \
    if (node->style.instanceName.value != paramName ||                               \
        node->style.instanceName.unit != YGUnitPercent) {                            \
      node->style.instanceName.value = paramName;                                    \
      node->style.instanceName.unit =                                                \
          YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPercent;           \
      YGNodeMarkDirtyInternal(node);                                                 \
    }                                                                                \
  }

#define YG_NODE_STYLE_PROPERTY_IMPL(type, name, paramName, instanceName)  \
  YG_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
                                                                          \
  type YGNodeStyleGet##name(const YGNodeRef node) {                       \
    return node->style.instanceName;                                      \
  }

#define YG_NODE_STYLE_PROPERTY_UNIT_IMPL(type, name, paramName, instanceName)   \
  YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(float, name, paramName, instanceName) \
                                                                                \
  type YGNodeStyleGet##name(const YGNodeRef node) {                             \
    return node->style.instanceName;                                            \
  }

#define YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(type, name, paramName, instanceName, defaultValue) \
  void YGNodeStyleSet##name(const YGNodeRef node, const YGEdge edge, const float paramName) {    \
    if (node->style.instanceName[edge].value != paramName ||                                     \
        node->style.instanceName[edge].unit != YGUnitPixel) {                                    \
      node->style.instanceName[edge].value = paramName;                                          \
      node->style.instanceName[edge].unit =                                                      \
          YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPixel;                         \
      YGNodeMarkDirtyInternal(node);                                                             \
    }                                                                                            \
  }                                                                                              \
                                                                                                 \
  void YGNodeStyleSet##name##Percent(const YGNodeRef node,                                       \
                                     const YGEdge edge,                                          \
                                     const float paramName) {                                    \
    if (node->style.instanceName[edge].value != paramName ||                                     \
        node->style.instanceName[edge].unit != YGUnitPercent) {                                  \
      node->style.instanceName[edge].value = paramName;                                          \
      node->style.instanceName[edge].unit =                                                      \
          YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPercent;                       \
      YGNodeMarkDirtyInternal(node);                                                             \
    }                                                                                            \
  }                                                                                              \
                                                                                                 \
  type YGNodeStyleGet##name(const YGNodeRef node, const YGEdge edge) {                           \
    return *YGComputedEdgeValue(node->style.instanceName, edge, &defaultValue);                  \
  }

#define YG_NODE_STYLE_EDGE_PROPERTY_IMPL(type, name, paramName, instanceName, defaultValue)   \
  void YGNodeStyleSet##name(const YGNodeRef node, const YGEdge edge, const float paramName) { \
    if (node->style.instanceName[edge].value != paramName ||                                  \
        node->style.instanceName[edge].unit != YGUnitPixel) {                                 \
      node->style.instanceName[edge].value = paramName;                                       \
      node->style.instanceName[edge].unit =                                                   \
          YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPixel;                      \
      YGNodeMarkDirtyInternal(node);                                                          \
    }                                                                                         \
  }                                                                                           \
                                                                                              \
  float YGNodeStyleGet##name(const YGNodeRef node, const YGEdge edge) {                       \
    return YGComputedEdgeValue(node->style.instanceName, edge, &defaultValue)->value;         \
  }

#define YG_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName) \
  type YGNodeLayoutGet##name(const YGNodeRef node) {           \
    return node->layout.instanceName;                          \
  }

#define YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(type, name, instanceName)  \
  type YGNodeLayoutGet##name(const YGNodeRef node, const YGEdge edge) {                    \
    YG_ASSERT(edge <= YGEdgeEnd, "Cannot get layout properties of multi-edge shorthands"); \
                                                                                           \
    if (edge == YGEdgeLeft) {                                                              \
      if (node->layout.direction == YGDirectionRTL) {                                      \
        return node->layout.instanceName[YGEdgeEnd];                                       \
      } else {                                                                             \
        return node->layout.instanceName[YGEdgeStart];                                     \
      }                                                                                    \
    }                                                                                      \
                                                                                           \
    if (edge == YGEdgeRight) {                                                             \
      if (node->layout.direction == YGDirectionRTL) {                                      \
        return node->layout.instanceName[YGEdgeStart];                                     \
      } else {                                                                             \
        return node->layout.instanceName[YGEdgeEnd];                                       \
      }                                                                                    \
    }                                                                                      \
                                                                                           \
    return node->layout.instanceName[edge];                                                \
  }

YG_NODE_PROPERTY_IMPL(void *, Context, context, context);
YG_NODE_PROPERTY_IMPL(YGPrintFunc, PrintFunc, printFunc, print);
YG_NODE_PROPERTY_IMPL(bool, HasNewLayout, hasNewLayout, hasNewLayout);

YG_NODE_STYLE_PROPERTY_IMPL(YGDirection, Direction, direction, direction);
YG_NODE_STYLE_PROPERTY_IMPL(YGFlexDirection, FlexDirection, flexDirection, flexDirection);
YG_NODE_STYLE_PROPERTY_IMPL(YGJustify, JustifyContent, justifyContent, justifyContent);
YG_NODE_STYLE_PROPERTY_IMPL(YGAlign, AlignContent, alignContent, alignContent);
YG_NODE_STYLE_PROPERTY_IMPL(YGAlign, AlignItems, alignItems, alignItems);
YG_NODE_STYLE_PROPERTY_IMPL(YGAlign, AlignSelf, alignSelf, alignSelf);
YG_NODE_STYLE_PROPERTY_IMPL(YGPositionType, PositionType, positionType, positionType);
YG_NODE_STYLE_PROPERTY_IMPL(YGWrap, FlexWrap, flexWrap, flexWrap);
YG_NODE_STYLE_PROPERTY_IMPL(YGOverflow, Overflow, overflow, overflow);

YG_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexGrow, flexGrow, flexGrow);
YG_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexShrink, flexShrink, flexShrink);
YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(float, FlexBasis, flexBasis, flexBasis);

YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(YGValue, Position, position, position, YGValueUndefined);
YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(YGValue, Margin, margin, margin, YGValueZero);
YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(YGValue, Padding, padding, padding, YGValueZero);
YG_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Border, border, border, YGValueZero);

YG_NODE_STYLE_PROPERTY_UNIT_IMPL(YGValue, Width, width, dimensions[YGDimensionWidth]);
YG_NODE_STYLE_PROPERTY_UNIT_IMPL(YGValue, Height, height, dimensions[YGDimensionHeight]);
YG_NODE_STYLE_PROPERTY_UNIT_IMPL(YGValue, MinWidth, minWidth, minDimensions[YGDimensionWidth]);
YG_NODE_STYLE_PROPERTY_UNIT_IMPL(YGValue, MinHeight, minHeight, minDimensions[YGDimensionHeight]);
YG_NODE_STYLE_PROPERTY_UNIT_IMPL(YGValue, MaxWidth, maxWidth, maxDimensions[YGDimensionWidth]);
YG_NODE_STYLE_PROPERTY_UNIT_IMPL(YGValue, MaxHeight, maxHeight, maxDimensions[YGDimensionHeight]);

// Yoga specific properties, not compatible with flexbox specification
YG_NODE_STYLE_PROPERTY_IMPL(float, AspectRatio, aspectRatio, aspectRatio);

YG_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[YGEdgeLeft]);
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[YGEdgeTop]);
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[YGEdgeRight]);
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[YGEdgeBottom]);
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[YGDimensionWidth]);
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[YGDimensionHeight]);
YG_NODE_LAYOUT_PROPERTY_IMPL(YGDirection, Direction, direction);

YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Margin, margin);
YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Border, border);
YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Padding, padding);

uint32_t gCurrentGenerationCount = 0;

bool YGLayoutNodeInternal(const YGNodeRef node,
                          const float availableWidth,
                          const float availableHeight,
                          const YGDirection parentDirection,
                          const YGMeasureMode widthMeasureMode,
                          const YGMeasureMode heightMeasureMode,
                          const float parentWidth,
                          const float parentHeight,
                          const bool performLayout,
                          const char *reason);

inline bool YGFloatIsUndefined(const float value) {
  return isnan(value);
}

static inline bool YGValueEqual(const YGValue a, const YGValue b) {
  if (a.unit != b.unit) {
    return false;
  }

  if (a.unit == YGUnitUndefined) {
    return true;
  }

  return fabs(a.value - b.value) < 0.0001f;
}

static inline bool YGFloatsEqual(const float a, const float b) {
  if (YGFloatIsUndefined(a)) {
    return YGFloatIsUndefined(b);
  }
  return fabs(a - b) < 0.0001f;
}

static void YGIndent(const uint32_t n) {
  for (uint32_t i = 0; i < n; i++) {
    YGLog(YGLogLevelDebug, "  ");
  }
}

static void YGPrintNumberIfNotZero(const char *str, const YGValue *const number) {
  if (!YGFloatsEqual(number->value, 0)) {
    YGLog(YGLogLevelDebug,
          "%s: %g%s, ",
          str,
          number->value,
          number->unit == YGUnitPixel ? "px" : "%");
  }
}

static void YGPrintNumberIfNotUndefinedf(const char *str, const float number) {
  if (!YGFloatIsUndefined(number)) {
    YGLog(YGLogLevelDebug, "%s: %g, ", str, number);
  }
}

static void YGPrintNumberIfNotUndefined(const char *str, const YGValue *const number) {
  if (number->unit != YGUnitUndefined) {
    YGLog(YGLogLevelDebug,
          "%s: %g%s, ",
          str,
          number->value,
          number->unit == YGUnitPixel ? "px" : "%");
  }
}

static bool YGFourValuesEqual(const YGValue four[4]) {
  return YGValueEqual(four[0], four[1]) && YGValueEqual(four[0], four[2]) &&
         YGValueEqual(four[0], four[3]);
}

static void YGNodePrintInternal(const YGNodeRef node,
                                const YGPrintOptions options,
                                const uint32_t level) {
  YGIndent(level);
  YGLog(YGLogLevelDebug, "{");

  if (node->print) {
    node->print(node);
  }

  if (options & YGPrintOptionsLayout) {
    YGLog(YGLogLevelDebug, "layout: {");
    YGLog(YGLogLevelDebug, "width: %g, ", node->layout.dimensions[YGDimensionWidth]);
    YGLog(YGLogLevelDebug, "height: %g, ", node->layout.dimensions[YGDimensionHeight]);
    YGLog(YGLogLevelDebug, "top: %g, ", node->layout.position[YGEdgeTop]);
    YGLog(YGLogLevelDebug, "left: %g", node->layout.position[YGEdgeLeft]);
    YGLog(YGLogLevelDebug, "}, ");
  }

  if (options & YGPrintOptionsStyle) {
    if (node->style.flexDirection == YGFlexDirectionColumn) {
      YGLog(YGLogLevelDebug, "flexDirection: 'column', ");
    } else if (node->style.flexDirection == YGFlexDirectionColumnReverse) {
      YGLog(YGLogLevelDebug, "flexDirection: 'column-reverse', ");
    } else if (node->style.flexDirection == YGFlexDirectionRow) {
      YGLog(YGLogLevelDebug, "flexDirection: 'row', ");
    } else if (node->style.flexDirection == YGFlexDirectionRowReverse) {
      YGLog(YGLogLevelDebug, "flexDirection: 'row-reverse', ");
    }

    if (node->style.justifyContent == YGJustifyCenter) {
      YGLog(YGLogLevelDebug, "justifyContent: 'center', ");
    } else if (node->style.justifyContent == YGJustifyFlexEnd) {
      YGLog(YGLogLevelDebug, "justifyContent: 'flex-end', ");
    } else if (node->style.justifyContent == YGJustifySpaceAround) {
      YGLog(YGLogLevelDebug, "justifyContent: 'space-around', ");
    } else if (node->style.justifyContent == YGJustifySpaceBetween) {
      YGLog(YGLogLevelDebug, "justifyContent: 'space-between', ");
    }

    if (node->style.alignItems == YGAlignCenter) {
      YGLog(YGLogLevelDebug, "alignItems: 'center', ");
    } else if (node->style.alignItems == YGAlignFlexEnd) {
      YGLog(YGLogLevelDebug, "alignItems: 'flex-end', ");
    } else if (node->style.alignItems == YGAlignStretch) {
      YGLog(YGLogLevelDebug, "alignItems: 'stretch', ");
    }

    if (node->style.alignContent == YGAlignCenter) {
      YGLog(YGLogLevelDebug, "alignContent: 'center', ");
    } else if (node->style.alignContent == YGAlignFlexEnd) {
      YGLog(YGLogLevelDebug, "alignContent: 'flex-end', ");
    } else if (node->style.alignContent == YGAlignStretch) {
      YGLog(YGLogLevelDebug, "alignContent: 'stretch', ");
    }

    if (node->style.alignSelf == YGAlignFlexStart) {
      YGLog(YGLogLevelDebug, "alignSelf: 'flex-start', ");
    } else if (node->style.alignSelf == YGAlignCenter) {
      YGLog(YGLogLevelDebug, "alignSelf: 'center', ");
    } else if (node->style.alignSelf == YGAlignFlexEnd) {
      YGLog(YGLogLevelDebug, "alignSelf: 'flex-end', ");
    } else if (node->style.alignSelf == YGAlignStretch) {
      YGLog(YGLogLevelDebug, "alignSelf: 'stretch', ");
    }

    YGPrintNumberIfNotUndefinedf("flexGrow", YGNodeStyleGetFlexGrow(node));
    YGPrintNumberIfNotUndefinedf("flexShrink", YGNodeStyleGetFlexShrink(node));
    YGPrintNumberIfNotUndefined("flexBasis", YGNodeStyleGetFlexBasisPtr(node));

    if (node->style.overflow == YGOverflowHidden) {
      YGLog(YGLogLevelDebug, "overflow: 'hidden', ");
    } else if (node->style.overflow == YGOverflowVisible) {
      YGLog(YGLogLevelDebug, "overflow: 'visible', ");
    } else if (node->style.overflow == YGOverflowScroll) {
      YGLog(YGLogLevelDebug, "overflow: 'scroll', ");
    }

    if (YGFourValuesEqual(node->style.margin)) {
      YGPrintNumberIfNotZero("margin",
                             YGComputedEdgeValue(node->style.margin, YGEdgeLeft, &YGValueZero));
    } else {
      YGPrintNumberIfNotZero("marginLeft",
                             YGComputedEdgeValue(node->style.margin, YGEdgeLeft, &YGValueZero));
      YGPrintNumberIfNotZero("marginRight",
                             YGComputedEdgeValue(node->style.margin, YGEdgeRight, &YGValueZero));
      YGPrintNumberIfNotZero("marginTop",
                             YGComputedEdgeValue(node->style.margin, YGEdgeTop, &YGValueZero));
      YGPrintNumberIfNotZero("marginBottom",
                             YGComputedEdgeValue(node->style.margin, YGEdgeBottom, &YGValueZero));
      YGPrintNumberIfNotZero("marginStart",
                             YGComputedEdgeValue(node->style.margin, YGEdgeStart, &YGValueZero));
      YGPrintNumberIfNotZero("marginEnd",
                             YGComputedEdgeValue(node->style.margin, YGEdgeEnd, &YGValueZero));
    }

    if (YGFourValuesEqual(node->style.padding)) {
      YGPrintNumberIfNotZero("padding",
                             YGComputedEdgeValue(node->style.padding, YGEdgeLeft, &YGValueZero));
    } else {
      YGPrintNumberIfNotZero("paddingLeft",
                             YGComputedEdgeValue(node->style.padding, YGEdgeLeft, &YGValueZero));
      YGPrintNumberIfNotZero("paddingRight",
                             YGComputedEdgeValue(node->style.padding, YGEdgeRight, &YGValueZero));
      YGPrintNumberIfNotZero("paddingTop",
                             YGComputedEdgeValue(node->style.padding, YGEdgeTop, &YGValueZero));
      YGPrintNumberIfNotZero("paddingBottom",
                             YGComputedEdgeValue(node->style.padding, YGEdgeBottom, &YGValueZero));
      YGPrintNumberIfNotZero("paddingStart",
                             YGComputedEdgeValue(node->style.padding, YGEdgeStart, &YGValueZero));
      YGPrintNumberIfNotZero("paddingEnd",
                             YGComputedEdgeValue(node->style.padding, YGEdgeEnd, &YGValueZero));
    }

    if (YGFourValuesEqual(node->style.border)) {
      YGPrintNumberIfNotZero("borderWidth",
                             YGComputedEdgeValue(node->style.border, YGEdgeLeft, &YGValueZero));
    } else {
      YGPrintNumberIfNotZero("borderLeftWidth",
                             YGComputedEdgeValue(node->style.border, YGEdgeLeft, &YGValueZero));
      YGPrintNumberIfNotZero("borderRightWidth",
                             YGComputedEdgeValue(node->style.border, YGEdgeRight, &YGValueZero));
      YGPrintNumberIfNotZero("borderTopWidth",
                             YGComputedEdgeValue(node->style.border, YGEdgeTop, &YGValueZero));
      YGPrintNumberIfNotZero("borderBottomWidth",
                             YGComputedEdgeValue(node->style.border, YGEdgeBottom, &YGValueZero));
      YGPrintNumberIfNotZero("borderStartWidth",
                             YGComputedEdgeValue(node->style.border, YGEdgeStart, &YGValueZero));
      YGPrintNumberIfNotZero("borderEndWidth",
                             YGComputedEdgeValue(node->style.border, YGEdgeEnd, &YGValueZero));
    }

    YGPrintNumberIfNotUndefined("width", &node->style.dimensions[YGDimensionWidth]);
    YGPrintNumberIfNotUndefined("height", &node->style.dimensions[YGDimensionHeight]);
    YGPrintNumberIfNotUndefined("maxWidth", &node->style.maxDimensions[YGDimensionWidth]);
    YGPrintNumberIfNotUndefined("maxHeight", &node->style.maxDimensions[YGDimensionHeight]);
    YGPrintNumberIfNotUndefined("minWidth", &node->style.minDimensions[YGDimensionWidth]);
    YGPrintNumberIfNotUndefined("minHeight", &node->style.minDimensions[YGDimensionHeight]);

    if (node->style.positionType == YGPositionTypeAbsolute) {
      YGLog(YGLogLevelDebug, "position: 'absolute', ");
    }

    YGPrintNumberIfNotUndefined(
        "left", YGComputedEdgeValue(node->style.position, YGEdgeLeft, &YGValueUndefined));
    YGPrintNumberIfNotUndefined(
        "right", YGComputedEdgeValue(node->style.position, YGEdgeRight, &YGValueUndefined));
    YGPrintNumberIfNotUndefined(
        "top", YGComputedEdgeValue(node->style.position, YGEdgeTop, &YGValueUndefined));
    YGPrintNumberIfNotUndefined(
        "bottom", YGComputedEdgeValue(node->style.position, YGEdgeBottom, &YGValueUndefined));
  }

  const uint32_t childCount = YGNodeListCount(node->children);
  if (options & YGPrintOptionsChildren && childCount > 0) {
    YGLog(YGLogLevelDebug, "children: [\n");
    for (uint32_t i = 0; i < childCount; i++) {
      YGNodePrintInternal(YGNodeGetChild(node, i), options, level + 1);
    }
    YGIndent(level);
    YGLog(YGLogLevelDebug, "]},\n");
  } else {
    YGLog(YGLogLevelDebug, "},\n");
  }
}

void YGNodePrint(const YGNodeRef node, const YGPrintOptions options) {
  YGNodePrintInternal(node, options, 0);
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

static inline bool YGFlexDirectionIsRow(const YGFlexDirection flexDirection) {
  return flexDirection == YGFlexDirectionRow || flexDirection == YGFlexDirectionRowReverse;
}

static inline bool YGFlexDirectionIsColumn(const YGFlexDirection flexDirection) {
  return flexDirection == YGFlexDirectionColumn || flexDirection == YGFlexDirectionColumnReverse;
}

static inline float YGNodeLeadingMargin(const YGNodeRef node,
                                        const YGFlexDirection axis,
                                        const float widthSize) {
  if (YGFlexDirectionIsRow(axis) && node->style.margin[YGEdgeStart].unit != YGUnitUndefined) {
    return YGValueResolve(&node->style.margin[YGEdgeStart], widthSize);
  }

  return YGValueResolve(YGComputedEdgeValue(node->style.margin, leading[axis], &YGValueZero),
                        widthSize);
}

static float YGNodeTrailingMargin(const YGNodeRef node,
                                  const YGFlexDirection axis,
                                  const float widthSize) {
  if (YGFlexDirectionIsRow(axis) && node->style.margin[YGEdgeEnd].unit != YGUnitUndefined) {
    return YGValueResolve(&node->style.margin[YGEdgeEnd], widthSize);
  }

  return YGValueResolve(YGComputedEdgeValue(node->style.margin, trailing[axis], &YGValueZero),
                        widthSize);
}

static float YGNodeLeadingPadding(const YGNodeRef node,
                                  const YGFlexDirection axis,
                                  const float widthSize) {
  if (YGFlexDirectionIsRow(axis) && node->style.padding[YGEdgeStart].unit != YGUnitUndefined &&
      YGValueResolve(&node->style.padding[YGEdgeStart], widthSize) >= 0.0f) {
    return YGValueResolve(&node->style.padding[YGEdgeStart], widthSize);
  }

  return fmaxf(YGValueResolve(YGComputedEdgeValue(node->style.padding, leading[axis], &YGValueZero),
                              widthSize),
               0.0f);
}

static float YGNodeTrailingPadding(const YGNodeRef node,
                                   const YGFlexDirection axis,
                                   const float widthSize) {
  if (YGFlexDirectionIsRow(axis) && node->style.padding[YGEdgeEnd].unit != YGUnitUndefined &&
      YGValueResolve(&node->style.padding[YGEdgeEnd], widthSize) >= 0.0f) {
    return YGValueResolve(&node->style.padding[YGEdgeEnd], widthSize);
  }

  return fmaxf(YGValueResolve(YGComputedEdgeValue(node->style.padding, trailing[axis], &YGValueZero),
                              widthSize),
               0.0f);
}

static float YGNodeLeadingBorder(const YGNodeRef node, const YGFlexDirection axis) {
  if (YGFlexDirectionIsRow(axis) && node->style.border[YGEdgeStart].unit != YGUnitUndefined &&
      node->style.border[YGEdgeStart].value >= 0.0f) {
    return node->style.border[YGEdgeStart].value;
  }

  return fmaxf(YGComputedEdgeValue(node->style.border, leading[axis], &YGValueZero)->value, 0.0f);
}

static float YGNodeTrailingBorder(const YGNodeRef node, const YGFlexDirection axis) {
  if (YGFlexDirectionIsRow(axis) && node->style.border[YGEdgeEnd].unit != YGUnitUndefined &&
      node->style.border[YGEdgeEnd].value >= 0.0f) {
    return node->style.border[YGEdgeEnd].value;
  }

  return fmaxf(YGComputedEdgeValue(node->style.border, trailing[axis], &YGValueZero)->value, 0.0f);
}

static inline float YGNodeLeadingPaddingAndBorder(const YGNodeRef node,
                                                  const YGFlexDirection axis,
                                                  const float widthSize) {
  return YGNodeLeadingPadding(node, axis, widthSize) + YGNodeLeadingBorder(node, axis);
}

static inline float YGNodeTrailingPaddingAndBorder(const YGNodeRef node,
                                                   const YGFlexDirection axis,
                                                   const float widthSize) {
  return YGNodeTrailingPadding(node, axis, widthSize) + YGNodeTrailingBorder(node, axis);
}

static inline float YGNodeMarginForAxis(const YGNodeRef node,
                                        const YGFlexDirection axis,
                                        const float widthSize) {
  return YGNodeLeadingMargin(node, axis, widthSize) + YGNodeTrailingMargin(node, axis, widthSize);
}

static inline float YGNodePaddingAndBorderForAxis(const YGNodeRef node,
                                                  const YGFlexDirection axis,
                                                  const float widthSize) {
  return YGNodeLeadingPaddingAndBorder(node, axis, widthSize) +
         YGNodeTrailingPaddingAndBorder(node, axis, widthSize);
}

static inline YGAlign YGNodeAlignItem(const YGNodeRef node, const YGNodeRef child) {
  const YGAlign align =
      child->style.alignSelf == YGAlignAuto ? node->style.alignItems : child->style.alignSelf;
  if (align == YGAlignBaseline && YGFlexDirectionIsColumn(node->style.flexDirection)) {
    return YGAlignFlexStart;
  }
  return align;
}

static inline YGDirection YGNodeResolveDirection(const YGNodeRef node,
                                                 const YGDirection parentDirection) {
  if (node->style.direction == YGDirectionInherit) {
    return parentDirection > YGDirectionInherit ? parentDirection : YGDirectionLTR;
  } else {
    return node->style.direction;
  }
}

static float YGBaseline(const YGNodeRef node) {
  if (node->baseline != NULL) {
    const float baseline = node->baseline(node,
                                          node->layout.measuredDimensions[YGDimensionWidth],
                                          node->layout.measuredDimensions[YGDimensionHeight]);
    YG_ASSERT(!YGFloatIsUndefined(baseline), "Expect custom baseline function to not return NaN")
    return baseline;
  }

  YGNodeRef baselineChild = NULL;
  for (uint32_t i = 0; i < YGNodeGetChildCount(node); i++) {
    const YGNodeRef child = YGNodeGetChild(node, i);
    if (child->lineIndex > 0) {
      break;
    }
    if (child->style.positionType == YGPositionTypeAbsolute) {
      continue;
    }
    if (YGNodeAlignItem(node, child) == YGAlignBaseline) {
      baselineChild = child;
      break;
    }

    if (baselineChild == NULL) {
      baselineChild = child;
    }
  }

  if (baselineChild == NULL) {
    return node->layout.measuredDimensions[YGDimensionHeight];
  }

  const float baseline = YGBaseline(baselineChild);
  return baseline + baselineChild->layout.position[YGEdgeTop];
}

static inline YGFlexDirection YGFlexDirectionResolve(const YGFlexDirection flexDirection,
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

static YGFlexDirection YGFlexDirectionCross(const YGFlexDirection flexDirection,
                                            const YGDirection direction) {
  return YGFlexDirectionIsColumn(flexDirection)
             ? YGFlexDirectionResolve(YGFlexDirectionRow, direction)
             : YGFlexDirectionColumn;
}

static inline bool YGNodeIsFlex(const YGNodeRef node) {
  return (node->style.positionType == YGPositionTypeRelative &&
          (YGNodeStyleGetFlexGrow(node) != 0 || YGNodeStyleGetFlexShrink(node) != 0));
}

static bool YGIsBaselineLayout(const YGNodeRef node) {
  if (YGFlexDirectionIsColumn(node->style.flexDirection)) {
    return false;
  }
  if (node->style.alignItems == YGAlignBaseline) {
    return true;
  }
  for (uint32_t i = 0; i < YGNodeGetChildCount(node); i++) {
    const YGNodeRef child = YGNodeGetChild(node, i);
    if (child->style.positionType == YGPositionTypeRelative &&
        child->style.alignSelf == YGAlignBaseline) {
      return true;
    }
  }

  return false;
}

static inline float YGNodeDimWithMargin(const YGNodeRef node,
                                        const YGFlexDirection axis,
                                        const float widthSize) {
  return node->layout.measuredDimensions[dim[axis]] + YGNodeLeadingMargin(node, axis, widthSize) +
         YGNodeTrailingMargin(node, axis, widthSize);
}

static inline bool YGNodeIsStyleDimDefined(const YGNodeRef node, const YGFlexDirection axis) {
  return node->style.dimensions[dim[axis]].unit != YGUnitUndefined &&
         node->style.dimensions[dim[axis]].value >= 0.0f;
}

static inline bool YGNodeIsLayoutDimDefined(const YGNodeRef node, const YGFlexDirection axis) {
  const float value = node->layout.measuredDimensions[dim[axis]];
  return !YGFloatIsUndefined(value) && value >= 0.0f;
}

static inline bool YGNodeIsLeadingPosDefined(const YGNodeRef node, const YGFlexDirection axis) {
  return (YGFlexDirectionIsRow(axis) &&
          YGComputedEdgeValue(node->style.position, YGEdgeStart, &YGValueUndefined)->unit !=
              YGUnitUndefined) ||
         YGComputedEdgeValue(node->style.position, leading[axis], &YGValueUndefined)->unit !=
             YGUnitUndefined;
}

static inline bool YGNodeIsTrailingPosDefined(const YGNodeRef node, const YGFlexDirection axis) {
  return (YGFlexDirectionIsRow(axis) &&
          YGComputedEdgeValue(node->style.position, YGEdgeEnd, &YGValueUndefined)->unit !=
              YGUnitUndefined) ||
         YGComputedEdgeValue(node->style.position, trailing[axis], &YGValueUndefined)->unit !=
             YGUnitUndefined;
}

static float YGNodeLeadingPosition(const YGNodeRef node,
                                   const YGFlexDirection axis,
                                   const float axisSize) {
  if (YGFlexDirectionIsRow(axis)) {
    const YGValue *leadingPosition =
        YGComputedEdgeValue(node->style.position, YGEdgeStart, &YGValueUndefined);
    if (leadingPosition->unit != YGUnitUndefined) {
      return YGValueResolve(leadingPosition, axisSize);
    }
  }

  const YGValue *leadingPosition =
      YGComputedEdgeValue(node->style.position, leading[axis], &YGValueUndefined);

  return leadingPosition->unit == YGUnitUndefined ? 0.0f
                                                  : YGValueResolve(leadingPosition, axisSize);
}

static float YGNodeTrailingPosition(const YGNodeRef node,
                                    const YGFlexDirection axis,
                                    const float axisSize) {
  if (YGFlexDirectionIsRow(axis)) {
    const YGValue *trailingPosition =
        YGComputedEdgeValue(node->style.position, YGEdgeEnd, &YGValueUndefined);
    if (trailingPosition->unit != YGUnitUndefined) {
      return YGValueResolve(trailingPosition, axisSize);
    }
  }

  const YGValue *trailingPosition =
      YGComputedEdgeValue(node->style.position, trailing[axis], &YGValueUndefined);

  return trailingPosition->unit == YGUnitUndefined ? 0.0f
                                                   : YGValueResolve(trailingPosition, axisSize);
}

static float YGNodeBoundAxisWithinMinAndMax(const YGNodeRef node,
                                            const YGFlexDirection axis,
                                            const float value,
                                            const float axisSize) {
  float min = YGUndefined;
  float max = YGUndefined;

  if (YGFlexDirectionIsColumn(axis)) {
    min = YGValueResolve(&node->style.minDimensions[YGDimensionHeight], axisSize);
    max = YGValueResolve(&node->style.maxDimensions[YGDimensionHeight], axisSize);
  } else if (YGFlexDirectionIsRow(axis)) {
    min = YGValueResolve(&node->style.minDimensions[YGDimensionWidth], axisSize);
    max = YGValueResolve(&node->style.maxDimensions[YGDimensionWidth], axisSize);
  }

  float boundValue = value;

  if (!YGFloatIsUndefined(max) && max >= 0.0f && boundValue > max) {
    boundValue = max;
  }

  if (!YGFloatIsUndefined(min) && min >= 0.0f && boundValue < min) {
    boundValue = min;
  }

  return boundValue;
}

// Like YGNodeBoundAxisWithinMinAndMax but also ensures that the value doesn't go
// below the
// padding and border amount.
static inline float YGNodeBoundAxis(const YGNodeRef node,
                                    const YGFlexDirection axis,
                                    const float value,
                                    const float axisSize,
                                    const float widthSize) {
  return fmaxf(YGNodeBoundAxisWithinMinAndMax(node, axis, value, axisSize),
               YGNodePaddingAndBorderForAxis(node, axis, widthSize));
}

static void YGNodeSetChildTrailingPosition(const YGNodeRef node,
                                           const YGNodeRef child,
                                           const YGFlexDirection axis) {
  const float size = child->layout.measuredDimensions[dim[axis]];
  child->layout.position[trailing[axis]] =
      node->layout.measuredDimensions[dim[axis]] - size - child->layout.position[pos[axis]];
}

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
static float YGNodeRelativePosition(const YGNodeRef node,
                                    const YGFlexDirection axis,
                                    const float axisSize) {
  return YGNodeIsLeadingPosDefined(node, axis) ? YGNodeLeadingPosition(node, axis, axisSize)
                                               : -YGNodeTrailingPosition(node, axis, axisSize);
}

static void YGConstrainMaxSizeForMode(const float maxSize, YGMeasureMode *mode, float *size) {
  switch (*mode) {
    case YGMeasureModeExactly:
    case YGMeasureModeAtMost:
      *size = (YGFloatIsUndefined(maxSize) || *size < maxSize) ? *size : maxSize;
      break;
    case YGMeasureModeUndefined:
      if (!YGFloatIsUndefined(maxSize)) {
        *mode = YGMeasureModeAtMost;
        *size = maxSize;
      }
      break;
  }
}

static void YGNodeSetPosition(const YGNodeRef node,
                              const YGDirection direction,
                              const float mainSize,
                              const float crossSize,
                              const float parentWidth) {
  const YGFlexDirection mainAxis = YGFlexDirectionResolve(node->style.flexDirection, direction);
  const YGFlexDirection crossAxis = YGFlexDirectionCross(mainAxis, direction);
  const float relativePositionMain = YGNodeRelativePosition(node, mainAxis, mainSize);
  const float relativePositionCross = YGNodeRelativePosition(node, crossAxis, crossSize);

  node->layout.position[leading[mainAxis]] =
      YGNodeLeadingMargin(node, mainAxis, parentWidth) + relativePositionMain;
  node->layout.position[trailing[mainAxis]] =
      YGNodeTrailingMargin(node, mainAxis, parentWidth) + relativePositionMain;
  node->layout.position[leading[crossAxis]] =
      YGNodeLeadingMargin(node, crossAxis, parentWidth) + relativePositionCross;
  node->layout.position[trailing[crossAxis]] =
      YGNodeTrailingMargin(node, crossAxis, parentWidth) + relativePositionCross;
}

static void YGNodeComputeFlexBasisForChild(const YGNodeRef node,
                                           const YGNodeRef child,
                                           const float width,
                                           const YGMeasureMode widthMode,
                                           const float height,
                                           const float parentWidth,
                                           const float parentHeight,
                                           const YGMeasureMode heightMode,
                                           const YGDirection direction) {
  const YGFlexDirection mainAxis = YGFlexDirectionResolve(node->style.flexDirection, direction);
  const bool isMainAxisRow = YGFlexDirectionIsRow(mainAxis);
  const float mainAxisSize = isMainAxisRow ? width : height;
  const float mainAxisParentSize = isMainAxisRow ? parentWidth : parentHeight;

  float childWidth;
  float childHeight;
  YGMeasureMode childWidthMeasureMode;
  YGMeasureMode childHeightMeasureMode;

  const bool isRowStyleDimDefined = YGNodeIsStyleDimDefined(child, YGFlexDirectionRow);
  const bool isColumnStyleDimDefined = YGNodeIsStyleDimDefined(child, YGFlexDirectionColumn);

  if (YGNodeStyleGetFlexBasisPtr(child)->unit != YGUnitUndefined &&
      !YGFloatIsUndefined(mainAxisSize)) {
    if (YGFloatIsUndefined(child->layout.computedFlexBasis) ||
        (YGIsExperimentalFeatureEnabled(YGExperimentalFeatureWebFlexBasis) &&
         child->layout.computedFlexBasisGeneration != gCurrentGenerationCount)) {
      child->layout.computedFlexBasis =
          fmaxf(YGValueResolve(YGNodeStyleGetFlexBasisPtr(child), mainAxisParentSize),
                YGNodePaddingAndBorderForAxis(child, mainAxis, parentWidth));
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    child->layout.computedFlexBasis =
        fmaxf(YGValueResolve(&child->style.dimensions[YGDimensionWidth], parentWidth),
              YGNodePaddingAndBorderForAxis(child, YGFlexDirectionRow, parentWidth));
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    child->layout.computedFlexBasis =
        fmaxf(YGValueResolve(&child->style.dimensions[YGDimensionHeight], parentHeight),
              YGNodePaddingAndBorderForAxis(child, YGFlexDirectionColumn, parentWidth));
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped
    // flex basis).
    childWidth = YGUndefined;
    childHeight = YGUndefined;
    childWidthMeasureMode = YGMeasureModeUndefined;
    childHeightMeasureMode = YGMeasureModeUndefined;

    if (isRowStyleDimDefined) {
      childWidth = YGValueResolve(&child->style.dimensions[YGDimensionWidth], parentWidth) +
                   YGNodeMarginForAxis(child, YGFlexDirectionRow, parentWidth);
      childWidthMeasureMode = YGMeasureModeExactly;
    }
    if (isColumnStyleDimDefined) {
      childHeight = YGValueResolve(&child->style.dimensions[YGDimensionHeight], parentHeight) +
                    YGNodeMarginForAxis(child, YGFlexDirectionColumn, parentWidth);
      childHeightMeasureMode = YGMeasureModeExactly;
    }

    // The W3C spec doesn't say anything about the 'overflow' property,
    // but all major browsers appear to implement the following logic.
    if ((!isMainAxisRow && node->style.overflow == YGOverflowScroll) ||
        node->style.overflow != YGOverflowScroll) {
      if (YGFloatIsUndefined(childWidth) && !YGFloatIsUndefined(width)) {
        childWidth = width;
        childWidthMeasureMode = YGMeasureModeAtMost;
      }
    }

    if ((isMainAxisRow && node->style.overflow == YGOverflowScroll) ||
        node->style.overflow != YGOverflowScroll) {
      if (YGFloatIsUndefined(childHeight) && !YGFloatIsUndefined(height)) {
        childHeight = height;
        childHeightMeasureMode = YGMeasureModeAtMost;
      }
    }

    // If child has no defined size in the cross axis and is set to stretch,
    // set the cross
    // axis to be measured exactly with the available inner width
    if (!isMainAxisRow && !YGFloatIsUndefined(width) && !isRowStyleDimDefined &&
        widthMode == YGMeasureModeExactly && YGNodeAlignItem(node, child) == YGAlignStretch) {
      childWidth = width;
      childWidthMeasureMode = YGMeasureModeExactly;
    }
    if (isMainAxisRow && !YGFloatIsUndefined(height) && !isColumnStyleDimDefined &&
        heightMode == YGMeasureModeExactly && YGNodeAlignItem(node, child) == YGAlignStretch) {
      childHeight = height;
      childHeightMeasureMode = YGMeasureModeExactly;
    }

    if (!YGFloatIsUndefined(child->style.aspectRatio)) {
      if (!isMainAxisRow && childWidthMeasureMode == YGMeasureModeExactly) {
        child->layout.computedFlexBasis =
            fmaxf(childWidth / child->style.aspectRatio,
                  YGNodePaddingAndBorderForAxis(child, YGFlexDirectionColumn, parentWidth));
        return;
      } else if (isMainAxisRow && childHeightMeasureMode == YGMeasureModeExactly) {
        child->layout.computedFlexBasis =
            fmaxf(childHeight * child->style.aspectRatio,
                  YGNodePaddingAndBorderForAxis(child, YGFlexDirectionRow, parentWidth));
        return;
      }
    }

    YGConstrainMaxSizeForMode(YGValueResolve(&child->style.maxDimensions[YGDimensionWidth],
                                             parentWidth),
                              &childWidthMeasureMode,
                              &childWidth);
    YGConstrainMaxSizeForMode(YGValueResolve(&child->style.maxDimensions[YGDimensionHeight],
                                             parentHeight),
                              &childHeightMeasureMode,
                              &childHeight);

    // Measure the child
    YGLayoutNodeInternal(child,
                         childWidth,
                         childHeight,
                         direction,
                         childWidthMeasureMode,
                         childHeightMeasureMode,
                         parentWidth,
                         parentHeight,
                         false,
                         "measure");

    child->layout.computedFlexBasis =
        fmaxf(isMainAxisRow ? child->layout.measuredDimensions[YGDimensionWidth]
                            : child->layout.measuredDimensions[YGDimensionHeight],
              YGNodePaddingAndBorderForAxis(child, mainAxis, parentWidth));
  }

  child->layout.computedFlexBasisGeneration = gCurrentGenerationCount;
}

static void YGNodeAbsoluteLayoutChild(const YGNodeRef node,
                                      const YGNodeRef child,
                                      const float width,
                                      const YGMeasureMode widthMode,
                                      const float height,
                                      const YGDirection direction) {
  const YGFlexDirection mainAxis = YGFlexDirectionResolve(node->style.flexDirection, direction);
  const YGFlexDirection crossAxis = YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = YGFlexDirectionIsRow(mainAxis);

  float childWidth = YGUndefined;
  float childHeight = YGUndefined;
  YGMeasureMode childWidthMeasureMode = YGMeasureModeUndefined;
  YGMeasureMode childHeightMeasureMode = YGMeasureModeUndefined;

  if (YGNodeIsStyleDimDefined(child, YGFlexDirectionRow)) {
    childWidth = YGValueResolve(&child->style.dimensions[YGDimensionWidth], width) +
                 YGNodeMarginForAxis(child, YGFlexDirectionRow, width);
  } else {
    // If the child doesn't have a specified width, compute the width based
    // on the left/right
    // offsets if they're defined.
    if (YGNodeIsLeadingPosDefined(child, YGFlexDirectionRow) &&
        YGNodeIsTrailingPosDefined(child, YGFlexDirectionRow)) {
      childWidth = node->layout.measuredDimensions[YGDimensionWidth] -
                   (YGNodeLeadingBorder(node, YGFlexDirectionRow) +
                    YGNodeTrailingBorder(node, YGFlexDirectionRow)) -
                   (YGNodeLeadingPosition(child, YGFlexDirectionRow, width) +
                    YGNodeTrailingPosition(child, YGFlexDirectionRow, width));
      childWidth = YGNodeBoundAxis(child, YGFlexDirectionRow, childWidth, width, width);
    }
  }

  if (YGNodeIsStyleDimDefined(child, YGFlexDirectionColumn)) {
    childHeight = YGValueResolve(&child->style.dimensions[YGDimensionHeight], height) +
                  YGNodeMarginForAxis(child, YGFlexDirectionColumn, width);
  } else {
    // If the child doesn't have a specified height, compute the height
    // based on the top/bottom
    // offsets if they're defined.
    if (YGNodeIsLeadingPosDefined(child, YGFlexDirectionColumn) &&
        YGNodeIsTrailingPosDefined(child, YGFlexDirectionColumn)) {
      childHeight = node->layout.measuredDimensions[YGDimensionHeight] -
                    (YGNodeLeadingBorder(node, YGFlexDirectionColumn) +
                     YGNodeTrailingBorder(node, YGFlexDirectionColumn)) -
                    (YGNodeLeadingPosition(child, YGFlexDirectionColumn, height) +
                     YGNodeTrailingPosition(child, YGFlexDirectionColumn, height));
      childHeight = YGNodeBoundAxis(child, YGFlexDirectionColumn, childHeight, height, width);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect ratio
  // calculation. One dimension being the anchor and the other being flexible.
  if (YGFloatIsUndefined(childWidth) ^ YGFloatIsUndefined(childHeight)) {
    if (!YGFloatIsUndefined(child->style.aspectRatio)) {
      if (YGFloatIsUndefined(childWidth)) {
        childWidth = fmaxf(childHeight * child->style.aspectRatio,
                           YGNodePaddingAndBorderForAxis(child, YGFlexDirectionColumn, width));
      } else if (YGFloatIsUndefined(childHeight)) {
        childHeight = fmaxf(childWidth / child->style.aspectRatio,
                            YGNodePaddingAndBorderForAxis(child, YGFlexDirectionRow, width));
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (YGFloatIsUndefined(childWidth) || YGFloatIsUndefined(childHeight)) {
    childWidthMeasureMode =
        YGFloatIsUndefined(childWidth) ? YGMeasureModeUndefined : YGMeasureModeExactly;
    childHeightMeasureMode =
        YGFloatIsUndefined(childHeight) ? YGMeasureModeUndefined : YGMeasureModeExactly;

    // If the size of the parent is defined then try to constrain the absolute child to that size
    // as well. This allows text within the absolute child to wrap to the size of its parent.
    // This is the same behavior as many browsers implement.
    if (!isMainAxisRow && YGFloatIsUndefined(childWidth) && widthMode != YGMeasureModeUndefined && width > 0) {
      childWidth = width;
      childWidthMeasureMode = YGMeasureModeAtMost;
    }

    YGLayoutNodeInternal(child,
                         childWidth,
                         childHeight,
                         direction,
                         childWidthMeasureMode,
                         childHeightMeasureMode,
                         childWidth,
                         childHeight,
                         false,
                         "abs-measure");
    childWidth = child->layout.measuredDimensions[YGDimensionWidth] +
                 YGNodeMarginForAxis(child, YGFlexDirectionRow, width);
    childHeight = child->layout.measuredDimensions[YGDimensionHeight] +
                  YGNodeMarginForAxis(child, YGFlexDirectionColumn, width);
  }

  YGLayoutNodeInternal(child,
                       childWidth,
                       childHeight,
                       direction,
                       YGMeasureModeExactly,
                       YGMeasureModeExactly,
                       childWidth,
                       childHeight,
                       true,
                       "abs-layout");

  if (YGNodeIsTrailingPosDefined(child, mainAxis) && !YGNodeIsLeadingPosDefined(child, mainAxis)) {
    child->layout.position[leading[mainAxis]] = node->layout.measuredDimensions[dim[mainAxis]] -
                                                child->layout.measuredDimensions[dim[mainAxis]] -
                                                YGNodeTrailingBorder(node, mainAxis) -
                                                YGNodeTrailingPosition(child, mainAxis, width);
  } else if (!YGNodeIsLeadingPosDefined(child, mainAxis) && 
      node->style.justifyContent == YGJustifyCenter) {
    child->layout.position[leading[mainAxis]] = (node->layout.measuredDimensions[dim[mainAxis]] -
                                                 child->layout.measuredDimensions[dim[mainAxis]]) / 2.0f;
  } else if (!YGNodeIsLeadingPosDefined(child, mainAxis) && 
      node->style.justifyContent == YGJustifyFlexEnd) {
    child->layout.position[leading[mainAxis]] = (node->layout.measuredDimensions[dim[mainAxis]] -
                                                 child->layout.measuredDimensions[dim[mainAxis]]);
  }

  if (YGNodeIsTrailingPosDefined(child, crossAxis) &&
      !YGNodeIsLeadingPosDefined(child, crossAxis)) {
    child->layout.position[leading[crossAxis]] = node->layout.measuredDimensions[dim[crossAxis]] -
                                                 child->layout.measuredDimensions[dim[crossAxis]] -
                                                 YGNodeTrailingBorder(node, crossAxis) -
                                                 YGNodeTrailingPosition(child, crossAxis, width);
  } else if (!YGNodeIsLeadingPosDefined(child, crossAxis) && 
    YGNodeAlignItem(node, child) == YGAlignCenter) {
    child->layout.position[leading[crossAxis]] = (node->layout.measuredDimensions[dim[crossAxis]] -
                                                  child->layout.measuredDimensions[dim[crossAxis]]) / 2.0f;
  } else if (!YGNodeIsLeadingPosDefined(child, crossAxis) && 
    YGNodeAlignItem(node, child) == YGAlignFlexEnd) {
    child->layout.position[leading[crossAxis]] = (node->layout.measuredDimensions[dim[crossAxis]] -
                                                  child->layout.measuredDimensions[dim[crossAxis]]);
  }
}

static void YGNodeWithMeasureFuncSetMeasuredDimensions(const YGNodeRef node,
                                                       const float availableWidth,
                                                       const float availableHeight,
                                                       const YGMeasureMode widthMeasureMode,
                                                       const YGMeasureMode heightMeasureMode) {
  YG_ASSERT(node->measure, "Expected node to have custom measure function");

  const float paddingAndBorderAxisRow =
      YGNodePaddingAndBorderForAxis(node, YGFlexDirectionRow, availableWidth);
  const float paddingAndBorderAxisColumn =
      YGNodePaddingAndBorderForAxis(node, YGFlexDirectionColumn, availableWidth);
  const float marginAxisRow = YGNodeMarginForAxis(node, YGFlexDirectionRow, availableWidth);
  const float marginAxisColumn = YGNodeMarginForAxis(node, YGFlexDirectionColumn, availableWidth);

  const float innerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  const float innerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;

  if (widthMeasureMode == YGMeasureModeExactly && heightMeasureMode == YGMeasureModeExactly) {
    // Don't bother sizing the text if both dimensions are already defined.
    node->layout.measuredDimensions[YGDimensionWidth] = YGNodeBoundAxis(
        node, YGFlexDirectionRow, availableWidth - marginAxisRow, availableWidth, availableWidth);
    node->layout.measuredDimensions[YGDimensionHeight] =
        YGNodeBoundAxis(node,
                        YGFlexDirectionColumn,
                        availableHeight - marginAxisColumn,
                        availableHeight,
                        availableWidth);
  } else if (innerWidth <= 0.0f || innerHeight <= 0.0f) {
    // Don't bother sizing the text if there's no horizontal or vertical
    // space.
    node->layout.measuredDimensions[YGDimensionWidth] =
        YGNodeBoundAxis(node, YGFlexDirectionRow, 0.0f, availableWidth, availableWidth);
    node->layout.measuredDimensions[YGDimensionHeight] =
        YGNodeBoundAxis(node, YGFlexDirectionColumn, 0.0f, availableHeight, availableWidth);
  } else {
    // Measure the text under the current constraints.
    const YGSize measuredSize =
        node->measure(node, innerWidth, widthMeasureMode, innerHeight, heightMeasureMode);

    node->layout.measuredDimensions[YGDimensionWidth] =
        YGNodeBoundAxis(node,
                        YGFlexDirectionRow,
                        (widthMeasureMode == YGMeasureModeUndefined ||
                         widthMeasureMode == YGMeasureModeAtMost)
                            ? measuredSize.width + paddingAndBorderAxisRow
                            : availableWidth - marginAxisRow,
                        availableWidth,
                        availableWidth);
    node->layout.measuredDimensions[YGDimensionHeight] =
        YGNodeBoundAxis(node,
                        YGFlexDirectionColumn,
                        (heightMeasureMode == YGMeasureModeUndefined ||
                         heightMeasureMode == YGMeasureModeAtMost)
                            ? measuredSize.height + paddingAndBorderAxisColumn
                            : availableHeight - marginAxisColumn,
                        availableHeight,
                        availableWidth);
  }
}

// For nodes with no children, use the available values if they were provided,
// or the minimum size as indicated by the padding and border sizes.
static void YGNodeEmptyContainerSetMeasuredDimensions(const YGNodeRef node,
                                                      const float availableWidth,
                                                      const float availableHeight,
                                                      const YGMeasureMode widthMeasureMode,
                                                      const YGMeasureMode heightMeasureMode,
                                                      const float parentWidth,
                                                      const float parentHeight) {
  const float paddingAndBorderAxisRow =
      YGNodePaddingAndBorderForAxis(node, YGFlexDirectionRow, parentWidth);
  const float paddingAndBorderAxisColumn =
      YGNodePaddingAndBorderForAxis(node, YGFlexDirectionColumn, parentWidth);
  const float marginAxisRow = YGNodeMarginForAxis(node, YGFlexDirectionRow, parentWidth);
  const float marginAxisColumn = YGNodeMarginForAxis(node, YGFlexDirectionColumn, parentWidth);

  node->layout.measuredDimensions[YGDimensionWidth] =
      YGNodeBoundAxis(node,
                      YGFlexDirectionRow,
                      (widthMeasureMode == YGMeasureModeUndefined ||
                       widthMeasureMode == YGMeasureModeAtMost)
                          ? paddingAndBorderAxisRow
                          : availableWidth - marginAxisRow,
                      parentWidth,
                      parentWidth);
  node->layout.measuredDimensions[YGDimensionHeight] =
      YGNodeBoundAxis(node,
                      YGFlexDirectionColumn,
                      (heightMeasureMode == YGMeasureModeUndefined ||
                       heightMeasureMode == YGMeasureModeAtMost)
                          ? paddingAndBorderAxisColumn
                          : availableHeight - marginAxisColumn,
                      parentHeight,
                      parentWidth);
}

static bool YGNodeFixedSizeSetMeasuredDimensions(const YGNodeRef node,
                                                 const float availableWidth,
                                                 const float availableHeight,
                                                 const YGMeasureMode widthMeasureMode,
                                                 const YGMeasureMode heightMeasureMode,
                                                 const float parentWidth,
                                                 const float parentHeight) {
  if ((widthMeasureMode == YGMeasureModeAtMost && availableWidth <= 0.0f) ||
      (heightMeasureMode == YGMeasureModeAtMost && availableHeight <= 0.0f) ||
      (widthMeasureMode == YGMeasureModeExactly && heightMeasureMode == YGMeasureModeExactly)) {
    const float marginAxisColumn = YGNodeMarginForAxis(node, YGFlexDirectionColumn, parentWidth);
    const float marginAxisRow = YGNodeMarginForAxis(node, YGFlexDirectionRow, parentWidth);

    node->layout.measuredDimensions[YGDimensionWidth] =
        YGNodeBoundAxis(node,
                        YGFlexDirectionRow,
                        YGFloatIsUndefined(availableWidth) ||
                                (widthMeasureMode == YGMeasureModeAtMost && availableWidth < 0.0f)
                            ? 0.0f
                            : availableWidth - marginAxisRow,
                        parentWidth,
                        parentWidth);

    node->layout.measuredDimensions[YGDimensionHeight] =
        YGNodeBoundAxis(node,
                        YGFlexDirectionColumn,
                        YGFloatIsUndefined(availableHeight) ||
                                (heightMeasureMode == YGMeasureModeAtMost && availableHeight < 0.0f)
                            ? 0.0f
                            : availableHeight - marginAxisColumn,
                        parentHeight,
                        parentWidth);

    return true;
  }

  return false;
}

//
// This is the main routine that implements a subset of the flexbox layout
// algorithm
// described in the W3C YG documentation: https://www.w3.org/TR/YG3-flexbox/.
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
//    from the spec (https://www.w3.org/TR/YG3-sizing/#terms):
//      - YGMeasureModeUndefined: max content
//      - YGMeasureModeExactly: fill available
//      - YGMeasureModeAtMost: fit content
//
//    When calling YGNodelayoutImpl and YGLayoutNodeInternal, if the caller passes
//    an available size of
//    undefined then it must also pass a measure mode of YGMeasureModeUndefined
//    in that dimension.
//
static void YGNodelayoutImpl(const YGNodeRef node,
                             const float availableWidth,
                             const float availableHeight,
                             const YGDirection parentDirection,
                             const YGMeasureMode widthMeasureMode,
                             const YGMeasureMode heightMeasureMode,
                             const float parentWidth,
                             const float parentHeight,
                             const bool performLayout) {
  YG_ASSERT(YGFloatIsUndefined(availableWidth) ? widthMeasureMode == YGMeasureModeUndefined : true,
            "availableWidth is indefinite so widthMeasureMode must be "
            "YGMeasureModeUndefined");
  YG_ASSERT(YGFloatIsUndefined(availableHeight) ? heightMeasureMode == YGMeasureModeUndefined
                                                : true,
            "availableHeight is indefinite so heightMeasureMode must be "
            "YGMeasureModeUndefined");

  // Set the resolved resolution in the node's layout.
  const YGDirection direction = YGNodeResolveDirection(node, parentDirection);
  node->layout.direction = direction;

  const YGFlexDirection flexRowDirection = YGFlexDirectionResolve(YGFlexDirectionRow, direction);
  const YGFlexDirection flexColumnDirection = YGFlexDirectionResolve(YGFlexDirectionColumn, direction);

  node->layout.margin[YGEdgeStart] =
    YGNodeLeadingMargin(node, flexRowDirection, parentWidth);
  node->layout.margin[YGEdgeEnd] =
    YGNodeTrailingMargin(node, flexRowDirection, parentWidth);
  node->layout.margin[YGEdgeTop] =
    YGNodeLeadingMargin(node, flexColumnDirection, parentWidth);
  node->layout.margin[YGEdgeBottom] =
    YGNodeTrailingMargin(node, flexColumnDirection, parentWidth);

  node->layout.border[YGEdgeStart] =
    YGNodeLeadingBorder(node, flexRowDirection);
  node->layout.border[YGEdgeEnd] =
    YGNodeTrailingBorder(node, flexRowDirection);
  node->layout.border[YGEdgeTop] =
    YGNodeLeadingBorder(node, flexColumnDirection);
  node->layout.border[YGEdgeBottom] =
    YGNodeTrailingBorder(node, flexColumnDirection);

  node->layout.padding[YGEdgeStart] =
    YGNodeLeadingPadding(node, flexRowDirection, parentWidth);
  node->layout.padding[YGEdgeEnd] =
    YGNodeTrailingPadding(node, flexRowDirection, parentWidth);
  node->layout.padding[YGEdgeTop] =
    YGNodeLeadingPadding(node, flexColumnDirection, parentWidth);
  node->layout.padding[YGEdgeBottom] =
    YGNodeTrailingPadding(node, flexColumnDirection, parentWidth);

  if (node->measure) {
    YGNodeWithMeasureFuncSetMeasuredDimensions(
        node, availableWidth, availableHeight, widthMeasureMode, heightMeasureMode);
    return;
  }

  const uint32_t childCount = YGNodeListCount(node->children);
  if (childCount == 0) {
    YGNodeEmptyContainerSetMeasuredDimensions(node,
                                              availableWidth,
                                              availableHeight,
                                              widthMeasureMode,
                                              heightMeasureMode,
                                              parentWidth,
                                              parentHeight);
    return;
  }

  // If we're not being asked to perform a full layout we can skip the algorithm if we already know
  // the size
  if (!performLayout && YGNodeFixedSizeSetMeasuredDimensions(node,
                                                             availableWidth,
                                                             availableHeight,
                                                             widthMeasureMode,
                                                             heightMeasureMode,
                                                             parentWidth,
                                                             parentHeight)) {
    return;
  }

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const YGFlexDirection mainAxis = YGFlexDirectionResolve(node->style.flexDirection, direction);
  const YGFlexDirection crossAxis = YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = YGFlexDirectionIsRow(mainAxis);
  const YGJustify justifyContent = node->style.justifyContent;
  const bool isNodeFlexWrap = node->style.flexWrap == YGWrapWrap;

  const float mainAxisParentSize = isMainAxisRow ? parentWidth : parentHeight;
  const float crossAxisParentSize = isMainAxisRow ? parentHeight : parentWidth;

  YGNodeRef firstAbsoluteChild = NULL;
  YGNodeRef currentAbsoluteChild = NULL;

  const float leadingPaddingAndBorderMain =
      YGNodeLeadingPaddingAndBorder(node, mainAxis, parentWidth);
  const float trailingPaddingAndBorderMain =
      YGNodeTrailingPaddingAndBorder(node, mainAxis, parentWidth);
  const float leadingPaddingAndBorderCross =
      YGNodeLeadingPaddingAndBorder(node, crossAxis, parentWidth);
  const float paddingAndBorderAxisMain = YGNodePaddingAndBorderForAxis(node, mainAxis, parentWidth);
  const float paddingAndBorderAxisCross =
      YGNodePaddingAndBorderForAxis(node, crossAxis, parentWidth);

  const YGMeasureMode measureModeMainDim = isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  const YGMeasureMode measureModeCrossDim = isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  const float paddingAndBorderAxisRow =
      isMainAxisRow ? paddingAndBorderAxisMain : paddingAndBorderAxisCross;
  const float paddingAndBorderAxisColumn =
      isMainAxisRow ? paddingAndBorderAxisCross : paddingAndBorderAxisMain;

  const float marginAxisRow = YGNodeMarginForAxis(node, YGFlexDirectionRow, parentWidth);
  const float marginAxisColumn = YGNodeMarginForAxis(node, YGFlexDirectionColumn, parentWidth);

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS
  const float minInnerWidth =
      YGValueResolve(&node->style.minDimensions[YGDimensionWidth], parentWidth) - marginAxisRow -
      paddingAndBorderAxisRow;
  const float maxInnerWidth =
      YGValueResolve(&node->style.maxDimensions[YGDimensionWidth], parentWidth) - marginAxisRow -
      paddingAndBorderAxisRow;
  const float minInnerHeight =
      YGValueResolve(&node->style.minDimensions[YGDimensionHeight], parentHeight) -
      marginAxisColumn - paddingAndBorderAxisColumn;
  const float maxInnerHeight =
      YGValueResolve(&node->style.maxDimensions[YGDimensionHeight], parentHeight) -
      marginAxisColumn - paddingAndBorderAxisColumn;
  const float minInnerMainDim = isMainAxisRow ? minInnerWidth : minInnerHeight;
  const float maxInnerMainDim = isMainAxisRow ? maxInnerWidth : maxInnerHeight;

  // Max dimension overrides predefined dimension value; Min dimension in turn overrides both of the
  // above
  float availableInnerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  if (!YGFloatIsUndefined(availableInnerWidth)) {
    availableInnerWidth = fmaxf(fminf(availableInnerWidth, maxInnerWidth), minInnerWidth);
  }

  float availableInnerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;
  if (!YGFloatIsUndefined(availableInnerHeight)) {
    availableInnerHeight = fmaxf(fminf(availableInnerHeight, maxInnerHeight), minInnerHeight);
  }

  float availableInnerMainDim = isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  const float availableInnerCrossDim = isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  // If there is only one child with flexGrow + flexShrink it means we can set the
  // computedFlexBasis to 0 instead of measuring and shrinking / flexing the child to exactly
  // match the remaining space
  YGNodeRef singleFlexChild = NULL;
  if ((isMainAxisRow && widthMeasureMode == YGMeasureModeExactly) ||
      (!isMainAxisRow && heightMeasureMode == YGMeasureModeExactly)) {
    for (uint32_t i = 0; i < childCount; i++) {
      const YGNodeRef child = YGNodeGetChild(node, i);
      if (singleFlexChild) {
        if (YGNodeIsFlex(child)) {
          // There is already a flexible child, abort.
          singleFlexChild = NULL;
          break;
        }
      } else if (YGNodeStyleGetFlexGrow(child) > 0.0f && YGNodeStyleGetFlexShrink(child) > 0.0f) {
        singleFlexChild = child;
      }
    }
  }

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM
  for (uint32_t i = 0; i < childCount; i++) {
    const YGNodeRef child = YGNodeListGet(node->children, i);

    if (performLayout) {
      // Set the initial position (relative to the parent).
      const YGDirection childDirection = YGNodeResolveDirection(child, direction);
      YGNodeSetPosition(child,
                        childDirection,
                        availableInnerMainDim,
                        availableInnerCrossDim,
                        availableInnerWidth);
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
        YGNodeComputeFlexBasisForChild(node,
                                       child,
                                       availableInnerWidth,
                                       widthMeasureMode,
                                       availableInnerHeight,
                                       availableInnerWidth,
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
    YGNodeRef firstRelativeChild = NULL;
    YGNodeRef currentRelativeChild = NULL;

    // Add items to the current line until it's full or we run out of items.
    for (uint32_t i = startOfLineIndex; i < childCount; i++, endOfLineIndex++) {
      const YGNodeRef child = YGNodeListGet(node->children, i);
      child->lineIndex = lineCount;

      if (child->style.positionType != YGPositionTypeAbsolute) {
        const float outerFlexBasis =
            fmaxf(YGValueResolve(&child->style.minDimensions[dim[mainAxis]], mainAxisParentSize), child->layout.computedFlexBasis) +
                  YGNodeMarginForAxis(child, mainAxis, availableInnerWidth);

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

        if (YGNodeIsFlex(child)) {
          totalFlexGrowFactors += YGNodeStyleGetFlexGrow(child);

          // Unlike the grow factor, the shrink factor is scaled relative to the
          // child
          // dimension.
          totalFlexShrinkScaledFactors +=
              -YGNodeStyleGetFlexShrink(child) * child->layout.computedFlexBasis;
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

    // We resolve main dimension to fit minimum and maximum values
    if (YGFloatIsUndefined(availableInnerMainDim)) {
      if (!YGFloatIsUndefined(minInnerMainDim) && sizeConsumedOnCurrentLine < minInnerMainDim) {
        availableInnerMainDim = minInnerMainDim;
      } else if (!YGFloatIsUndefined(maxInnerMainDim) &&
                 sizeConsumedOnCurrentLine > maxInnerMainDim) {
        availableInnerMainDim = maxInnerMainDim;
      }
    }

    float remainingFreeSpace = 0;
    if (!YGFloatIsUndefined(availableInnerMainDim)) {
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
      // spec (https://www.w3.org/TR/YG-flexbox-1/#resolve-flexible-lengths)
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
          flexShrinkScaledFactor = -YGNodeStyleGetFlexShrink(currentRelativeChild) * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            baseMainSize =
                childFlexBasis +
                remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor;
            boundMainSize = YGNodeBoundAxis(currentRelativeChild,
                                            mainAxis,
                                            baseMainSize,
                                            availableInnerMainDim,
                                            availableInnerWidth);
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
          flexGrowFactor = YGNodeStyleGetFlexGrow(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            baseMainSize =
                childFlexBasis + remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor;
            boundMainSize = YGNodeBoundAxis(currentRelativeChild,
                                            mainAxis,
                                            baseMainSize,
                                            availableInnerMainDim,
                                            availableInnerWidth);
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
          flexShrinkScaledFactor = -YGNodeStyleGetFlexShrink(currentRelativeChild) * childFlexBasis;
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

            updatedMainSize = YGNodeBoundAxis(currentRelativeChild,
                                              mainAxis,
                                              childSize,
                                              availableInnerMainDim,
                                              availableInnerWidth);
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = YGNodeStyleGetFlexGrow(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            updatedMainSize =
                YGNodeBoundAxis(currentRelativeChild,
                                mainAxis,
                                childFlexBasis +
                                    remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor,
                                availableInnerMainDim,
                                availableInnerWidth);
          }
        }

        deltaFreeSpace -= updatedMainSize - childFlexBasis;

        float childWidth;
        float childHeight;
        YGMeasureMode childWidthMeasureMode;
        YGMeasureMode childHeightMeasureMode;

        if (isMainAxisRow) {
          childWidth =
              updatedMainSize +
              YGNodeMarginForAxis(currentRelativeChild, YGFlexDirectionRow, availableInnerWidth);
          childWidthMeasureMode = YGMeasureModeExactly;

          if (!YGFloatIsUndefined(availableInnerCrossDim) &&
              !YGNodeIsStyleDimDefined(currentRelativeChild, YGFlexDirectionColumn) &&
              heightMeasureMode == YGMeasureModeExactly &&
              YGNodeAlignItem(node, currentRelativeChild) == YGAlignStretch) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode = YGMeasureModeExactly;
          } else if (!YGNodeIsStyleDimDefined(currentRelativeChild, YGFlexDirectionColumn)) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode =
                YGFloatIsUndefined(childHeight) ? YGMeasureModeUndefined : YGMeasureModeAtMost;
          } else {
            childHeight = YGValueResolve(&currentRelativeChild->style.dimensions[YGDimensionHeight],
                                         availableInnerHeight) +
                          YGNodeMarginForAxis(currentRelativeChild,
                                              YGFlexDirectionColumn,
                                              availableInnerWidth);
            childHeightMeasureMode = YGMeasureModeExactly;
          }
        } else {
          childHeight =
              updatedMainSize +
              YGNodeMarginForAxis(currentRelativeChild, YGFlexDirectionColumn, availableInnerWidth);
          childHeightMeasureMode = YGMeasureModeExactly;

          if (!YGFloatIsUndefined(availableInnerCrossDim) &&
              !YGNodeIsStyleDimDefined(currentRelativeChild, YGFlexDirectionRow) &&
              widthMeasureMode == YGMeasureModeExactly &&
              YGNodeAlignItem(node, currentRelativeChild) == YGAlignStretch) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode = YGMeasureModeExactly;
          } else if (!YGNodeIsStyleDimDefined(currentRelativeChild, YGFlexDirectionRow)) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode =
                YGFloatIsUndefined(childWidth) ? YGMeasureModeUndefined : YGMeasureModeAtMost;
          } else {
            childWidth =
                YGValueResolve(&currentRelativeChild->style.dimensions[YGDimensionWidth],
                               availableInnerWidth) +
                YGNodeMarginForAxis(currentRelativeChild, YGFlexDirectionRow, availableInnerWidth);
            childWidthMeasureMode = YGMeasureModeExactly;
          }
        }

        if (!YGFloatIsUndefined(currentRelativeChild->style.aspectRatio)) {
          if (isMainAxisRow) {
            childHeight = fmaxf(childWidth / currentRelativeChild->style.aspectRatio,
                                YGNodePaddingAndBorderForAxis(currentRelativeChild,
                                                              YGFlexDirectionColumn,
                                                              availableInnerWidth));
            childHeightMeasureMode = YGMeasureModeExactly;

            // Parent size constraint should have higher priority than flex
            if (YGNodeIsFlex(currentRelativeChild)) {
              childHeight = fminf(childHeight, availableInnerHeight);
              childWidth = childHeight * currentRelativeChild->style.aspectRatio;
            }
          } else {
            childWidth = fmaxf(childHeight * currentRelativeChild->style.aspectRatio,
                               YGNodePaddingAndBorderForAxis(currentRelativeChild,
                                                             YGFlexDirectionRow,
                                                             availableInnerWidth));
            childWidthMeasureMode = YGMeasureModeExactly;

            // Parent size constraint should have higher priority than flex
            if (YGNodeIsFlex(currentRelativeChild)) {
              childWidth = fminf(childWidth, availableInnerWidth);
              childHeight = childWidth / currentRelativeChild->style.aspectRatio;
            }
          }
        }

        YGConstrainMaxSizeForMode(
            YGValueResolve(&currentRelativeChild->style.maxDimensions[YGDimensionWidth],
                           availableInnerWidth),
            &childWidthMeasureMode,
            &childWidth);
        YGConstrainMaxSizeForMode(
            YGValueResolve(&currentRelativeChild->style.maxDimensions[YGDimensionHeight],
                           availableInnerHeight),
            &childHeightMeasureMode,
            &childHeight);

        const bool requiresStretchLayout =
            !YGNodeIsStyleDimDefined(currentRelativeChild, crossAxis) &&
            YGNodeAlignItem(node, currentRelativeChild) == YGAlignStretch;

        // Recursively call the layout algorithm for this child with the updated
        // main size.
        YGLayoutNodeInternal(currentRelativeChild,
                             childWidth,
                             childHeight,
                             direction,
                             childWidthMeasureMode,
                             childHeightMeasureMode,
                             availableInnerWidth,
                             availableInnerHeight,
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
      if (node->style.minDimensions[dim[mainAxis]].unit != YGUnitUndefined &&
          YGValueResolve(&node->style.minDimensions[dim[mainAxis]], mainAxisParentSize) >= 0) {
        remainingFreeSpace =
            fmaxf(0,
                  YGValueResolve(&node->style.minDimensions[dim[mainAxis]], mainAxisParentSize) -
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
        break;
    }

    float mainDim = leadingPaddingAndBorderMain + leadingMainDim;
    float crossDim = 0;

    for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
      const YGNodeRef child = YGNodeListGet(node->children, i);

      if (child->style.positionType == YGPositionTypeAbsolute &&
          YGNodeIsLeadingPosDefined(child, mainAxis)) {
        if (performLayout) {
          // In case the child is position absolute and has left/top being
          // defined, we override the position to whatever the user said
          // (and margin/border).
          child->layout.position[pos[mainAxis]] =
              YGNodeLeadingPosition(child, mainAxis, availableInnerMainDim) +
              YGNodeLeadingBorder(node, mainAxis) +
              YGNodeLeadingMargin(child, mainAxis, availableInnerWidth);
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
            // they weren't computed. This means we can't call YGNodeDimWithMargin.
            mainDim += betweenMainDim + YGNodeMarginForAxis(child, mainAxis, availableInnerWidth) +
                       child->layout.computedFlexBasis;
            crossDim = availableInnerCrossDim;
          } else {
            // The main dimension is the sum of all the elements dimension plus
            // the spacing.
            mainDim += betweenMainDim + YGNodeDimWithMargin(child, mainAxis, availableInnerWidth);

            // The cross dimension is the max of the elements dimension since
            // there
            // can only be one element in that cross dimension.
            crossDim = fmaxf(crossDim, YGNodeDimWithMargin(child, crossAxis, availableInnerWidth));
          }
        } else if (performLayout) {
          child->layout.position[pos[mainAxis]] +=
              YGNodeLeadingBorder(node, mainAxis) + leadingMainDim;
        }
      }
    }

    mainDim += trailingPaddingAndBorderMain;

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == YGMeasureModeUndefined ||
        measureModeCrossDim == YGMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis = YGNodeBoundAxis(node,
                                           crossAxis,
                                           crossDim + paddingAndBorderAxisCross,
                                           crossAxisParentSize,
                                           parentWidth) -
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
    crossDim = YGNodeBoundAxis(node,
                               crossAxis,
                               crossDim + paddingAndBorderAxisCross,
                               crossAxisParentSize,
                               parentWidth) -
               paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
        const YGNodeRef child = YGNodeListGet(node->children, i);

        if (child->style.positionType == YGPositionTypeAbsolute) {
          // If the child is absolutely positioned and has a
          // top/left/bottom/right
          // set, override all the previously computed positions to set it
          // correctly.
          if (YGNodeIsLeadingPosDefined(child, crossAxis)) {
            child->layout.position[pos[crossAxis]] =
                YGNodeLeadingPosition(child, crossAxis, availableInnerCrossDim) +
                YGNodeLeadingBorder(node, crossAxis) +
                YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
          } else {
            child->layout.position[pos[crossAxis]] =
                YGNodeLeadingBorder(node, crossAxis) +
                YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (parent) or
          // alignSelf (child) in order to determine the position in the cross
          // axis
          const YGAlign alignItem = YGNodeAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time
          // forcing the cross-axis size to be the computed cross size for the
          // current line.
          if (alignItem == YGAlignStretch) {
            const bool isCrossSizeDefinite =
                (isMainAxisRow && YGNodeIsStyleDimDefined(child, YGFlexDirectionColumn)) ||
                (!isMainAxisRow && YGNodeIsStyleDimDefined(child, YGFlexDirectionRow));

            float childWidth;
            float childHeight;
            YGMeasureMode childWidthMeasureMode = YGMeasureModeExactly;
            YGMeasureMode childHeightMeasureMode = YGMeasureModeExactly;

            if (isMainAxisRow) {
              childWidth = child->layout.measuredDimensions[YGDimensionWidth] +
                           YGNodeMarginForAxis(child, YGFlexDirectionRow, availableInnerWidth);

              if (!YGFloatIsUndefined(child->style.aspectRatio)) {
                childHeight = childWidth / child->style.aspectRatio;
              } else {
                childHeight = crossDim;
              }
            } else {
              childHeight = child->layout.measuredDimensions[YGDimensionHeight] +
                            YGNodeMarginForAxis(child, YGFlexDirectionColumn, availableInnerWidth);

              if (!YGFloatIsUndefined(child->style.aspectRatio)) {
                childWidth = childHeight * child->style.aspectRatio;
              } else {
                childWidth = crossDim;
              }
            }

            YGConstrainMaxSizeForMode(YGValueResolve(&child->style.maxDimensions[YGDimensionWidth],
                                                     availableInnerWidth),
                                      &childWidthMeasureMode,
                                      &childWidth);
            YGConstrainMaxSizeForMode(YGValueResolve(&child->style.maxDimensions[YGDimensionHeight],
                                                     availableInnerHeight),
                                      &childHeightMeasureMode,
                                      &childHeight);

            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!isCrossSizeDefinite) {
              childWidthMeasureMode =
                  YGFloatIsUndefined(childWidth) ? YGMeasureModeUndefined : YGMeasureModeExactly;
              childHeightMeasureMode =
                  YGFloatIsUndefined(childHeight) ? YGMeasureModeUndefined : YGMeasureModeExactly;

              YGLayoutNodeInternal(child,
                                   childWidth,
                                   childHeight,
                                   direction,
                                   childWidthMeasureMode,
                                   childHeightMeasureMode,
                                   availableInnerWidth,
                                   availableInnerHeight,
                                   true,
                                   "stretch");
            }
          } else if (alignItem != YGAlignFlexStart) {
            const float remainingCrossDim =
                containerCrossAxis - YGNodeDimWithMargin(child, crossAxis, availableInnerWidth);

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
  if (performLayout && (lineCount > 1 || YGIsBaselineLayout(node)) &&
      !YGFloatIsUndefined(availableInnerCrossDim)) {
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
      case YGAlignBaseline:
        break;
    }

    uint32_t endIndex = 0;
    for (uint32_t i = 0; i < lineCount; i++) {
      uint32_t startIndex = endIndex;
      uint32_t ii;

      // compute the line's height and find the endIndex
      float lineHeight = 0;
      float maxAscentForCurrentLine = 0;
      float maxDescentForCurrentLine = 0;
      for (ii = startIndex; ii < childCount; ii++) {
        const YGNodeRef child = YGNodeListGet(node->children, ii);

        if (child->style.positionType == YGPositionTypeRelative) {
          if (child->lineIndex != i) {
            break;
          }
          if (YGNodeIsLayoutDimDefined(child, crossAxis)) {
            lineHeight = fmaxf(lineHeight,
                               child->layout.measuredDimensions[dim[crossAxis]] +
                                   YGNodeMarginForAxis(child, crossAxis, availableInnerWidth));
          }
          if (YGNodeAlignItem(node, child) == YGAlignBaseline) {
            const float ascent =
                YGBaseline(child) +
                YGNodeLeadingMargin(child, YGFlexDirectionColumn, availableInnerWidth);
            const float descent =
                child->layout.measuredDimensions[YGDimensionHeight] +
                YGNodeMarginForAxis(child, YGFlexDirectionColumn, availableInnerWidth) - ascent;
            maxAscentForCurrentLine = fmaxf(maxAscentForCurrentLine, ascent);
            maxDescentForCurrentLine = fmaxf(maxDescentForCurrentLine, descent);
            lineHeight = fmaxf(lineHeight, maxAscentForCurrentLine + maxDescentForCurrentLine);
          }
        }
      }
      endIndex = ii;
      lineHeight += crossDimLead;

      if (performLayout) {
        for (ii = startIndex; ii < endIndex; ii++) {
          const YGNodeRef child = YGNodeListGet(node->children, ii);

          if (child->style.positionType == YGPositionTypeRelative) {
            switch (YGNodeAlignItem(node, child)) {
              case YGAlignFlexStart: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
                break;
              }
              case YGAlignFlexEnd: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + lineHeight -
                    YGNodeTrailingMargin(child, crossAxis, availableInnerWidth) -
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
                    currentLead + YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
                // TODO(prenaux): Correctly set the height of items with indefinite
                //                (auto) crossAxis dimension.
                break;
              }
              case YGAlignBaseline: {
                child->layout.position[YGEdgeTop] =
                    currentLead + maxAscentForCurrentLine - YGBaseline(child) +
                    YGNodeLeadingPosition(child, YGFlexDirectionColumn, availableInnerCrossDim);
                break;
              }
              case YGAlignAuto:
                break;
            }
          }
        }
      }

      currentLead += lineHeight;
    }
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS
  node->layout.measuredDimensions[YGDimensionWidth] = YGNodeBoundAxis(
      node, YGFlexDirectionRow, availableWidth - marginAxisRow, parentWidth, parentWidth);
  node->layout.measuredDimensions[YGDimensionHeight] = YGNodeBoundAxis(
      node, YGFlexDirectionColumn, availableHeight - marginAxisColumn, parentHeight, parentWidth);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == YGMeasureModeUndefined ||
      (node->style.overflow != YGOverflowScroll && measureModeMainDim == YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[mainAxis]] =
        YGNodeBoundAxis(node, mainAxis, maxLineMainDim, mainAxisParentSize, parentWidth);
  } else if (measureModeMainDim == YGMeasureModeAtMost &&
             node->style.overflow == YGOverflowScroll) {
    node->layout.measuredDimensions[dim[mainAxis]] = fmaxf(
        fminf(availableInnerMainDim + paddingAndBorderAxisMain,
              YGNodeBoundAxisWithinMinAndMax(node, mainAxis, maxLineMainDim, mainAxisParentSize)),
        paddingAndBorderAxisMain);
  }

  if (measureModeCrossDim == YGMeasureModeUndefined ||
      (node->style.overflow != YGOverflowScroll && measureModeCrossDim == YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[crossAxis]] =
        YGNodeBoundAxis(node,
                        crossAxis,
                        totalLineCrossDim + paddingAndBorderAxisCross,
                        crossAxisParentSize,
                        parentWidth);
  } else if (measureModeCrossDim == YGMeasureModeAtMost &&
             node->style.overflow == YGOverflowScroll) {
    node->layout.measuredDimensions[dim[crossAxis]] =
        fmaxf(fminf(availableInnerCrossDim + paddingAndBorderAxisCross,
                    YGNodeBoundAxisWithinMinAndMax(node,
                                                   crossAxis,
                                                   totalLineCrossDim + paddingAndBorderAxisCross,
                                                   crossAxisParentSize)),
              paddingAndBorderAxisCross);
  }

  if (performLayout) {
    // STEP 10: SIZING AND POSITIONING ABSOLUTE CHILDREN
    for (currentAbsoluteChild = firstAbsoluteChild; currentAbsoluteChild != NULL;
         currentAbsoluteChild = currentAbsoluteChild->nextChild) {
      YGNodeAbsoluteLayoutChild(node,
                                currentAbsoluteChild,
                                availableInnerWidth,
                                widthMeasureMode,
                                availableInnerHeight,
                                direction);
    }

    // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
    const bool needsMainTrailingPos =
        mainAxis == YGFlexDirectionRowReverse || mainAxis == YGFlexDirectionColumnReverse;
    const bool needsCrossTrailingPos =
        crossAxis == YGFlexDirectionRowReverse || crossAxis == YGFlexDirectionColumnReverse;

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (uint32_t i = 0; i < childCount; i++) {
        const YGNodeRef child = YGNodeListGet(node->children, i);

        if (needsMainTrailingPos) {
          YGNodeSetChildTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          YGNodeSetChildTrailingPosition(node, child, crossAxis);
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

static const char *YGSpacer(const unsigned long level) {
  const size_t spacerLen = strlen(spacer);
  if (level > spacerLen) {
    return &spacer[0];
  } else {
    return &spacer[spacerLen - level];
  }
}

static const char *YGMeasureModeName(const YGMeasureMode mode, const bool performLayout) {
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

static inline bool YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(YGMeasureMode sizeMode,
                                                                     float size,
                                                                     float lastComputedSize) {
  return sizeMode == YGMeasureModeExactly && YGFloatsEqual(size, lastComputedSize);
}

static inline bool YGMeasureModeOldSizeIsUnspecifiedAndStillFits(YGMeasureMode sizeMode,
                                                                 float size,
                                                                 YGMeasureMode lastSizeMode,
                                                                 float lastComputedSize) {
  return sizeMode == YGMeasureModeAtMost && lastSizeMode == YGMeasureModeUndefined &&
         (size >= lastComputedSize || YGFloatsEqual(size, lastComputedSize));
}

static inline bool YGMeasureModeNewMeasureSizeIsStricterAndStillValid(YGMeasureMode sizeMode,
                                                                      float size,
                                                                      YGMeasureMode lastSizeMode,
                                                                      float lastSize,
                                                                      float lastComputedSize) {
  return lastSizeMode == YGMeasureModeAtMost && sizeMode == YGMeasureModeAtMost &&
         lastSize > size && (lastComputedSize <= size || YGFloatsEqual(size, lastComputedSize));
}

bool YGNodeCanUseCachedMeasurement(const YGMeasureMode widthMode,
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

  const bool hasSameWidthSpec = lastWidthMode == widthMode && YGFloatsEqual(lastWidth, width);
  const bool hasSameHeightSpec = lastHeightMode == heightMode && YGFloatsEqual(lastHeight, height);

  const bool widthIsCompatible =
      hasSameWidthSpec || YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(widthMode,
                                                                            width - marginRow,
                                                                            lastComputedWidth) ||
      YGMeasureModeOldSizeIsUnspecifiedAndStillFits(widthMode,
                                                    width - marginRow,
                                                    lastWidthMode,
                                                    lastComputedWidth) ||
      YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          widthMode, width - marginRow, lastWidthMode, lastWidth, lastComputedWidth);

  const bool heightIsCompatible =
      hasSameHeightSpec || YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(heightMode,
                                                                             height - marginColumn,
                                                                             lastComputedHeight) ||
      YGMeasureModeOldSizeIsUnspecifiedAndStillFits(heightMode,
                                                    height - marginColumn,
                                                    lastHeightMode,
                                                    lastComputedHeight) ||
      YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          heightMode, height - marginColumn, lastHeightMode, lastHeight, lastComputedHeight);

  return widthIsCompatible && heightIsCompatible;
}

//
// This is a wrapper around the YGNodelayoutImpl function. It determines
// whether the layout request is redundant and can be skipped.
//
// Parameters:
//  Input parameters are the same as YGNodelayoutImpl (see above)
//  Return parameter is true if layout was performed, false if skipped
//
bool YGLayoutNodeInternal(const YGNodeRef node,
                          const float availableWidth,
                          const float availableHeight,
                          const YGDirection parentDirection,
                          const YGMeasureMode widthMeasureMode,
                          const YGMeasureMode heightMeasureMode,
                          const float parentWidth,
                          const float parentHeight,
                          const bool performLayout,
                          const char *reason) {
  YGLayout *layout = &node->layout;

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

  YGCachedMeasurement *cachedResults = NULL;

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
    const float marginAxisRow = YGNodeMarginForAxis(node, YGFlexDirectionRow, parentWidth);
    const float marginAxisColumn = YGNodeMarginForAxis(node, YGFlexDirectionColumn, parentWidth);

    // First, try to use the layout cache.
    if (YGNodeCanUseCachedMeasurement(widthMeasureMode,
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
        if (YGNodeCanUseCachedMeasurement(widthMeasureMode,
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
    if (YGFloatsEqual(layout->cachedLayout.availableWidth, availableWidth) &&
        YGFloatsEqual(layout->cachedLayout.availableHeight, availableHeight) &&
        layout->cachedLayout.widthMeasureMode == widthMeasureMode &&
        layout->cachedLayout.heightMeasureMode == heightMeasureMode) {
      cachedResults = &layout->cachedLayout;
    }
  } else {
    for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
      if (YGFloatsEqual(layout->cachedMeasurements[i].availableWidth, availableWidth) &&
          YGFloatsEqual(layout->cachedMeasurements[i].availableHeight, availableHeight) &&
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
      printf("%s%d.{[skipped] ", YGSpacer(gDepth), gDepth);
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
             YGMeasureModeName(widthMeasureMode, performLayout),
             YGMeasureModeName(heightMeasureMode, performLayout),
             availableWidth,
             availableHeight,
             cachedResults->computedWidth,
             cachedResults->computedHeight,
             reason);
    }
  } else {
    if (gPrintChanges) {
      printf("%s%d.{%s", YGSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f %s\n",
             YGMeasureModeName(widthMeasureMode, performLayout),
             YGMeasureModeName(heightMeasureMode, performLayout),
             availableWidth,
             availableHeight,
             reason);
    }

    YGNodelayoutImpl(node,
                     availableWidth,
                     availableHeight,
                     parentDirection,
                     widthMeasureMode,
                     heightMeasureMode,
                     parentWidth,
                     parentHeight,
                     performLayout);

    if (gPrintChanges) {
      printf("%s%d.}%s", YGSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, d: (%f, %f) %s\n",
             YGMeasureModeName(widthMeasureMode, performLayout),
             YGMeasureModeName(heightMeasureMode, performLayout),
             layout->measuredDimensions[YGDimensionWidth],
             layout->measuredDimensions[YGDimensionHeight],
             reason);
    }

    layout->lastParentDirection = parentDirection;

    if (cachedResults == NULL) {
      if (layout->nextCachedMeasurementsIndex == YG_MAX_CACHED_RESULT_COUNT) {
        if (gPrintChanges) {
          printf("Out of cache entries!\n");
        }
        layout->nextCachedMeasurementsIndex = 0;
      }

      YGCachedMeasurement *newCacheEntry;
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

static void roundToPixelGrid(const YGNodeRef node) {
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

  const uint32_t childCount = YGNodeListCount(node->children);
  for (uint32_t i = 0; i < childCount; i++) {
    roundToPixelGrid(YGNodeGetChild(node, i));
  }
}

void YGNodeCalculateLayout(const YGNodeRef node,
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

  if (!YGFloatIsUndefined(width)) {
    widthMeasureMode = YGMeasureModeExactly;
  } else if (YGNodeIsStyleDimDefined(node, YGFlexDirectionRow)) {
    width = YGValueResolve(&node->style.dimensions[dim[YGFlexDirectionRow]], availableWidth) +
            YGNodeMarginForAxis(node, YGFlexDirectionRow, availableWidth);
    widthMeasureMode = YGMeasureModeExactly;
  } else if (YGValueResolve(&node->style.maxDimensions[YGDimensionWidth], availableWidth) >= 0.0f) {
    width = YGValueResolve(&node->style.maxDimensions[YGDimensionWidth], availableWidth);
    widthMeasureMode = YGMeasureModeAtMost;
  }

  if (!YGFloatIsUndefined(height)) {
    heightMeasureMode = YGMeasureModeExactly;
  } else if (YGNodeIsStyleDimDefined(node, YGFlexDirectionColumn)) {
    height = YGValueResolve(&node->style.dimensions[dim[YGFlexDirectionColumn]], availableHeight) +
             YGNodeMarginForAxis(node, YGFlexDirectionColumn, availableWidth);
    heightMeasureMode = YGMeasureModeExactly;
  } else if (YGValueResolve(&node->style.maxDimensions[YGDimensionHeight], availableHeight) >=
             0.0f) {
    height = YGValueResolve(&node->style.maxDimensions[YGDimensionHeight], availableHeight);
    heightMeasureMode = YGMeasureModeAtMost;
  }

  if (YGLayoutNodeInternal(node,
                           width,
                           height,
                           parentDirection,
                           widthMeasureMode,
                           heightMeasureMode,
                           availableWidth,
                           availableHeight,
                           true,
                           "initia"
                           "l")) {
    YGNodeSetPosition(node, node->layout.direction, availableWidth, availableHeight, availableWidth);

    if (YGIsExperimentalFeatureEnabled(YGExperimentalFeatureRounding)) {
      roundToPixelGrid(node);
    }

    if (gPrintTree) {
      YGNodePrint(node, YGPrintOptionsLayout | YGPrintOptionsChildren | YGPrintOptionsStyle);
    }
  }
}

void YGSetLogger(YGLogger logger) {
  gLogger = logger;
}

void YGLog(YGLogLevel level, const char *format, ...) {
  va_list args;
  va_start(args, format);
  gLogger(level, format, args);
  va_end(args);
}

static bool experimentalFeatures[YGExperimentalFeatureCount + 1];

void YGSetExperimentalFeatureEnabled(YGExperimentalFeature feature, bool enabled) {
  experimentalFeatures[feature] = enabled;
}

inline bool YGIsExperimentalFeatureEnabled(YGExperimentalFeature feature) {
  return experimentalFeatures[feature];
}

void YGSetMemoryFuncs(YGMalloc ygmalloc, YGCalloc yccalloc, YGRealloc ygrealloc, YGFree ygfree) {
  YG_ASSERT(gNodeInstanceCount == 0, "Cannot set memory functions: all node must be freed first");
  YG_ASSERT((ygmalloc == NULL && yccalloc == NULL && ygrealloc == NULL && ygfree == NULL) ||
                (ygmalloc != NULL && yccalloc != NULL && ygrealloc != NULL && ygfree != NULL),
            "Cannot set memory functions: functions must be all NULL or Non-NULL");

  if (ygmalloc == NULL || yccalloc == NULL || ygrealloc == NULL || ygfree == NULL) {
    gYGMalloc = &malloc;
    gYGCalloc = &calloc;
    gYGRealloc = &realloc;
    gYGFree = &free;
  } else {
    gYGMalloc = ygmalloc;
    gYGCalloc = yccalloc;
    gYGRealloc = ygrealloc;
    gYGFree = ygfree;
  }
}
