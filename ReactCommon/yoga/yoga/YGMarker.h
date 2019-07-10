/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include "YGMacros.h"

YG_EXTERN_C_BEGIN

typedef struct YGNode* YGNodeRef;
typedef struct YGConfig* YGConfigRef;

typedef YG_ENUM_BEGIN(YGMarker){
    YGMarkerMeasure,
    YGMarkerBaselineFn,
} YG_ENUM_END(YGMarker);

typedef struct {
  int layouts;
  int measures;
  int maxMeasureCache;
  int cachedLayouts;
  int cachedMeasures;
  int measureCallbacks;
} YGMarkerLayoutData;

typedef struct {
  bool _unused;
} YGMarkerNoData;

typedef union {
  YGMarkerNoData* noData;
} YGMarkerData;

typedef struct {
  // accepts marker type, a node ref, and marker data (depends on marker type)
  // can return a handle or id that Yoga will pass to endMarker
  void* (*startMarker)(YGMarker, YGNodeRef, YGMarkerData);
  // accepts marker type, a node ref, marker data, and marker id as returned by
  // startMarker
  void (*endMarker)(YGMarker, YGNodeRef, YGMarkerData, void* id);
} YGMarkerCallbacks;

void YGConfigSetMarkerCallbacks(YGConfigRef, YGMarkerCallbacks);

YG_EXTERN_C_END

#ifdef __cplusplus

namespace facebook {
namespace yoga {
namespace marker {
namespace detail {

template <YGMarker M>
struct MarkerData;

struct NoMarkerData {
  using type = YGMarkerNoData;
  static type*& get(YGMarkerData& d) { return d.noData; }
};

template <>
struct MarkerData<YGMarkerMeasure> : NoMarkerData {};

template <>
struct MarkerData<YGMarkerBaselineFn> : NoMarkerData {};

} // namespace detail

template <YGMarker M>
typename detail::MarkerData<M>::type* data(YGMarkerData d) {
  return detail::MarkerData<M>::get(d);
}

} // namespace marker
} // namespace yoga
} // namespace facebook

#endif // __cplusplus
