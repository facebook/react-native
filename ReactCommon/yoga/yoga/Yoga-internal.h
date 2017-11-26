/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once
#include "YGNodeList.h"
#include "Yoga.h"

YG_EXTERN_C_BEGIN

WIN_EXPORT float YGRoundValueToPixelGrid(const float value,
                                         const float pointScaleFactor,
                                         const bool forceCeil,
                                         const bool forceFloor);

YG_EXTERN_C_END

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
  bool hadOverflow;

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
  YGDisplay display;
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

typedef struct YGConfig {
  bool experimentalFeatures[YGExperimentalFeatureCount + 1];
  bool useWebDefaults;
  bool useLegacyStretchBehaviour;
  float pointScaleFactor;
  YGLogger logger;
  YGNodeClonedFunc cloneNodeCallback;
  void* context;
} YGConfig;

typedef struct YGNode {
  YGStyle style;
  YGLayout layout;
  uint32_t lineIndex;

  YGNodeRef parent;
  YGNodeListRef children;

  struct YGNode* nextChild;

  YGMeasureFunc measure;
  YGBaselineFunc baseline;
  YGPrintFunc print;
  YGConfigRef config;
  void* context;

  bool isDirty;
  bool hasNewLayout;
  YGNodeType nodeType;

  YGValue const* resolvedDimensions[2];
} YGNode;

#define YG_UNDEFINED_VALUES \
  { .value = YGUndefined, .unit = YGUnitUndefined }

#define YG_AUTO_VALUES \
  { .value = YGUndefined, .unit = YGUnitAuto }

#define YG_DEFAULT_EDGE_VALUES_UNIT                                            \
  {                                                                            \
    [YGEdgeLeft] = YG_UNDEFINED_VALUES, [YGEdgeTop] = YG_UNDEFINED_VALUES,     \
    [YGEdgeRight] = YG_UNDEFINED_VALUES, [YGEdgeBottom] = YG_UNDEFINED_VALUES, \
    [YGEdgeStart] = YG_UNDEFINED_VALUES, [YGEdgeEnd] = YG_UNDEFINED_VALUES,    \
    [YGEdgeHorizontal] = YG_UNDEFINED_VALUES,                                  \
    [YGEdgeVertical] = YG_UNDEFINED_VALUES, [YGEdgeAll] = YG_UNDEFINED_VALUES, \
  }

#define YG_DEFAULT_DIMENSION_VALUES \
  { [YGDimensionWidth] = YGUndefined, [YGDimensionHeight] = YGUndefined, }

#define YG_DEFAULT_DIMENSION_VALUES_UNIT       \
  {                                            \
    [YGDimensionWidth] = YG_UNDEFINED_VALUES,  \
    [YGDimensionHeight] = YG_UNDEFINED_VALUES, \
  }

#define YG_DEFAULT_DIMENSION_VALUES_AUTO_UNIT \
  { [YGDimensionWidth] = YG_AUTO_VALUES, [YGDimensionHeight] = YG_AUTO_VALUES, }

static const float kDefaultFlexGrow = 0.0f;
static const float kDefaultFlexShrink = 0.0f;
static const float kWebDefaultFlexShrink = 1.0f;

static const YGStyle gYGNodeStyleDefaults = {
    .direction = YGDirectionInherit,
    .flexDirection = YGFlexDirectionColumn,
    .justifyContent = YGJustifyFlexStart,
    .alignContent = YGAlignFlexStart,
    .alignItems = YGAlignStretch,
    .alignSelf = YGAlignAuto,
    .positionType = YGPositionTypeRelative,
    .flexWrap = YGWrapNoWrap,
    .overflow = YGOverflowVisible,
    .display = YGDisplayFlex,
    .flex = YGUndefined,
    .flexGrow = YGUndefined,
    .flexShrink = YGUndefined,
    .flexBasis = YG_AUTO_VALUES,
    .margin = YG_DEFAULT_EDGE_VALUES_UNIT,
    .position = YG_DEFAULT_EDGE_VALUES_UNIT,
    .padding = YG_DEFAULT_EDGE_VALUES_UNIT,
    .border = YG_DEFAULT_EDGE_VALUES_UNIT,
    .dimensions = YG_DEFAULT_DIMENSION_VALUES_AUTO_UNIT,
    .minDimensions = YG_DEFAULT_DIMENSION_VALUES_UNIT,
    .maxDimensions = YG_DEFAULT_DIMENSION_VALUES_UNIT,
    .aspectRatio = YGUndefined,
};

static const YGLayout gYGNodeLayoutDefaults = {
    .position = {},
    .dimensions = YG_DEFAULT_DIMENSION_VALUES,
    .margin = {},
    .border = {},
    .padding = {},
    .direction = YGDirectionInherit,
    .computedFlexBasisGeneration = 0,
    .computedFlexBasis = YGUndefined,
    .hadOverflow = false,
    .generationCount = 0,
    .lastParentDirection = (YGDirection)-1,
    .nextCachedMeasurementsIndex = 0,
    .cachedMeasurements = {},
    .measuredDimensions = YG_DEFAULT_DIMENSION_VALUES,
    .cachedLayout =
        {
            .availableWidth = 0,
            .availableHeight = 0,
            .widthMeasureMode = (YGMeasureMode)-1,
            .heightMeasureMode = (YGMeasureMode)-1,
            .computedWidth = -1,
            .computedHeight = -1,
        },
};

static const YGNode gYGNodeDefaults = {
    .style = gYGNodeStyleDefaults,
    .layout = gYGNodeLayoutDefaults,
    .lineIndex = 0,
    .parent = nullptr,
    .children = nullptr,
    .nextChild = nullptr,
    .measure = nullptr,
    .baseline = nullptr,
    .print = nullptr,
    .config = nullptr,
    .context = nullptr,
    .isDirty = false,
    .hasNewLayout = true,
    .nodeType = YGNodeTypeDefault,
    .resolvedDimensions = {[YGDimensionWidth] = &YGValueUndefined,
                           [YGDimensionHeight] = &YGValueUndefined},
};

extern bool YGFloatsEqual(const float a, const float b);
extern bool YGValueEqual(const YGValue a, const YGValue b);
extern const YGValue* YGComputedEdgeValue(
    const YGValue edges[YGEdgeCount],
    const YGEdge edge,
    const YGValue* const defaultValue);
