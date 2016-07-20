/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef __LAYOUT_H
#define __LAYOUT_H

#include <math.h>
#ifndef __cplusplus
#include <stdbool.h>
#endif

// Not defined in MSVC++
#ifndef NAN
static const unsigned long __nan[2] = {0xffffffff, 0x7fffffff};
#define NAN (*(const float *)__nan)
#endif

#define CSSUndefined NAN

#include "CSSMacros.h"

CSS_EXTERN_C_BEGIN

typedef enum CSSDirection {
  CSSDirectionInherit,
  CSSDirectionLTR,
  CSSDirectionRTL,
} CSSDirection;

typedef enum CSSFlexDirection {
  CSSFlexDirectionColumn,
  CSSFlexDirectionColumnReverse,
  CSSFlexDirectionRow,
  CSSFlexDirectionRowReverse,
} CSSFlexDirection;

typedef enum CSSJustify {
  CSSJustifyFlexStart,
  CSSJustifyCenter,
  CSSJustifyFlexEnd,
  CSSJustifySpaceBetween,
  CSSJustifySpaceAround,
} CSSJustify;

typedef enum CSSOverflow {
  CSSOverflowVisible,
  CSSOverflowHidden,
} CSSOverflow;

// Note: auto is only a valid value for alignSelf. It is NOT a valid value for
// alignItems.
typedef enum CSSAlign {
  CSSAlignAuto,
  CSSAlignFlexStart,
  CSSAlignCenter,
  CSSAlignFlexEnd,
  CSSAlignStretch,
} CSSAlign;

typedef enum CSSPositionType {
  CSSPositionTypeRelative,
  CSSPositionTypeAbsolute,
} CSSPositionType;

typedef enum CSSWrapType {
  CSSWrapTypeNoWrap,
  CSSWrapTypeWrap,
} CSSWrapType;

// Note: left and top are shared between position[2] and position[4], so
// they have to be before right and bottom.
typedef enum CSSPosition {
  CSSPositionLeft,
  CSSPositionTop,
  CSSPositionRight,
  CSSPositionBottom,
  CSSPositionStart,
  CSSPositionEnd,
  CSSPositionCount,
} CSSPosition;

typedef enum CSSMeasureMode {
  CSSMeasureModeUndefined,
  CSSMeasureModeExactly,
  CSSMeasureModeAtMost,
  CSSMeasureModeCount,
} CSSMeasureMode;

typedef enum CSSDimension {
  CSSDimensionWidth,
  CSSDimensionHeight,
} CSSDimension;

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
enum {
  CSS_MAX_CACHED_RESULT_COUNT = 16
};

typedef struct CSSLayout {
  float position[4];
  float dimensions[2];
  CSSDirection direction;

  float flexBasis;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  bool shouldUpdate;
  int generationCount;
  CSSDirection lastParentDirection;

  int nextCachedMeasurementsIndex;
  CSSCachedMeasurement cachedMeasurements[CSS_MAX_CACHED_RESULT_COUNT];
  float measuredDimensions[2];

  CSSCachedMeasurement cached_layout;
} CSSLayout;

typedef struct CSSMeasureResult {
  float dimensions[2];
} CSSMeasureResult;

typedef struct CSSStyle {
  CSSDirection direction;
  CSSFlexDirection flexDirection;
  CSSJustify justifyContent;
  CSSAlign alignContent;
  CSSAlign alignItems;
  CSSAlign alignSelf;
  CSSPositionType positionType;
  CSSWrapType flexWrap;
  CSSOverflow overflow;
  float flex;
  float margin[6];
  float position[4];
  /**
   * You should skip all the rules that contain negative values for the
   * following attributes. For example:
   *   {padding: 10, paddingLeft: -5}
   * should output:
   *   {left: 10 ...}
   * the following two are incorrect:
   *   {left: -5 ...}
   *   {left: 0 ...}
   */
  float padding[6];
  float border[6];
  float dimensions[2];
  float minDimensions[2];
  float maxDimensions[2];
} CSSStyle;

typedef struct CSSNode {
  CSSStyle style;
  CSSLayout layout;
  int childCount;
  int lineIndex;

  struct CSSNode* nextChild;

  CSSMeasureResult (*measure)(void *context, float width, CSSMeasureMode widthMode, float height, CSSMeasureMode heightMode);
  void (*print)(void *context);
  struct CSSNode* (*getChild)(void *context, int i);
  bool (*isDirty)(void *context);
  bool (*isTextNode)(void *context);
  void *context;
} CSSNode;

// Lifecycle of nodes and children
CSSNode *CSSNodeNew();
void CSSNodeInit(CSSNode *node);
void CSSNodeFree(CSSNode *node);

// Print utilities
typedef enum CSSPrintOptions {
  CSSPrintOptionsLayout = 1,
  CSSPrintOptionsStyle = 2,
  CSSPrintOptionsChildren = 4,
} CSSPrintOptions;

void CSSNodePrint(CSSNode *node, CSSPrintOptions options);

// Function that computes the layout!
void layoutNode(CSSNode *node, float availableWidth, float availableHeight, CSSDirection parentDirection);
bool isUndefined(float value);

CSS_EXTERN_C_END

#endif
