/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef __CSS_LAYOUT_INTERNAL_H
#define __CSS_LAYOUT_INTERNAL_H

#include <stdio.h>
#include <stdlib.h>

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
  int generationCount;
  CSSDirection lastParentDirection;

  int nextCachedMeasurementsIndex;
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
  int lineIndex;
  bool shouldUpdate;
  bool isTextNode;
  CSSNodeListRef children;

  struct CSSNode* nextChild;

  CSSSize (*measure)(void *context, float width, CSSMeasureMode widthMode, float height, CSSMeasureMode heightMode);
  bool (*isDirty)(void *context);
  void (*print)(void *context);
  void *context;
} CSSNode;

CSS_EXTERN_C_END

#endif
