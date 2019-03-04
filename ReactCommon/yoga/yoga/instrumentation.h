/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "YGConfig.h"
#include "YGMarker.h"
#include "YGNode.h"

namespace facebook {
namespace yoga {
namespace marker {

template <YGMarker MarkerType>
class MarkerSection {
private:
  using Data = detail::MarkerData<MarkerType>;

public:
  MarkerSection(YGNodeRef node) : MarkerSection{node, node->getConfig()} {}
  ~MarkerSection() {
    if (endMarker_) {
      endMarker_(MarkerType, node_, markerData(&data), userData_);
    }
  }

  typename Data::type data = {};

  template <typename Ret, typename... Args>
  static Ret wrap(
      YGNodeRef node,
      Ret (YGNode::*method)(Args...),
      Args... args) {
    MarkerSection<MarkerType> section{node};
    return (node->*method)(std::forward<Args>(args)...);
  }

private:
  decltype(YGMarkerCallbacks{}.endMarker) endMarker_;
  YGNodeRef node_;
  void* userData_;

  MarkerSection(YGNodeRef node, YGConfigRef config)
      : MarkerSection{node, config ? &config->markerCallbacks : nullptr} {}
  MarkerSection(YGNodeRef node, YGMarkerCallbacks* callbacks)
      : endMarker_{callbacks ? callbacks->endMarker : nullptr},
        node_{node},
        userData_{
            callbacks && callbacks->startMarker
                ? callbacks->startMarker(MarkerType, node, markerData(&data))
                : nullptr} {}

  static YGMarkerData markerData(typename Data::type* d) {
    YGMarkerData markerData = {};
    Data::get(markerData) = d;
    return markerData;
  }
};

} // namespace marker
} // namespace yoga
} // namespace facebook
