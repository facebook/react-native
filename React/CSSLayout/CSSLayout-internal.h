/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "CSSLayout.h"
#include "CSSNodeList.h"

CSS_EXTERN_C_BEGIN

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

  float computedFlexBasis;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  CSSDirection lastParentDirection;

  uint32_t nextCachedMeasurementsIndex;
  CSSCachedMeasurement cachedMeasurements[CSS_MAX_CACHED_RESULT_COUNT];
  float measuredDimensions[2];

  CSSCachedMeasurement cached_layout;
} CSSLayout;

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
} CSSStyle;

typedef struct CSSNode {
  CSSStyle style;
  CSSLayout layout;
  uint32_t lineIndex;
  bool hasNewLayout;
  bool isTextNode;
  CSSNodeRef parent;
  CSSNodeListRef children;
  bool isDirty;

  struct CSSNode *nextChild;

  CSSSize (*measure)(void *context,
                     float width,
                     CSSMeasureMode widthMode,
                     float height,
                     CSSMeasureMode heightMode);
  void (*print)(void *context);
  void *context;
} CSSNode;

CSS_EXTERN_C_END
