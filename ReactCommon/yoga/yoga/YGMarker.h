/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include "YGMacros.h"

YG_EXTERN_C_BEGIN

typedef struct YGNode* YGNodeRef;

typedef YG_ENUM_BEGIN(YGMarkerType) {}
YG_ENUM_END(YGMarkerType);

typedef union {
  int unused;
} YGMarkerData;

typedef struct {
  // accepts marker type, a node ref, and marker data (depends on marker type)
  // can return a handle or id that Yoga will pass to endMarker
  void* (*startMarker)(YGMarkerType, YGNodeRef, YGMarkerData);
  // accepts marker type, a node ref, marker data, and marker id as returned
  // by startMarker
  void (*endMarker)(YGMarkerType, YGNodeRef, YGMarkerData, void* id);
} YGMarkerCallbacks;

YG_EXTERN_C_END
