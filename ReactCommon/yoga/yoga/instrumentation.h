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
public:
  MarkerSection(YGNodeRef node) : MarkerSection{node, node->getConfig()} {}
  ~MarkerSection() {
    if (endMarker_) {
      endMarker_(MarkerType, node_, {&data}, userData_);
    }
  }

  typename detail::MarkerData<MarkerType>::type data = {};

private:
  decltype(YGMarkerCallbacks{}.endMarker) endMarker_;
  YGNodeRef node_;
  void* userData_;

  MarkerSection(YGNodeRef node, YGConfigRef config)
      : MarkerSection{node, config ? &config->markerCallbacks : nullptr} {}
  MarkerSection(YGNodeRef node, YGMarkerCallbacks* callbacks)
      : endMarker_{callbacks ? callbacks->endMarker : nullptr},
        node_{node},
        userData_{callbacks && callbacks->startMarker
                      ? callbacks->startMarker(MarkerType, node, {&data})
                      : nullptr} {}
};

} // namespace marker
} // namespace yoga
} // namespace facebook
